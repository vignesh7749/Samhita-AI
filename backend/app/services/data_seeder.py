import os
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models.models import (
    User, CPSE, Category, StandardMaterial, Material,
    MaterialAttribute, MaterialMatch, ReviewDecision,
    AuditLog, ImportJob
)
from backend.app.services.ai.normalizer import MaterialNormalizer
from backend.app.services.ai.attribute_extractor import AttributeExtractor
from backend.app.services.ai.similarity import SimilarityEngine
from backend.app.services.ai.matching_engine import MatchingEngine
from backend.app.services.ai.code_generator import StandardCodeGenerator

def seed_database(db: Session, force: bool = False):
    """
    Seeds database with at least 5 CPSEs, 10 categories, 700+ realistic material records,
    AI matches with explainability, standard codes, audit logs, and review queue items.
    """
    # Check if already seeded
    existing_materials = db.query(Material).count()
    if existing_materials >= 500 and not force:
        print(f"Database already contains {existing_materials} materials. Skipping seed.")
        return

    print("Initializing SAMHITA AI database seed...")

    # 1. Seed Users
    users_data = [
        {"username": "admin", "email": "admin@samhita.gov.in", "full_name": "Dr. Rajesh Sharma (Chief Technical Officer)", "role": "admin"},
        {"username": "reviewer1", "email": "a.verma@samhita.gov.in", "full_name": "Ananya Verma (Sr. Standardization Engineer)", "role": "reviewer"},
        {"username": "reviewer2", "email": "v.patel@samhita.gov.in", "full_name": "Vikram Patel (Procurement Specialist)", "role": "reviewer"},
        {"username": "viewer", "email": "guest@samhita.gov.in", "full_name": "Audit Observer (Public Sector Cell)", "role": "viewer"},
    ]
    user_objects = []
    for u in users_data:
        existing = db.query(User).filter_by(username=u["username"]).first()
        if not existing:
            user = User(**u)
            db.add(user)
            db.flush()
            user_objects.append(user)
        else:
            user_objects.append(existing)

    # 2. Seed 5 Major Indian CPSEs
    cpses_data = [
        {"code": "ONGC", "name": "Oil and Natural Gas Corporation", "sector": "Oil & Gas Exploration", "location": "Dehradun / New Delhi", "logo_icon": "Flame"},
        {"code": "BHEL", "name": "Bharat Heavy Electricals Limited", "sector": "Power & Heavy Engineering", "location": "New Delhi / Tiruchirappalli", "logo_icon": "Zap"},
        {"code": "NTPC", "name": "National Thermal Power Corporation", "sector": "Power Generation", "location": "New Delhi", "logo_icon": "Factory"},
        {"code": "SAIL", "name": "Steel Authority of India Limited", "sector": "Iron & Steel Production", "location": "New Delhi / Bokaro", "logo_icon": "Layers"},
        {"code": "IOCL", "name": "Indian Oil Corporation Limited", "sector": "Refining & Petrochemicals", "location": "New Delhi / Mathura", "logo_icon": "Fuel"},
    ]
    cpse_map = {}
    for c in cpses_data:
        existing = db.query(CPSE).filter_by(code=c["code"]).first()
        if not existing:
            cpse = CPSE(**c)
            db.add(cpse)
            db.flush()
            cpse_map[c["code"]] = cpse
        else:
            cpse_map[c["code"]] = existing

    # 3. Seed 10 Realistic Categories
    categories_data = [
        {"code": "FST", "name": "Fasteners", "description": "Bolts, nuts, washers, studs, pins, and structural fixings"},
        {"code": "BRG", "name": "Bearings", "description": "Deep groove ball, spherical roller, and needle bearings"},
        {"code": "VLV", "name": "Valves & Actuators", "description": "Gate, globe, ball, butterfly, check, and safety relief valves"},
        {"code": "ELE", "name": "Electrical Components", "description": "Circuit breakers, contactors, relays, and switchgear"},
        {"code": "CBL", "name": "Cables & Wires", "description": "Armoured power cables, control cables, and instrumentation wires"},
        {"code": "MTR", "name": "Electric Motors", "description": "3-phase squirrel cage, slip ring, and flameproof induction motors"},
        {"code": "PMP", "name": "Pumps & Spares", "description": "Centrifugal, positive displacement, and submersible pumps"},
        {"code": "SFT", "name": "Safety Equipment", "description": "Personal protective equipment (PPE), gas detectors, harnesses"},
        {"code": "TLS", "name": "Industrial Tools", "description": "Pneumatic, torque, hydraulic, and cutting tools"},
        {"code": "MCH", "name": "Mechanical Spares", "description": "Gaskets, mechanical seals, couplings, and pipe fittings"},
    ]
    cat_map = {}
    for cat in categories_data:
        existing = db.query(Category).filter_by(code=cat["code"]).first()
        if not existing:
            category = Category(**cat)
            db.add(category)
            db.flush()
            cat_map[cat["code"]] = category
        else:
            cat_map[cat["code"]] = existing

    # 4. Standard Material Template Families with cross-CPSE variations
    # Each family has standard specs and distinct descriptions used by different CPSEs
    material_families = [
        {
            "cat": "FST",
            "std_code": "STD-FST-00128",
            "std_name": "Stainless Steel Hex Bolt M10 × 50 mm",
            "spec": "HEXAGONAL BOLT M10 X 50 MM STAINLESS STEEL 304 FULL THREAD",
            "uom": "NOS",
            "attrs": {"material_type": "STAINLESS STEEL 304", "product_type": "HEXAGONAL BOLT", "dimensions": "M10 X 50", "grade": "SS304"},
            "variations": [
                ("ONGC", "MAT-001245", "HEX BOLT M10 X 50 SS", "NOS", "Unbrako", "UB-M1050-SS"),
                ("BHEL", "BOLT-8932", "SS HEXAGONAL BOLT 10MM X 50MM", "NUMBERS", "Pooja Forgings", "PF-10-50"),
                ("NTPC", "MTR-44521", "STAINLESS STEEL HEX BOLT M10*50", "PCS", "Astra", "AST-M10-SS"),
                ("SAIL", "STEEL-FL-902", "SS304 HEX HEAD BOLT SIZE M10 X 50MM", "NOS", "Tata Steels", "TS-BOLT-1050"),
                ("IOCL", "IOC-FAST-3312", "BOLT HEX SS 10X50 MM FULL THREAD", "PIECES", "Unbrako", "UB-SS-1050"),
            ]
        },
        {
            "cat": "BRG",
            "std_code": "STD-BRG-00045",
            "std_name": "Deep Groove Ball Bearing 6205-2RS",
            "spec": "DEEP GROOVE BALL BEARING 6205 2RS RUBBER SEAL 25MM BORE",
            "uom": "NOS",
            "attrs": {"material_type": "CARBON STEEL", "product_type": "BALL BEARING", "dimensions": "25MM X 52MM X 15MM", "size_rating": "6205-2RS"},
            "variations": [
                ("ONGC", "BRG-09214", "BEARING BALL 6205", "NOS", "SKF", "6205-2RSH"),
                ("BHEL", "MECH-44810", "BALL BEARING 6205 2RS SKF", "NOS", "SKF", "6205-2RS"),
                ("NTPC", "NT-BRG-102", "BRG DEEP GROOVE 6205-2RS 25MM BORE", "NUMBERS", "FAG", "FAG-6205RS"),
                ("SAIL", "SL-ROT-552", "6205 2RS SEALED BALL BEARING", "PCS", "NBC", "NBC-6205"),
                ("IOCL", "IOC-PMP-882", "BALL BRG 6205 2RS DGBB", "NOS", "SKF", "6205-2RS"),
            ]
        },
        {
            "cat": "VLV",
            "std_code": "STD-VLV-00302",
            "std_name": "Cast Steel Gate Valve 2 Inch Class 150 Flanged",
            "spec": "GATE VALVE 2 INCH CLASS 150 FLANGED ASTM A216 WCB OS&Y",
            "uom": "NOS",
            "attrs": {"material_type": "CARBON STEEL", "product_type": "GATE VALVE", "dimensions": "2 INCH", "grade": "CLASS 150 WCB", "pressure": "150 LBS"},
            "variations": [
                ("ONGC", "VLV-77341", "GATE VLV 2\" CL150 WCB", "NOS", "Audco", "AUD-GV-02-150"),
                ("BHEL", "BH-VLV-9921", "2 INCH CLASS 150 CAST STEEL GATE VALVE", "NOS", "L&T Valves", "LNT-GV-2IN"),
                ("NTPC", "NTPC-MECH-404", "VLV GT CS 2IN 150# FLANGED OS&Y", "NUMBERS", "Kirloskar", "KIRL-GV-2"),
                ("SAIL", "SAIL-VAL-119", "2 INCH FLANGED GATE VALVE 150 LBS WCB", "NOS", "Audco", "AUD-2-150"),
                ("IOCL", "IOC-REF-6031", "CAST STEEL GATE VALVE 50MM NB 150 CLASS", "PCS", "L&T", "LT-GV-50-150"),
            ]
        },
        {
            "cat": "MTR",
            "std_code": "STD-MTR-00088",
            "std_name": "3-Phase Induction Motor 15 HP 415V 1440 RPM",
            "spec": "SQUIRREL CAGE INDUCTION MOTOR 15 HP 11 KW 415 VOLTS 1440 RPM 4 POLE FOOT MOUNTED",
            "uom": "NOS",
            "attrs": {"material_type": "CAST IRON", "product_type": "INDUCTION MOTOR", "capacity": "15 HP", "voltage": "415 VOLT", "size_rating": "1440 RPM"},
            "variations": [
                ("ONGC", "MTR-22091", "IND MTR 15HP 415V 1440RPM", "NOS", "Siemens", "1LE0-15HP"),
                ("BHEL", "BH-EL-773", "15 HP 415 VOLT SQUIRREL CAGE INDUCTION MOTOR 4P", "NOS", "BHEL", "BHEL-IM-15"),
                ("NTPC", "NT-MTR-661", "MOTOR AC 11KW 15HP 415V 1440 RPM TEFC", "NOS", "ABB", "ABB-M2BAX-15"),
                ("SAIL", "SL-POW-492", "3 PH INDUCTION MOTOR 15HP 415V FOOT MOUNT", "NUMBERS", "Crompton", "CG-15HP-4P"),
                ("IOCL", "IOC-DRV-102", "INDUCTION MTR 15 HP 415 VOLT 50 HZ 1440 RPM", "PCS", "Siemens", "SIE-15HP-415"),
            ]
        },
        {
            "cat": "CBL",
            "std_code": "STD-CBL-00215",
            "std_name": "XLPE Armoured Power Cable 4C × 16 sq mm Aluminium",
            "spec": "POWER CABLE 4 CORE 16 SQ MM ALUMINIUM CONDUCTOR XLPE INSULATED ARMOURED 1100V",
            "uom": "MTR",
            "attrs": {"material_type": "ALUMINUM", "product_type": "POWER CABLE", "dimensions": "4C X 16 SQMM", "voltage": "1100V", "size_rating": "4C X 16 SQMM"},
            "variations": [
                ("ONGC", "CBL-55310", "CBL 4C X 16 SQMM AL ARMOURED 1.1KV", "MTR", "Polycab", "POLY-4C-16"),
                ("BHEL", "BH-CB-3091", "4 CORE 16 SQ MM ALUMINIUM ARMORED POWER CABLE", "METERS", "Havells", "HAV-4C16-AL"),
                ("NTPC", "NT-ELE-881", "AL ARMOURED POWER CABLE 4CX16SQMM XLPE 1100V", "MTR", "KEI", "KEI-4C16-XL"),
                ("SAIL", "SL-CAB-120", "CABLE 4 CORE 16 SQMM AL XLPE ARMOURED", "MTRS", "Finolex", "FIN-4C16"),
                ("IOCL", "IOC-PW-7721", "1.1 KV 4C X 16 SQMM ALUMINUM ARMORED CABLE", "MTR", "Polycab", "POL-16-4C-AL"),
            ]
        },
        {
            "cat": "ELE",
            "std_code": "STD-ELE-00104",
            "std_name": "Miniature Circuit Breaker (MCB) 32A Triple Pole C-Curve",
            "spec": "MINIATURE CIRCUIT BREAKER 32A 3 POLE 415V 10KA C CURVE DIN RAIL",
            "uom": "NOS",
            "attrs": {"material_type": "POLYCARBONATE", "product_type": "MINIATURE CIRCUIT BREAKER", "capacity": "32A", "voltage": "415 VOLT", "grade": "10KA C-CURVE"},
            "variations": [
                ("ONGC", "ELE-33291", "MCB 32A TP C CURVE 10KA", "NOS", "Schneider", "SCH-A9F-32"),
                ("BHEL", "BH-SW-4011", "TRIPLE POLE 32 AMP MINIATURE CIRCUIT BREAKER", "NUMBERS", "L&T", "LNT-BB-32A-TP"),
                ("NTPC", "NT-CB-2041", "3 POLE MCB 32 AMPERE C-CURVE 415V", "PCS", "Siemens", "SIE-5SL-32"),
                ("SAIL", "SL-BRK-990", "MCB 3 POLE 32A 10KA DIN MOUNT", "NOS", "ABB", "ABB-SH203-C32"),
                ("IOCL", "IOC-ELE-512", "MINIATURE CIRCUIT BREAKER 3P 32A 415 VOLTS", "PIECES", "Schneider", "ACTI9-32-3P"),
            ]
        },
        {
            "cat": "SFT",
            "std_code": "STD-SFT-00019",
            "std_name": "Industrial Safety Helmet HDPE with Ratchet Suspension IS 2925",
            "spec": "SAFETY HELMET HIGH DENSITY POLYETHYLENE ADJUSTABLE RATCHET SUSPENSION IS 2925 APPROVED",
            "uom": "NOS",
            "attrs": {"material_type": "POLYETHYLENE", "product_type": "SAFETY HELMET", "grade": "IS 2925", "size_rating": "ADJUSTABLE"},
            "variations": [
                ("ONGC", "SFT-11042", "SAFETY HELMET HDPE YELLOW RATCHET", "NOS", "Karam", "SHEL-01-YL"),
                ("BHEL", "BH-SF-8012", "HARD HAT INDUSTRIAL SAFETY HELMET IS 2925", "NUMBERS", "3M", "3M-H700"),
                ("NTPC", "NT-PPE-330", "HDPE SAFETY HELMET WITH RATCHET HARNESS", "PCS", "Udyogi", "UDY-ULTRA"),
                ("SAIL", "SL-SAF-771", "INDUSTRIAL SAFETY HELMET YELLOW COLOR IS 2925", "NOS", "Karam", "KRM-HLMT-Y"),
                ("IOCL", "IOC-PPE-901", "SAFETY HELMET IS 2925 APPROVED WITH NAPE STRAP", "PIECES", "MSA", "MSA-V-GARD"),
            ]
        },
        {
            "cat": "PMP",
            "std_code": "STD-PMP-00062",
            "std_name": "End Suction Centrifugal Pump 50 m3/hr Head 40m",
            "spec": "CENTRIFUGAL WATER PUMP END SUCTION 50 M3/HR HEAD 40 MTRS CI CASING SS304 IMPELLER",
            "uom": "SET",
            "attrs": {"material_type": "CAST IRON", "product_type": "CENTRIFUGAL PUMP", "capacity": "50 M3/HR", "pressure": "40 M HEAD"},
            "variations": [
                ("ONGC", "PMP-88310", "CNTRF PUMP 50M3/HR 40M HEAD CI/SS", "SET", "KSB", "MEGA-50-40"),
                ("BHEL", "BH-PM-1092", "CENTRIFUGAL WATER PUMP CAPACITY 50 M3 PER HR HEAD 40 METER", "SETS", "Kirloskar", "DB-50-40"),
                ("NTPC", "NT-HYD-550", "END SUCTION CENTRIFUGAL PUMP 50 M3/HR 40M HEAD", "SET", "Sulzer", "SUL-CP-50"),
                ("SAIL", "SL-PMP-311", "WATER PUMP CENTRIFUGAL 50 M3/H HEAD 40 METERS", "SET", "KSB", "KSB-ETA-50"),
                ("IOCL", "IOC-PMP-704", "CENTRIFUGAL PROCESS PUMP 50 M3/HR 40 MTRS", "SET", "Flowserve", "FS-D824"),
            ]
        },
        {
            "cat": "MCH",
            "std_code": "STD-MCH-00174",
            "std_name": "Spiral Wound Gasket 2 Inch Class 150 SS316 with Graphite Filler",
            "spec": "SPIRAL WOUND GASKET ASME B16.20 2 INCH CLASS 150 SS 316 WINDINGS WITH FLEXIBLE GRAPHITE FILLER CS OUTER RING",
            "uom": "NOS",
            "attrs": {"material_type": "STAINLESS STEEL 316", "product_type": "SPIRAL WOUND GASKET", "dimensions": "2 INCH", "grade": "CLASS 150 SS316"},
            "variations": [
                ("ONGC", "GSK-44019", "GSKT SPIRAL WOUND 2\" 150# SS316 GRAPHITE", "NOS", "Flexitallic", "CG-2-150-SS"),
                ("BHEL", "BH-MC-2098", "2 INCH CLASS 150 SPIRAL WOUND GASKET SS316/GRAPHITE", "NUMBERS", "Champion", "CHM-SWG-2"),
                ("NTPC", "NT-GSK-112", "SS 316 SPIRAL WOUND GASKET SIZE 2 INCH 150 LBS", "PCS", "Spiratec", "SPT-2-150"),
                ("SAIL", "SL-PIP-884", "GASKET SW 2 INCH 150 CLASS SS316 WITH GRAPHITE FILLER", "NOS", "Flexitallic", "FLX-2-150"),
                ("IOCL", "IOC-PIP-319", "SPIRAL WOUND GASKET ASME B16.20 50MM NB 150#", "PIECES", "Champion", "CHP-50-150"),
            ]
        },
        {
            "cat": "TLS",
            "std_code": "STD-TLS-00055",
            "std_name": "Adjustable Torque Wrench 40 - 200 Nm 1/2 Inch Drive",
            "spec": "MECHANICAL TORQUE WRENCH DUAL SCALE 40 TO 200 NM 1/2 INCH SQUARE DRIVE CHROME VANADIUM",
            "uom": "NOS",
            "attrs": {"material_type": "CHROME VANADIUM STEEL", "product_type": "TORQUE WRENCH", "dimensions": "1/2 INCH DRIVE", "capacity": "40-200 NM"},
            "variations": [
                ("ONGC", "TLS-90112", "TORQUE WRENCH 1/2\" DR 40-200 NM", "NOS", "Britool", "EVT-2000A"),
                ("BHEL", "BH-TL-6612", "1/2 INCH DRIVE ADJUSTABLE TORQUE WRENCH 40 TO 200 NM", "NUMBERS", "Norbar", "NOR-130103"),
                ("NTPC", "NT-TLS-401", "TORQUE WRENCH 40-200NM CAPACITY HALF INCH SQ DRIVE", "PCS", "Gedore", "GED-TORCO"),
                ("SAIL", "SL-TLS-199", "1/2 INCH TORQUE WRENCH RANGE 40-200 NM", "NOS", "Stanley", "ST-TW-200"),
                ("IOCL", "IOC-TLS-804", "TORQUE WRENCH ADJ 40-200 NM 1/2\" SQUARE DRIVE", "PIECES", "Norbar", "NOR-200-12"),
            ]
        }
    ]

    # Additional standard materials catalog for diverse range
    std_mat_objects = {}
    family_counter = 800

    # Create the featured standard materials first
    for fam in material_families:
        category = cat_map[fam["cat"]]
        std_mat = StandardMaterial(
            standard_code=fam["std_code"],
            name=fam["std_name"],
            normalized_spec=MaterialNormalizer.normalize(fam["spec"]),
            category_id=category.id,
            base_uom=fam["uom"],
            specifications_json=fam["attrs"]
        )
        db.add(std_mat)
        db.flush()
        std_mat_objects[fam["std_code"]] = std_mat

    # Generate additional standard materials across all 10 categories to reach enterprise scale
    extra_templates = [
        ("FST", "Hexagonal Nut M10 Stainless Steel 304", "HEXAGONAL NUT M10 SS304 IS 1364", "NOS", "M10", "STAINLESS STEEL 304"),
        ("FST", "High Tensile Stud Bolt M16 × 120 mm Gr. 8.8", "STUD BOLT M16 X 120 MM GRADE 8.8 BLACK FINISH", "NOS", "M16 X 120", "CARBON STEEL"),
        ("FST", "Spring Washer M12 Zinc Plated", "SPRING WASHER M12 ZINC PLATED IS 3063", "NOS", "M12", "CARBON STEEL"),
        ("BRG", "Spherical Roller Bearing 22212 EK with Adapter Sleeve", "SPHERICAL ROLLER BEARING 22212 EK TAPERED BORE 60MM", "NOS", "60MM X 110MM X 28MM", "ALLOY STEEL"),
        ("BRG", "Deep Groove Ball Bearing 6308 C3 Open", "DEEP GROOVE BALL BEARING 6308 C3 CLEARANCE 40MM BORE", "NOS", "40MM X 90MM X 23MM", "CARBON STEEL"),
        ("BRG", "Taper Roller Bearing 32210 SKF", "TAPER ROLLER BEARING 32210 CONE AND CUP 50MM BORE", "NOS", "50MM X 90MM X 24.75MM", "ALLOY STEEL"),
        ("VLV", "Forged Steel Globe Valve 1 Inch Class 800 Socket Weld", "GLOBE VALVE 1 INCH CLASS 800 FORGED STEEL A105 SW OS&Y", "NOS", "1 INCH", "CARBON STEEL"),
        ("VLV", "Dual Plate Check Valve 4 Inch Class 150 Wafer Type", "CHECK VALVE DUAL PLATE 4 INCH CLASS 150 WAFER ASTM A216 WCB", "NOS", "4 INCH", "CAST STEEL"),
        ("VLV", "Ball Valve 3 Piece 2 Inch Class 300 SS316 Full Bore", "BALL VALVE 3 PIECE 2 INCH CLASS 300 SS316 LEVER OPERATED", "NOS", "2 INCH", "STAINLESS STEEL 316"),
        ("ELE", "Molded Case Circuit Breaker 160A 36kA 3-Pole", "MCCB 160A 36KA 3 POLE THERMAL MAGNETIC TRIP UNIT", "NOS", "160A", "POLYCARBONATE"),
        ("ELE", "Power Contactor 3 Pole 40A 230V AC Coil", "POWER CONTACTOR 3 POLE 40A AC3 230V AC COIL 1NO 1NC", "NOS", "40A", "ENGINEERING PLASTIC"),
        ("ELE", "Thermal Overload Relay Range 24-40A", "THERMAL OVERLOAD RELAY 24 TO 40A CLASS 10 DIRECT MOUNT", "NOS", "24-40A", "ENGINEERING PLASTIC"),
        ("CBL", "Copper Control Cable 7C × 1.5 sq mm Armoured 1.1kV", "CONTROL CABLE 7 CORE 1.5 SQ MM COPPER XLPE ARMOURED PVC", "MTR", "7C X 1.5 SQMM", "COPPER"),
        ("CBL", "Instrumentation Signal Cable 1 Pair 1.5 sq mm Screened", "INSTRUMENTATION CABLE 1 PAIR 1.5 SQ MM OVERALL SCREENED PE/PVC", "MTR", "1P X 1.5 SQMM", "COPPER"),
        ("CBL", "Flexible Copper Wire 1C × 2.5 sq mm FR PVC Red", "SINGLE CORE 2.5 SQ MM FLEXIBLE COPPER WIRE FLAME RETARDANT RED", "MTR", "1C X 2.5 SQMM", "COPPER"),
        ("MTR", "Flameproof Induction Motor 20 HP Ex d IIC T4 415V", "FLAMEPROOF INDUCTION MOTOR 20 HP 15 KW 415V 1470 RPM EX D IIC T4", "NOS", "20 HP", "CAST IRON"),
        ("MTR", "3-Phase Induction Motor 5 HP 415V 2880 RPM 2 Pole", "SQUIRREL CAGE INDUCTION MOTOR 5 HP 3.7 KW 415V 2880 RPM B3", "NOS", "5 HP", "CAST IRON"),
        ("MTR", "VFD Duty Inverter Inverter Grade Motor 30 HP 415V", "INVERTER DUTY AC INDUCTION MOTOR 30 HP 22 KW 415V FORCE COOLED", "NOS", "30 HP", "CAST IRON"),
        ("PMP", "Submersible Dewatering Pump 7.5 HP 415V", "SUBMERSIBLE DEWATERING PUMP 7.5 HP 415V 3 PHASE WITH FLOAT SWITCH", "SET", "7.5 HP", "CAST IRON / SS"),
        ("PMP", "Chemical Dosing Metering Pump 0-50 LPH SS316", "METERING DOSING PUMP 0 TO 50 LPH PRESSURE 10 BAR SS316 WETTED", "SET", "50 LPH", "STAINLESS STEEL 316"),
        ("PMP", "Multi-stage Boiler Feed Water Pump 100 m3/hr 250m Head", "BOILER FEED BOOSTER PUMP MULTISTAGE 100 M3/HR 250M HEAD", "SET", "100 M3/HR", "ALLOY STEEL"),
        ("SFT", "Full Body Safety Harness with Double Lanyard IS 3521", "FULL BODY FALL ARREST SAFETY HARNESS DOUBLE ROPE LANYARD SCAFFOLD HOOKS", "NOS", "UNIVERSAL", "POLYESTER"),
        ("SFT", "Heat Resistant Leather Hand Gloves 14 Inch", "HEAVY DUTY HEAT RESISTANT SPLIT LEATHER WELDING GLOVES 14 INCH", "PAIR", "14 INCH", "LEATHER"),
        ("SFT", "Safety Shoes Steel Toe Cap Anti-Static IS 15298", "SAFETY SHOES DERBY CUT STEEL TOE LEATHER SOLE ANTI STATIC PU", "PAIR", "SIZE 8", "LEATHER"),
        ("TLS", "Pneumatic Impact Wrench 3/4 Inch Drive Heavy Duty", "HEAVY DUTY PNEUMATIC AIR IMPACT WRENCH 3/4 INCH SQUARE DRIVE 1200 NM", "NOS", "3/4 INCH", "COMPOSITE / STEEL"),
        ("TLS", "Hydraulic Pipe Bender 1/2 Inch to 2 Inch Capacity", "HYDRAULIC PIPE BENDING MACHINE WITH DIES 1/2 INCH TO 2 INCH NB", "SET", "1/2 - 2 INCH", "CARBON STEEL"),
        ("TLS", "Digital Vernier Caliper 0-300 mm Resolution 0.01 mm", "ELECTRONIC DIGITAL VERNIER CALIPER RANGE 0 TO 300 MM RESOLUTION 0.01 MM", "NOS", "0-300 MM", "STAINLESS STEEL"),
        ("MCH", "Carbon Steel Weld Neck Flange 4 Inch Class 150 RF", "WELD NECK FLANGE 4 INCH 150 LBS RAISED FACE SCH 40 ASTM A105", "NOS", "4 INCH", "CARBON STEEL"),
        ("MCH", "Single Spring Cartridge Mechanical Seal 45mm Shaft", "CARTRIDGE MECHANICAL SEAL 45MM BALANCE DESIGN SIC VS SIC PTFE", "SET", "45 MM", "SS316 / SIC"),
        ("MCH", "High Pressure Hydraulic Hose 1/2 Inch 2SN 250 Bar", "HYDRAULIC RUBBER HOSE 1/2 INCH TWO WIRE BRAIDED 2SN 250 BAR WITH COUPLINGS", "MTR", "1/2 INCH", "SYNTHETIC RUBBER"),
    ]

    for cat_code, name, spec, uom, dim, mat in extra_templates:
        family_counter += 1
        std_code = f"STD-{cat_code}-{family_counter:05d}"
        category = cat_map[cat_code]
        std_mat = StandardMaterial(
            standard_code=std_code,
            name=name,
            normalized_spec=MaterialNormalizer.normalize(spec),
            category_id=category.id,
            base_uom=uom,
            specifications_json={"material_type": mat, "dimensions": dim}
        )
        db.add(std_mat)
        db.flush()
        std_mat_objects[std_code] = std_mat

    # 5. Populate Material Records
    # A) Add the harmonized family variations
    total_materials_added = 0
    recent_timestamp = datetime.now(timezone.utc)

    for fam in material_families:
        std_mat = std_mat_objects[fam["std_code"]]
        cat = cat_map[fam["cat"]]

        for cpse_code, mat_code, raw_desc, uom, mfg, part_no in fam["variations"]:
            cpse = cpse_map[cpse_code]
            norm_desc = MaterialNormalizer.normalize(raw_desc)
            attrs = AttributeExtractor.extract(raw_desc)
            if mfg and not attrs.get("manufacturer"):
                attrs["manufacturer"] = mfg

            # Calculate match with standard material spec
            match_res = MatchingEngine.compare_materials(
                desc_a=raw_desc,
                desc_b=std_mat.normalized_spec,
                category_a=cat.name,
                category_b=cat.name,
                uom_a=uom,
                uom_b=std_mat.base_uom,
                part_no_a=part_no
            )

            # High confidence matches for these core demonstration items
            conf = max(92.0, min(99.0, match_res["confidence_score"] + random.uniform(2.0, 5.0)))
            conf = round(conf, 1)

            mat = Material(
                material_code=mat_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                cpse_id=cpse.id,
                category_id=cat.id,
                uom=uom,
                manufacturer=mfg,
                part_number=part_no,
                standard_material_id=std_mat.id,
                match_status="approved" if cpse_code in ["ONGC", "BHEL"] else "ai_suggested",
                confidence_score=conf,
                created_at=recent_timestamp - timedelta(days=random.randint(2, 60))
            )
            db.add(mat)
            db.flush()
            total_materials_added += 1

            # Save attributes
            mat_attr = MaterialAttribute(
                material_id=mat.id,
                material_type=attrs.get("material_type"),
                product_type=attrs.get("product_type"),
                dimensions=attrs.get("dimensions"),
                grade=attrs.get("grade"),
                size_rating=attrs.get("size_rating"),
                capacity=attrs.get("capacity"),
                voltage=attrs.get("voltage"),
                pressure=attrs.get("pressure"),
                uom=uom,
                manufacturer=mfg,
                model=part_no
            )
            db.add(mat_attr)

            # Save MaterialMatch with explanation
            bd = match_res["breakdown"]
            mat_match = MaterialMatch(
                source_material_id=mat.id,
                standard_material_id=std_mat.id,
                overall_confidence=conf,
                description_sim=bd["description_sim"],
                dimension_sim=bd["dimension_sim"],
                material_sim=bd["material_sim"],
                category_sim=bd["category_sim"],
                uom_compatibility=bd["uom_compatibility"],
                match_explanation=bd["explanation"],
                status="approved" if mat.match_status == "approved" else "suggested",
                created_at=mat.created_at
            )
            db.add(mat_match)

    # B) Generate 650+ more realistic CPSE materials across categories to reach >700 total records
    cpse_codes_list = list(cpse_map.keys())
    standard_materials_list = list(std_mat_objects.values())

    var_templates = [
        # (category_code, prefix, name_variants, sizes, materials, grades, uoms)
        ("FST", "FST", ["HEX BOLT", "HEXAGONAL BOLT", "STUD BOLT", "HEX NUT", "PLAIN WASHER", "SOCKET CAP SCREW"],
         ["M6 X 25", "M8 X 30", "M12 X 60", "M16 X 75", "M20 X 100", "M24 X 120", "1/2\" X 2\"", "3/4\" X 3\""],
         ["SS", "STAINLESS STEEL", "MS", "MILD STEEL", "HIGH TENSILE", "BRASS"],
         ["GR 8.8", "GR 10.9", "SS304", "SS316", "IS 1367", "GALV"],
         ["NOS", "PCS", "NUMBERS", "SET"]),

        ("BRG", "BRG", ["BALL BEARING", "BEARING BALL", "DEEP GROOVE BRG", "ROLLER BEARING", "TAPER BRG"],
         ["6201", "6202", "6204", "6206-2RS", "6305-ZZ", "6309", "22210", "30205", "32208"],
         ["CARBON STEEL", "CHROME STEEL", "ALLOY STEEL"],
         ["SKF", "FAG", "TIMKEN", "NBC", "NSK"],
         ["NOS", "NUMBERS", "PCS"]),

        ("VLV", "VLV", ["GATE VALVE", "GATE VLV", "GLOBE VALVE", "BALL VALVE", "CHECK VALVE", "BUTTERFLY VALVE"],
         ["1/2 INCH", "3/4 INCH", "1 INCH", "1.5 INCH", "2 INCH", "3 INCH", "4 INCH", "6 INCH", "DN50", "DN100"],
         ["CAST STEEL", "CS", "FORGED STEEL", "SS316", "CAST IRON", "WCB"],
         ["CLASS 150", "150#", "CLASS 300", "300#", "CLASS 800", "PN16", "PN25"],
         ["NOS", "PCS", "NUMBERS", "SET"]),

        ("ELE", "ELE", ["MCB", "MINIATURE CIRCUIT BREAKER", "MCCB", "POWER CONTACTOR", "OVERLOAD RELAY", "PUSH BUTTON"],
         ["16A", "25A", "32A", "63A", "100A", "125A", "160A", "250A"],
         ["POLYCARBONATE", "MOLDED CASE", "BAKELITE"],
         ["10KA", "16KA", "25KA", "36KA", "415V", "230V"],
         ["NOS", "NUMBERS", "PCS"]),

        ("CBL", "CBL", ["ARMOURED POWER CABLE", "CBL ARMOURED", "CONTROL CABLE", "UNARMOURED WIRE", "INSTRUMENTATION CABLE"],
         ["2C X 2.5 SQMM", "3C X 4 SQMM", "4C X 6 SQMM", "4C X 10 SQMM", "4C X 25 SQMM", "4C X 35 SQMM", "4C X 50 SQMM", "7C X 1.5 SQMM"],
         ["COPPER", "CU", "ALUMINIUM", "AL"],
         ["XLPE 1.1KV", "PVC 1100V", "FRLS", "IS 1554", "IS 7098"],
         ["MTR", "METERS", "MTRS"]),

        ("MTR", "MTR", ["INDUCTION MOTOR", "IND MTR", "SQUIRREL CAGE MOTOR", "TEFC MOTOR", "FLAMEPROOF MOTOR"],
         ["3 HP", "5 HP", "7.5 HP", "10 HP", "15 HP", "20 HP", "25 HP", "30 HP", "50 HP", "75 HP"],
         ["CAST IRON", "CI"],
         ["415V 1440 RPM", "415V 2880 RPM", "415V 960 RPM", "CLASS F IE2", "CLASS F IE3"],
         ["NOS", "SET"]),

        ("PMP", "PMP", ["CENTRIFUGAL PUMP", "CNTRF PUMP", "SUBMERSIBLE PUMP", "SLURRY PUMP", "MONOBLOC PUMP"],
         ["15 M3/HR 25M HEAD", "25 M3/HR 30M HEAD", "40 M3/HR 35M HEAD", "60 M3/HR 45M HEAD", "100 M3/HR 50M HEAD"],
         ["CAST IRON", "CI / BRONZE", "SS304", "SS316"],
         ["KSB", "KIRLOSKAR", "SULZER", "MATHER & PLATT", "FLOWSERVE"],
         ["SET", "SETS", "NOS"]),

        ("SFT", "SFT", ["SAFETY HELMET", "HARD HAT", "SAFETY SHOES", "LEATHER GLOVES", "SAFETY HARNESS", "GAS MASK"],
         ["STANDARD", "SIZE 7", "SIZE 8", "SIZE 9", "SIZE 10", "14 INCH", "UNIVERSAL"],
         ["HDPE", "LEATHER", "POLYESTER", "NITRILE"],
         ["IS 2925", "IS 15298", "IS 3521", "CE EN 397"],
         ["NOS", "PAIR", "PCS"]),

        ("TLS", "TLS", ["TORQUE WRENCH", "IMPACT WRENCH", "PIPE BENDER", "BENCH VICE", "HYDRAULIC JACK", "VERNIER CALIPER"],
         ["1/2\" DR", "3/4\" DR", "1\" DR", "6 INCH", "8 INCH", "10 TON", "20 TON", "0-150 MM", "0-300 MM"],
         ["CHROME VANADIUM", "FORGED STEEL", "ALLOY STEEL"],
         ["NORBAR", "BRITOOL", "GEDORE", "STANLEY", "TAPARIA"],
         ["NOS", "SET", "PCS"]),

        ("MCH", "MCH", ["SPIRAL WOUND GASKET", "GSKT SW", "MECHANICAL SEAL", "WELD NECK FLANGE", "SLIP ON FLANGE", "BALL VALVE BALL"],
         ["1 INCH 150#", "2 INCH 150#", "3 INCH 150#", "4 INCH 150#", "6 INCH 150#", "30MM SHAFT", "45MM SHAFT", "60MM SHAFT"],
         ["SS316 / GRAPHITE", "CARBON STEEL", "A105", "PTFE", "CARTRIDGE SIC"],
         ["ASME B16.20", "ASME B16.5", "CLASS 150", "CLASS 300"],
         ["NOS", "PCS", "SET"])
    ]

    # Generate synthetic materials systematically
    seq = 1000
    for cat_code, prefix, names, sizes, materials, grades, uoms in var_templates:
        cat = cat_map[cat_code]
        # Find matching standard materials in this category
        cat_stds = [s for s in standard_materials_list if s.category_id == cat.id]

        for i in range(65):  # 65 per category * 10 categories = 650 materials
            seq += 1
            cpse_code = random.choice(cpse_codes_list)
            cpse = cpse_map[cpse_code]

            name = random.choice(names)
            size = random.choice(sizes)
            mat_type = random.choice(materials)
            grade = random.choice(grades)
            uom = random.choice(uoms)

            # Construct varying syntactic permutations
            perm = random.randint(1, 4)
            if perm == 1:
                raw_desc = f"{name} {size} {mat_type} {grade}".strip()
            elif perm == 2:
                raw_desc = f"{mat_type} {name} SIZE {size} {grade}".strip()
            elif perm == 3:
                raw_desc = f"{grade} {name} {size} IN {mat_type}".strip()
            else:
                raw_desc = f"{name} {mat_type} {grade} {size}".strip()

            mat_code = f"{cpse_code}-{prefix}-{seq:05d}"
            norm_desc = MaterialNormalizer.normalize(raw_desc)
            attrs = AttributeExtractor.extract(raw_desc)

            # Assign standard material & match status
            std_mat = random.choice(cat_stds) if cat_stds else None
            
            # Confidence distribution
            roll = random.random()
            if roll < 0.60:
                status = "approved"
                conf = round(random.uniform(91.0, 98.8), 1)
            elif roll < 0.85:
                status = "ai_suggested"
                conf = round(random.uniform(80.0, 92.0), 1)
            elif roll < 0.95:
                status = "needs_review"
                conf = round(random.uniform(65.0, 78.0), 1)
            else:
                status = "rejected"
                conf = round(random.uniform(50.0, 72.0), 1)

            mat = Material(
                material_code=mat_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                cpse_id=cpse.id,
                category_id=cat.id,
                uom=uom,
                manufacturer=attrs.get("manufacturer") or grade,
                part_number=f"PN-{seq}",
                standard_material_id=std_mat.id if (std_mat and status != "rejected") else None,
                match_status=status,
                confidence_score=conf,
                created_at=recent_timestamp - timedelta(days=random.randint(1, 45))
            )
            db.add(mat)
            db.flush()
            total_materials_added += 1

            # Save attributes
            mat_attr = MaterialAttribute(
                material_id=mat.id,
                material_type=attrs.get("material_type"),
                product_type=attrs.get("product_type"),
                dimensions=attrs.get("dimensions") or size,
                grade=attrs.get("grade") or grade,
                size_rating=attrs.get("size_rating") or size,
                capacity=attrs.get("capacity"),
                voltage=attrs.get("voltage"),
                pressure=attrs.get("pressure"),
                uom=uom,
                manufacturer=attrs.get("manufacturer"),
                model=f"MOD-{seq}"
            )
            db.add(mat_attr)

            # Save MaterialMatch
            if std_mat:
                mat_match = MaterialMatch(
                    source_material_id=mat.id,
                    standard_material_id=std_mat.id,
                    overall_confidence=conf,
                    description_sim=round(conf - random.uniform(0.5, 3.0), 1),
                    dimension_sim=round(random.uniform(85.0, 100.0), 1),
                    material_sim=round(random.uniform(88.0, 100.0), 1),
                    category_sim=100.0,
                    uom_compatibility=100.0,
                    match_explanation=f"Matches {std_mat.name} across engineering parameters. Differences are primarily due to naming conventions, word order, and CPSE abbreviation practices.",
                    status="approved" if status == "approved" else ("rejected" if status == "rejected" else "suggested"),
                    created_at=mat.created_at
                )
                db.add(mat_match)

    # 6. Seed Review Queue items and Decisions
    pending_materials = db.query(Material).filter(Material.match_status == "needs_review").limit(25).all()
    admin_user = user_objects[0]
    reviewer_user = user_objects[1]

    # Pre-record some historic review decisions
    approved_mats = db.query(Material).filter(Material.match_status == "approved").limit(15).all()
    for m in approved_mats:
        rev = ReviewDecision(
            material_id=m.id,
            standard_material_id=m.standard_material_id,
            reviewer_id=reviewer_user.id,
            reviewer_name=reviewer_user.full_name,
            decision="approved",
            notes="Technical attributes, dimensions, and grade verified against CPSE specification sheets."
        )
        db.add(rev)

    # 7. Seed Audit Logs
    audit_samples = [
        ("admin", "Admin", "ONGC-FST-001245", "AI Suggested", "Approved", "Approve Match", "Technical attributes, grade SS304, and M10x50 dimensions verified"),
        ("reviewer1", "Reviewer", "BHEL-BOLT-8932", "AI Suggested", "Approved", "Approve Match", "Normalized description mapped to STD-FST-00128"),
        ("reviewer1", "Reviewer", "NTPC-MTR-44521", "AI Suggested", "Approved", "Approve Match", "Fastener family match confirmed across CPSE procurement records"),
        ("admin", "Admin", "IOC-PMP-882", "AI Suggested", "Approved", "Approve Match", "Bearing model 6205-2RS verified"),
        ("reviewer2", "Reviewer", "SAIL-VAL-119", "Needs Review", "Approved", "Approve Match", "Gate valve 2 inch Class 150 WCB specifications confirmed"),
        ("reviewer2", "Reviewer", "ONGC-ELE-33291", "AI Suggested", "Approved", "Approve Match", "MCB rating 32A C-curve confirmed"),
        ("admin", "Admin", "BHEL-SW-4011", "AI Suggested", "Modified", "Modify Match", "Adjusted base UOM to NOS"),
        ("reviewer1", "Reviewer", "SAIL-TLS-199", "Needs Review", "Approved", "Approve Match", "Torque wrench range 40-200 Nm verified"),
        ("admin", "Admin", "BATCH-IMPORT-2026", "Pending", "Completed", "Data Normalization", "Automated batch normalization of 150 CPSE-C records"),
    ]
    for usr, role, code, prev, new_st, act, rsn in audit_samples:
        log = AuditLog(
            user_name=f"{usr.title()} ({role})",
            user_role=role.lower(),
            material_code=code,
            previous_state=prev,
            new_state=new_st,
            action=act,
            reason=rsn,
            timestamp=recent_timestamp - timedelta(hours=random.randint(1, 96))
        )
        db.add(log)

    # 8. Seed Sample Import Jobs
    import_jobs = [
        ImportJob(file_name="ONGC_Master_Materials_Q3.csv", cpse_code="ONGC", total_records=180, normalized_records=180, matched_records=168, status="completed"),
        ImportJob(file_name="BHEL_Trichy_Spares_Catalog.xlsx", cpse_code="BHEL", total_records=220, normalized_records=220, matched_records=195, status="completed"),
        ImportJob(file_name="NTPC_PowerPlant_Inventory.csv", cpse_code="NTPC", total_records=150, normalized_records=150, matched_records=132, status="completed"),
    ]
    for ij in import_jobs:
        db.add(ij)

    db.commit()
    print(f"Successfully seeded database with {total_materials_added} material records and 5 CPSEs!")

    # 9. Generate realistic CSV and XLSX demo sample files in backend/data/
    generate_demo_files()

def generate_demo_files():
    """Generates sample CSV and XLSX files for the Import Data test feature."""
    import csv
    import pandas as pd

    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    os.makedirs(data_dir, exist_ok=True)

    sample_rows = [
        {"material_code": "ONGC-VAL-901", "description": "GATE VLV 2\" CL150 WCB FLANGED", "cpse": "ONGC", "category": "Valves", "uom": "NOS", "manufacturer": "Audco", "part_number": "GV-2-150"},
        {"material_code": "BHEL-FST-402", "description": "HEX BOLT M12 X 60 MM SS 304", "cpse": "BHEL", "category": "Fasteners", "uom": "NOS", "manufacturer": "Unbrako", "part_number": "UB-M1260"},
        {"material_code": "NTPC-BRG-811", "description": "BEARING DEEP GROOVE BALL 6308-ZZ", "cpse": "NTPC", "category": "Bearings", "uom": "NUMBERS", "manufacturer": "SKF", "part_number": "6308-ZZ"},
        {"material_code": "SAIL-CBL-119", "description": "4 CORE 25 SQ MM ALUMINIUM ARMOURED CABLE 1.1KV", "cpse": "SAIL", "category": "Cables", "uom": "MTR", "manufacturer": "Polycab", "part_number": "POL-4C25"},
        {"material_code": "IOCL-MTR-303", "description": "3 PHASE INDUCTION MOTOR 20 HP 415V 1440 RPM", "cpse": "IOCL", "category": "Electric Motors", "uom": "NOS", "manufacturer": "Siemens", "part_number": "1LE0-20HP"},
        {"material_code": "ONGC-PMP-772", "description": "CENTRIFUGAL WATER PUMP 50 M3/HR 40M HEAD", "cpse": "ONGC", "category": "Pumps", "uom": "SET", "manufacturer": "KSB", "part_number": "MEGA-50"},
        {"material_code": "BHEL-ELE-551", "description": "MINIATURE CIRCUIT BREAKER 3 POLE 32A C-CURVE", "cpse": "BHEL", "category": "Electrical", "uom": "NOS", "manufacturer": "Schneider", "part_number": "ACTI9-32"},
        {"material_code": "NTPC-SFT-201", "description": "SAFETY HELMET HDPE YELLOW WITH RATCHET HARNESS", "cpse": "NTPC", "category": "Safety", "uom": "NOS", "manufacturer": "Karam", "part_number": "SHEL-01"},
        {"material_code": "SAIL-TLS-992", "description": "TORQUE WRENCH 1/2 INCH DRIVE 40-200 NM", "cpse": "SAIL", "category": "Tools", "uom": "NOS", "manufacturer": "Norbar", "part_number": "NOR-130103"},
        {"material_code": "IOCL-MCH-414", "description": "SPIRAL WOUND GASKET 2\" 150# SS316 GRAPHITE ASME B16.20", "cpse": "IOCL", "category": "Mechanical", "uom": "NOS", "manufacturer": "Champion", "part_number": "CHM-2-150"},
    ]

    csv_path = os.path.join(data_dir, "sample_materials.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(sample_rows[0].keys()))
        writer.writeheader()
        writer.writerows(sample_rows)

    xlsx_path = os.path.join(data_dir, "sample_materials.xlsx")
    df = pd.DataFrame(sample_rows)
    df.to_excel(xlsx_path, index=False)

    print(f"Generated sample import files:\n - {csv_path}\n - {xlsx_path}")
