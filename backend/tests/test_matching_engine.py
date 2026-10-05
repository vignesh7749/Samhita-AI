"""
SAMHITA AI - Stage 2 Automated Intelligence Test Suite
Tests for NLP Normalization, Category-Aware Attribute Extraction,
Deterministic Conflict Detection, and Multi-Factor Scoring Engine.
"""
import pytest
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.similarity import SimilarityEngine
from backend.app.services.ai.matching_engine import MatchingEngine


class TestMaterialNormalizer:
    """Tests for Stage 2 advanced normalization of industrial acronyms and dimensions."""

    def test_abbreviation_expansion_metallurgy(self):
        """Verify metallurgy acronyms expand to canonical forms."""
        assert "STAINLESS STEEL" in MaterialNormalizer.normalize("SS BOLT")
        assert "MILD STEEL" in MaterialNormalizer.normalize("MS PLATE")
        assert "GALVANIZED IRON" in MaterialNormalizer.normalize("GI PIPE")
        assert "CAST IRON" in MaterialNormalizer.normalize("CI VALVE")
        assert "COPPER" in MaterialNormalizer.normalize("CU CABLE")
        assert "ALUMINIUM" in MaterialNormalizer.normalize("AL WIRE")

    def test_abbreviation_expansion_mechanical(self):
        """Verify mechanical acronyms expand accurately."""
        assert "HEXAGONAL" in MaterialNormalizer.normalize("HEX BOLT")
        assert "DIAMETER" in MaterialNormalizer.normalize("10MM DIA")
        assert "BEARING" in MaterialNormalizer.normalize("BRG 6205")
        assert "VALVE" in MaterialNormalizer.normalize("GATE VLV")
        assert "MOTOR" in MaterialNormalizer.normalize("IND MTR")

    def test_abbreviation_expansion_units(self):
        """Verify electrical and metric units expand properly."""
        assert "HORSEPOWER" in MaterialNormalizer.normalize("15 HP MOTOR")
        assert "SQUARE MILLIMETER" in MaterialNormalizer.normalize("16 SQMM CABLE")
        assert "SQUARE MILLIMETER" in MaterialNormalizer.normalize("10 MM2 WIRE")

    def test_dimension_canonicalization_formats(self):
        """Verify various syntax variations of dimensions map to canonical form."""
        norm_asterisk = MaterialNormalizer.normalize("SS HEX BOLT M10*50")
        norm_cross = MaterialNormalizer.normalize("SS HEX BOLT M10 X 50")
        norm_hyphen = MaterialNormalizer.normalize("SS HEX BOLT M10-50")
        
        # All syntax variations must yield identical canonical representation
        assert norm_asterisk == norm_cross == norm_hyphen
        assert "M10 X 50" in norm_asterisk


class TestAttributeExtractor:
    """Tests category-aware structured extraction for engineering equipment."""

    def test_fasteners_attribute_extraction(self):
        attrs = AttributeExtractor.extract("SS HEX BOLT M10 X 50", category_hint="Fasteners")
        assert attrs["product_type"] == "HEXAGONAL BOLT"
        assert attrs["material_type"] == "STAINLESS STEEL"
        assert attrs["diameter_mm"] == 10.0
        assert attrs["length_mm"] == 50.0

    def test_bearings_attribute_extraction(self):
        attrs = AttributeExtractor.extract("BALL BEARING 6205 2RS SKF", category_hint="Bearings")
        assert attrs["product_type"] == "DEEP GROOVE BALL BEARING"
        assert attrs["bearing_number"] == "6205"
        assert attrs["manufacturer"] == "SKF"

    def test_cables_attribute_extraction(self):
        attrs = AttributeExtractor.extract("CU CABLE 4 CORE 10 SQMM", category_hint="Cables & Wires")
        assert attrs["product_type"] == "CABLE"
        assert attrs["material_type"] == "COPPER"
        assert attrs["core_count"] == 4
        assert attrs["cross_section_sqmm"] == 10.0

    def test_motors_attribute_extraction(self):
        attrs = AttributeExtractor.extract("IND MTR 15HP 415V 1440RPM", category_hint="Electric Motors")
        assert attrs["product_type"] == "INDUCTION MOTOR"
        assert "15" in attrs["capacity"]
        assert "415V" in attrs["voltage"]

    def test_product_disambiguation_bearing_vs_housing(self):
        """Critical test: Plummer block / bearing housing must NOT be classified as ball bearing."""
        attrs_brg = AttributeExtractor.extract("BALL BEARING 6205")
        attrs_hsg = AttributeExtractor.extract("BEARING HOUSING 6205")
        assert attrs_brg["product_type"] != attrs_hsg["product_type"]
        assert "HOUSING" in attrs_hsg["product_type"]


class TestDeterministicBenchmarkPresets:
    """
    Validates the 5 required Stage 2 evaluation benchmarks (Section 17).
    Must pass with 100% determinism.
    """

    def test_preset_1_format_normalization(self):
        """Test 1: 'HEX BOLT M10 X 50 SS' vs 'SS HEXAGONAL BOLT 10MM X 50MM' -> MATCH"""
        res = MatchingEngine.compare_materials(
            "HEX BOLT M10 X 50 SS",
            "SS HEXAGONAL BOLT 10MM X 50MM",
            category_a="Fasteners",
            category_b="Fasteners",
            uom_a="NOS",
            uom_b="NUMBERS"
        )
        assert res["match_status"] == "MATCH"
        assert res["is_equivalent"] is True
        assert res["confidence_score"] >= 90.0
        assert len(res["critical_conflicts"]) == 0

    def test_preset_2_cable_synonyms_and_units(self):
        """Test 2: 'CU CABLE 4 CORE 10 SQMM' vs 'COPPER CABLE 4 CORE 10 MM2' -> MATCH"""
        res = MatchingEngine.compare_materials(
            "CU CABLE 4 CORE 10 SQMM",
            "COPPER CABLE 4 CORE 10 MM2",
            category_a="Cables & Wires",
            category_b="Cables & Wires",
            uom_a="MTR",
            uom_b="METERS"
        )
        assert res["match_status"] == "MATCH"
        assert res["is_equivalent"] is True
        assert res["confidence_score"] >= 90.0
        assert len(res["critical_conflicts"]) == 0

    def test_preset_3_dimension_conflict_diameter(self):
        """Test 3: 'SS HEX BOLT M10 X 50' vs 'SS HEX BOLT M12 X 50' -> TECHNICAL CONFLICT (M10 != M12)"""
        res = MatchingEngine.compare_materials(
            "SS HEX BOLT M10 X 50",
            "SS HEX BOLT M12 X 50",
            category_a="Fasteners",
            category_b="Fasteners"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["is_equivalent"] is False
        assert res["confidence_score"] <= 52.0  # Hard capped to prevent false harmonization
        assert res["has_critical_conflict"] is True
        assert any(c["attribute"] == "Diameter" for c in res["critical_conflicts"])

    def test_preset_4_metallurgy_conflict(self):
        """Test 4: 'MS BOLT M10 X 50' vs 'SS BOLT M10 X 50' -> TECHNICAL CONFLICT (MS != SS)"""
        res = MatchingEngine.compare_materials(
            "MS BOLT M10 X 50",
            "SS BOLT M10 X 50",
            category_a="Fasteners",
            category_b="Fasteners"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["is_equivalent"] is False
        assert res["confidence_score"] <= 52.0
        assert res["has_critical_conflict"] is True
        assert any(c["attribute"] == "Material" for c in res["critical_conflicts"])

    def test_preset_5_product_incompatibility(self):
        """Test 5: 'BALL BEARING 6205' vs 'BEARING HOUSING 6205' -> DO NOT MATCH"""
        res = MatchingEngine.compare_materials(
            "BALL BEARING 6205",
            "BEARING HOUSING 6205",
            category_a="Bearings",
            category_b="Bearings"
        )
        assert res["match_status"] == "DO NOT MATCH"
        assert res["is_equivalent"] is False
        assert res["confidence_score"] <= 48.0
        assert any(c["attribute"] == "Product Type" and c["status"] == "CONFLICT" for c in res["attribute_comparisons"])


class TestCriticalConflictsAndHardRules:
    """Verifies that engineering conflicts override high semantic similarity."""

    def test_fastener_length_conflict(self):
        """Bolt length mismatch (50 mm vs 75 mm) must trigger technical conflict."""
        res = MatchingEngine.compare_materials(
            "SS HEX BOLT M10 X 50",
            "SS HEX BOLT M10 X 75",
            category_a="Fasteners",
            category_b="Fasteners"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["confidence_score"] <= 52.0
        assert any(c["attribute"] == "Length" for c in res["critical_conflicts"])

    def test_cable_conductor_material_conflict(self):
        """Copper vs Aluminium cable must trigger technical conflict."""
        res = MatchingEngine.compare_materials(
            "CU CABLE 4 CORE 16 SQMM",
            "AL CABLE 4 CORE 16 SQMM",
            category_a="Cables & Wires",
            category_b="Cables & Wires"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["confidence_score"] <= 52.0
        assert any(c["attribute"] == "Material" for c in res["critical_conflicts"])

    def test_cable_core_count_conflict(self):
        """4 Core vs 3 Core must trigger technical conflict."""
        res = MatchingEngine.compare_materials(
            "CU CABLE 4 CORE 10 SQMM",
            "CU CABLE 3 CORE 10 SQMM",
            category_a="Cables & Wires",
            category_b="Cables & Wires"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["confidence_score"] <= 52.0
        assert any(c["attribute"] == "Number of Cores" for c in res["critical_conflicts"])

    def test_cable_cross_section_conflict(self):
        """10 sqmm vs 16 sqmm cross-sectional area must trigger conflict."""
        res = MatchingEngine.compare_materials(
            "CU CABLE 4 CORE 10 SQMM",
            "CU CABLE 4 CORE 16 SQMM",
            category_a="Cables & Wires",
            category_b="Cables & Wires"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["confidence_score"] <= 52.0
        assert any(c["attribute"] == "Cross Section" for c in res["critical_conflicts"])

    def test_bearing_designation_code_conflict(self):
        """Bearing 6205 vs 6305 must conflict despite identical type and words."""
        res = MatchingEngine.compare_materials(
            "BALL BEARING 6205",
            "BALL BEARING 6305",
            category_a="Bearings",
            category_b="Bearings"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["confidence_score"] <= 52.0
        assert any(c["attribute"] == "Bearing Number" for c in res["critical_conflicts"])

    def test_voltage_rating_conflict(self):
        """Motor 415V vs 230V must trigger electrical conflict."""
        res = MatchingEngine.compare_materials(
            "IND MTR 15HP 415V 1440RPM",
            "IND MTR 15HP 230V 1440RPM",
            category_a="Electric Motors",
            category_b="Electric Motors"
        )
        assert res["match_status"] == "TECHNICAL CONFLICT"
        assert res["confidence_score"] <= 52.0
        assert any(c["attribute"] == "Voltage Rating" for c in res["critical_conflicts"])

    def test_product_type_conflict_bolt_vs_nut(self):
        """Hex Bolt vs Hex Nut must NOT match even if both are M10 and SS."""
        res = MatchingEngine.compare_materials(
            "SS HEX BOLT M10 X 50",
            "SS HEX NUT M10",
            category_a="Fasteners",
            category_b="Fasteners"
        )
        assert res["match_status"] == "DO NOT MATCH"
        assert res["confidence_score"] <= 48.0


class TestUnitOfMeasurementCompatibility:
    """Verifies UOM harmonization and conversion rules."""

    def test_compatible_uom_numbers(self):
        assert SimilarityEngine.compare_uom("NOS", "NUMBERS") == 1.0
        assert SimilarityEngine.compare_uom("PCS", "PIECES") == 1.0

    def test_compatible_uom_length(self):
        assert SimilarityEngine.compare_uom("MTR", "METERS") == 1.0

    def test_incompatible_uom(self):
        assert SimilarityEngine.compare_uom("NOS", "MTR") == 0.5
        assert SimilarityEngine.compare_uom("KG", "SET") == 0.5
