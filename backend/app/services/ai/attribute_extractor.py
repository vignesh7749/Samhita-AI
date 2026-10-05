import re
from typing import Dict, Any, Optional, Tuple, List

class AttributeExtractor:
    """
    Category-Aware Technical Attribute Extractor.
    Extracts structured technical parameters from industrial material descriptions.
    Supports Fasteners, Bearings, Cables, Motors, Pumps, Electrical, and Valves.
    Never hallucinates: marks missing attributes as None / "Not detected".
    """

    # Materials hierarchy and synonyms
    MATERIALS = [
        ("STAINLESS STEEL 316L", r"\b(?:STAINLESS\s*STEEL\s*316L|SS\s*316L|SS-316L|A4-80)\b"),
        ("STAINLESS STEEL 316", r"\b(?:STAINLESS\s*STEEL\s*316|SS\s*316|SS-316|A4-70|CF8M)\b"),
        ("STAINLESS STEEL 304", r"\b(?:STAINLESS\s*STEEL\s*304|SS\s*304|SS-304|A2-70|CF8)\b"),
        ("STAINLESS STEEL", r"\b(?:STAINLESS\s*STEEL|SS|INOX)\b"),
        ("MILD STEEL", r"\b(?:MILD\s*STEEL|MS|IS\s*2062)\b"),
        ("CARBON STEEL", r"\b(?:CARBON\s*STEEL|CS|ASTM\s*A105|A216\s*WCB|WCB)\b"),
        ("CAST IRON", r"\b(?:CAST\s*IRON|CI|FG\s*200|FG\s*260)\b"),
        ("DUCTILE IRON", r"\b(?:DUCTILE\s*IRON|DI|SGI)\b"),
        ("GALVANIZED IRON", r"\b(?:GALVANIZED\s*IRON|GI|HOT\s*DIP\s*GALV|HDG)\b"),
        ("BRASS", r"\bBRASS\b"),
        ("BRONZE", r"\b(?:BRONZE|GUNMETAL)\b"),
        ("COPPER", r"\b(?:COPPER|CU|ELECTROLYTIC\s*COPPER)\b"),
        ("ALUMINIUM", r"\b(?:ALUMINIUM|ALUMINUM|AL)\b"),
        ("TITANIUM", r"\bTITANIUM\b"),
        ("POLYTETRAFLUOROETHYLENE", r"\b(?:PTFE|TEFLON|POLYTETRAFLUOROETHYLENE)\b"),
        ("POLYVINYL CHLORIDE", r"\b(?:PVC|FR\s*PVC)\b"),
        ("POLYETHYLENE", r"\b(?:HDPE|PE|XLPE)\b"),
    ]

    # Specific Product Types (Order matters: check distinct/composite assemblies first!)
    PRODUCT_TYPES = [
        # Distinct assemblies (prevent false matches with components)
        ("BEARING HOUSING", r"\b(?:BEARING\s*HOUSING|PLUMMER\s*BLOCK|PILLOW\s*BLOCK|HOUSING\s*FOR\s*BEARING|SNHK|SNH)\b"),
        
        # Fasteners
        ("HEXAGONAL BOLT", r"\b(?:HEXAGONAL|HEX)\s*(?:HEAD\s*)?(?:BOLT|BLT)\b"),
        ("STUD BOLT", r"\b(?:STUD\s*BOLT|ALL\s*THREAD\s*ROD)\b"),
        ("HEXAGONAL NUT", r"\b(?:HEXAGONAL|HEX)\s*(?:HEAD\s*)?(?:NUT)\b"),
        ("SPRING WASHER", r"\bSPRING\s*WASHER\b"),
        ("FLAT WASHER", r"\b(?:FLAT|PLAIN)\s*WASHER\b"),
        ("WASHER", r"\bWASHER\b"),
        ("BOLT", r"\bBOLT\b"),
        ("NUT", r"\bNUT\b"),

        # Bearings
        ("DEEP GROOVE BALL BEARING", r"\b(?:DEEP\s*GROOVE\s*)?BALL\s*BEARING\b"),
        ("SPHERICAL ROLLER BEARING", r"\bSPHERICAL\s*ROLLER\s*BEARING\b"),
        ("TAPER ROLLER BEARING", r"\bTAPER(?:ED)?\s*ROLLER\s*BEARING\b"),
        ("CYLINDRICAL ROLLER BEARING", r"\bCYLINDRICAL\s*ROLLER\s*BEARING\b"),
        ("ROLLER BEARING", r"\bROLLER\s*BEARING\b"),
        ("BALL BEARING", r"\bBALL\s*BEARING\b"),
        ("BEARING", r"\b(?:BEARING|BRG)\b"),

        # Valves
        ("GATE VALVE", r"\b(?:GATE\s*VALVE|GT\s*VLV)\b"),
        ("GLOBE VALVE", r"\b(?:GLOBE\s*VALVE|GLB\s*VLV)\b"),
        ("BALL VALVE", r"\b(?:BALL\s*VALVE|BL\s*VLV)\b"),
        ("CHECK VALVE", r"\b(?:NON\s*RETURN\s*VALVE|CHECK\s*VALVE|NRV|CHK\s*VLV)\b"),
        ("BUTTERFLY VALVE", r"\b(?:BUTTERFLY\s*VALVE|BTFL\s*VLV)\b"),
        ("SAFETY RELIEF VALVE", r"\b(?:SAFETY\s*VALVE|RELIEF\s*VALVE|SRV|PRV)\b"),
        ("VALVE", r"\b(?:VALVE|VLV)\b"),

        # Pumps
        ("CENTRIFUGAL PUMP", r"\b(?:CENTRIFUGAL\s*PUMP|CNTRF\s*PUMP)\b"),
        ("SUBMERSIBLE PUMP", r"\b(?:SUBMERSIBLE\s*PUMP|SUBM\s*PUMP)\b"),
        ("DOSING PUMP", r"\b(?:DOSING|METERING)\s*PUMP\b"),
        ("PUMP", r"\b(?:PUMP|PMP)\b"),

        # Motors
        ("INDUCTION MOTOR", r"\b(?:SQUIRREL\s*CAGE\s*(?:INDUCTION\s*)?MOTOR|INDUCTION\s*MOTOR|IND\s*MTR|SQUIRREL\s*CAGE)\b"),
        ("MOTOR", r"\b(?:MOTOR|MTR)\b"),

        # Cables
        ("POWER CABLE", r"\b(?:POWER|ARMOURED|ARMORED)\s*CABLE\b"),
        ("CONTROL CABLE", r"\bCONTROL\s*CABLE\b"),
        ("INSTRUMENTATION CABLE", r"\b(?:INSTRUMENTATION|SIGNAL)\s*CABLE\b"),
        ("FLEXIBLE WIRE", r"\b(?:FLEXIBLE|COPPER)\s*WIRE\b"),
        ("CABLE", r"\b(?:CABLE|CBL)\b"),

        # Mechanical
        ("SPIRAL WOUND GASKET", r"\b(?:SPIRAL\s*WOUND\s*GASKET|SWG|GSKT\s*SW)\b"),
        ("GASKET", r"\b(?:GASKET|GSKT)\b"),
        ("WELD NECK FLANGE", r"\b(?:WELD\s*NECK|WN)\s*FLANGE\b"),
        ("SLIP ON FLANGE", r"\b(?:SLIP\s*ON|SO)\s*FLANGE\b"),
        ("BLIND FLANGE", r"\bBLIND\s*FLANGE\b"),
        ("FLANGE", r"\b(?:FLANGE|FLG)\b"),
        ("MECHANICAL SEAL", r"\b(?:MECHANICAL\s*SEAL|MECH\s*SEAL)\b"),

        # Electrical
        ("MINIATURE CIRCUIT BREAKER", r"\b(?:MINIATURE\s*CIRCUIT\s*BREAKER|MCB)\b"),
        ("MOLDED CASE CIRCUIT BREAKER", r"\b(?:MOLDED\s*CASE\s*CIRCUIT\s*BREAKER|MCCB)\b"),
        ("AIR CIRCUIT BREAKER", r"\b(?:AIR\s*CIRCUIT\s*BREAKER|ACB)\b"),
        ("POWER CONTACTOR", r"\b(?:CONTACTOR|POWER\s*CONTACTOR)\b"),
        ("OVERLOAD RELAY", r"\b(?:OVERLOAD\s*RELAY|THERMAL\s*RELAY)\b"),

        # Safety & Tools
        ("SAFETY HELMET", r"\b(?:SAFETY\s*HELMET|HARD\s*HAT|HELMET)\b"),
        ("SAFETY GLOVES", r"\b(?:SAFETY\s*GLOVES|HAND\s*GLOVES|GLOVES)\b"),
        ("SAFETY SHOES", r"\b(?:SAFETY\s*SHOES|SAFETY\s*BOOTS)\b"),
        ("SAFETY HARNESS", r"\b(?:SAFETY\s*HARNESS|FALL\s*ARREST)\b"),
        ("TORQUE WRENCH", r"\bTORQUE\s*WRENCH\b"),
        ("IMPACT WRENCH", r"\bIMPACT\s*WRENCH\b"),
        ("PIPE BENDER", r"\bPIPE\s*BENDER\b"),
    ]

    MANUFACTURERS = [
        "SKF", "FAG", "TIMKEN", "NTN", "NSK", "NBC",
        "L&T", "LARSEN & TOUBRO", "SIEMENS", "ABB", "SCHNEIDER", "CROMPTON", "CGL",
        "KSB", "KIRLOSKAR", "SULZER", "FLOWSERVE",
        "AUDCO", "L&T AUDCO", "CRANE",
        "POLYCAB", "HAVELLS", "KEI", "FINOLEX",
        "KARAM", "3M", "MSA", "UDYOGI", "UNBRAKO", "NORBAR", "BRITOOL", "GEDORE"
    ]

    @classmethod
    def extract_dimensions_structured(cls, text: str) -> Dict[str, Any]:
        """
        Parses dimensions into structured numeric parameters:
        diameter_mm, length_mm, width_mm, bore_mm, outer_diameter_mm, cores, cross_section_sqmm.
        """
        raw_upper = text.upper()
        metrics: Dict[str, Any] = {
            "diameter_mm": None,
            "length_mm": None,
            "display": None,
            "cores": None,
            "cross_section_sqmm": None,
            "bearing_number": None,
            "bore_mm": None,
            "nominal_size_inch": None,
            "rating_power": None,
            "rating_voltage": None,
            "rating_current": None,
            "pressure_class": None,
        }

        # 1. Fastener Metric Diameters & Lengths: M10 X 50, M10*50, M10-50, M10 / 50, M10x50mm
        m_dim = re.search(r'\bM\s*(\d+(?:\.\d+)?)\s*(?:[\*×xX\-\/]|BY)\s*(\d+(?:\.\d+)?)(?:\s*(?:MM|MILLIMETER))?\b', raw_upper)
        if m_dim:
            metrics["diameter_mm"] = float(m_dim.group(1))
            metrics["length_mm"] = float(m_dim.group(2))
            metrics["display"] = f"M{int(metrics['diameter_mm'])} × {int(metrics['length_mm'])} mm"

        # 2. Or explicit Diameter / Length: e.g. "10MM X 50MM", "10 X 50 MM", "DIA 10MM LG 50MM"
        if not metrics["diameter_mm"]:
            explicit_dim = re.search(r'\b(\d+(?:\.\d+)?)\s*(?:MM|MILLIMETER)?\s*[\*×xX]\s*(\d+(?:\.\d+)?)\s*(?:MM|MILLIMETER)\b', raw_upper)
            if explicit_dim:
                metrics["diameter_mm"] = float(explicit_dim.group(1))
                metrics["length_mm"] = float(explicit_dim.group(2))
                metrics["display"] = f"{metrics['diameter_mm']:g} mm × {metrics['length_mm']:g} mm"

        # 3. Single Metric Diameter (e.g. M10, M12, DIA 10 MM) without length (e.g. for Nut or Washer)
        if not metrics["diameter_mm"]:
            single_m = re.search(r'\b(?:M|DIA\s*|DIAMETER\s*)(\d+(?:\.\d+)?)\b', raw_upper)
            if single_m and "REV" not in single_m.group(0):
                metrics["diameter_mm"] = float(single_m.group(1))
                metrics["display"] = f"M{int(metrics['diameter_mm'])}"

        # 4. Cable Cores & Cross-Sectional Area:
        # e.g., "4C X 10 SQMM", "4 CORE 10 MM²", "4CX10", "10 SQMM", "10 MM²"
        cable_m = re.search(
            r'\b(?:(\d+)\s*(?:C|CORE|CORES)\s*(?:X|\*|\s+))?(\d+(?:\.\d+)?)\s*(?:SQMM|SQ\s*\.?\s*MM|MM2|MM²|SQUARE\s*MILLIMETER)\b',
            raw_upper
        )
        if cable_m:
            if cable_m.group(1):
                metrics["cores"] = int(cable_m.group(1))
            metrics["cross_section_sqmm"] = float(cable_m.group(2))
            core_str = f"{metrics['cores']} Core × " if metrics["cores"] else ""
            metrics["display"] = f"{core_str}{metrics['cross_section_sqmm']:g} mm²"

        # 5. Bearing Number & Bore: e.g. 6205, 6308, 22212
        brg_m = re.search(r'\b(6\d{3}(?:-[2ZRS]+)?|2\d{4}|3\d{4}|7\d{3})\b', raw_upper)
        if brg_m:
            base_code = brg_m.group(1).split('-')[0]
            metrics["bearing_number"] = brg_m.group(1)
            # Standard metric bore calculation for 6000 series
            try:
                last_two = int(base_code[-2:])
                if last_two == 0:
                    metrics["bore_mm"] = 10.0
                elif last_two == 1:
                    metrics["bore_mm"] = 12.0
                elif last_two == 2:
                    metrics["bore_mm"] = 15.0
                elif last_two == 3:
                    metrics["bore_mm"] = 17.0
                else:
                    metrics["bore_mm"] = float(last_two * 5)
            except Exception:
                pass
            if not metrics["display"]:
                metrics["display"] = f"Bearing {metrics['bearing_number']}"

        # 6. Pipe / Valve Nominal Sizes: e.g. 2", 2 INCH, 1/2", DN50
        valve_size_m = re.search(r'\b(1/2|3/4|1/4|1\.5|2\.5|\d+(?:\.\d+)?)\s*(?:INCH|IN|")\b', raw_upper)
        if valve_size_m:
            metrics["nominal_size_inch"] = valve_size_m.group(1).strip()
            if not metrics["display"]:
                metrics["display"] = f"{metrics['nominal_size_inch']} Inch"
        else:
            dn_m = re.search(r'\b(DN\s*\d+)\b', raw_upper)
            if dn_m:
                metrics["nominal_size_inch"] = dn_m.group(1)
                if not metrics["display"]:
                    metrics["display"] = dn_m.group(1)

        # 7. Motor / Pump Power: e.g. 15 HP, 11 KW, 7.5 HP
        power_m = re.search(r'\b(\d+(?:\.\d+)?)\s*(HP|KW|HORSEPOWER|KILOWATT)\b', raw_upper)
        if power_m:
            metrics["rating_power"] = f"{power_m.group(1)} {power_m.group(2)}"

        # 8. Voltage: e.g. 415V, 230V, 11KV
        volt_m = re.search(r'\b(\d+(?:\.\d+)?)\s*(?:KV|VOLTS?|V)\b', raw_upper)
        if volt_m and "REV" not in volt_m.group(0):
            metrics["rating_voltage"] = volt_m.group(0)

        # 9. Current: e.g. 32A, 63 AMP
        curr_m = re.search(r'\b(\d+(?:\.\d+)?)\s*(?:A|AMP|AMPERE|AMPS)\b', raw_upper)
        if curr_m:
            metrics["rating_current"] = f"{curr_m.group(1)} A"

        # 10. Pressure Class: e.g. Class 150, 150#, PN16, 10 Bar
        press_m = re.search(r'\b(CLASS\s*\d+|CL\s*\d+|\d+\s*#|PN\s*\d+|\d+\s*BAR|\d+\s*PSI)\b', raw_upper)
        if press_m:
            metrics["pressure_class"] = press_m.group(1)

        return metrics

    @classmethod
    def extract(cls, text: str, category_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts comprehensive category-aware technical attributes from material description.
        """
        raw_upper = text.upper()
        dim_metrics = cls.extract_dimensions_structured(text)

        attrs: Dict[str, Any] = {
            "material_type": None,
            "product_type": None,
            "dimensions": dim_metrics["display"],
            "grade": None,
            "size_rating": dim_metrics["bearing_number"] or dim_metrics["nominal_size_inch"],
            "capacity": dim_metrics["rating_power"],
            "voltage": dim_metrics["rating_voltage"],
            "pressure": dim_metrics["pressure_class"],
            "uom": None,
            "manufacturer": None,
            "model": None,
            # Structured parameters for critical conflict evaluation
            "diameter_mm": dim_metrics["diameter_mm"],
            "length_mm": dim_metrics["length_mm"],
            "bore_mm": dim_metrics["bore_mm"],
            "bearing_number": dim_metrics["bearing_number"],
            "core_count": dim_metrics["cores"],
            "cross_section_sqmm": dim_metrics["cross_section_sqmm"],
            "current_a": dim_metrics["rating_current"],
            "power": dim_metrics["rating_power"],
            "nominal_size": dim_metrics["nominal_size_inch"],
        }

        # 1. Material Type
        for label, pattern in cls.MATERIALS:
            if re.search(pattern, raw_upper):
                attrs["material_type"] = label
                break

        # 2. Product Type
        for label, pattern in cls.PRODUCT_TYPES:
            if re.search(pattern, raw_upper):
                attrs["product_type"] = label
                break

        # Fallback Product Type if general word present
        if not attrs["product_type"]:
            if "BOLT" in raw_upper:
                attrs["product_type"] = "BOLT"
            elif "NUT" in raw_upper:
                attrs["product_type"] = "NUT"
            elif "BEARING" in raw_upper:
                attrs["product_type"] = "BEARING"
            elif "VALVE" in raw_upper:
                attrs["product_type"] = "VALVE"
            elif "CABLE" in raw_upper:
                attrs["product_type"] = "CABLE"
            elif "MOTOR" in raw_upper:
                attrs["product_type"] = "MOTOR"
            elif "PUMP" in raw_upper:
                attrs["product_type"] = "PUMP"

        # 3. Technical Grade
        grade_match = re.search(r'\b(SS\s*316L?|SS\s*304|GR(?:\.|\s*)?8\.8|GR(?:\.|\s*)?10\.9|CLASS\s*\d+|CL\s*\d+|WCB|CF8M|PN\s*\d+|IS\s*\d+|A2-70|A4-80)\b', raw_upper)
        if grade_match:
            attrs["grade"] = grade_match.group(1).strip()

        # 4. Manufacturer
        for mfg in cls.MANUFACTURERS:
            if re.search(rf"\b{re.escape(mfg)}\b", raw_upper):
                attrs["manufacturer"] = mfg
                break

        # 5. UOM
        uom_match = re.search(r'\b(NOS|NUMBERS|PIECES|PCS|METERS|MTR|KILOGRAMS|KG|SET|SETS|BOX|BOXES|PAIR|PAIRS)\b', raw_upper)
        if uom_match:
            attrs["uom"] = uom_match.group(1)

        # 6. Bearing seal type / Motor RPM if applicable
        if "2RS" in raw_upper:
            attrs["size_rating"] = (attrs["size_rating"] or "") + " 2RS"
        elif "ZZ" in raw_upper or "2Z" in raw_upper:
            attrs["size_rating"] = (attrs["size_rating"] or "") + " ZZ"

        rpm_m = re.search(r'\b(\d{3,4})\s*RPM\b', raw_upper)
        if rpm_m:
            attrs["rpm"] = f"{rpm_m.group(1)} RPM"

        return attrs
