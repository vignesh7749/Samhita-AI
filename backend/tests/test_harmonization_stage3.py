"""
SAMHITA AI - Stage 3 Automated Test Suite
Cross-CPSE Harmonization, Duplicate Detection & Standard Master Catalog
Validates Section 27 Requirements:
1. Five CPSE records describing same material -> One canonical group.
2. Same material with different abbreviations -> Same group.
3. Same product but different critical dimension -> Separate groups.
4. Two identical records from different CPSEs -> Duplicate relationship.
5. Similar descriptions but different product types -> Not harmonized.
6. Material belonging to only one CPSE -> Valid unique standard material.
7. Duplicate merge retains all source records and lineage (Non-destructive).
8. Keep Separate keeps records separate and prevents accidental regrouping.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models.models import (
    Base,
    CPSE,
    Category,
    StandardMaterial,
    Material,
    MaterialAttribute,
    MaterialGroup,
    MaterialGroupMember,
    DuplicateRelationship,
    AuditLog
)
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.harmonization_service import HarmonizationService


@pytest.fixture
def db_session():
    """Provides a fresh, isolated in-memory SQLite database session for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. Seed CPSEs
    cpses = [
        CPSE(code="ONGC", name="Oil and Natural Gas Corporation", sector="Oil & Gas", logo_icon="Flame"),
        CPSE(code="BHEL", name="Bharat Heavy Electricals Limited", sector="Heavy Engineering", logo_icon="Cpu"),
        CPSE(code="NTPC", name="NTPC Limited", sector="Power Generation", logo_icon="Zap"),
        CPSE(code="SAIL", name="Steel Authority of India Limited", sector="Steel & Metals", logo_icon="Layers"),
        CPSE(code="IOCL", name="Indian Oil Corporation Limited", sector="Refining & Petrochemicals", logo_icon="Fuel"),
    ]
    session.add_all(cpses)

    # 2. Seed Categories
    cats = [
        Category(code="FST", name="Fasteners", description="Bolts, Nuts, Screws"),
        Category(code="BRG", name="Bearings", description="Deep groove ball, roller bearings"),
        Category(code="CBL", name="Cables & Wires", description="Power & instrumentation cables"),
        Category(code="TLS", name="Industrial Tools", description="Drills, tooling, bits"),
    ]
    session.add_all(cats)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


class TestHarmonizationStage3:
    """Stage 3 Test Suite validating cross-CPSE grouping, deduplication, and non-destructive lineage."""

    def test_five_cpse_records_group_into_one_canonical_identity(self, db_session):
        """
        Test 1: Verify that 5 records across 5 CPSEs describing the same material
        are consolidated into a single standard material group with CPSE coverage = 5.
        """
        fst_cat = db_session.query(Category).filter_by(code="FST").first()
        cpses = {c.code: c for c in db_session.query(CPSE).all()}

        # Canonical Standard Material
        std = StandardMaterial(
            standard_code="STD-FST-00128",
            name="Stainless Steel Hex Bolt M10 × 50 mm",
            normalized_spec="STAINLESS STEEL HEXAGONAL BOLT M10 X 50 MM",
            category_id=fst_cat.id,
            base_uom="NOS",
            canonical_attributes={
                "material_type": "STAINLESS STEEL",
                "product_type": "HEXAGONAL BOLT",
                "dimensions": "M10 X 50 MM",
                "diameter_mm": 10.0,
                "length_mm": 50.0,
                "uom": "NOS"
            }
        )
        db_session.add(std)
        db_session.flush()

        # 5 CPSE descriptions of the same real-world material
        records_data = [
            ("ONGC", "MAT-001245", "SS HEX BOLT M10 X 50"),
            ("BHEL", "BOLT-8932", "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM"),
            ("NTPC", "MTR-44521", "SS HEX BOLT M10*50"),
            ("SAIL", "SAIL-FST-902", "SS HEX BOLT M10 X 50"),
            ("IOCL", "IOCL-77821", "STAINLESS HEX BOLT M10X50")
        ]

        for cpse_code, code, desc in records_data:
            mat = Material(
                cpse_id=cpses[cpse_code].id,
                category_id=fst_cat.id,
                material_code=code,
                original_description=desc,
                normalized_description=MaterialNormalizer.normalize(desc),
                uom="NOS",
                standard_material_id=std.id,
                match_status="approved",
                confidence_score=98.5
            )
            db_session.add(mat)

        db_session.commit()

        # Execute harmonization sync
        HarmonizationService.sync_material_groups(db_session)

        # Assertions
        group = db_session.query(MaterialGroup).filter_by(standard_material_id=std.id).first()
        assert group is not None
        assert group.cpse_coverage_count == 5
        assert group.harmonization_status == "HARMONIZED"
        assert group.group_confidence >= 95.0

        members = db_session.query(MaterialGroupMember).filter_by(group_id=group.id).all()
        assert len(members) == 5

        distinct_cpses = {m.source_cpse for m in members}
        assert distinct_cpses == {"ONGC", "BHEL", "NTPC", "SAIL", "IOCL"}

    def test_different_acronyms_normalize_to_same_canonical_representation(self, db_session):
        """
        Test 2: Verify that variations in acronyms (SS vs STAINLESS STEEL, HEX vs HEXAGONAL)
        normalize to the identical canonical form and produce a high-confidence match.
        """
        desc_a = "SS HEX BOLT M10 X 50"
        desc_b = "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM"
        desc_c = "SS HEX BOLT M10*50"

        norm_a = MaterialNormalizer.normalize(desc_a)
        norm_b = MaterialNormalizer.normalize(desc_b)
        norm_c = MaterialNormalizer.normalize(desc_c)

        # All must normalize to consistent canonical specifications
        assert "STAINLESS STEEL" in norm_a and "STAINLESS STEEL" in norm_b
        assert "HEXAGONAL BOLT" in norm_a and "HEXAGONAL BOLT" in norm_b
        assert "M10 X 50" in norm_a and "M10 X 50" in norm_c

        # Stage 2 Comparison should yield equivalence
        comp = MatchingEngine.compare_materials(desc_a, desc_b, category_a="Fasteners", category_b="Fasteners")
        assert comp["is_equivalent"] is True
        assert comp["match_status"] == "MATCH"
        assert comp["confidence_score"] >= 90.0

    def test_same_product_different_critical_dimensions_stay_separate(self, db_session):
        """
        Test 3: Verify that materials with the same product type but different critical dimensions
        (e.g. M10 vs M12) are detected as TECHNICAL CONFLICT and kept in separate standard groups.
        """
        desc_10 = "SS HEX BOLT M10 X 50"
        desc_12 = "SS HEX BOLT M12 X 50"

        comp = MatchingEngine.compare_materials(desc_10, desc_12, category_a="Fasteners", category_b="Fasteners")
        assert comp["has_critical_conflict"] is True
        assert comp["match_status"] == "TECHNICAL CONFLICT"
        assert comp["is_equivalent"] is False

        # Confirm critical conflict details
        conflicts = comp["critical_conflicts"]
        assert any(c["attribute"] in ["dimensions", "Diameter"] for c in conflicts)

    def test_duplicate_detection_classifies_cross_cpse_duplicates(self, db_session):
        """
        Test 4: Verify duplicate detection identifies identical items across CPSEs
        and records a traceable DuplicateRelationship with high similarity score.
        """
        fst_cat = db_session.query(Category).filter_by(code="FST").first()
        ongc = db_session.query(CPSE).filter_by(code="ONGC").first()
        bhel = db_session.query(CPSE).filter_by(code="BHEL").first()

        mat_ongc = Material(
            cpse_id=ongc.id,
            category_id=fst_cat.id,
            material_code="MAT-001245",
            original_description="SS HEX BOLT M10 X 50",
            normalized_description=MaterialNormalizer.normalize("SS HEX BOLT M10 X 50"),
            uom="NOS"
        )
        mat_bhel = Material(
            cpse_id=bhel.id,
            category_id=fst_cat.id,
            material_code="BOLT-8932",
            original_description="STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM",
            normalized_description=MaterialNormalizer.normalize("STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM"),
            uom="NOS"
        )
        db_session.add_all([mat_ongc, mat_bhel])
        db_session.commit()

        # Run duplicate scanner
        count = HarmonizationService.scan_and_seed_duplicates(db_session, force=True)
        assert count >= 1

        dupes = HarmonizationService.get_duplicates(db_session, min_similarity=85.0, status="pending")
        assert len(dupes) >= 1
        assert dupes[0].relationship_type in ["exact_duplicate", "near_duplicate"]
        assert dupes[0].similarity_score >= 90.0

    def test_different_product_types_not_harmonized(self, db_session):
        """
        Test 5: Verify that materials with similar descriptions but different product types
        (e.g., BOLT vs NUT) are NOT considered equivalent.
        """
        desc_bolt = "SS HEX BOLT M10 X 50"
        desc_nut = "SS HEX NUT M10"

        comp = MatchingEngine.compare_materials(desc_bolt, desc_nut, category_a="Fasteners", category_b="Fasteners")
        assert comp["has_critical_conflict"] is True
        assert comp["is_equivalent"] is False
        assert comp["match_status"] in ["TECHNICAL CONFLICT", "DO NOT MATCH"]

    def test_single_cpse_material_forms_valid_unique_standard(self, db_session):
        """
        Test 6: Verify that a specialized material belonging to only one CPSE forms
        a valid standard material group with status UNIQUE and cpse_coverage = 1.
        """
        tls_cat = db_session.query(Category).filter_by(code="TLS").first()
        ongc = db_session.query(CPSE).filter_by(code="ONGC").first()

        std = StandardMaterial(
            standard_code="STD-TLS-00999",
            name="PDC Offshore Drill Bit 12-1/4 Inch",
            normalized_spec="PDC OFFSHORE DRILL BIT 12-1/4 INCH",
            category_id=tls_cat.id,
            base_uom="NOS"
        )
        db_session.add(std)
        db_session.flush()

        mat = Material(
            cpse_id=ongc.id,
            category_id=tls_cat.id,
            material_code="ONGC-PDC-1225",
            original_description="OFFSHORE DRILL BIT 12-1/4 INCH PDC MATRIX BODY",
            normalized_description=MaterialNormalizer.normalize("OFFSHORE DRILL BIT 12-1/4 INCH PDC MATRIX BODY"),
            uom="NOS",
            standard_material_id=std.id,
            match_status="approved",
            confidence_score=92.0
        )
        db_session.add(mat)
        db_session.commit()

        HarmonizationService.sync_material_groups(db_session)

        group = db_session.query(MaterialGroup).filter_by(standard_material_id=std.id).first()
        assert group is not None
        assert group.cpse_coverage_count == 1
        assert group.harmonization_status == "UNIQUE"
        assert std.harmonization_status == "UNIQUE"

    def test_duplicate_merge_is_non_destructive(self, db_session):
        """
        Test 7: Verify Section 15 Non-Destructive Guarantee:
        Merging duplicate records links both to a canonical standard material
        and logs to AuditLog, without mutating or deleting either source record.
        """
        fst_cat = db_session.query(Category).filter_by(code="FST").first()
        ongc = db_session.query(CPSE).filter_by(code="ONGC").first()
        bhel = db_session.query(CPSE).filter_by(code="BHEL").first()

        mat_a = Material(
            cpse_id=ongc.id,
            category_id=fst_cat.id,
            material_code="MAT-001245",
            original_description="SS HEX BOLT M10 X 50",
            normalized_description=MaterialNormalizer.normalize("SS HEX BOLT M10 X 50"),
            uom="NOS",
            confidence_score=98.0
        )
        mat_b = Material(
            cpse_id=bhel.id,
            category_id=fst_cat.id,
            material_code="BOLT-8932",
            original_description="STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM",
            normalized_description=MaterialNormalizer.normalize("STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM"),
            uom="NOS",
            confidence_score=98.0
        )
        db_session.add_all([mat_a, mat_b])
        db_session.flush()

        dupe = DuplicateRelationship(
            material_a_id=mat_a.id,
            material_b_id=mat_b.id,
            relationship_type="exact_duplicate",
            confidence=98.0,
            status="pending",
            explanation="Both records match stainless steel hexagonal bolt M10 x 50 mm."
        )
        db_session.add(dupe)
        db_session.commit()

        # Perform Merge
        res = HarmonizationService.merge_duplicate(
            db=db_session,
            duplicate_id=dupe.id,
            reviewer_name="GovTech Officer",
            notes="Consolidated duplicate procurement items."
        )

        assert res["status"] == "success"

        # Verify Non-Destructive Retention: Both rows still exist
        assert db_session.query(Material).count() == 2

        # Verify source codes and descriptions remain untouched
        refreshed_a = db_session.query(Material).filter_by(id=mat_a.id).first()
        refreshed_b = db_session.query(Material).filter_by(id=mat_b.id).first()

        assert refreshed_a.material_code == "MAT-001245"
        assert refreshed_a.original_description == "SS HEX BOLT M10 X 50"
        assert refreshed_b.material_code == "BOLT-8932"
        assert refreshed_b.original_description == "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM"

        # Verify both linked to same standard material
        assert refreshed_a.standard_material_id is not None
        assert refreshed_a.standard_material_id == refreshed_b.standard_material_id
        assert refreshed_a.harmonization_status == "HARMONIZED"
        assert refreshed_b.harmonization_status == "HARMONIZED"

        # Verify Audit Log
        audit = db_session.query(AuditLog).filter_by(action="Merge Duplicate Pair").first()
        assert audit is not None
        assert audit.user_name == "GovTech Officer"
        assert "MAT-001245 + BOLT-8932" in audit.material_code

    def test_keep_separate_prevents_unintended_merging(self, db_session):
        """
        Test 8: Verify that Keep Separate updates the duplicate status to 'kept_separate',
        records the reviewer justification in AuditLog, and excludes the pair from pending merges.
        """
        fst_cat = db_session.query(Category).filter_by(code="FST").first()
        ongc = db_session.query(CPSE).filter_by(code="ONGC").first()
        bhel = db_session.query(CPSE).filter_by(code="BHEL").first()

        mat_a = Material(
            cpse_id=ongc.id,
            category_id=fst_cat.id,
            material_code="MAT-FST-01",
            original_description="SS HEX BOLT M10 X 50",
            normalized_description=MaterialNormalizer.normalize("SS HEX BOLT M10 X 50"),
            uom="NOS"
        )
        mat_b = Material(
            cpse_id=bhel.id,
            category_id=fst_cat.id,
            material_code="MAT-FST-02",
            original_description="SS HEX BOLT M10 X 60",
            normalized_description=MaterialNormalizer.normalize("SS HEX BOLT M10 X 60"),
            uom="NOS"
        )
        db_session.add_all([mat_a, mat_b])
        db_session.flush()

        dupe = DuplicateRelationship(
            material_a_id=mat_a.id,
            material_b_id=mat_b.id,
            relationship_type="potential_duplicate",
            confidence=78.0,
            status="pending",
            explanation="Different lengths detected."
        )
        db_session.add(dupe)
        db_session.commit()

        # Perform Keep Separate
        res = HarmonizationService.keep_separate_duplicate(
            db=db_session,
            duplicate_id=dupe.id,
            reviewer_name="GovTech Officer",
            notes="Different bolt lengths (50mm vs 60mm) confirmed required for separate applications."
        )

        assert res["status"] == "success"

        # Verify status
        refreshed_dupe = db_session.query(DuplicateRelationship).filter_by(id=dupe.id).first()
        assert refreshed_dupe.status == "kept_separate"
        assert refreshed_dupe.decision == "KEEP_SEPARATE"

        # Verify excluded from pending duplicates
        pending_dupes = HarmonizationService.get_duplicates(db_session, status="pending")
        assert not any(d.id == dupe.id for d in pending_dupes)

        # Verify Audit Log
        audit = db_session.query(AuditLog).filter_by(action="Keep Duplicate Separate").first()
        assert audit is not None
        assert audit.user_name == "GovTech Officer"
