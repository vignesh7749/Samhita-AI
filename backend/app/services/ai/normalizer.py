import re
from typing import Dict, Any, Optional, Tuple

class MaterialNormalizer:
    """
    NLP & Rule-based Material Text Normalizer.
    Converts inconsistent CPSE industrial descriptions into a standardized canonical vocabulary.
    Never alters or mutates original source text.
    """

    # Domain vocabulary replacements for CPSE industrial procurement
    ABBREVIATIONS: Dict[str, str] = {
        # Materials
        r"\bSS\s*316L\b": "STAINLESS STEEL 316L",
        r"\bSS\s*316\b": "STAINLESS STEEL 316",
        r"\bSS\s*304\b": "STAINLESS STEEL 304",
        r"\bSS\b": "STAINLESS STEEL",
        r"\bMS\b": "MILD STEEL",
        r"\bCS\b": "CARBON STEEL",
        r"\bCI\b": "CAST IRON",
        r"\bGI\b": "GALVANIZED IRON",
        r"\bDI\b": "DUCTILE IRON",
        r"\bCU\b": "COPPER",
        r"\bAL\b": "ALUMINIUM",
        r"\bALUMINUM\b": "ALUMINIUM",
        r"\bBRS\b": "BRASS",
        r"\bBRZ\b": "BRONZE",
        r"\bTI\b": "TITANIUM",
        r"\bPTFE\b": "POLYTETRAFLUOROETHYLENE",
        r"\bTEFLON\b": "POLYTETRAFLUOROETHYLENE",
        r"\bNBR\b": "NITRILE BUTADIENE RUBBER",
        r"\bPVC\b": "POLYVINYL CHLORIDE",
        r"\bHDPE\b": "HIGH DENSITY POLYETHYLENE",

        # Product types
        r"\bHEX\b": "HEXAGONAL",
        r"\bHD\b": "HEAD",
        r"\bBLT\b": "BOLT",
        r"\bNUT\b": "NUT",
        r"\bWSHR\b": "WASHER",
        r"\bWSH\b": "WASHER",
        r"\bBRG\b": "BEARING",
        r"\bBALL\s+BRG\b": "BALL BEARING",
        r"\bROLR\s+BRG\b": "ROLLER BEARING",
        r"\bPLUMMER\s*BLOCK\b": "BEARING HOUSING",
        r"\bPILLOW\s*BLOCK\b": "BEARING HOUSING",
        r"\bVLV\b": "VALVE",
        r"\bGT\s+VLV\b": "GATE VALVE",
        r"\bGLB\s+VLV\b": "GLOBE VALVE",
        r"\bBL\s+VLV\b": "BALL VALVE",
        r"\bCHK\s+VLV\b": "CHECK VALVE",
        r"\bBTFL\s+VLV\b": "BUTTERFLY VALVE",
        r"\bPMP\b": "PUMP",
        r"\bCNTRF\b": "CENTRIFUGAL",
        r"\bSUBM\b": "SUBMERSIBLE",
        r"\bIND\s+MTR\b": "INDUCTION MOTOR",
        r"\bELEC\s+MTR\b": "ELECTRIC MOTOR",
        r"\bMTR\b": "MOTOR",
        r"\bCBL\b": "CABLE",
        r"\bFLG\b": "FLANGE",
        r"\bFLNG\b": "FLANGE",
        r"\bGSKT\b": "GASKET",
        r"\bSW\b": "SWITCH",
        r"\bMCB\b": "MINIATURE CIRCUIT BREAKER",
        r"\bMCCB\b": "MOLDED CASE CIRCUIT BREAKER",
        r"\bHLMT\b": "SAFETY HELMET",
        r"\bGLVS\b": "SAFETY GLOVES",
        r"\bPRF\b": "PROOF",
        r"\bFLTR\b": "FILTER",

        # Engineering Dimensions & Features
        r"\bDIA\b": "DIAMETER",
        r"\bDIAM\b": "DIAMETER",
        r"\bOD\b": "OUTER DIAMETER",
        r"\bID\b": "INNER DIAMETER",
        r"\bTHK\b": "THICKNESS",
        r"\bTHICK\b": "THICKNESS",
        r"\bLEN\b": "LENGTH",
        r"\bLG\b": "LENGTH",
        r"\bNB\b": "NOMINAL BORE",
        r"\bSQMM\b": "SQUARE MILLIMETER",
        r"\bSQ\s*\.?\s*MM\b": "SQUARE MILLIMETER",
        r"\bMM2\b": "SQUARE MILLIMETER",
        r"\bMM²\b": "SQUARE MILLIMETER",
        r"\bHP\b": "HORSEPOWER",
        r"\bKW\b": "KILOWATT",
        r"\bRPM\b": "RPM",

        # Units & Measurements
        r"\bNOS\b": "NUMBERS",
        r"\bNO\b": "NUMBER",
        r"\bPCS\b": "PIECES",
        r"\bPC\b": "PIECE",
        r"\bMTRS\b": "METERS",
        r"\bKG\b": "KILOGRAM",
        r"\bKGS\b": "KILOGRAMS",
        r"\bMM\b": "MILLIMETER",
        r"\bCM\b": "CENTIMETER",
        r"\bIN\b": "INCH",
        r"\bINCH\b": "INCH",
        r"\bBAR\b": "BAR",
        r"\bPSI\b": "PSI",
        r"\bVOLT\b": "VOLT",
        r"\bVOLTS\b": "VOLT",
        r"\bV\b": "VOLT",
        r"\bAMP\b": "AMPERE",
        r"\bAMPS\b": "AMPERE",
        r"\bKV\b": "KILOVOLT",
    }

    @classmethod
    def normalize_dimensions(cls, text: str) -> str:
        """
        Normalizes equivalent dimension variations:
        M10 X 50, M10*50, M10×50, M10 x 50mm, M10-50, M10 / 50 -> M10 X 50 MM
        """
        result = text

        # Handle M-metric dimensions with various delimiters:
        # e.g., M10*50, M10x50, M10×50, M10-50, M10 / 50 -> M10 X 50 MM
        result = re.sub(
            r'\bM\s*(\d+)\s*(?:[\*×xX\-\/]|BY)\s*(\d+)(?:\s*(?:MM|MILLIMETER))?\b',
            r'M\1 X \2 MM',
            result,
            flags=re.IGNORECASE
        )

        # Standardize numeric dimensions with x or *: e.g. 10MM X 50MM or 10*50 -> 10 MM X 50 MM
        result = re.sub(
            r'\b(\d+(?:\.\d+)?)\s*(?:MM|MILLIMETER)?\s*[\*×xX]\s*(\d+(?:\.\d+)?)\s*(?:MM|MILLIMETER)\b',
            r'\1 MM X \2 MM',
            result,
            flags=re.IGNORECASE
        )

        # Standardize inch fractions: 1/2", 1/2 INCH -> 0.5 INCH
        result = re.sub(r'\b1/2\s*(?:["\']|INCH)?\b', '0.5 INCH', result, flags=re.IGNORECASE)
        result = re.sub(r'\b3/4\s*(?:["\']|INCH)?\b', '0.75 INCH', result, flags=re.IGNORECASE)
        result = re.sub(r'\b1/4\s*(?:["\']|INCH)?\b', '0.25 INCH', result, flags=re.IGNORECASE)
        result = re.sub(r'\b(\d+)\s*["\']\b', r'\1 INCH', result)

        # Standardize cable core notations: 4C X 10 SQMM, 4CX10, 4 CORE 10 MM²
        result = re.sub(
            r'\b(\d+)\s*(?:C|CORE|CORES)\s*(?:X|\*|\s+)\s*(\d+(?:\.\d+)?)\s*(?:SQMM|SQ\s*\.?\s*MM|MM2|MM²)\b',
            r'\1 CORE \2 SQUARE MILLIMETER',
            result,
            flags=re.IGNORECASE
        )

        return result

    @classmethod
    def normalize(cls, text: str) -> str:
        """
        Takes raw material description and returns canonical normalized text.
        """
        if not text:
            return ""

        # 1. Uppercase & strip
        normalized = text.strip().upper()

        # 2. Normalize dimension symbols and notations
        normalized = cls.normalize_dimensions(normalized)

        # 3. Replace abbreviations with domain canonical terms
        for pattern, replacement in cls.ABBREVIATIONS.items():
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

        # 4. Clean up non-alphanumeric punctuation except '-' and 'X' and '.'
        normalized = re.sub(r'[,;:_/\(\)\[\]#~"\'×\*]', ' ', normalized)

        # 5. Collapse multiple whitespaces
        normalized = re.sub(r'\s+', ' ', normalized).strip()

        return normalized

    @classmethod
    def get_normalization_diff(cls, original: str) -> Dict[str, Any]:
        """Returns comparison between original and normalized string."""
        normalized = cls.normalize(original)
        return {
            "original": original,
            "normalized": normalized,
            "changed": original.strip().upper() != normalized
        }
