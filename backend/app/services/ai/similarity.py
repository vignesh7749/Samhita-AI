import re
from typing import Dict, Any, Tuple, Optional, List
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SimilarityEngine:
    """
    Multi-faceted similarity engine comparing material descriptions,
    semantic representations, and extracted engineering attributes.
    Supports deterministic conflict detection for critical technical specifications.
    """

    @staticmethod
    def calculate_fuzzy_scores(text_a: str, text_b: str) -> Dict[str, float]:
        """Calculates token sort, token set, and ratio similarities [0.0 - 1.0]."""
        if not text_a or not text_b:
            return {"ratio": 0.0, "token_sort": 0.0, "token_set": 0.0, "average_fuzzy": 0.0}

        ratio = fuzz.ratio(text_a, text_b) / 100.0
        token_sort = fuzz.token_sort_ratio(text_a, text_b) / 100.0
        token_set = fuzz.token_set_ratio(text_a, text_b) / 100.0
        avg_fuzzy = (token_sort * 0.5) + (token_set * 0.3) + (ratio * 0.2)

        return {
            "ratio": ratio,
            "token_sort": token_sort,
            "token_set": token_set,
            "average_fuzzy": avg_fuzzy
        }

    @staticmethod
    def calculate_tfidf_similarity(text_a: str, text_b: str) -> float:
        """
        Calculates character and word n-gram cosine similarity using TF-IDF.
        Provides robust subword semantic matching without requiring external cloud embeddings.
        """
        if not text_a or not text_b:
            return 0.0
        if text_a.strip().upper() == text_b.strip().upper():
            return 1.0

        try:
            vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))
            tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
            cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(cos_sim)
        except Exception:
            return fuzz.token_sort_ratio(text_a, text_b) / 100.0

    @classmethod
    def compare_materials(cls, mat_a: Optional[str], mat_b: Optional[str]) -> Tuple[float, str, bool]:
        """
        Compares material types.
        Returns: (similarity_score, status, is_conflict)
        status: 'MATCH', 'COMPATIBLE', 'NOT_SPECIFIED', 'CONFLICT'
        """
        if not mat_a and not mat_b:
            return (1.0, "NOT_SPECIFIED", False)
        if not mat_a or not mat_b:
            return (0.75, "NOT_SPECIFIED", False)

        m_a = mat_a.strip().upper()
        m_b = mat_b.strip().upper()

        if m_a == m_b:
            return (1.0, "MATCH", False)

        # Compatible grade subsets within same alloy family
        if "STAINLESS STEEL" in m_a and "STAINLESS STEEL" in m_b:
            # E.g. Stainless Steel 304 vs Stainless Steel
            return (0.95, "COMPATIBLE", False)

        # Mutually exclusive base metals -> CRITICAL CONFLICT
        mutually_exclusive = [
            ("MILD STEEL", "STAINLESS STEEL"),
            ("CARBON STEEL", "STAINLESS STEEL"),
            ("CAST IRON", "STAINLESS STEEL"),
            ("COPPER", "ALUMINIUM"),
            ("BRASS", "STAINLESS STEEL"),
            ("MILD STEEL", "BRASS"),
            ("ALUMINIUM", "COPPER"),
            ("PTFE", "STAINLESS STEEL"),
        ]

        for metal_x, metal_y in mutually_exclusive:
            if (metal_x in m_a and metal_y in m_b) or (metal_y in m_a and metal_x in m_b):
                return (0.0, "CONFLICT", True)

        # Partial fuzzy token match if neither mutually exclusive rule matched
        score = fuzz.token_sort_ratio(m_a, m_b) / 100.0
        if score >= 0.85:
            return (score, "COMPATIBLE", False)
        else:
            return (score, "CONFLICT", True)

    @classmethod
    def compare_product_types(cls, prod_a: Optional[str], prod_b: Optional[str]) -> Tuple[float, str, bool]:
        """
        Compares product types.
        Detects critical assembly/component mismatches (e.g. Ball Bearing vs Bearing Housing).
        """
        if not prod_a and not prod_b:
            return (1.0, "NOT_SPECIFIED", False)
        if not prod_a or not prod_b:
            return (0.75, "NOT_SPECIFIED", False)

        p_a = prod_a.strip().upper()
        p_b = prod_b.strip().upper()

        if p_a == p_b:
            return (1.0, "MATCH", False)

        # Critical Product Type Conflicts (Completely different mechanical functions)
        critical_mismatches = [
            ("BEARING HOUSING", "BALL BEARING"),
            ("BEARING HOUSING", "BEARING"),
            ("BEARING HOUSING", "ROLLER BEARING"),
            ("HEXAGONAL BOLT", "HEXAGONAL NUT"),
            ("BOLT", "NUT"),
            ("BOLT", "WASHER"),
            ("PUMP", "MOTOR"),
            ("VALVE", "FLANGE"),
            ("VALVE", "GASKET"),
            ("GATE VALVE", "GLOBE VALVE"),
            ("GATE VALVE", "BALL VALVE"),
            ("GATE VALVE", "CHECK VALVE"),
        ]

        for type_x, type_y in critical_mismatches:
            if (type_x in p_a and type_y in p_b) or (type_y in p_a and type_x in p_b):
                return (0.0, "CONFLICT", True)

        # Check hierarchical compatibility (e.g. BOLT vs HEXAGONAL BOLT)
        if ("BOLT" in p_a and "BOLT" in p_b) or ("BEARING" in p_a and "BEARING" in p_b) or ("VALVE" in p_a and "VALVE" in p_b):
            return (0.88, "COMPATIBLE", False)

        score = fuzz.token_sort_ratio(p_a, p_b) / 100.0
        return (score, "COMPATIBLE" if score >= 0.80 else "CONFLICT", score < 0.80)

    @classmethod
    def compare_numeric_spec(cls, val_a: Optional[float], val_b: Optional[float], tolerance: float = 0.01) -> Tuple[float, str, bool]:
        """
        Compares numeric parameters (diameter_mm, length_mm, cross_section_sqmm, etc.).
        Returns: (score, status, is_conflict)
        """
        if val_a is None and val_b is None:
            return (1.0, "NOT_SPECIFIED", False)
        if val_a is None or val_b is None:
            return (0.80, "NOT_SPECIFIED", False)

        if abs(val_a - val_b) <= tolerance:
            return (1.0, "MATCH", False)

        # Explicit numeric divergence -> CRITICAL CONFLICT
        return (0.0, "CONFLICT", True)

    @classmethod
    def compare_dimensions(cls, dim_a: Optional[str], dim_b: Optional[str]) -> float:
        """
        Compares dimension strings backward-compatibly.
        """
        if not dim_a and not dim_b:
            return 1.0
        if not dim_a or not dim_b:
            return 0.70

        clean_a = re.sub(r'[^\d]', ' ', dim_a.upper()).split()
        clean_b = re.sub(r'[^\d]', ' ', dim_b.upper()).split()

        if clean_a and clean_b and clean_a == clean_b:
            return 1.0

        if clean_a and clean_b and clean_a != clean_b:
            # Different numbers in dimensions
            return 0.20

        return fuzz.ratio(dim_a, dim_b) / 100.0

    @classmethod
    def compare_uom(cls, uom_a: Optional[str], uom_b: Optional[str]) -> float:
        """Checks unit of measurement compatibility."""
        if not uom_a or not uom_b:
            return 1.0

        canonical_uom = {
            "NOS": "NUM", "NO": "NUM", "NUMBER": "NUM", "NUMBERS": "NUM",
            "PCS": "NUM", "PC": "NUM", "PIECE": "NUM", "PIECES": "NUM",
            "MTR": "LEN", "MTRS": "LEN", "METER": "LEN", "METERS": "LEN",
            "KG": "WT", "KGS": "WT", "KILOGRAM": "WT", "KILOGRAMS": "WT",
            "SET": "SET", "SETS": "SET", "PAIR": "PAIR", "PAIRS": "PAIR"
        }

        cat_a = canonical_uom.get(uom_a.strip().upper(), uom_a.strip().upper())
        cat_b = canonical_uom.get(uom_b.strip().upper(), uom_b.strip().upper())

        return 1.0 if cat_a == cat_b else 0.5
