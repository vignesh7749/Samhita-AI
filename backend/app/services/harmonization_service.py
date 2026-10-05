from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc

from backend.app.models.models import (
    Material, StandardMaterial, MaterialGroup, MaterialGroupMember,
    DuplicateRelationship, CPSE, Category, MaterialMatch, AuditLog
)
from backend.app.schemas.schemas import (
    HarmonizationGroup, HarmonizedMaterialItem, StandardMaterialCatalogItem,
    HarmonizationMetricsResponse, DuplicatePair
)
from backend.app.services.ai.code_generator import StandardCodeGenerator
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.ai.similarity import SimilarityEngine
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.normalizer import MaterialNormalizer


def utc_now():
    return datetime.now(timezone.utc)


class HarmonizationService:
    """
    SAMHITA AI Stage 3 Harmonization Engine:
    Manages cross-CPSE clustering, canonical material identities, standard code generation,
    traceable duplicate detection, merge operations, and catalog aggregation.
    """

    ALL_CPSE_CODES = ["ONGC", "BHEL", "NTPC", "SAIL", "IOCL"]

    @classmethod
    def sync_material_groups(cls, db: Session) -> None:
        """
        Synchronizes all StandardMaterial families with MaterialGroup and MaterialGroupMember tables.
        Calculates group confidence, CPSE coverage, and matching evidence from Stage 2 evidence.
        """
        standards = db.query(StandardMaterial).all()

        for std in standards:
            # Fetch mapped materials
            members = (
                db.query(Material)
                .join(CPSE)
                .filter(Material.standard_material_id == std.id)
                .all()
            )

            distinct_cpses = sorted(list({m.cpse.code for m in members}))
            cpse_count = len(distinct_cpses)
            member_count = len(members)

            if member_count == 0:
                avg_conf = 0.0
                group_status = "UNREVIEWED"
            elif cpse_count >= 2:
                avg_conf = sum((m.confidence_score or 0.0) for m in members) / member_count
                group_status = "HARMONIZED" if avg_conf >= 85.0 else "CANDIDATE"
            else:
                avg_conf = members[0].confidence_score or 90.0
                group_status = "UNIQUE"

            # Derive Stage 2 Matching Evidence
            evidence = cls._derive_matching_evidence(std, members)

            # Update or create MaterialGroup
            group = db.query(MaterialGroup).filter_by(standard_material_id=std.id).first()
            if not group:
                group = MaterialGroup(
                    standard_material_id=std.id,
                    group_confidence=round(avg_conf, 1),
                    harmonization_status=group_status,
                    explanation=f"{member_count} source records unified across {cpse_count} CPSEs with {round(avg_conf, 1)}% average AI confidence.",
                    matching_evidence_json=evidence,
                    cpse_coverage_count=cpse_count
                )
                db.add(group)
                db.flush()
            else:
                group.group_confidence = round(avg_conf, 1)
                group.harmonization_status = group_status
                group.explanation = f"{member_count} source records unified across {cpse_count} CPSEs with {round(avg_conf, 1)}% average AI confidence."
                group.matching_evidence_json = evidence
                group.cpse_coverage_count = cpse_count

            # Update StandardMaterial status and confidence
            std.harmonization_status = group_status
            std.group_confidence = round(avg_conf, 1)
            if not std.canonical_attributes and members:
                # Derive canonical attributes from first member's extracted attributes
                attrs = db.query(Material).filter(Material.standard_material_id == std.id).first()
                if attrs and attrs.attributes:
                    std.canonical_attributes = {
                        "material_type": attrs.attributes.material_type,
                        "product_type": attrs.attributes.product_type,
                        "dimensions": attrs.attributes.dimensions,
                        "grade": attrs.attributes.grade,
                        "size_rating": attrs.attributes.size_rating,
                        "uom": attrs.attributes.uom or std.base_uom
                    }

            # Update or create members
            existing_member_ids = {mem.material_id for mem in group.members}
            for m in members:
                m.harmonization_status = group_status
                if m.id not in existing_member_ids:
                    mgm = MaterialGroupMember(
                        group_id=group.id,
                        material_id=m.id,
                        source_cpse=m.cpse.code,
                        membership_confidence=m.confidence_score or 0.0,
                        harmonization_status=group_status
                    )
                    db.add(mgm)

        db.commit()

    @classmethod
    def _derive_matching_evidence(cls, std: StandardMaterial, members: List[Material]) -> Dict[str, Any]:
        """Calculates Stage 2 multi-factor attribute parity across group members."""
        if not members:
            return {
                "material_compatibility": 100.0,
                "product_type_compatibility": 100.0,
                "dimensions_compatibility": 100.0,
                "uom_compatibility": 100.0,
                "semantic_similarity": 95.0
            }

        # Compare sample pair or member against canonical spec
        sample = members[0]
        comp = MatchingEngine.compare_materials(
            desc_a=sample.original_description,
            desc_b=std.normalized_spec,
            category_a=std.category.name if std.category else None,
            category_b=std.category.name if std.category else None,
            uom_a=sample.uom,
            uom_b=std.base_uom
        )

        bd = comp["breakdown"]
        return {
            "material_compatibility": min(100.0, round(float(bd.get("material_sim", 100.0)), 1)),
            "product_type_compatibility": min(100.0, round(float(bd.get("tech_attr_sim", 98.0)), 1)),
            "dimensions_compatibility": min(100.0, round(float(bd.get("dimension_sim", 100.0)), 1)),
            "uom_compatibility": min(100.0, round(float(bd.get("uom_compatibility", 100.0)), 1)),
            "semantic_similarity": min(100.0, round(float(bd.get("semantic_sim", 92.0)), 1))
        }

    @classmethod
    def get_harmonization_groups(
        cls,
        db: Session,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        cpse_code: Optional[str] = None,
        status: Optional[str] = None,
        min_cpse_count: int = 1,
        page: int = 1,
        page_size: int = 25
    ) -> List[HarmonizationGroup]:
        """
        Retrieves filtered harmonization groups with full Stage 3 cross-CPSE metadata.
        """
        query = db.query(StandardMaterial).join(Category)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    StandardMaterial.standard_code.ilike(search_pattern),
                    StandardMaterial.name.ilike(search_pattern),
                    StandardMaterial.normalized_spec.ilike(search_pattern)
                )
            )

        if category_id:
            query = query.filter(StandardMaterial.category_id == category_id)

        if status and status != "ALL":
            query = query.filter(StandardMaterial.harmonization_status == status)

        standards = query.all()
        results = []

        for std in standards:
            # Query mapped materials
            mat_q = db.query(Material).join(CPSE).filter(Material.standard_material_id == std.id)
            if cpse_code and cpse_code != "ALL":
                mat_q = mat_q.filter(CPSE.code == cpse_code)

            mapped = mat_q.all()
            if not mapped and min_cpse_count > 0:
                continue

            all_mapped = db.query(Material).join(CPSE).filter(Material.standard_material_id == std.id).all()
            distinct_cpses = sorted(list({m.cpse.code for m in all_mapped}))
            cpse_count = len(distinct_cpses)

            if cpse_count < min_cpse_count:
                continue

            avg_conf = (
                sum((m.confidence_score or 0.0) for m in all_mapped) / len(all_mapped)
                if all_mapped else 0.0
            )

            mat_items = [
                HarmonizedMaterialItem(
                    id=m.id,
                    material_code=m.material_code,
                    original_description=m.original_description,
                    normalized_description=m.normalized_description,
                    cpse_code=m.cpse.code,
                    cpse_name=m.cpse.name,
                    uom=m.uom,
                    match_status=m.match_status,
                    harmonization_status=m.harmonization_status or "HARMONIZED",
                    confidence_score=m.confidence_score or 0.0
                )
                for m in all_mapped
            ]

            evidence = (
                std.group.matching_evidence_json
                if std.group and std.group.matching_evidence_json
                else cls._derive_matching_evidence(std, all_mapped)
            )

            results.append(HarmonizationGroup(
                standard_material_id=std.id,
                standard_code=std.standard_code,
                standard_name=std.name,
                normalized_spec=std.normalized_spec,
                category_name=std.category.name if std.category else "General",
                base_uom=std.base_uom,
                average_confidence=round(avg_conf, 1),
                record_count=len(all_mapped),
                cpse_count=cpse_count,
                harmonization_status=std.harmonization_status or ("HARMONIZED" if cpse_count >= 2 else "UNIQUE"),
                cpse_coverage=distinct_cpses,
                matching_evidence=evidence,
                canonical_attributes=std.canonical_attributes or std.specifications_json or {},
                materials=mat_items
            ))

        # Sort with highest CPSE coverage and record count first
        results.sort(key=lambda g: (g.cpse_count, g.record_count), reverse=True)
        start = (page - 1) * page_size
        return results[start:start + page_size]

    @classmethod
    def get_group_by_id(cls, db: Session, standard_material_id: int) -> Optional[HarmonizationGroup]:
        """Fetches detailed single family cluster by standard material ID."""
        std = db.query(StandardMaterial).filter(StandardMaterial.id == standard_material_id).first()
        if not std:
            return None

        mapped = db.query(Material).join(CPSE).filter(Material.standard_material_id == std.id).all()
        distinct_cpses = sorted(list({m.cpse.code for m in mapped}))
        avg_conf = (
            sum((m.confidence_score or 0.0) for m in mapped) / len(mapped)
            if mapped else 0.0
        )

        mat_items = [
            HarmonizedMaterialItem(
                id=m.id,
                material_code=m.material_code,
                original_description=m.original_description,
                normalized_description=m.normalized_description,
                cpse_code=m.cpse.code,
                cpse_name=m.cpse.name,
                uom=m.uom,
                match_status=m.match_status,
                harmonization_status=m.harmonization_status or "HARMONIZED",
                confidence_score=m.confidence_score or 0.0
            )
            for m in mapped
        ]

        evidence = (
            std.group.matching_evidence_json
            if std.group and std.group.matching_evidence_json
            else cls._derive_matching_evidence(std, mapped)
        )

        return HarmonizationGroup(
            standard_material_id=std.id,
            standard_code=std.standard_code,
            standard_name=std.name,
            normalized_spec=std.normalized_spec,
            category_name=std.category.name if std.category else "General",
            base_uom=std.base_uom,
            average_confidence=round(avg_conf, 1),
            record_count=len(mapped),
            cpse_count=len(distinct_cpses),
            harmonization_status=std.harmonization_status or ("HARMONIZED" if len(distinct_cpses) >= 2 else "UNIQUE"),
            cpse_coverage=distinct_cpses,
            matching_evidence=evidence,
            canonical_attributes=std.canonical_attributes or std.specifications_json or {},
            materials=mat_items
        )

    @classmethod
    def get_unified_catalog(
        cls,
        db: Session,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 25
    ) -> Dict[str, Any]:
        """
        Unified Standard Material Master Catalog (Section 10).
        """
        query = db.query(StandardMaterial).join(Category)

        if search:
            search_pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    StandardMaterial.standard_code.ilike(search_pat),
                    StandardMaterial.name.ilike(search_pat),
                    StandardMaterial.normalized_spec.ilike(search_pat)
                )
            )

        if category_id:
            query = query.filter(StandardMaterial.category_id == category_id)

        if status and status != "ALL":
            query = query.filter(StandardMaterial.harmonization_status == status)

        total = query.count()
        standards = query.order_by(StandardMaterial.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for std in standards:
            mapped = db.query(Material).join(CPSE).filter(Material.standard_material_id == std.id).all()
            distinct_cpses = sorted(list({m.cpse.code for m in mapped}))
            attrs = std.canonical_attributes or {}

            items.append(StandardMaterialCatalogItem(
                id=std.id,
                standard_code=std.standard_code,
                standard_name=std.name,
                category_name=std.category.name if std.category else "General",
                material_type=attrs.get("material_type") or "Standard Alloy",
                product_type=attrs.get("product_type"),
                key_specifications=std.normalized_spec,
                cpse_count=len(distinct_cpses),
                record_count=len(mapped),
                harmonization_status=std.harmonization_status or ("HARMONIZED" if len(distinct_cpses) >= 2 else "UNIQUE"),
                confidence=std.group_confidence or 92.0,
                base_uom=std.base_uom,
                cpse_coverage=distinct_cpses
            ))

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // max(1, page_size)
        }

    @classmethod
    def get_harmonization_metrics(cls, db: Session) -> HarmonizationMetricsResponse:
        """
        Calculates real database metrics (Section 18 & 19).
        Zero hardcoded numbers.
        """
        total_source_records = db.query(Material).count()
        unique_standards = db.query(StandardMaterial).count()

        harmonized_count = db.query(Material).filter(Material.harmonization_status == "HARMONIZED").count()
        candidate_count = db.query(Material).filter(Material.harmonization_status == "CANDIDATE").count()
        unique_mat_count = db.query(Material).filter(Material.harmonization_status == "UNIQUE").count()

        potential_dupes = db.query(DuplicateRelationship).filter(DuplicateRelationship.status == "pending").count()
        confirmed_dupes = db.query(DuplicateRelationship).filter(DuplicateRelationship.status == "merged").count()

        # Potential SKU Reduction = Total Source Records - Unique Standard Materials
        potential_reduction_count = max(0, total_source_records - unique_standards)
        potential_reduction_pct = (
            round((potential_reduction_count / max(1, total_source_records)) * 100, 1)
        )

        # CPSE Coverage Distribution
        # Count standard materials used in 5, 4, 3, 2, 1 CPSEs
        coverage_dist = {"5_cpses": 0, "4_cpses": 0, "3_cpses": 0, "2_cpses": 0, "1_cpse": 0}
        all_standards = db.query(StandardMaterial.id).all()
        for (std_id,) in all_standards:
            cpses = db.query(CPSE.code).join(Material).filter(Material.standard_material_id == std_id).distinct().count()
            if cpses >= 5:
                coverage_dist["5_cpses"] += 1
            elif cpses == 4:
                coverage_dist["4_cpses"] += 1
            elif cpses == 3:
                coverage_dist["3_cpses"] += 1
            elif cpses == 2:
                coverage_dist["2_cpses"] += 1
            elif cpses == 1:
                coverage_dist["1_cpse"] += 1

        return HarmonizationMetricsResponse(
            total_source_records=total_source_records,
            unique_standard_materials=unique_standards,
            harmonized_records=harmonized_count,
            candidate_materials=candidate_count,
            potential_duplicates=potential_dupes,
            confirmed_duplicates=confirmed_dupes,
            unique_materials=unique_mat_count,
            potential_sku_reduction_count=potential_reduction_count,
            potential_sku_reduction_pct=potential_reduction_pct,
            cpse_coverage_distribution=coverage_dist
        )

    @classmethod
    def scan_and_seed_duplicates(cls, db: Session, force: bool = False) -> int:
        """
        Scans catalog and registers cross-CPSE duplicate relationships (Section 12 & 13).
        Categorizes into exact duplicates, near duplicates, potential duplicates, and non-duplicates.
        """
        existing_count = db.query(DuplicateRelationship).count()
        if existing_count > 20 and not force:
            return existing_count

        materials = (
            db.query(Material)
            .join(CPSE)
            .filter(or_(Material.standard_material_id.isnot(None), Material.category_id.isnot(None)))
            .order_by(Material.standard_material_id, Material.id)
            .all()
        )

        by_std = {}
        for m in materials:
            group_key = m.standard_material_id if m.standard_material_id is not None else f"cat_{m.category_id}"
            by_std.setdefault(group_key, []).append(m)

        created_count = 0
        for std_id, group in by_std.items():
            if len(group) < 2:
                continue

            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    m_a = group[i]
                    m_b = group[j]

                    if m_a.cpse_id == m_b.cpse_id:
                        continue  # Focus on cross-CPSE duplicates

                    # Check if already registered
                    exists = db.query(DuplicateRelationship).filter(
                        or_(
                            (DuplicateRelationship.material_a_id == m_a.id) & (DuplicateRelationship.material_b_id == m_b.id),
                            (DuplicateRelationship.material_a_id == m_b.id) & (DuplicateRelationship.material_b_id == m_a.id)
                        )
                    ).first()
                    if exists:
                        continue

                    # Evaluate Stage 2 equivalence
                    comp = MatchingEngine.compare_materials(
                        desc_a=m_a.original_description,
                        desc_b=m_b.original_description,
                        category_a=m_a.category.name if m_a.category else None,
                        category_b=m_b.category.name if m_b.category else None,
                        uom_a=m_a.uom,
                        uom_b=m_b.uom
                    )

                    score = comp["confidence_score"]
                    has_conflict = comp["has_critical_conflict"]

                    if has_conflict:
                        rel_type = "non_duplicate"
                        status = "conflict"
                        expl = f"Technical conflict prevents duplication: {comp.get('conflict_summary') or 'Conflicting specifications'}."
                    elif score >= 98.0 or m_a.normalized_description == m_b.normalized_description:
                        rel_type = "exact_duplicate"
                        status = "pending"
                        expl = f"Exact technical parity ({score}%) between {m_a.cpse.code} and {m_b.cpse.code}. Identical engineering specifications."
                    elif score >= 88.0:
                        rel_type = "near_duplicate"
                        status = "pending"
                        expl = f"Near-duplicate ({score}%) with naming/abbreviation variations across {m_a.cpse.code} and {m_b.cpse.code}."
                    else:
                        rel_type = "potential_duplicate"
                        status = "pending"
                        expl = f"Potential duplicate ({score}%) sharing standard material {m_a.standard_material.standard_code if m_a.standard_material else 'family'}."

                    dupe = DuplicateRelationship(
                        material_a_id=m_a.id,
                        material_b_id=m_b.id,
                        relationship_type=rel_type,
                        confidence=score,
                        status=status,
                        explanation=expl
                    )
                    db.add(dupe)
                    created_count += 1

                    if created_count >= 80:
                        break
                if created_count >= 80:
                    break

        db.commit()
        return db.query(DuplicateRelationship).count()

    @classmethod
    def get_duplicates(
        cls,
        db: Session,
        min_similarity: float = 75.0,
        relationship_type: Optional[str] = None,
        status: Optional[str] = "pending",
        category_name: Optional[str] = None,
        limit: int = 50
    ) -> List[DuplicatePair]:
        """
        Retrieves duplicate pairs with full traceability (Section 12, 13, 20).
        """
        query = db.query(DuplicateRelationship).join(
            Material, DuplicateRelationship.material_a_id == Material.id
        )

        if status and status != "ALL":
            query = query.filter(DuplicateRelationship.status == status)

        if relationship_type and relationship_type != "ALL":
            query = query.filter(DuplicateRelationship.relationship_type == relationship_type)

        if min_similarity:
            query = query.filter(DuplicateRelationship.confidence >= min_similarity)

        dupes = query.order_by(DuplicateRelationship.confidence.desc()).limit(limit).all()
        results = []

        for d in dupes:
            m_a = d.material_a
            m_b = d.material_b
            if not m_a or not m_b:
                continue

            if category_name and category_name != "ALL":
                if m_a.category.name != category_name and m_b.category.name != category_name:
                    continue

            results.append(DuplicatePair(
                id=d.id,
                material_a_id=m_a.id,
                material_a_code=m_a.material_code,
                material_a_desc=m_a.original_description,
                material_a_norm=m_a.normalized_description,
                material_a_cpse=m_a.cpse.code,
                material_b_id=m_b.id,
                material_b_code=m_b.material_code,
                material_b_desc=m_b.original_description,
                material_b_norm=m_b.normalized_description,
                material_b_cpse=m_b.cpse.code,
                relationship_type=d.relationship_type,
                similarity_score=round(d.confidence, 1),
                category=m_a.category.name if m_a.category else "General",
                status=d.status,
                decision=d.decision,
                explanation=d.explanation,
                standard_code=m_a.standard_material.standard_code if m_a.standard_material else None
            ))

        return results

    @classmethod
    def merge_duplicate(
        cls,
        db: Session,
        duplicate_id: int,
        reviewer_name: str = "Admin User",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes safe, non-destructive merge of duplicate records (Section 14 & 15).
        Preserves original records and identifiers, maps them to canonical standard identity,
        and logs full lineage to AuditLog.
        """
        dupe = db.query(DuplicateRelationship).filter(DuplicateRelationship.id == duplicate_id).first()
        if not dupe:
            raise ValueError(f"Duplicate relationship ID {duplicate_id} not found.")

        m_a = dupe.material_a
        m_b = dupe.material_b

        # Determine target standard material
        target_std_id = m_a.standard_material_id or m_b.standard_material_id

        if not target_std_id:
            # Generate new standard material if neither has one
            attrs = m_a.attributes
            p_type = attrs.product_type if attrs else "Standard Item"
            m_type = attrs.material_type if attrs else "Specification"
            dim = attrs.dimensions if attrs else None
            grade = attrs.grade if attrs else None

            title = StandardCodeGenerator.generate_standard_title(p_type, m_type, dim, grade)
            code = StandardCodeGenerator.generate_code(m_a.category.code if m_a.category else "GEN", m_a.id + 100)

            std = StandardMaterial(
                standard_code=code,
                name=title,
                normalized_spec=m_a.normalized_description,
                category_id=m_a.category_id,
                base_uom=m_a.uom,
                canonical_attributes={
                    "product_type": p_type,
                    "material_type": m_type,
                    "dimensions": dim,
                    "grade": grade,
                    "uom": m_a.uom
                },
                harmonization_status="HARMONIZED",
                group_confidence=dupe.confidence
            )
            db.add(std)
            db.flush()
            target_std_id = std.id

        target_std = db.query(StandardMaterial).filter(StandardMaterial.id == target_std_id).first()

        # Update both materials to point to canonical standard without mutating original codes
        m_a.standard_material_id = target_std_id
        m_b.standard_material_id = target_std_id
        m_a.harmonization_status = "HARMONIZED"
        m_b.harmonization_status = "HARMONIZED"
        m_a.match_status = "approved"
        m_b.match_status = "approved"
        m_a.confidence_score = max(m_a.confidence_score or 0.0, dupe.confidence)
        m_b.confidence_score = max(m_b.confidence_score or 0.0, dupe.confidence)

        # Update duplicate relationship
        dupe.status = "merged"
        dupe.decision = "MERGE"
        dupe.decision_notes = notes or f"Merged cross-CPSE duplicates ({m_a.cpse.code} & {m_b.cpse.code}) to {target_std.standard_code}."
        dupe.decided_at = utc_now()
        dupe.decided_by = reviewer_name

        # Immutable Audit Log
        audit = AuditLog(
            user_name=reviewer_name,
            user_role="Admin Reviewer",
            material_code=f"{m_a.material_code} + {m_b.material_code}",
            previous_state="Potential Duplicate",
            new_state=f"Merged into {target_std.standard_code}",
            action="Merge Duplicate Pair",
            reason=notes or f"Consolidated {m_a.cpse.code} and {m_b.cpse.code} duplicate records into canonical {target_std.name}."
        )
        db.add(audit)
        db.commit()

        # Sync group membership
        cls.sync_material_groups(db)

        return {
            "status": "success",
            "message": f"Successfully merged {m_a.material_code} ({m_a.cpse.code}) and {m_b.material_code} ({m_b.cpse.code}) into canonical standard {target_std.standard_code}.",
            "standard_code": target_std.standard_code,
            "standard_name": target_std.name,
            "duplicate_id": dupe.id
        }

    @classmethod
    def keep_separate_duplicate(
        cls,
        db: Session,
        duplicate_id: int,
        reviewer_name: str = "Admin User",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Explicitly records that materials are distinct, preventing future grouping (Section 14).
        """
        dupe = db.query(DuplicateRelationship).filter(DuplicateRelationship.id == duplicate_id).first()
        if not dupe:
            raise ValueError(f"Duplicate relationship ID {duplicate_id} not found.")

        m_a = dupe.material_a
        m_b = dupe.material_b

        dupe.status = "kept_separate"
        dupe.decision = "KEEP_SEPARATE"
        dupe.decision_notes = notes or "Explicitly confirmed as distinct materials for separate procurement."
        dupe.decided_at = utc_now()
        dupe.decided_by = reviewer_name

        # Immutable Audit Log
        audit = AuditLog(
            user_name=reviewer_name,
            user_role="Admin Reviewer",
            material_code=f"{m_a.material_code} / {m_b.material_code}",
            previous_state="Potential Duplicate",
            new_state="Confirmed Distinct Materials",
            action="Keep Duplicate Separate",
            reason=notes or f"Kept records separate between {m_a.cpse.code} and {m_b.cpse.code} based on engineering review."
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "message": f"Recorded {m_a.material_code} and {m_b.material_code} as distinct materials.",
            "duplicate_id": dupe.id
        }

    @classmethod
    def assign_material_to_group(
        cls,
        db: Session,
        material_id: int,
        standard_material_id: Optional[int],
        create_new: bool = False,
        std_code: Optional[str] = None,
        std_name: Optional[str] = None,
        reviewer_name: str = "Admin User",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assigns material to a canonical standard material group or generates a new one.
        """
        mat = db.query(Material).filter(Material.id == material_id).first()
        if not mat:
            raise ValueError(f"Material {material_id} not found.")

        if create_new:
            cat_code = mat.category.code if mat.category else "GEN"
            new_code = std_code or StandardCodeGenerator.generate_code(cat_code, mat.id + 200)
            new_title = std_name or mat.original_description.title()

            std = StandardMaterial(
                standard_code=new_code,
                name=new_title,
                normalized_spec=mat.normalized_description,
                category_id=mat.category_id,
                base_uom=mat.uom,
                canonical_attributes={
                    "uom": mat.uom,
                    "normalized": mat.normalized_description
                },
                harmonization_status="UNIQUE",
                group_confidence=95.0
            )
            db.add(std)
            db.flush()
            target_std_id = std.id
            target_code = std.standard_code
            target_name = std.name
        else:
            if not standard_material_id:
                raise ValueError("Must provide standard_material_id or create_new=True.")
            std = db.query(StandardMaterial).filter(StandardMaterial.id == standard_material_id).first()
            if not std:
                raise ValueError(f"StandardMaterial {standard_material_id} not found.")
            target_std_id = std.id
            target_code = std.standard_code
            target_name = std.name

        prev_code = mat.standard_material.standard_code if mat.standard_material else "Unassigned"
        mat.standard_material_id = target_std_id
        mat.harmonization_status = "HARMONIZED"
        mat.match_status = "approved"

        audit = AuditLog(
            user_name=reviewer_name,
            user_role="Admin Reviewer",
            material_code=mat.material_code,
            previous_state=prev_code,
            new_state=target_code,
            action="Assign Material to Standard",
            reason=notes or f"Assigned to {target_name} ({target_code})."
        )
        db.add(audit)
        db.commit()

        cls.sync_material_groups(db)

        return {
            "status": "success",
            "material_id": mat.id,
            "standard_code": target_code,
            "standard_name": target_name,
            "message": f"Assigned {mat.material_code} to {target_code}."
        }
