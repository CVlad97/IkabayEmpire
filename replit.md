# IKABAY EMPIRE

## Overview

IKABAY EMPIRE is a comprehensive Caribbean-focused e-commerce and rewards ecosystem that combines marketplace shopping, food delivery, cryptocurrency rewards, and AI-powered personalization. The platform enables users to discover products, order food, earn IKB tokens through purchases and engagement, and mine crypto rewards. It features geolocation-based services, AI-generated content, user authentication via Replit Auth, and an admin analytics dashboard for monitoring the ecosystem.

## Recent Changes (November 4, 2025)

### ✅ v2.4 INTERACTIVE RELAY MAP - Complete
- **Carte des Relais**: Interactive Leaflet map showing 11 Caribbean relay points
- **Real-time Filtering**: Zone (Martinique, Guadeloupe, etc.) and status (active/full/inactive) filters
- **Marker Clustering**: MarkerClusterGroup for dense areas with custom colored markers
- **Relay Details Panel**: Click marker to see capacity, hours, contact, WhatsApp link
- **Seed Data**: 11 relay points across Martinique (4), Guadeloupe (3), Saint-Martin, Saint-Barthélemy, La Réunion (2)
- **API Routes**: GET /api/relay-points with zone/status filtering, GET /api/partners
- **E2E Tested**: All features verified (login, navigation, filtering, marker interaction)

### ✅ v2.4 PHASE 1 - TRUST & FLOW ENGINE Database Foundation
- **New Tables Added**:
  - `partner_reviews`: AI-verified 3-criteria feedback system (cost/quality/service scoring)
  - `zone_suggestions`: Gemini-powered logistics optimization recommendations
- **Storage Layer Extended**: Complete CRUD operations for reviews and zone analysis
- **AI Integration Ready**: Schema supports AI confidence scoring and fake review detection
- **Zone Optimizer Foundation**: Geographic coverage analysis, priority scoring, demand metrics

### ✅ v2.2 COMPLETED - LOCAL STARS + Local Products
- **Artisan System**: Complete artisan profiles with certifications, videos, bios
- **Multilingual Storytelling**: AI-generated product stories in French/English/Creole
- **Local Products Page**: /produits-locaux with filtering, "Made in Caribbean" badges
- **Sample Data**: 3 Caribbean artisans + 6 authentic local products seeded
- **Test Instrumentation**: Unique, collision-free data-testid attributes (artisan-*, product-* prefixes)

### ✅ v1.2 COMPLETED - WhatsApp + Voice AI
- **Twilio Integration**: WhatsApp messaging with session management
- **Voice AI**: OpenAI Whisper transcription + Gemini intent recognition
- **Partner System**: Delivery drivers, relay operators with status tracking
- **Missions & Relays**: Complete logistics infrastructure (already in database)

### ✅ v1.0 COMPLETED - Full Authentication & Multi-User System
- **Database Migration**: Migrated from in-memory to PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication System**: Complete Replit Auth (OIDC) implementation with user sessions
- **Protected Routes**: All user-specific endpoints require authentication
- **Multi-User Support**: Individual wallet, transactions, and activity tracking per user

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server

**UI Component System**: Built with shadcn/ui components (Radix UI primitives) and styled with TailwindCSS
- Uses a custom design system with Caribbean-inspired colors (ikabay-orange, ikabay-green)
- Typography system based on Inter (body text) and Poppins (display text) from Google Fonts
- Responsive layout with mobile-first approach
- Animation framework: Framer Motion for smooth transitions and interactions

**State Management**: TanStack Query (React Query) for server state management
- Custom query client configuration with fetch-based data fetching
- Optimistic updates for wallet and transaction data
- Automatic cache invalidation on mutations

**Routing**: Wouter for lightweight client-side routing
- Main routes: Home (`/`) and Admin (`/admin`)
- 404 fallback handling

**Key UI Features**:
- Hero section with AI-generated daily story and geolocation display
- Product marketplace with cashback incentives
- Food delivery interface (Delikreol) with map integration
- Crypto dashboard with real-time mining simulation and transaction tracking
- Chart visualizations using Recharts
- Interactive Leaflet maps for delivery zones

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**Development Environment**: 
- Vite middleware integration for hot module replacement in development
- Custom logging middleware for API request tracking
- Raw body preservation for webhook handling

**API Structure**: RESTful endpoints organized by feature:
- `/api/story` - AI-generated daily welcome message (OpenAI GPT-5)
- `/api/products` - Product catalog management
- `/api/food` - Food items for delivery service
- `/api/wallet` - User wallet and IKB token balance
- `/api/transactions` - Transaction history
- `/api/purchase` - Product purchase with cashback
- `/api/share` - Social sharing rewards
- `/api/wallet/toggle-mining` - Crypto mining activation
- `/api/geolocation` - User location services
- `/api/recommend` - AI-powered product recommendations
- `/api/admin/analytics` - Business intelligence dashboard

**Data Storage**: In-memory storage implementation (MemStorage class)
- Designed with interface pattern for future database migration
- Collections: products, foodItems, wallets, transactions, userActivities
- Sample data initialization on startup
- UUID-based entity identification

**AI Integration**:
- **OpenAI GPT-5**: Daily story generation in French for Caribbean audience
- **Google Gemini Pro**: Available for additional AI features via Replit AI Integrations
- Caching strategy for daily AI-generated content to minimize API calls

### Data Schema Design

**Database ORM**: Drizzle ORM configured for PostgreSQL
- Schema definition in TypeScript with Zod validation
- Migration system via drizzle-kit
- Connection via Neon Database serverless driver

**Core Entities**:

1. **Products**: Marketplace items with pricing, images, categories, and stock status
2. **Food Items**: Restaurant offerings with prep time and availability
3. **Wallets**: User IKB token balance, earnings tracking, and mining status
4. **Transactions**: Financial history with type, amount, and metadata
5. **User Activity**: Analytics tracking for clicks, views, and engagement

**Validation**: Zod schemas generated from Drizzle tables for type-safe input validation

### External Dependencies

**AI Services**:
- Replit AI Integrations for OpenAI and Gemini API access
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

**Database**:
- Neon Database (PostgreSQL) via serverless connection
- Environment variable: `DATABASE_URL`
- Session storage: connect-pg-simple for PostgreSQL-backed sessions

**Maps and Geolocation**:
- Leaflet for interactive maps
- ipapi.co for IP-based geolocation (inferred from design documents)
- Mapbox Static API for delivery zone visualization

**Frontend Libraries**:
- Recharts for data visualization
- date-fns for date manipulation
- cmdk for command palette interfaces
- class-variance-authority and clsx for dynamic styling

**Planned Integrations** (referenced in design documents but not yet implemented):
- Coinbase Commerce for cryptocurrency payments
- WhatsApp Cloud API for chat commerce
- Telegram Bot API for social integration
- Zapier webhooks for automation
- Airtable for data management

### Authentication and Security

**Current State**: No authentication implemented (uses default user ID)

**Planned Features** (from design documents):
- Supabase authentication integration
- JWT token-based session management
- Rate limiting for API endpoints
- Bearer token authorization for internal services

### Build and Deployment

**Build Process**:
- Client: Vite production build to `dist/public`
- Server: esbuild bundling to `dist/index.js` (ESM format)
- TypeScript compilation check via `tsc`

**Environment**:
- Development: `NODE_ENV=development` with hot reload
- Production: `NODE_ENV=production` serving static assets

**Path Aliases**:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`