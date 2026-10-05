"""
SAMHITA AI - AI-Assisted Material Search Service (Section 15 & 16)
Provides intelligent natural language search over CPSE materials and the unified standard catalog
grounded strictly in Stage 2 normalization, attribute extraction, and cross-CPSE group intelligence.
"""
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.models import StandardMaterial, Material, CPSE, Category, MaterialGroup, MaterialGroupMember
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor


class AISearchService:
    KNOWN_CPSES = ["ONGC", "BHEL", "NTPC", "SAIL", "IOCL"]

    @classmethod
    def search_natural_language(
        cls,
        db: Session,
        query: str,
        limit: int = 15
    ) -> Dict[str, Any]:
        """
        Executes natural language search across standardized catalog and CPSE material records.
        Returns parsed intent, matched attributes, and ranked search results with cross-CPSE lineage.
        """
        clean_q = query.strip()
        if not clean_q:
            return {
                "query": query,
                "parsed_query": {
                    "normalized": "",
                    "attributes": {},
                    "detected_cpses": [],
                    "confidence_filter": None
                },
                "total_matches": 0,
                "results": []
            }

        # 1. Normalization & Stage 2 Attribute Extraction
        normalizer = MaterialNormalizer()
        normalized_q = normalizer.normalize(clean_q)
        extractor = AttributeExtractor()
        extracted_attrs = extractor.extract(clean_q)

        # 2. Detect mentioned CPSEs
        upper_q = clean_q.upper()
        detected_cpses = [c for c in cls.KNOWN_CPSES if re.search(rf"\b{c}\b", upper_q)]

        # 3. Detect multi-CPSE conditions
        is_shared_query = bool(re.search(r"\b(shared by|used by both|common to|shared between)\b", clean_q, re.I))

        # 4. Detect confidence intent
        confidence_filter = None
        if re.search(r"\b(high confidence|high match|highly confident)\b", clean_q, re.I):
            confidence_filter = "high"  # >= 85
        elif re.search(r"\b(low confidence|needs review|uncertain)\b", clean_q, re.I):
            confidence_filter = "low"   # < 75

        # 5. Check for exact code mentions
        code_match = re.search(r"\b(STD-[A-Z]+-[0-9]+)\b", upper_q)
        target_std_code = code_match.group(1) if code_match else None

        mat_code_match = re.search(r"\b(MAT-[0-9]+|BOLT-[0-9]+|MTR-[0-9]+|VALVE-[0-9]+|BRG-[0-9]+)\b", upper_q)
        target_mat_code = mat_code_match.group(1) if mat_code_match else None

        # 6. Query Standard Materials
        std_query = db.query(StandardMaterial)
        if target_std_code:
            std_records = std_query.filter(StandardMaterial.standard_code == target_std_code).all()
        else:
            std_records = std_query.all()

        query_tokens = set(re.findall(r"[A-Z0-9]+", normalized_q.upper()))
        # Remove common query filler words
        stop_words = {"FIND", "SHOW", "MATERIALS", "MATERIAL", "USED", "BY", "AND", "OR", "WITH", "FOR", "OF", "THE", "IN", "ALL", "SHARED", "BETWEEN", "BOTH"}
        semantic_tokens = query_tokens - stop_words - set(cls.KNOWN_CPSES)

        results = []

        for std in std_records:
            # Gather associated CPSE materials
            member_materials = db.query(Material).filter(Material.standard_material_id == std.id).all()
            if not member_materials and not target_std_code:
                continue

            # CPSE coverage set
            present_cpses = set()
            cpse_records = []
            for m in member_materials:
                cpse_name = m.cpse.code if m.cpse else "UNKNOWN"
                present_cpses.add(cpse_name)
                cpse_records.append({
                    "material_id": m.id,
                    "material_code": m.material_code,
                    "cpse_code": cpse_name,
                    "original_description": m.original_description,
                    "uom": m.uom,
                    "match_status": m.match_status,
                    "confidence_score": m.confidence_score
                })

            # Check CPSE filters if specified
            if detected_cpses:
                if is_shared_query and len(detected_cpses) > 1:
                    # Must contain all specified CPSEs
                    if not set(detected_cpses).issubset(present_cpses):
                        continue
                else:
                    # Must contain at least one of the specified CPSEs
                    if not any(c in present_cpses for c in detected_cpses):
                        continue

            # Check confidence filter
            group_conf = std.group_confidence or 0.0
            if confidence_filter == "high" and group_conf < 85.0:
                continue
            if confidence_filter == "low" and group_conf >= 75.0:
                continue

            # Calculate relevance score
            relevance = 0.0
            reasons = []

            # Exact standard code match
            if target_std_code and std.standard_code == target_std_code:
                relevance = 99.5
                reasons.append(f"Exact Standard Material Code match ({std.standard_code})")
            elif target_mat_code and any(m["material_code"] == target_mat_code for m in cpse_records):
                relevance = 98.0
                reasons.append(f"Direct match with CPSE material code {target_mat_code}")
            else:
                # Text token overlap
                std_text = f"{std.name} {std.normalized_spec} {std.standard_code}".upper()
                std_tokens = set(re.findall(r"[A-Z0-9]+", std_text))
                common_tokens = semantic_tokens.intersection(std_tokens)

                if common_tokens:
                    token_overlap_ratio = len(common_tokens) / max(len(semantic_tokens), 1)
                    relevance += token_overlap_ratio * 40.0
                    reasons.append(f"Keyword match on {', '.join(sorted(list(common_tokens))[:4])}")

                # Technical attribute matching
                std_attrs = std.canonical_attributes or {}
                
                # Dimensions
                q_dim = extracted_attrs.get("dimensions")
                std_dim = std_attrs.get("dimensions")
                if q_dim and std_dim:
                    if q_dim.upper().replace(" ", "") in std_dim.upper().replace(" ", "") or std_dim.upper().replace(" ", "") in q_dim.upper().replace(" ", ""):
                        relevance += 25.0
                        reasons.append(f"Dimension match ({std_dim})")

                # Material Type
                q_mat = extracted_attrs.get("material_type")
                std_mat = std_attrs.get("material_type")
                if q_mat and std_mat and q_mat.upper() == std_mat.upper():
                    relevance += 20.0
                    reasons.append(f"Material specification match ({std_mat})")

                # Product Type
                q_prod = extracted_attrs.get("product_type")
                std_prod = std_attrs.get("product_type")
                if q_prod and std_prod and (q_prod.upper() in std_prod.upper() or std_prod.upper() in q_prod.upper()):
                    relevance += 20.0
                    reasons.append(f"Product class match ({std_prod})")

                # Size Rating / Model / Bearing Number (e.g. 6205)
                q_rating = extracted_attrs.get("size_rating")
                std_rating = std_attrs.get("size_rating")
                if q_rating and std_rating and q_rating.upper() in std_rating.upper():
                    relevance += 25.0
                    reasons.append(f"Specification rating match ({std_rating})")

                # Part Number
                q_pn = extracted_attrs.get("part_number")
                if q_pn and any(q_pn.upper() in (m.part_number or "").upper() for m in member_materials):
                    relevance += 25.0
                    reasons.append(f"Part number reference ({q_pn})")

                # Boost if CPSE matches
                if detected_cpses and any(c in present_cpses for c in detected_cpses):
                    relevance += 15.0
                    reasons.append(f"Verified presence in requested CPSE(s): {', '.join(present_cpses.intersection(detected_cpses))}")

                # Multi-CPSE presence weight (materials widely harmonized across CPSEs are often primary catalog candidates)
                cpse_bonus = min(len(present_cpses) * 2.0, 10.0)
                relevance += cpse_bonus

            # Threshold for inclusion
            if relevance >= 20.0 or target_std_code:
                relevance = min(round(relevance, 1), 99.9)
                category_name = std.category.name if std.category else "General"
                
                explanation = "; ".join(reasons) if reasons else "Semantic catalog match"
                explanation += f". Linked across {len(present_cpses)} CPSE(s) ({', '.join(sorted(present_cpses))})."

                results.append({
                    "standard_material_id": std.id,
                    "standard_code": std.standard_code,
                    "name": std.name,
                    "normalized_spec": std.normalized_spec,
                    "category": category_name,
                    "base_uom": std.base_uom,
                    "harmonization_status": std.harmonization_status,
                    "group_confidence": round(std.group_confidence, 1) if std.group_confidence else 0.0,
                    "relevance_score": relevance,
                    "match_rationale": explanation,
                    "matched_attributes": {k: v for k, v in (std.canonical_attributes or {}).items() if v},
                    "total_cpse_count": len(present_cpses),
                    "cpse_list": sorted(list(present_cpses)),
                    "cpse_records": cpse_records[:10]  # Limit records per item for clean display
                })

        # Sort descending by relevance score, then confidence
        results.sort(key=lambda r: (r["relevance_score"], r["group_confidence"]), reverse=True)

        return {
            "query": query,
            "parsed_query": {
                "normalized": normalized_q,
                "attributes": {k: v for k, v in extracted_attrs.items() if v},
                "detected_cpses": detected_cpses,
                "is_shared_query": is_shared_query,
                "confidence_filter": confidence_filter
            },
            "total_matches": len(results),
            "results": results[:limit]
        }
