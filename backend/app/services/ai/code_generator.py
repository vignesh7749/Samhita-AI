import re
from typing import Optional

class StandardCodeGenerator:
    """
    Standardized Material Code Generator for SAMHITA AI.
    Produces enterprise-grade canonical codes according to CPSE harmonization standards.
    Example: STD-FST-00128
    """

    DEFAULT_PREFIX = "STD"

    @classmethod
    def generate_code(cls, category_code: str, sequence_number: int, prefix: Optional[str] = None) -> str:
        """
        Generates standard code: e.g. STD-FST-00128
        """
        pref = (prefix or cls.DEFAULT_PREFIX).upper().strip()
        cat = category_code.upper().strip()[:3]
        num_str = f"{sequence_number:05d}"
        return f"{pref}-{cat}-{num_str}"

    @classmethod
    def generate_standard_title(cls, product_type: Optional[str], material_type: Optional[str], dimensions: Optional[str], grade: Optional[str]) -> str:
        """
        Creates canonical human-readable standard material title.
        e.g. 'Stainless Steel Hex Bolt M10 × 50 mm'
        """
        parts = []
        if material_type:
            parts.append(material_type.title())
        if grade and grade.upper() not in (material_type or "").upper():
            parts.append(grade)
        if product_type:
            parts.append(product_type.title())
        if dimensions:
            parts.append(dimensions)

        if not parts:
            return "Standard Industrial Item"

        # Format nicely
        title = " ".join(parts)
        title = title.replace(" X ", " x ")
        return title
