# FlacronBuild Architecture Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [System Architecture](#system-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Schema](#database-schema)
8. [External Integrations](#external-integrations)
9. [Data Flow](#data-flow)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Key Features](#key-features)

---

## System Overview

**FlacronBuild** is an AI-powered roofing cost estimation platform that provides accurate, data-driven estimates for roof repairs, replacements, and maintenance. The system serves four distinct user roles:

- **Homeowners**: Basic estimation with simplified interface
- **Contractors**: Advanced features with detailed breakdowns and bid-ready reports
- **Inspectors**: Professional inspection tools with slope-by-slope damage assessment
- **Insurance Adjusters**: Claim analysis with coverage tables and damage classification

### Core Capabilities
- Real-time cost estimation using multi-provider AI (OpenAI GPT-4o primary, Google Gemini 2.5-flash fallback)
- AI chatbot powered by IBM Watsonx (ibm/granite-4-h-small)
- Multi-role user management with role-based features
- PDF report generation with role-specific templates (browser via jsPDF + server-side via pdfkit)
- Project comparison and analysis tools
- Subscription-based payment processing (Stripe)
- Real-time data scraping for market pricing
- Image analysis for damage assessment
- Docker containerization support
- Cloud Foundry deployment support

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: Wouter 3.3.5 (lightweight React router)
- **State Management**:
  - React Query (TanStack Query) 5.60.5 for server state
  - React Hook Form 7.55.0 for form state
- **UI Components**:
  - Radix UI primitives
  - Tailwind CSS 3.4.17 for styling
  - shadcn/ui component library
  - framer-motion 11.13.1 for animations
  - recharts 2.15.2 for data visualization
  - react-icons 5.4.0 for icon sets
  - lucide-react 0.453.0 for icons
  - next-themes 0.4.6 for theme management
- **Form Validation**: Zod 3.24.2
- **PDF Generation**: jsPDF 3.0.1 (browser-side)
- **Maps**: @react-google-maps/api 2.20.7
- **Build Tool**: Vite 5.4.10

### Backend
- **Runtime**: Node.js 20.x with TypeScript (ES modules)
- **Framework**: Express 4.21.2
- **Database**:
  - PostgreSQL (via Neon serverless — schema/migrations only; runtime uses in-memory store)
  - Drizzle ORM 0.39.1 for type-safe schema definitions and migrations
- **Session Management**: express-session with memorystore (connect-pg-simple available as drop-in)
- **Authentication**: Firebase Authentication (client-side) + passport/passport-local (declared, not yet wired)
- **File Storage**: Firebase Firestore
- **PDF (server)**: pdfkit 0.17.2 (used in `shared/inspector-pdf.ts`)
- **Web Scraping**: cheerio 1.1.0, node-fetch 3.3.2

### External Services
- **AI/ML — Cost Estimation**: OpenAI GPT-4o (primary), Google Gemini 2.5-flash (fallback)
- **AI/ML — Chatbot**: IBM Watsonx (ibm/granite-4-h-small default)
- **Payment Processing**: Stripe API (server SDK 18.3.0 + @stripe/stripe-js 7.5.0)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (for reports/PDFs and user role documents)
- **Maps**: Google Maps API

### Development Tools
- **TypeScript**: 5.6.3
- **Build**: Vite 5.4.10 (frontend) + esbuild 0.25.0 (backend bundle)
- **Database Migrations**: Drizzle Kit 0.18.1
- **Package Manager**: npm
- **Runtime Runner (dev)**: tsx 4.19.1

---

## Architecture Patterns

### 1. Monorepo Structure
```
FlacronBuild/
├── client/          # React frontend application
├── server/          # Express backend API
├── shared/          # Shared TypeScript types, schemas, and PDF helpers
├── dist/            # Build output (gitignored)
└── *.ts             # Root-level utility and test scripts
```

### 2. Client-Server Architecture
- **Frontend**: SPA (Single Page Application) served via Vite in dev, static files in prod
- **Backend**: RESTful API with Express
- **Communication**: JSON over HTTP/HTTPS

### 3. Multi-Provider AI Strategy
- **Primary (cost estimation)**: OpenAI GPT-4o via `OPENAI_KEY` / `OPENAI_API_KEY`
- **Fallback (cost estimation)**: Google Gemini 2.5-flash via `GEMINI_KEY`
- **Chatbot**: IBM Watsonx via `IBM_WATSONX_AI_API_KEY` with IAM token exchange

### 4. Database Strategy
- **Schema definitions**: PostgreSQL (Drizzle ORM) in `shared/schema.ts` — used for migrations via `drizzle-kit push`
- **Runtime persistence**: `MemStorage` (in-memory maps) for projects and estimates
- **Document Store**: Firebase Firestore for reports, PDFs, and user role/subscription data
- **Hybrid Approach**: Combines (planned) relational (PostgreSQL) and document (Firestore) databases

### 5. Authentication & Authorization
- **Authentication**: Firebase Authentication (email/password, Google OAuth)
- **Authorization**: Role-based access control (RBAC) with 4 user roles stored in Firestore `userRoles/{uid}`
- **Session Management**: Express sessions (memorystore)

### 6. State Management
- **Server State**: React Query for caching and synchronization
- **Form State**: React Hook Form with Zod validation
- **Client State**: React hooks (useState, useContext)
- **Persistence**: localStorage for temporary data (file uploads)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React SPA)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │     Hooks    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                            │                                 │
│                    React Query Client                        │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┼─────────────────────────────────┐
│                    Express Backend API                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │   Storage    │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
    ┌─────┴─────┐    ┌───────┴───────┐   ┌─────┴──────────────┐
    │PostgreSQL │    │  Firestore   │   │  AI Services       │
    │  (Neon)   │    │  (Firebase)  │   │  OpenAI / Gemini / │
    │ (schema)  │    │              │   │  IBM Watsonx       │
    └───────────┘    └──────────────┘   └────────────────────┘
```

---

## Frontend Architecture

### Directory Structure
```
client/src/
├── components/                    # Reusable UI components
│   ├── ui/                       # shadcn/ui base components (30+ primitives)
│   ├── estimation-form.tsx        # Main estimation form (multi-step wizard)
│   ├── real-cost-breakdown.tsx    # Detailed AI cost breakdown display
│   ├── cost-preview.tsx           # Live cost preview panel
│   ├── chatbot.tsx                # IBM Watsonx AI chatbot component
│   ├── login-dialog.tsx           # Authentication modal (multi-step)
│   ├── ChoosePlanStep.tsx         # Plan selection step in auth flow
│   ├── SignUpStepOne.tsx          # Email/password sign-up step
│   ├── ProfileCompletionStep.tsx  # Profile setup step
│   ├── ReviewSubscription.tsx     # Subscription review before payment
│   ├── header.tsx                 # App header with navigation
│   ├── intro-desgin.tsx           # Landing page intro/hero section
│   ├── JurisdictionMapPicker.tsx  # Google Maps-based jurisdiction selector
│   ├── data-verification.tsx      # Real-time data source verification panel
│   ├── live-scraping-test.tsx     # Live market data scraping test UI
│   ├── LoadingOverlay.tsx         # Full-screen loading overlay
│   └── legal-page-layout.tsx     # Shared layout for legal pages
├── pages/                        # Route components
│   ├── dashboard.tsx              # Landing/main estimator page (/)
│   ├── userdashboard.tsx          # My Estimates page (/my-estimates)
│   ├── compare.tsx                # Project comparison (/compare)
│   ├── compare-slog.tsx           # Alternative comparison variant
│   ├── estimate-detail.tsx        # Single estimate view
│   ├── estimate-edit.tsx          # Estimate editing
│   ├── report/[id].tsx            # Dynamic report viewer (/report/:id)
│   ├── admin.tsx                  # Admin dashboard
│   ├── user-settings.tsx          # User settings and preferences
│   ├── success.tsx                # Stripe payment success page
│   ├── cancel.tsx                 # Stripe payment cancel page
│   ├── support.tsx                # Customer support
│   ├── privacy-policy.tsx         # Privacy policy
│   ├── terms.tsx                  # Terms of service
│   ├── cookie-policy.tsx          # Cookie policy
│   ├── disclaimer.tsx             # Disclaimer
│   ├── refund-policy.tsx          # Refund policy
│   └── not-found.tsx              # 404 page
├── lib/                          # Utilities and services
│   ├── firebase.ts                # Firebase initialization and config
│   ├── user-role.ts               # UserRoleManager (Firestore role/subscription)
│   ├── pdf-generator.ts           # Browser-side PDF generation (jsPDF)
│   ├── pdf-storage.ts             # Firestore PDF operations
│   ├── cost-calculator.ts         # Client-side heuristic cost calculation
│   ├── queryClient.ts             # React Query client factory
│   └── utils.ts                   # cn() utility (clsx + tailwind-merge)
├── hooks/                        # Custom React hooks
│   ├── use-toast.ts               # Toast notification state
│   └── use-mobile.tsx             # Responsive breakpoint detection
├── App.tsx                       # Root component with Wouter routing
├── main.tsx                      # Application entry point
└── index.css                     # Global styles (Tailwind layers/variables)
```

### Key Frontend Patterns

#### 1. Multi-Step Form Pattern
The estimation form uses a step-based wizard pattern:
- **Step 1**: Project basics (name, type, location)
- **Step 2**: Structure details (roof pitch, age, materials)
- **Step 3**: Role-specific fields (inspector, contractor, etc.)
- **Step 4**: Additional details (jurisdiction, images)
- **Step 5**: Review and submit
- **Step 6**: Results and PDF generation

#### 2. Multi-Step Auth / Onboarding Pattern
The login dialog orchestrates a multi-step onboarding flow:
1. `SignUpStepOne` — email/password entry
2. `ChoosePlanStep` — role and plan selection
3. `ProfileCompletionStep` — profile details
4. `ReviewSubscription` — subscription summary before Stripe redirect

#### 3. Component Composition
- **Atomic Design**: UI components built from Radix primitives
- **Compound Components**: Complex components like forms use composition
- **Controlled Components**: Forms use React Hook Form for validation

#### 4. Data Fetching Strategy
- **React Query**: All API calls go through React Query
- **Optimistic Updates**: UI updates before server confirmation
- **Cache Management**: Automatic cache invalidation on mutations

#### 5. State Management
```typescript
// Server State (React Query)
const { data, isLoading } = useQuery(['projects'], fetchProjects);

// Form State (React Hook Form)
const form = useForm<ProjectFormData>({
  resolver: zodResolver(projectSchema)
});

// Client State (React Hooks)
const [currentStep, setCurrentStep] = useState(1);
```

---

## Backend Architecture

### Directory Structure
```
server/
├── index.ts                  # Express app setup, middleware, error handler
├── routes.ts                 # All API route definitions and handlers
├── storage.ts                # IStorage interface + MemStorage implementation
├── cost-calculator.ts        # Multi-provider AI cost calculation service
├── data-scrapers.ts          # Cheerio-based web scraping for market data
├── scraping-verification.ts  # Real URL probing for /api/verify-data-sources
├── admin-functions.js        # Firebase Admin user utilities (not wired to routes)
└── vite.ts                   # Vite dev middleware + static prod file serving
```

### Shared Directory
```
shared/
├── schema.ts                 # Drizzle ORM table definitions + Zod insert schemas
└── inspector-pdf.ts          # Server-side inspector report PDF layout (pdfkit)
```

### Root Utility Scripts
```
generate-inspector-report.ts  # CLI: generate sample inspector PDF (npm run generate:inspector-report)
test-api.ts                   # API endpoint smoke tests
test-cost-calculator.ts       # Cost calculator unit tests
test-all-cases.ts             # Full test suite across all project types
validate-prompt.ts            # AI prompt validation utility
```

### API Routes

#### Project Management
- `GET /api/projects` — List all projects
- `GET /api/projects/:id` — Get project details
- `POST /api/projects` — Create new project (body validated with `insertProjectSchema`)
- `PATCH /api/projects/:id` — Partial update
- `DELETE /api/projects/:id` — Delete project

#### Estimation
- `POST /api/projects/:id/estimate` — Generate AI estimate (loads form JSON, optional images)
- `GET /api/projects/:id/estimates` — Get all estimates for project
- `GET /api/projects/:id/estimate/latest` — Get latest estimate
- `GET /api/projects/:id/cost-breakdown` — Regenerate cost breakdown (lightweight, no estimate save)

#### Payment Processing
- `POST /api/create-checkout-session` — Create Stripe subscription checkout
- `GET /api/stripe-session/:sessionId` — Retrieve session details and set user role

#### Utilities
- `POST /api/chatbot` — IBM Watsonx-powered chatbot (fallback static copy if no API key)
- `GET /api/verify-data-sources/:location` — Probe real data source URLs for a location

### Service Layer

#### Cost Calculator Service (`server/cost-calculator.ts`)
```typescript
class RealCostCalculator {
  async calculateRealCost(
    requirements: ProjectRequirements,
    images?: any[]
  ): Promise<EstimateResult>
}
```

**Multi-Provider AI Strategy**:
- **OpenAI GPT-4o** (primary): `OPENAI_KEY` / `OPENAI_API_KEY`
- **Google Gemini 2.5-flash** (fallback): `GEMINI_KEY`
- **IBM Watsonx** (chatbot, `ibm/granite-3-8b-instruct` default): `IBM_WATSONX_AI_API_KEY`

**Responsibilities**:
- Selects AI provider based on available API keys
- Processes project requirements and role-specific fields
- Analyzes uploaded images for damage assessment
- Scrapes real-time market data via `ConstructionDataScraper`
- Calculates material, labor, and permit costs with regional multipliers

#### Storage Layer (`server/storage.ts`)
```typescript
interface IStorage {
  createProject(project: InsertProject): Promise<Project>
  createEstimate(estimate: InsertEstimate): Promise<Estimate>
  // ... full CRUD
}

class MemStorage implements IStorage {
  // In-memory Maps — data is lost on server restart
}

export const storage = new MemStorage();
```

**Note**: Runtime uses in-memory storage. PostgreSQL + Drizzle are available for migration by implementing `IStorage` with a Drizzle-backed class.

---

## Database Schema

### PostgreSQL Schema (via Drizzle ORM — `shared/schema.ts`)

#### Projects Table
```typescript
projects {
  id: serial (PK)
  name: text
  type: text (residential | commercial | renovation | infrastructure)
  location: text
  area: integer
  unit: text (sqft | sqm)
  materialTier: text (economy | standard | premium)
  timeline: text | null (urgent | standard | flexible)
  status: text (draft | completed)
  uploadedFiles: json (string[])
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Estimates Table
```typescript
estimates {
  id: serial (PK)
  projectId: integer (FK -> projects.id)
  totalCost: decimal(12,2)
  materialsCost: decimal(12,2)
  laborCost: decimal(12,2)
  permitsCost: decimal(12,2)
  contingencyCost: decimal(12,2)
  regionMultiplier: decimal(3,2)
  report: json (full AI response — structured estimate)
  formInputData: json (complete form input data)
  openaiResponse: json (raw AI API response)
  createdAt: timestamp
}
```

### Firebase Firestore Collections

#### userRoles Collection (`userRoles/{uid}`)
```typescript
userRoles {
  uid: string
  role: string (homeowner | contractor | inspector | insurance_adjuster)
  subscriptionStatus: string
  stripeSessionId: string
  // ... subscription metadata
}
```

#### Reports Collection
```typescript
reports {
  id: string (document ID)
  userId: string
  projectId: number
  projectData: object
  geminiResponse: object
  pdfRef: string (reference to pdfs collection)
  timestamp: timestamp
  createdAt: timestamp
}
```

#### PDFs Collection
```typescript
pdfs {
  id: string (document ID)
  userId: string
  fileName: string
  pdfBase64: string
  fileSize: number
  timestamp: string
  projectType: string
  uploadedBy: string
  projectData: object
  structuredData: object
  createdAt: timestamp
}
```

---

## External Integrations

### 1. OpenAI API (Primary AI)
**Purpose**: Primary AI provider for cost estimation

**Model**: GPT-4o

**Configuration**:
```
OPENAI_KEY=          # or OPENAI_API_KEY
```

### 2. Google Gemini API (Fallback AI)
**Purpose**: Fallback AI provider for cost estimation when OpenAI key is unavailable

**Model**: gemini-2.5-flash

**Configuration**:
```typescript
GEMINI_KEY=
```

### 3. IBM Watsonx AI (Chatbot)
**Purpose**: Powers the in-app chatbot assistant

**Model**: `ibm/granite-4-h-small` (chatbot) / `ibm/granite-3-8b-instruct` (cost calc)

**Integration**:
- Exchanges IBM API key for IAM bearer token via `https://iam.cloud.ibm.com/identity/token`
- Calls Watsonx inference endpoint: `{WATSONX_URL}/ml/v1/text/generation?version=2024-11-19`
- Gracefully falls back to static copy if API key is not set

**Configuration**:
```
IBM_WATSONX_AI_API_KEY=
IBM_WATSONX_AI_URL=        # default: https://us-south.ml.cloud.ibm.com
IBM_WATSONX_AI_PROJECT_ID= # required for standard deployments
IBM_WATSONX_AI_SPACE_ID=   # required for deployment space
IBM_WATSONX_AI_MODEL_ID=   # default: ibm/granite-4-h-small
```

See `IBM_WATSONX_SETUP.md` for detailed setup instructions.

### 4. Stripe API
**Purpose**: Subscription payment processing

**Integration Points**:
- Checkout session creation
- Subscription management
- Stripe session metadata retrieval for role assignment

**Pricing Structure**:
- Homeowner: $19.99/month
- Contractor/Inspector/Insurance Adjuster: $97.99/month or $999.99/year

See `STRIPE_SETUP.md` for setup instructions.

### 5. Firebase Services

#### Authentication
- Email/password authentication
- Google OAuth
- Client-side session management

#### Firestore
- User role and subscription documents (`userRoles/{uid}`)
- Report storage
- PDF document storage (base64)

### 6. Google Maps API
**Purpose**: Location selection and jurisdiction mapping

**Features**:
- Place autocomplete (`JurisdictionMapPicker` component)
- Geocoding
- Map display with markers

---

## Data Flow

### Estimate Generation Flow

```
1. User fills estimation form (multi-step wizard)
   ↓
2. Form data validated (Zod schema)
   ↓
3. POST /api/projects (create project)
   ↓
4. POST /api/projects/:id/estimate
   ↓
5. Backend extracts project requirements
   ↓
6. Cost Calculator Service:
   - Selects AI provider (OpenAI → Gemini fallback)
   - Sends requirements + images to AI API
   - Scrapes real-time market data (ConstructionDataScraper)
   - Calculates costs with regional multipliers
   ↓
7. Estimate saved to MemStorage (PostgreSQL-ready)
   ↓
8. Response returned to frontend
   ↓
9. Frontend:
   - Saves estimate/report to Firestore
   - Generates PDF (jsPDF, role-specific template)
   - Saves PDF (base64) to Firestore
   - Auto-downloads PDF
   ↓
10. User redirected to /my-estimates
```

### Authentication & Onboarding Flow

```
1. User clicks "Get Started"
   ↓
2. LoginDialog opens
   ↓
3. SignUpStepOne (email/password or Google OAuth)
   ↓
4. ChoosePlanStep (role + billing period selection)
   ↓
5. ProfileCompletionStep (display name, company, etc.)
   ↓
6. ReviewSubscription (summary before payment)
   ↓
7. POST /api/create-checkout-session
   ↓
8. Redirect to Stripe Checkout
   ↓
9. Payment processed
   ↓
10. Redirect to /success?session_id=xxx
    ↓
11. GET /api/stripe-session/:sessionId
    ↓
12. User role written to Firestore (userRoles/{uid})
    ↓
13. User redirected to dashboard
```

### PDF Generation Flow

```
1. Estimate generated
   ↓
2. Frontend calls generatePDFReport()
   ↓
3. PDF Generator (client/src/lib/pdf-generator.ts):
   - Creates jsPDF document
   - Applies role-specific template and branding
   - Includes project data and cost breakdown
   - Embeds uploaded images with damage annotations
   ↓
4. PDF converted to base64
   ↓
5. PDF saved to Firestore (pdfs collection)
   ↓
6. Report record created (reports collection)
   ↓
7. PDF auto-downloaded to user's browser
```

### Chatbot Flow

```
1. User sends message in Chatbot component
   ↓
2. POST /api/chatbot
   ↓
3. Server exchanges IBM API key for IAM bearer token
   ↓
4. Request sent to IBM Watsonx inference endpoint
   ↓
5. Response streamed/returned to frontend
   ↓
(Fallback: static copy returned if IBM_WATSONX_AI_API_KEY not set)
```

---

## Security

### Authentication & Authorization
- **Firebase Authentication**: Secure user authentication (email/password, Google OAuth)
- **Role-Based Access Control**: 4 distinct user roles with different feature permissions
- **Session Management**: Express sessions with memorystore
- **User Role Storage**: Firestore `userRoles/{uid}` documents, written server-side after Stripe confirmation

### Data Protection
- **Input Validation**: Zod schemas validate all inputs on both client and server
- **SQL Injection Prevention**: Drizzle ORM uses parameterized queries
- **XSS Prevention**: React automatically escapes content
- **CSRF Protection**: Express session middleware

### API Security
- **Rate Limiting**: Planned (not yet implemented)
- **CORS Configuration**: Configured for production domains
- **Environment Variables**: All sensitive keys stored in `.env` (never committed)
- **HTTPS**: Required in production
- **Docker Security**: Non-root user (`nodejs:nodejs`) in production container

### Payment Security
- **Stripe Integration**: PCI-compliant payment processing
- **No Card Storage**: Cards never touch application servers
- **Webhook Verification**: Stripe webhook signature verification (planned)

---

## Deployment

### Build Process
```bash
# Development
npm run dev           # Starts tsx server/index.ts + Vite dev server (HMR)

# Production Build
npm run build         # vite build (frontend) + esbuild server/index.ts (backend)
npm start             # node dist/index.js

# Database
npm run db:push       # Push Drizzle schema changes to PostgreSQL

# Inspector Report
npm run generate:inspector-report   # Generate sample inspector PDF
```

### Docker Deployment (Recommended)
```bash
# Build image
docker build \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_GOOGLE_MAPS_API_KEY=... \
  --build-arg VITE_STRIPE_PUBLIC_KEY=... \
  -t flacronbuild .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=... \
  -e OPENAI_KEY=... \
  -e GEMINI_KEY=... \
  -e IBM_WATSONX_AI_API_KEY=... \
  -e STRIPE_SECRET_KEY=... \
  flacronbuild
```

Multi-stage build (Node 20 Alpine):
- **Stage 1 (builder)**: Install all deps, inject `VITE_*` build args, run `npm run build`
- **Stage 2 (production)**: Production deps only + Vite, copy `dist/` + `shared/`, run as non-root user, health check on `GET /api/projects`

See `README.DOCKER.md` for full Docker and docker-compose instructions.

### Cloud Foundry Deployment
`manifest.yml` defines a CF app using `nodejs_buildpack`:
```bash
cf push   # Uses manifest.yml (npm start as command)
```

### Render / PaaS Deployment
The Express server serves both the API and static Vite build from a single process:
```
┌────────────────────────────────────────────┐
│         Production Server (Render / CF)     │
│  ┌──────────────────────────────────────┐  │
│  │      Express Server (Node.js 20)     │  │
│  │  - Serves dist/public (Vite build)   │  │
│  │  - /api/* → API handlers             │  │
│  │  - SPA fallback → index.html         │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
        │              │              │
  ┌─────┴─────┐  ┌─────┴─────┐  ┌────┴────────────────┐
  │PostgreSQL │  │ Firestore │  │  AI / Stripe APIs  │
  │  (Neon)   │  │(Firebase) │  │  OpenAI / Gemini /  │
  │ (schema)  │  │           │  │  IBM Watsonx        │
  └───────────┘  └───────────┘  └─────────────────────┘
```

### Environment Variables

#### Frontend (Vite build-time `VITE_*`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_STRIPE_PUBLIC_KEY=
```

#### Backend (runtime `.env`)
```
DATABASE_URL=                    # PostgreSQL connection (Drizzle Kit / future DB storage)
OPENAI_KEY=                      # or OPENAI_API_KEY — GPT-4o (primary cost estimator)
GEMINI_KEY=                      # Gemini 2.5-flash (fallback cost estimator)
IBM_WATSONX_AI_API_KEY=          # IBM Watsonx chatbot
IBM_WATSONX_AI_URL=              # default: https://us-south.ml.cloud.ibm.com
IBM_WATSONX_AI_PROJECT_ID=       # Watsonx project ID (standard deployments)
IBM_WATSONX_AI_SPACE_ID=         # Watsonx deployment space ID
IBM_WATSONX_AI_MODEL_ID=         # default: ibm/granite-4-h-small
STRIPE_SECRET_KEY=               # Stripe server secret
PORT=5000                        # Server port
NODE_ENV=production
```

---

## Key Features

### 1. Multi-Role Support
- **Homeowner**: Simplified interface, basic estimates
- **Contractor**: Advanced features, editable line items, bid-ready reports
- **Inspector**: Slope-by-slope damage input, certification tools, inspector PDF via pdfkit
- **Insurance Adjuster**: Claim analysis, coverage tables, damage classification

### 2. AI-Powered Estimation
- **Primary**: OpenAI GPT-4o for intelligent cost calculation
- **Fallback**: Google Gemini 2.5-flash when OpenAI is unavailable
- Image analysis for damage assessment
- Real-time market data scraping (ENR, Home Depot, BLS, government permit databases)
- Regional cost multipliers

### 3. AI Chatbot
- IBM Watsonx (ibm/granite-4-h-small) powers the in-app assistant
- Role selection guidance, pricing information, feature explanations
- Static fallback copy when API key is not configured

### 4. PDF Report Generation
- **Browser-side**: jsPDF with role-specific templates, images, branding, auto-download
- **Server-side**: pdfkit for inspector reports via `shared/inspector-pdf.ts`
- Reports stored in Firestore as base64 and accessible at `/report/:id`

### 5. Project Management
- Create, view, edit, and delete projects
- Multiple estimates per project
- Project comparison tools (`/compare`)
- Dynamic report viewer (`/report/:id`)

### 6. Subscription Management
- Stripe integration (monthly and yearly billing)
- Role-based pricing with plan selection in onboarding
- Payment success/cancel handling via `/success` and `/cancel` pages

### 7. Data Verification
- Real-time data source probing via `ScrapingVerification`
- `LiveScrapingTest` component for in-app visibility of data freshness
- `DataVerification` component for presenting source status to users

### 8. Docker Containerization
- Multi-stage Dockerfile (Node 20 Alpine, non-root runtime user)
- Health check on `/api/projects`
- Helper scripts: `build-docker.sh` (Linux/macOS), `build-docker.ps1` (Windows PowerShell)

---

## Documentation & Guides

| File | Contents |
|------|----------|
| `ARCHITECTURE.md` | This document |
| `IBM_WATSONX_SETUP.md` | Step-by-step IBM Watsonx AI setup |
| `STRIPE_SETUP.md` | Stripe payment integration setup |
| `README.DOCKER.md` | Docker build and deployment guide |
| `TEST_CASES_GUIDE.md` | Test case descriptions and expected outputs |
| `RUN_TESTS.md` | How to run the test suite |
| `TESTING_INSTRUCTIONS.md` | Manual and automated testing instructions |
| `PDF_VERIFICATION_REPORT.md` | PDF output verification results |

---

## Future Enhancements

### Planned Features
1. **PostgreSQL Runtime Storage**: Replace `MemStorage` with a Drizzle-backed `DatabaseStorage` class
2. **Stripe Webhooks**: Subscription lifecycle management (renewal, cancellation)
3. **Email Notifications**: Send PDFs and estimate summaries via email
4. **Advanced Analytics**: Admin and user statistics dashboard
5. **Export Options**: CSV and Excel export of estimates
6. **Collaboration**: Share estimates with team members
7. **Mobile App**: React Native application
8. **API Rate Limiting**: Protect endpoints against abuse
9. **Caching Layer**: Redis for AI response and scraping data caching
10. **Monitoring**: Application performance monitoring (APM)

### Technical Debt
- Wire `passport`/`passport-local` or remove declared dependencies
- Wire `admin-functions.js` into the Express route registration or replace with `firebase-admin` calls in TypeScript
- Add comprehensive error handling across all routes
- Implement structured logging (e.g. pino or winston)
- Add unit and integration tests (expand root test scripts to CI-runnable suite)
- Set up CI/CD pipeline
- Add OpenAPI/Swagger documentation for API routes

---

## Conclusion

FlacronBuild is a modern, full-stack roofing cost estimation platform built with React 18, Express, and TypeScript. It uses a **multi-provider AI strategy** — OpenAI GPT-4o as the primary estimator, Google Gemini 2.5-flash as a fallback, and IBM Watsonx (Granite) for the in-app chatbot — ensuring high availability and flexibility.

The architecture maintains clear separation of concerns, end-to-end type safety via TypeScript and Zod, and is containerized with Docker for portable deployment across Render, Cloud Foundry, and any Docker-compatible platform. Firestore handles user role/subscription state and PDF persistence, while PostgreSQL (Neon) provides a migration-ready schema for structured project and estimate data.

---

**Document Version**: 2.0
**Last Updated**: 2026-04-15
**Maintained By**: Development Team
