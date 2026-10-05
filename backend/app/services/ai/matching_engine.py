import re
from typing import Dict, Any, Optional, Tuple, List
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.similarity import SimilarityEngine

class MatchingEngine:
    """
    SAMHITA AI Stage 2: Material Intelligence & Technical Specification Matching Engine.
    Combines NLP normalization, category-aware attribute extraction,
    deterministic critical conflict detection, fuzzy matching, and TF-IDF semantic similarity.
    """

    # Configurable weights for Multi-Factor Scoring (Section 7)
    WEIGHT_DESC_SIM = 0.25      # 25% Description similarity
    WEIGHT_TECH_ATTR = 0.35     # 35% Technical attribute similarity
    WEIGHT_SEMANTIC = 0.20      # 20% Semantic similarity
    WEIGHT_CATEGORY = 0.10      # 10% Category compatibility
    WEIGHT_UOM = 0.05           # 5% UOM compatibility
    WEIGHT_MFG_PART = 0.05      # 5% Manufacturer / Part Number

    @classmethod
    def compare_materials(
        cls,
        desc_a: str,
        desc_b: str,
        category_a: Optional[str] = None,
        category_b: Optional[str] = None,
        uom_a: Optional[str] = None,
        uom_b: Optional[str] = None,
        part_no_a: Optional[str] = None,
        part_no_b: Optional[str] = None,
        mfg_a: Optional[str] = None,
        mfg_b: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete Stage 2 intelligent technical comparison between two materials.
        Identifies critical conflicts (diameter, length, voltage, material, product type),
        evaluates attribute-by-attribute parity, and produces explainable justifications.
        """
        # Step 1: Normalize descriptions
        norm_a = MaterialNormalizer.normalize(desc_a)
        norm_b = MaterialNormalizer.normalize(desc_b)

        # Step 2: Extract category-aware structured attributes
        attrs_a = AttributeExtractor.extract(desc_a, category_hint=category_a)
        attrs_b = AttributeExtractor.extract(desc_b, category_hint=category_b)

        # Merge explicit manufacturer/part if provided in arguments
        if mfg_a and not attrs_a.get("manufacturer"):
            attrs_a["manufacturer"] = mfg_a
        if mfg_b and not attrs_b.get("manufacturer"):
            attrs_b["manufacturer"] = mfg_b

        if part_no_a and not attrs_a.get("model"):
            attrs_a["model"] = part_no_a
        if part_no_b and not attrs_b.get("model"):
            attrs_b["model"] = part_no_b

        # Step 3: Detailed Attribute-by-Attribute Comparison & Conflict Detection
        attr_comparisons, critical_conflicts, tech_attr_score = cls._evaluate_attributes(
            attrs_a, attrs_b, uom_a, uom_b
        )

        # Step 4: Linguistic & Semantic Similarities
        exact_normalized_match = (norm_a == norm_b) and (len(norm_a) > 0)
        fuzzy_scores = SimilarityEngine.calculate_fuzzy_scores(norm_a, norm_b)
        fuzzy_score = fuzzy_scores["average_fuzzy"]
        semantic_score = SimilarityEngine.calculate_tfidf_similarity(norm_a, norm_b)
        desc_similarity_score = (fuzzy_score * 0.5) + (semantic_score * 0.5)

        # Step 5: Category & UOM Compatibility
        cat_sim = 1.0
        if category_a and category_b:
            cat_sim = 1.0 if category_a.strip().upper() == category_b.strip().upper() else 0.35

        uom_sim = SimilarityEngine.compare_uom(
            uom_a or attrs_a.get("uom"),
            uom_b or attrs_b.get("uom")
        )

        # Step 6: Manufacturer & Part Number Match
        mfg_part_score = 0.85  # default neutral if neither specified
        p_a = attrs_a.get("model") or part_no_a
        p_b = attrs_b.get("model") or part_no_b
        if p_a and p_b:
            if p_a.strip().upper() == p_b.strip().upper():
                mfg_part_score = 1.0
            else:
                mfg_part_score = 0.4
        elif attrs_a.get("manufacturer") and attrs_b.get("manufacturer"):
            if attrs_a["manufacturer"].upper() == attrs_b["manufacturer"].upper():
                mfg_part_score = 1.0
            else:
                mfg_part_score = 0.5

        # Step 7: Check Critical Conflicts and Product Type Hard Rejections
        has_critical_conflict = len(critical_conflicts) > 0
        product_type_conflict = any(
            c["attribute"] == "Product Type" and c["status"] == "CONFLICT"
            for c in attr_comparisons
        )

        # Step 8: Multi-Factor Weighted Scoring
        raw_weighted_score = (
            (desc_similarity_score * cls.WEIGHT_DESC_SIM) +
            (tech_attr_score * cls.WEIGHT_TECH_ATTR) +
            (semantic_score * cls.WEIGHT_SEMANTIC) +
            (cat_sim * cls.WEIGHT_CATEGORY) +
            (uom_sim * cls.WEIGHT_UOM) +
            (mfg_part_score * cls.WEIGHT_MFG_PART)
        )

        # Step 9: Apply Hard Rejection & Conflict Rules (Section 11, 12, 18)
        if product_type_conflict:
            # Different product types (e.g. Ball Bearing vs Bearing Housing, or Bolt vs Nut)
            match_status = "DO NOT MATCH"
            verdict = "Distinct Products (Do Not Harmonize)"
            is_equivalent = False
            # Hard cap confidence
            overall_confidence = min(0.48, max(0.20, raw_weighted_score * 0.50))
            recommendation = "DO NOT HARMONIZE"

        elif has_critical_conflict:
            # Critical technical parameter conflict (e.g. M10 vs M12, or MS vs SS)
            match_status = "TECHNICAL CONFLICT"
            verdict = "Technical Conflict Detected"
            is_equivalent = False
            # Hard cap confidence below review threshold (never allow high semantic to override conflict)
            overall_confidence = min(0.52, max(0.30, raw_weighted_score * 0.55))
            recommendation = "DO NOT HARMONIZE"

        elif exact_normalized_match or (tech_attr_score >= 0.95 and desc_similarity_score >= 0.70):
            # Perfect technical match
            match_status = "MATCH"
            verdict = "Equivalent (High Confidence)"
            is_equivalent = True
            overall_confidence = min(0.99, max(0.92, (raw_weighted_score * 0.30 + 0.68)))
            recommendation = "HARMONIZE"

        elif raw_weighted_score >= 0.85 and tech_attr_score >= 0.80:
            match_status = "MATCH"
            verdict = "Equivalent (High Confidence)"
            is_equivalent = True
            overall_confidence = min(0.98, raw_weighted_score)
            recommendation = "HARMONIZE"

        elif raw_weighted_score >= 0.72:
            match_status = "REVIEW"
            verdict = "Review Recommended"
            is_equivalent = True
            overall_confidence = min(0.89, max(0.75, raw_weighted_score))
            recommendation = "REVIEW RECOMMENDED"

        else:
            match_status = "DO NOT MATCH"
            verdict = "Distinct Materials"
            is_equivalent = False
            overall_confidence = min(0.74, max(0.15, raw_weighted_score))
            recommendation = "DO NOT HARMONIZE"

        # Scale percentages for UI
        conf_pct = round(overall_confidence * 100, 1)
        desc_pct = round(desc_similarity_score * 100, 1)
        tech_pct = round(tech_attr_score * 100, 1)
        sem_pct = round(semantic_score * 100, 1)
        cat_pct = round(cat_sim * 100, 1)
        uom_pct = round(uom_sim * 100, 1)
        mfg_pct = round(mfg_part_score * 100, 1)

        # Generate Explainable AI Structured Rationale
        explanation, conflict_summary = cls._generate_explanation(
            desc_a=desc_a,
            desc_b=desc_b,
            attrs_a=attrs_a,
            attrs_b=attrs_b,
            attr_comparisons=attr_comparisons,
            critical_conflicts=critical_conflicts,
            match_status=match_status,
            exact_normalized_match=exact_normalized_match,
            tech_pct=tech_pct
        )

        return {
            "is_equivalent": is_equivalent,
            "verdict": verdict,
            "match_status": match_status,
            "confidence_score": conf_pct,
            "recommendation": recommendation,
            "normalized_a": norm_a,
            "normalized_b": norm_b,
            "attributes_a": attrs_a,
            "attributes_b": attrs_b,
            "attribute_comparisons": attr_comparisons,
            "critical_conflicts": critical_conflicts,
            "has_critical_conflict": has_critical_conflict,
            "conflict_summary": conflict_summary,
            "breakdown": {
                "overall_confidence": conf_pct,
                "description_sim": desc_pct,
                "tech_attr_sim": tech_pct,
                "semantic_sim": sem_pct,
                "category_sim": cat_pct,
                "uom_compatibility": uom_pct,
                "mfg_part_sim": mfg_pct,
                # Backward compatibility aliases
                "dimension_sim": tech_pct,
                "material_sim": tech_pct,
                "explanation": explanation
            }
        }

    @classmethod
    def _evaluate_attributes(
        cls,
        attrs_a: Dict[str, Any],
        attrs_b: Dict[str, Any],
        uom_a: Optional[str],
        uom_b: Optional[str]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], float]:
        """
        Evaluates technical attributes parameter-by-parameter.
        Returns: (attribute_comparisons, critical_conflicts, overall_tech_score)
        """
        comparisons: List[Dict[str, Any]] = []
        conflicts: List[Dict[str, Any]] = []
        scores: List[float] = []

        # 1. Product Type (CRITICAL)
        pt_a = attrs_a.get("product_type")
        pt_b = attrs_b.get("product_type")
        pt_score, pt_status, pt_is_conflict = SimilarityEngine.compare_product_types(pt_a, pt_b)
        scores.append(pt_score * 2.0)  # Heavy weighting
        comp_item = {
            "attribute": "Product Type",
            "value_a": pt_a or "Not detected",
            "value_b": pt_b or "Not detected",
            "status": pt_status,
            "is_critical": True,
            "notes": "Fundamental mechanical product classification."
        }
        comparisons.append(comp_item)
        if pt_is_conflict:
            conflicts.append({
                "attribute": "Product Type",
                "value_a": pt_a or "Not detected",
                "value_b": pt_b or "Not detected",
                "reason": f"Product classification mismatch: '{pt_a}' vs '{pt_b}'."
            })

        # 2. Material Type (CRITICAL)
        mat_a = attrs_a.get("material_type")
        mat_b = attrs_b.get("material_type")
        mat_score, mat_status, mat_is_conflict = SimilarityEngine.compare_materials(mat_a, mat_b)
        scores.append(mat_score * 1.5)
        comp_item = {
            "attribute": "Material",
            "value_a": mat_a or "Not detected",
            "value_b": mat_b or "Not detected",
            "status": mat_status,
            "is_critical": True,
            "notes": "Base metallurgy or material alloy."
        }
        comparisons.append(comp_item)
        if mat_is_conflict:
            conflicts.append({
                "attribute": "Material",
                "value_a": mat_a or "Not detected",
                "value_b": mat_b or "Not detected",
                "reason": f"Material specification conflict: '{mat_a}' vs '{mat_b}'."
            })

        # 3. Diameter / Sizing (CRITICAL for Fasteners, Pipes, Valves)
        d_a = attrs_a.get("diameter_mm")
        d_b = attrs_b.get("diameter_mm")
        if d_a is not None or d_b is not None:
            d_score, d_status, d_is_conflict = SimilarityEngine.compare_numeric_spec(d_a, d_b)
            scores.append(d_score * 1.8)
            val_a_str = f"{d_a:g} mm" if d_a is not None else "Not detected"
            val_b_str = f"{d_b:g} mm" if d_b is not None else "Not detected"
            comparisons.append({
                "attribute": "Diameter",
                "value_a": val_a_str,
                "value_b": val_b_str,
                "status": d_status,
                "is_critical": True,
                "notes": "Metric or nominal diameter."
            })
            if d_is_conflict:
                conflicts.append({
                    "attribute": "Diameter",
                    "value_a": val_a_str,
                    "value_b": val_b_str,
                    "reason": f"Diameter dimension conflict: {val_a_str} != {val_b_str}."
                })

        # 4. Length (CRITICAL for Fasteners, Spares)
        l_a = attrs_a.get("length_mm")
        l_b = attrs_b.get("length_mm")
        if l_a is not None or l_b is not None:
            l_score, l_status, l_is_conflict = SimilarityEngine.compare_numeric_spec(l_a, l_b)
            scores.append(l_score * 1.5)
            val_a_str = f"{l_a:g} mm" if l_a is not None else "Not detected"
            val_b_str = f"{l_b:g} mm" if l_b is not None else "Not detected"
            comparisons.append({
                "attribute": "Length",
                "value_a": val_a_str,
                "value_b": val_b_str,
                "status": l_status,
                "is_critical": True,
                "notes": "Overall length or bolt shank length."
            })
            if l_is_conflict:
                conflicts.append({
                    "attribute": "Length",
                    "value_a": val_a_str,
                    "value_b": val_b_str,
                    "reason": f"Length dimension conflict: {val_a_str} != {val_b_str}."
                })

        # 5. Bearing Number (CRITICAL for Bearings)
        brg_a = attrs_a.get("bearing_number")
        brg_b = attrs_b.get("bearing_number")
        if brg_a or brg_b:
            if brg_a and brg_b:
                # Compare base 4-digit code (e.g. 6205)
                base_a = brg_a.split('-')[0].strip()
                base_b = brg_b.split('-')[0].strip()
                if base_a == base_b:
                    brg_score = 1.0
                    brg_status = "MATCH"
                    brg_conflict = False
                else:
                    brg_score = 0.0
                    brg_status = "CONFLICT"
                    brg_conflict = True
            else:
                brg_score = 0.8
                brg_status = "NOT_SPECIFIED"
                brg_conflict = False

            scores.append(brg_score * 2.0)
            comparisons.append({
                "attribute": "Bearing Number",
                "value_a": brg_a or "Not detected",
                "value_b": brg_b or "Not detected",
                "status": brg_status,
                "is_critical": True,
                "notes": "Standard ISO bearing designation."
            })
            if brg_conflict:
                conflicts.append({
                    "attribute": "Bearing Number",
                    "value_a": brg_a,
                    "value_b": brg_b,
                    "reason": f"Bearing code mismatch: {brg_a} != {brg_b}."
                })

        # 6. Cable Cross-Sectional Area (CRITICAL for Cables)
        cs_a = attrs_a.get("cross_section_sqmm")
        cs_b = attrs_b.get("cross_section_sqmm")
        if cs_a is not None or cs_b is not None:
            cs_score, cs_status, cs_is_conflict = SimilarityEngine.compare_numeric_spec(cs_a, cs_b)
            scores.append(cs_score * 1.8)
            val_a_str = f"{cs_a:g} mm2" if cs_a is not None else "Not detected"
            val_b_str = f"{cs_b:g} mm2" if cs_b is not None else "Not detected"
            comparisons.append({
                "attribute": "Cross Section",
                "value_a": val_a_str,
                "value_b": val_b_str,
                "status": cs_status,
                "is_critical": True,
                "notes": "Conductor cross-sectional area (sq mm / mm2)."
            })
            if cs_is_conflict:
                conflicts.append({
                    "attribute": "Cross Section",
                    "value_a": val_a_str,
                    "value_b": val_b_str,
                    "reason": f"Cable cross-section conflict: {val_a_str} != {val_b_str}."
                })

        # 7. Cable Core Count (CRITICAL for Cables)
        core_a = attrs_a.get("core_count")
        core_b = attrs_b.get("core_count")
        if core_a is not None or core_b is not None:
            c_score, c_status, c_is_conflict = SimilarityEngine.compare_numeric_spec(
                float(core_a) if core_a else None,
                float(core_b) if core_b else None
            )
            scores.append(c_score * 1.5)
            val_a_str = f"{core_a} Core" if core_a else "Not detected"
            val_b_str = f"{core_b} Core" if core_b else "Not detected"
            comparisons.append({
                "attribute": "Number of Cores",
                "value_a": val_a_str,
                "value_b": val_b_str,
                "status": c_status,
                "is_critical": True,
                "notes": "Cable conductor core count."
            })
            if c_is_conflict:
                conflicts.append({
                    "attribute": "Number of Cores",
                    "value_a": val_a_str,
                    "value_b": val_b_str,
                    "reason": f"Core count mismatch: {val_a_str} != {val_b_str}."
                })

        # 8. Voltage / Electrical Ratings (CRITICAL if conflicting numbers)
        v_a = attrs_a.get("voltage")
        v_b = attrs_b.get("voltage")
        if v_a or v_b:
            v_score = 1.0 if (v_a and v_b and v_a == v_b) else (0.8 if not (v_a and v_b) else 0.0)
            v_conflict = (v_a and v_b and v_a != v_b)
            scores.append(v_score * 1.2)
            comparisons.append({
                "attribute": "Voltage Rating",
                "value_a": v_a or "Not detected",
                "value_b": v_b or "Not detected",
                "status": "MATCH" if v_score == 1.0 else ("CONFLICT" if v_conflict else "NOT_SPECIFIED"),
                "is_critical": True,
                "notes": "Rated operational voltage."
            })
            if v_conflict:
                conflicts.append({
                    "attribute": "Voltage Rating",
                    "value_a": v_a,
                    "value_b": v_b,
                    "reason": f"Voltage rating conflict: {v_a} != {v_b}."
                })

        # 9. Power / Capacity (CRITICAL for Motors & Pumps)
        pwr_a = attrs_a.get("capacity")
        pwr_b = attrs_b.get("capacity")
        if pwr_a or pwr_b:
            pwr_score = 1.0 if (pwr_a and pwr_b and pwr_a == pwr_b) else (0.8 if not (pwr_a and pwr_b) else 0.0)
            pwr_conflict = (pwr_a and pwr_b and pwr_a != pwr_b)
            scores.append(pwr_score * 1.4)
            comparisons.append({
                "attribute": "Power / Capacity",
                "value_a": pwr_a or "Not detected",
                "value_b": pwr_b or "Not detected",
                "status": "MATCH" if pwr_score == 1.0 else ("CONFLICT" if pwr_conflict else "NOT_SPECIFIED"),
                "is_critical": True,
                "notes": "Power output rating (HP / kW / capacity)."
            })
            if pwr_conflict:
                conflicts.append({
                    "attribute": "Power / Capacity",
                    "value_a": pwr_a,
                    "value_b": pwr_b,
                    "reason": f"Power capacity mismatch: {pwr_a} != {pwr_b}."
                })

        # 10. Grade / Standard (Non-critical or Semi-critical)
        grd_a = attrs_a.get("grade")
        grd_b = attrs_b.get("grade")
        if grd_a or grd_b:
            grd_score = 1.0 if (grd_a and grd_b and grd_a == grd_b) else (0.85 if not (grd_a and grd_b) else 0.5)
            scores.append(grd_score)
            comparisons.append({
                "attribute": "Technical Grade",
                "value_a": grd_a or "Not detected",
                "value_b": grd_b or "Not detected",
                "status": "MATCH" if grd_score == 1.0 else ("REVIEW" if grd_score < 0.8 else "NOT_SPECIFIED"),
                "is_critical": False,
                "notes": "Manufacturing standard or material grade."
            })

        # 11. Unit of Measure (UOM)
        final_uom_a = uom_a or attrs_a.get("uom") or "NOS"
        final_uom_b = uom_b or attrs_b.get("uom") or "NOS"
        uom_score = SimilarityEngine.compare_uom(final_uom_a, final_uom_b)
        scores.append(uom_score)
        comparisons.append({
            "attribute": "UOM",
            "value_a": final_uom_a,
            "value_b": final_uom_b,
            "status": "MATCH" if uom_score == 1.0 else "REVIEW",
            "is_critical": False,
            "notes": "Unit of measurement compatibility."
        })

        avg_score = min(1.0, max(0.0, sum(scores) / max(1, len(scores))))
        return comparisons, conflicts, avg_score

    @classmethod
    def _generate_explanation(
        cls,
        desc_a: str,
        desc_b: str,
        attrs_a: Dict[str, Any],
        attrs_b: Dict[str, Any],
        attr_comparisons: List[Dict[str, Any]],
        critical_conflicts: List[Dict[str, Any]],
        match_status: str,
        exact_normalized_match: bool,
        tech_pct: float
    ) -> Tuple[str, Optional[str]]:
        """
        Generates structured, natural-language explanation and conflict summary.
        """
        product = attrs_a.get("product_type") or attrs_b.get("product_type") or "material"
        material = attrs_a.get("material_type") or attrs_b.get("material_type") or "standard alloy"
        dim = attrs_a.get("dimensions") or attrs_b.get("dimensions")

        if match_status == "TECHNICAL CONFLICT":
            conflict_lines = [f"{c['attribute']}: {c['value_a']} != {c['value_b']}" for c in critical_conflicts]
            summary = "; ".join(conflict_lines)
            explanation = (
                f"CRITICAL TECHNICAL CONFLICT DETECTED\n"
                f"The descriptions are syntactically and semantically similar, but critical engineering specifications contradict:\n"
                f"• {summary}\n"
                f"Recommendation: DO NOT HARMONIZE. Maintain distinct material codes in enterprise procurement catalog."
            )
            return explanation, summary

        if match_status == "DO NOT MATCH":
            if any(c["attribute"] == "Product Type" and c["status"] == "CONFLICT" for c in attr_comparisons):
                explanation = (
                    f"PRODUCT TYPE MISMATCH DETECTED\n"
                    f"Record A is '{attrs_a.get('product_type')}' while Record B is '{attrs_b.get('product_type')}'. "
                    f"Despite superficial word sharing or numeric overlap, these represent fundamentally distinct mechanical assemblies."
                )
            else:
                explanation = (
                    f"DISTINCT MATERIALS\n"
                    f"Records exhibit low technical compatibility ({tech_pct}% technical match). "
                    f"Identified as separate catalog entities across CPSE master records."
                )
            return explanation, None

        if match_status == "MATCH":
            if exact_normalized_match:
                explanation = (
                    f"Both records possess 100% identical canonical engineering specifications after resolving CPSE domain acronyms and dimensional formatting. "
                    f"Ready for automatic cross-enterprise harmonization."
                )
            else:
                dim_clause = f" with {dim} specifications" if dim else ""
                explanation = (
                    f"Both descriptions represent a {material.lower()} {product.lower()}{dim_clause}. "
                    f"Differences are strictly limited to abbreviation styles, formatting syntax, and word ordering across CPSE databases."
                )
            return explanation, None

        # REVIEW
        explanation = (
            f"POTENTIAL HARMONIZATION CANDIDATE (REVIEW RECOMMENDED)\n"
            f"Both records exhibit high technical affinity for {product.lower()} in {material.lower()} ({tech_pct}% technical match). "
            f"Minor non-critical variations or unconfirmed auxiliary parameters require human engineering sign-off."
        )
        return explanation, None
