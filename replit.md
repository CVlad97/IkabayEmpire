# IKABAY EMPIRE

## Overview

IKABAY EMPIRE is a comprehensive Caribbean-focused e-commerce and rewards ecosystem. It integrates marketplace shopping, food delivery, cryptocurrency rewards (IKB tokens), and AI-powered personalization. The platform allows users to discover products, order food, earn and mine crypto rewards, and benefits from geolocation-based services, AI-generated content, and an admin analytics dashboard. Its core ambition is to provide a transparent, localized, and rewarding e-commerce experience across the Caribbean.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, Vite, shadcn/ui (Radix UI primitives), and TailwindCSS for styling.
- **Design System**: Custom Caribbean-inspired color palette (ikabay-orange, ikabay-green), Inter and Poppins fonts, mobile-first responsive design.
- **Animation**: Framer Motion for smooth transitions.
- **State Management**: TanStack Query for server state, supporting optimistic updates and automatic cache invalidation.
- **Routing**: Wouter for client-side routing, with main routes for Home and Admin, and 404 handling.
- **Key UI Features**: AI-generated daily stories, geolocation display, product marketplace with cashback, Delikreol food delivery, crypto dashboard with real-time mining simulation, Recharts for visualizations, and interactive Leaflet maps.

### Backend Architecture

**Server Framework**: Express.js with TypeScript on Node.js.
- **API Structure**: RESTful endpoints covering AI-generated stories, product catalog, food items, user wallets, transactions, purchases, social sharing rewards, crypto mining, geolocation, AI recommendations, admin analytics, AI pricing analysis (Gemini), DOM-TOM price calculation, deal detection, CJ Dropshipping automation, partner registration, and interactive relay maps.
- **Data Storage**: PostgreSQL (Neon serverless) via Drizzle ORM for schema definition and migrations. In-memory storage (MemStorage) is used for development and initial setup, with an interface pattern for future database integration.
- **AI Integration**: OpenAI GPT-5 for daily story generation and Google Gemini Pro for advanced AI features like competitor price analysis and logistics optimization suggestions. Caching minimizes API calls.
- **Security**: Helmet.js for HTTP headers, tiered rate limiting on sensitive endpoints, comprehensive input validation using Zod schemas, and PostgreSQL-backed session management.

### Data Schema Design

**Database ORM**: Drizzle ORM for PostgreSQL.
- **Core Entities**: Products, Food Items, Wallets, Transactions, User Activity, Partner Reviews, and Zone Suggestions.
- **Validation**: Zod schemas derived from Drizzle tables ensure type-safe input validation.

## External Dependencies

**AI Services**:
- Replit AI Integrations for OpenAI GPT-5 and Google Gemini Pro.

**Database**:
- Neon Database (PostgreSQL) for persistent data storage.

**Maps and Geolocation**:
- Leaflet for interactive maps.
- ipapi.co for IP-based geolocation.
- Mapbox Static API for delivery zone visualization.

**Frontend Libraries**:
- Recharts for data visualization.
- date-fns for date manipulation.
- cmdk for command palette interfaces.
- class-variance-authority and clsx for dynamic styling.

**Dropshipping**:
- CJ Dropshipping API for product import automation.