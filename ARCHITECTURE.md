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
- Real-time cost estimation using AI (Google Gemini)
- Multi-role user management with role-based features
- PDF report generation with customizable templates
- Project comparison and analysis tools
- Subscription-based payment processing (Stripe)
- Real-time data scraping for market pricing
- Image analysis for damage assessment

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
- **Form Validation**: Zod 3.24.2
- **PDF Generation**: jsPDF 3.0.1
- **Maps**: @react-google-maps/api 2.20.7
- **Build Tool**: Vite 6.3.5

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express 4.21.2
- **Database**: 
  - PostgreSQL (via Neon serverless)
  - Drizzle ORM 0.39.1 for type-safe queries
- **Session Management**: express-session with PostgreSQL store
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Firestore

### External Services
- **AI/ML**: Google Gemini API (gemini-1.5-flash)
- **Payment Processing**: Stripe API
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (for reports/PDFs)
- **Maps**: Google Maps API

### Development Tools
- **TypeScript**: 5.6.3
- **Build**: Vite + esbuild
- **Database Migrations**: Drizzle Kit
- **Package Manager**: npm

---

## Architecture Patterns

### 1. Monorepo Structure
```
FlacronBuild/
├── client/          # React frontend application
├── server/          # Express backend API
├── shared/          # Shared TypeScript types and schemas
└── dist/            # Build output
```

### 2. Client-Server Architecture
- **Frontend**: SPA (Single Page Application) served via Vite
- **Backend**: RESTful API with Express
- **Communication**: JSON over HTTP/HTTPS

### 3. Database Strategy
- **Primary Database**: PostgreSQL (via Neon) for structured data (projects, estimates)
- **Document Store**: Firebase Firestore for reports, PDFs, and user data
- **Hybrid Approach**: Combines relational (PostgreSQL) and document (Firestore) databases

### 4. Authentication & Authorization
- **Authentication**: Firebase Authentication (email/password, Google OAuth)
- **Authorization**: Role-based access control (RBAC) with 4 user roles
- **Session Management**: Express sessions with PostgreSQL store

### 5. State Management
- **Server State**: React Query for caching and synchronization
- **Form State**: React Hook Form with Zod validation
- **Client State**: React hooks (useState, useContext)
- **Persistence**: localStorage for temporary data (file uploads)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React SPA)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │     Hooks     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                            │                                  │
│                    React Query Client                         │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┼──────────────────────────────────┐
│                    Express Backend API                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │   Storage    │  │   Services    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
    ┌─────┴─────┐    ┌───────┴───────┐   ┌─────┴─────┐
    │PostgreSQL │    │  Firestore   │   │  Gemini   │
    │  (Neon)   │    │  (Firebase)  │   │    API    │
    └───────────┘    └──────────────┘   └───────────┘
```

---

## Frontend Architecture

### Directory Structure
```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── estimation-form.tsx    # Main estimation form (multi-step)
│   ├── chatbot.tsx            # AI chatbot component
│   ├── login-dialog.tsx       # Authentication modal
│   └── ...
├── pages/              # Route components
│   ├── dashboard.tsx          # Landing page
│   ├── userdashboard.tsx      # My Estimates page
│   ├── compare.tsx            # Project comparison
│   ├── estimate-detail.tsx    # Estimate view
│   └── ...
├── lib/                # Utilities and services
│   ├── firebase.ts            # Firebase configuration
│   ├── pdf-generator.ts       # PDF generation logic
│   ├── pdf-storage.ts         # Firestore PDF operations
│   ├── cost-calculator.ts     # Client-side calculations
│   ├── queryClient.ts         # React Query setup
│   └── user-role.ts           # Role management
├── hooks/              # Custom React hooks
├── App.tsx             # Root component with routing
└── main.tsx            # Application entry point
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

#### 2. Component Composition
- **Atomic Design**: UI components built from Radix primitives
- **Compound Components**: Complex components like forms use composition
- **Controlled Components**: Forms use React Hook Form for validation

#### 3. Data Fetching Strategy
- **React Query**: All API calls go through React Query
- **Optimistic Updates**: UI updates before server confirmation
- **Cache Management**: Automatic cache invalidation on mutations

#### 4. State Management
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
├── index.ts              # Express app setup
├── routes.ts             # API route definitions
├── storage.ts            # Database abstraction layer
├── cost-calculator.ts    # AI cost calculation service
├── data-scrapers.ts      # Web scraping for market data
├── scraping-verification.ts  # Data source verification
├── admin-functions.js    # Admin utilities
└── vite.ts               # Vite dev server integration
```

### API Routes

#### Project Management
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Estimation
- `POST /api/projects/:id/estimate` - Generate AI estimate
- `GET /api/projects/:id/estimates` - Get all estimates for project
- `GET /api/projects/:id/estimate/latest` - Get latest estimate
- `GET /api/projects/:id/cost-breakdown` - Get detailed breakdown

#### Payment Processing
- `POST /api/create-checkout-session` - Create Stripe checkout
- `GET /api/stripe-session/:sessionId` - Get session details

#### Utilities
- `POST /api/chatbot` - AI chatbot endpoint
- `GET /api/verify-data-sources/:location` - Verify data sources

### Service Layer

#### Cost Calculator Service
```typescript
// server/cost-calculator.ts
class RealCostCalculator {
  async calculateRealCost(
    requirements: ProjectRequirements,
    images?: any[]
  ): Promise<EstimateResult>
}
```

**Responsibilities**:
- Integrates with Google Gemini API
- Processes project requirements
- Analyzes uploaded images
- Scrapes real-time market data
- Calculates material, labor, and permit costs
- Applies regional multipliers

#### Storage Layer
```typescript
// server/storage.ts
class MemStorage implements IStorage {
  // In-memory storage (can be swapped for PostgreSQL)
  createProject(project: InsertProject): Promise<Project>
  createEstimate(estimate: InsertEstimate): Promise<Estimate>
  // ... other CRUD operations
}
```

**Note**: Currently uses in-memory storage but designed with interface for easy database migration.

---

## Database Schema

### PostgreSQL Schema (via Drizzle ORM)

#### Projects Table
```typescript
projects {
  id: serial (PK)
  name: text
  type: text (residential | commercial | renovation)
  location: text
  area: integer
  unit: text (sqft | sqm)
  materialTier: text (economy | standard | premium)
  timeline: text (urgent | standard | flexible)
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
  report: json (Gemini response)
  formInputData: json (complete form data)
  geminiResponse: json (raw API response)
  createdAt: timestamp
}
```

### Firebase Firestore Collections

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

### 1. Google Gemini API
**Purpose**: AI-powered cost estimation and image analysis

**Integration Points**:
- Cost calculation with project requirements
- Image analysis for damage assessment
- Natural language processing for chatbot

**Configuration**:
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

### 2. Stripe API
**Purpose**: Subscription payment processing

**Integration Points**:
- Checkout session creation
- Subscription management
- Payment webhooks (future)

**Pricing Structure**:
- Homeowner: $19.99/month
- Contractor/Inspector/Insurance Adjuster: $97.99/month or $999.99/year

### 3. Firebase Services

#### Authentication
- Email/password authentication
- Google OAuth
- Session management

#### Firestore
- Report storage
- PDF document storage
- User data persistence

### 4. Google Maps API
**Purpose**: Location selection and jurisdiction mapping

**Features**:
- Place autocomplete
- Geocoding
- Map display with markers

---

## Data Flow

### Estimate Generation Flow

```
1. User fills estimation form
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
   - Calls Gemini API with requirements + images
   - Scrapes real-time market data
   - Calculates costs with regional multipliers
   ↓
7. Estimate saved to PostgreSQL
   ↓
8. Response sent to frontend
   ↓
9. Frontend:
   - Saves estimate to Firestore
   - Generates PDF (jsPDF)
   - Saves PDF to Firestore
   - Auto-downloads PDF
   ↓
10. User redirected to /my-estimates
```

### Authentication Flow

```
1. User clicks "Get Started"
   ↓
2. LoginDialog opens
   ↓
3. User selects plan (ChoosePlanStep)
   ↓
4. User completes profile (ProfileCompletionStep)
   ↓
5. User reviews subscription (ReviewSubscriptionStep)
   ↓
6. POST /api/create-checkout-session
   ↓
7. Redirect to Stripe Checkout
   ↓
8. Payment processed
   ↓
9. Redirect to /success?session_id=xxx
   ↓
10. GET /api/stripe-session/:sessionId
   ↓
11. User role set in Firebase
   ↓
12. User redirected to dashboard
```

### PDF Generation Flow

```
1. Estimate generated
   ↓
2. Frontend calls generatePDFReport()
   ↓
3. PDF Generator:
   - Creates jsPDF document
   - Adds role-specific template
   - Includes project data
   - Adds images with analysis
   - Applies branding
   ↓
4. PDF converted to base64
   ↓
5. PDF saved to Firestore (pdfs collection)
   ↓
6. Report record created (reports collection)
   ↓
7. PDF auto-downloaded to user
```

---

## Security

### Authentication & Authorization
- **Firebase Authentication**: Secure user authentication
- **Role-Based Access Control**: 4 distinct user roles with different permissions
- **Session Management**: Express sessions with secure cookies
- **JWT Tokens**: Firebase Auth tokens for API authentication (future)

### Data Protection
- **Input Validation**: Zod schemas validate all inputs
- **SQL Injection Prevention**: Drizzle ORM uses parameterized queries
- **XSS Prevention**: React automatically escapes content
- **CSRF Protection**: Express session middleware

### API Security
- **Rate Limiting**: Should be implemented (future)
- **CORS Configuration**: Configured for production domains
- **Environment Variables**: Sensitive keys stored in .env
- **HTTPS**: Required in production

### Payment Security
- **Stripe Integration**: PCI-compliant payment processing
- **No Card Storage**: Cards never touch our servers
- **Webhook Verification**: Stripe webhook signature verification (future)

---

## Deployment

### Build Process
```bash
# Development
npm run dev          # Starts Vite dev server + Express

# Production Build
npm run build        # Builds frontend + bundles backend
npm start            # Runs production server
```

### Environment Variables

#### Frontend (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_GOOGLE_MAPS_API_KEY=
```

#### Backend (.env)
```
DATABASE_URL=          # PostgreSQL connection string
GEMINI_API_KEY=        # Google Gemini API key
STRIPE_SECRET_KEY=     # Stripe secret key
STRIPE_PUBLISHABLE_KEY= # Stripe publishable key
PORT=5000              # Server port
NODE_ENV=production
```

### Deployment Architecture
```
┌─────────────────────────────────────────┐
│         Production Server (Render)       │
│  ┌───────────────────────────────────┐  │
│  │      Express Server (Node.js)      │  │
│  │  - Serves static files (Vite)     │  │
│  │  - API endpoints                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
           │              │              │
    ┌──────┴──────┐ ┌─────┴─────┐ ┌──────┴──────┐
    │  PostgreSQL │ │ Firestore │ │   Stripe   │
    │   (Neon)    │ │(Firebase) │ │    API     │
    └─────────────┘ └───────────┘ └────────────┘
```

### Database Migrations
```bash
npm run db:push    # Push schema changes to database
```

---

## Key Features

### 1. Multi-Role Support
- **Homeowner**: Simplified interface, basic estimates
- **Contractor**: Advanced features, editable line items, bid-ready reports
- **Inspector**: Slope-by-slope damage input, certification tools
- **Insurance Adjuster**: Claim analysis, coverage tables, damage classification

### 2. AI-Powered Estimation
- Google Gemini integration for intelligent cost calculation
- Image analysis for damage assessment
- Real-time market data scraping
- Regional cost multipliers

### 3. PDF Report Generation
- Role-specific templates
- Professional formatting
- Image inclusion with annotations
- Auto-download after generation

### 4. Project Management
- Create, view, edit, delete projects
- Multiple estimates per project
- Project comparison tools
- Historical data tracking

### 5. Subscription Management
- Stripe integration
- Monthly and yearly billing
- Role-based pricing
- Payment success/cancel handling

### 6. Chatbot Assistant
- AI-powered customer support
- Role selection guidance
- Pricing information
- Feature explanations

### 7. Data Verification
- Real-time data source verification
- Scraping verification endpoints
- Market data validation

---

## Future Enhancements

### Planned Features
1. **Database Migration**: Move from in-memory to PostgreSQL storage
2. **Webhook Support**: Stripe webhooks for subscription management
3. **Email Notifications**: Send PDFs via email
4. **Advanced Analytics**: User dashboard with statistics
5. **Export Options**: CSV, Excel export
6. **Collaboration**: Share estimates with team members
7. **Mobile App**: React Native application
8. **API Rate Limiting**: Protect against abuse
9. **Caching Layer**: Redis for performance optimization
10. **Monitoring**: Application performance monitoring (APM)

### Technical Debt
- Replace in-memory storage with PostgreSQL
- Add comprehensive error handling
- Implement proper logging system
- Add unit and integration tests
- Set up CI/CD pipeline
- Add API documentation (OpenAPI/Swagger)

---

## Conclusion

FlacronBuild is a modern, full-stack application built with React, Express, and TypeScript. It leverages AI (Google Gemini) for intelligent cost estimation and integrates with multiple external services (Stripe, Firebase, Google Maps) to provide a comprehensive roofing estimation platform.

The architecture is designed for scalability, with clear separation of concerns, type safety throughout, and a modular component structure. The system supports multiple user roles with role-based features and provides professional PDF reports for various use cases.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Maintained By**: Development Team

