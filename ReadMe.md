# 🛡️ SHIELDPLAN — Radiation Shielding Design Platform

Advanced radiation shielding analysis, leakage assessment, and regulatory compliance checking for medical and industrial radiation facilities.

## Architecture

```
radition_simulation/
├── backend/          # Node.js + Express + TypeScript + Prisma + SQLite
│   ├── prisma/       # Database schema & migrations
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── services/ # Physics calculation engine
│   │   ├── seed.ts   # Database seeder
│   │   └── index.ts  # Express server entry
│   └── package.json
└── frontend/         # Vite + TypeScript SPA
    ├── src/
    │   ├── lib/      # API client, router, state management
    │   ├── components/  # UI components
    │   ├── workflow/    # 5-step wizard logic
    │   ├── styles/      # CSS design system
    │   └── main.ts      # Entry point
    ├── public/       # Static assets
    └── package.json
```

## Quick Start

### Prerequisites

- **Node.js v18+** (includes `npm`)
- **Git Bash** or **WSL** (for npm scripts)

### 1. Start the Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx src/seed.ts
npm run dev
```

Server starts at **http://localhost:8000**

### 2. Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

App opens at **http://localhost:5173**

### 3. Use the Application

1. Navigate to **Workflow** from the sidebar
2. **Step 1:** Select a radiation modality (XR, CT, LINAC, etc.)
3. **Step 2:** Choose a manufacturer and specific machine model
4. **Step 3:** Select or configure a room template
5. **Step 4:** Adjust shielding parameters (kVp, mA, wall thickness, etc.)
6. **Step 5:** Click **Run Full Analysis** to compute:
   - Shielding analysis (dose rates, attenuation, wall-by-wall report)
   - Leakage analysis (barrier leakage rates)
   - Compliance check (against NCRP, IAEA, IEC standards)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/modalities/` | List all modalities |
| GET | `/api/modalities/:id/manufacturers` | Manufacturers for a modality |
| GET | `/api/modalities/:id/room-templates` | Room templates for a modality |
| GET | `/api/modalities/:id/standards` | Regulatory standards for a modality |
| POST | `/api/analysis/shielding` | Run shielding analysis |
| POST | `/api/analysis/leakage` | Run leakage analysis |
| POST | `/api/analysis/compliance` | Run compliance check |
| GET | `/api/reports/` | List all reports |
| POST | `/api/reports/` | Create a report |
| DELETE | `/api/reports/:id` | Delete a report |

## Database

SQLite (file: `backend/prisma/dev.db`). Seeded with:
- **8 modalities**: XR, Cath Lab, CT, PET-CT, Cyclotron, LINAC, Gamma Room, Neutron Facility
- **17 manufacturers**: Siemens, GE, Philips, Varian, Elekta, IBA, Canon, Thermo Fisher
- **23 machine models** with specs (kVp, mA, workload)
- **12 room templates** with dimensions
- **12 regulatory standards** (NCRP 147, 151, 160, 144; IAEA SRS 47; IEC 60601; ICRP 85; AAPM TG 204)

## Tech Stack

- **Backend**: Express + TypeScript + Prisma ORM + SQLite
- **Frontend**: Vite + TypeScript (vanilla, no framework)
- **Design**: Dark/light theme, particle animation, holographic cards
- **Calculations**: Attenuation coefficients (NCRP-based), inverse square law, transmission factors, compliance scoring
