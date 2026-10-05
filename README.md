# SAMHITA AI (संहिता)
### AI-Powered Material Standardization & Harmonization Platform Across CPSEs
**Smart India Hackathon (SIH) Prototype**

---

## 1. Executive Overview

**SAMHITA AI** is an enterprise-grade GovTech platform built to solve the systemic challenge of inconsistent, fragmented material master data across India's Central Public Sector Enterprises (CPSEs).

In major public sector undertakings (e.g., **ONGC**, **BHEL**, **NTPC**, **SAIL**, **IOCL**), different units procure identical or functionally equivalent industrial supplies using disparate naming conventions, abbreviations, dimensional notations, and proprietary part numbering.

### Problem Scenario Example:
| CPSE | Local Material Code | Description in Enterprise ERP | Local UOM |
| :--- | :--- | :--- | :--- |
| **ONGC** | `MAT-001245` | `HEX BOLT M10 X 50 SS` | `NOS` |
| **BHEL** | `BOLT-8932` | `SS HEXAGONAL BOLT 10MM X 50MM` | `NUMBERS` |
| **NTPC** | `MTR-44521` | `STAINLESS STEEL HEX BOLT M10*50` | `PCS` |
| **SAIL** | `STEEL-FL-902` | `SS304 HEX HEAD BOLT SIZE M10 X 50MM` | `NOS` |
| **IOCL** | `IOC-FAST-3312`| `BOLT HEX SS 10X50 MM FULL THREAD` | `PIECES` |

All five descriptions represent the exact same engineering fastener. Without standardization:
- Redundant procurement contracts are executed at divergent unit rates.
- Inventory is duplicated across regional warehouses.
- Inter-CPSE spare parts sharing and bulk rate negotiation are impossible.

**SAMHITA AI automatically standardizes these disparate records into a single canonical identity:**
> **Standard Code:** `STD-FST-00128`  
> **Standard Title:** `Stainless Steel Hex Bolt M10 × 50 mm`  
> **AI Confidence:** `97%` (with full explainable breakdown)

---

## 2. Core Architecture & AI Matching Pipeline

SAMHITA AI implements a deterministic, explainable **6-Layer Hybrid Matching Pipeline**:

```
                         Raw Material Descriptions
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Layer 1: Exact Code & Part Number Identification     │
       │   Compares OEM part numbers, manufacturer codes        │
       └────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Layer 2: NLP Data Normalization Engine               │
       │   Expands domain acronyms (SS -> STAINLESS STEEL),     │
       │   standardizes units, fractional inches, dimensions    │
       └────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Layer 3: Technical Attribute Extraction              │
       │   Parses Material Type, Product Type, Dimensions,      │
       │   Grade/Class (SS304, Class 150), Rating, Capacity     │
       └────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Layer 4: Fuzzy String Similarity                     │
       │   RapidFuzz token sort, token set & Levenshtein ratio  │
       └────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Layer 5: Semantic Subword Vector Similarity          │
       │   TF-IDF character & word n-gram cosine vectorizer     │
       └────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Layer 6: Multi-Factor Weighted Confidence & XAI      │
       │   Exact Attributes: 30% | Semantic: 30%                │
       │   Technical Specs: 25% | Fuzzy: 10% | UOM/Cat: 5%      │
       │   Outputs transparent reasoning for human verification │
       └────────────────────────────────────────────────────────┘
```

### AI Match Explainability (XAI)
SAMHITA AI does not output a black-box number. For every comparison, it provides:
1. **Description Similarity (%)**
2. **Dimension Similarity (%)**
3. **Material Similarity (%)**
4. **Category Compatibility (%)**
5. **Unit of Measure (UOM) Compatibility (%)**
6. **Natural Language Rationale**:  
   *"Both records describe a stainless-steel hexagonal bolt with an M10 diameter and 50 mm length. Differences are primarily due to naming conventions and abbreviations."*

---

## 3. Technology Stack

- **Frontend:**
  - React 19 + TypeScript
  - Tailwind CSS 4 (Enterprise light theme with minimal, purposeful accents)
  - Lucide React (Clean icon system)
  - Recharts (Interactive analytics & KPI visualizers)
  - Vite 8 (Ultra-fast build & HMR)

- **Backend:**
  - Python 3.13
  - FastAPI (High-performance async REST framework)
  - SQLAlchemy 2.0 (PostgreSQL-ready ORM with auto SQLite fallback for zero-setup demo)
  - RapidFuzz (Fast C-accelerated Levenshtein & token-sort matching)
  - Scikit-learn (TF-IDF subword vectorization & cosine similarity)
  - Pandas & OpenPyXL (CSV & Excel ingestion pipelines)

---

## 4. Key Application Modules

| Module | Purpose |
| :--- | :--- |
| **Executive Dashboard** | Real-time KPIs: Total Materials (700+), Standardized (400+), Duplicates (600+), Pending Review, Confidence tiers, and recent activity. |
| **Material Master** | Comprehensive catalog with search, multi-filters (CPSE, Category, Status), sorting, and sliding **Material Detail Drawer** with explainability. |
| **Cross-CPSE Harmonization** | Groups equivalent materials from 5 CPSEs under single unified standard material codes (`STD-FST-00128`). |
| **Review Queue** | Human-in-the-Loop review workflow for approving, modifying, or rejecting AI suggestions with reasons. |
| **Duplicate Detection** | Highlights cross-CPSE duplicate pairs with similarity ratings and one-click Merge / Keep Separate actions. |
| **Try AI Matching** | Interactive live playground allowing judges to enter any two descriptions or test 5 pre-built CPSE variations. |
| **Import Data** | 5-step bulk upload wizard (Validation &rarr; Column Detection &rarr; Normalization &rarr; AI Matching &rarr; Review). Includes downloadable sample template. |
| **CPSE Directory** | Coverage analysis for participating enterprises (**ONGC**, **BHEL**, **NTPC**, **SAIL**, **IOCL**). |
| **Analytics** | Quantified metrics: Materials by CPSE, category standardization rates, confidence score distribution, and estimated duplicate reduction. |
| **Audit Trail** | Immutable log recording every AI match, human approval, rejection rationale, and batch ingestion. |

---

## 5. Seeded Demo Data (Instant Out-of-the-Box Demo)

The application comes pre-seeded with **700 material records** across **5 participating CPSEs** and **10 industrial categories**:
- Fasteners (`FST`)
- Bearings (`BRG`)
- Valves & Actuators (`VLV`)
- Electrical Components (`ELE`)
- Cables & Wires (`CBL`)
- Electric Motors (`MTR`)
- Pumps & Spares (`PMP`)
- Safety Equipment (`SFT`)
- Industrial Tools (`TLS`)
- Mechanical Spares (`MCH`)

Sample import files are pre-generated in `backend/data/`:
- `sample_materials.csv`
- `sample_materials.xlsx`

---

## 6. Installation & Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Quick Start (One-Click)
On Windows:
```powershell
.\start_servers.bat
```
or via PowerShell:
```powershell
.\start_servers.ps1
```

### Manual Start

#### 1. Backend Setup
```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy rapidfuzz scikit-learn pandas openpyxl python-dotenv

# Run the backend server
python run_backend.py
```
Backend API will be live at: **`http://127.0.0.1:8000`**  
Interactive Swagger Docs: **`http://127.0.0.1:8000/docs`**

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (already completed in workspace)
npm install

# Run Vite development server
npm run dev
```
Frontend will be live at: **`http://localhost:5173`**

---

## 7. SIH Demonstration Walkthrough Guide

Follow this sequence for the Smart India Hackathon presentation:

1. **Dashboard:**
   - Open `http://localhost:5173`
   - Point out the 5 CPSEs participating (ONGC, BHEL, NTPC, SAIL, IOCL).
   - Highlight the **Harmonization Progress** bar and **Confidence Tiers**.

2. **Material Master & Detail Drawer:**
   - Click **Material Master** in the sidebar.
   - Filter by CPSE: **ONGC**, Category: **Fasteners**.
   - Click on `MAT-001245` (`HEX BOLT M10 X 50 SS`).
   - In the slide-out drawer, show the **NLP Normalized View** and **AI Match Explanation** breakdown (Description 98%, Dimension 100%, Material 96%, UOM 100%).

3. **Cross-CPSE Harmonization (Core Proof):**
   - Click **Harmonization** in the sidebar.
   - Inspect `STD-FST-00128` (*Stainless Steel Hex Bolt M10 × 50 mm*).
   - Show how records from **ONGC**, **BHEL**, **NTPC**, **SAIL**, and **IOCL** with completely different descriptions are unified under one code.

4. **Human-in-the-Loop Review:**
   - Click **Review Queue**.
   - Select a pending item, review its AI rationale, and click **Approve** (Thumbs Up).
   - Notice the instant optimistic update and audit trail entry.

5. **Interactive Playground ("Try AI Matching"):**
   - Click **Try AI Matching** in the top navbar or sidebar.
   - Click the preset button: **"SS Hex Bolt M10×50"** or enter custom text.
   - Click **Compare Materials**.
   - Watch the multi-step real-time analysis produce the verdict, side-by-side attributes, and explainable justification.

6. **Bulk Upload:**
   - Click **Import Data**.
   - Click **Download Sample Template** to show standard format.
   - Drag & drop `backend/data/sample_materials.csv`.
   - Watch the 5-step ingestion pipeline validate, normalize, and match records into the master catalog.

7. **Audit Trail & Analytics:**
   - Check **Audit Trail** to show full compliance and provenance tracking.
   - Check **Analytics** for duplicate reduction and inventory savings estimates.

---

## 8. Role-Based Access Control

Switch roles anytime using the top-right profile dropdown:
- **Admin (CTO):** Full access to approve, reject, merge, and bulk import.
- **Reviewer:** Can review AI suggestions, approve, or reject with notes.
- **Viewer:** Read-only mode for audit inspection.

---

## 9. Security & Compliance
- Parameterized SQLAlchemy queries prevent SQL injection.
- Strict schema validation via Pydantic v2 models.
- Immutable audit log with user attribution and timestamping.
- Separation of raw procurement data and normalized representations (raw data is never destroyed).

---

## 10. Future Roadmap
- Integration with Government e-Marketplace (GeM) APIs.
- Fine-tuned domain transformer LLM for Indian regional language transliteration.
- Automated inventory inter-CPSE transfer recommendations.
