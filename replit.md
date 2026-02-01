# Synergy

## Overview

Synergy is a team workflow and calendar workspace application that allows users to plan projects, assign tasks, and coordinate schedules in one place. The application features project management with task tracking, calendar event scheduling, and team member coordination with optional Web3 wallet authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom components in `client/src/components/`
- API client utilities in `client/src/lib/api.ts`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL

The backend provides CRUD endpoints for:
- Members (team users with optional wallet addresses)
- Projects (with emoji identifiers)
- Tasks (with status, priority, due dates, and assignees)
- Events (calendar events with attendees)

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Managed via `drizzle-kit push` command
- **Validation**: Zod schemas generated from Drizzle schema using `drizzle-zod`

### Key Design Patterns
1. **Shared Schema**: Database types and validation schemas are shared between client and server via the `@shared` path alias
2. **Storage Abstraction**: `IStorage` interface in `server/storage.ts` abstracts database operations
3. **API Client**: Centralized fetch wrapper in `client/src/lib/api.ts` for type-safe API calls
4. **Development/Production Split**: Vite dev server with HMR in development, static file serving in production

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Web3 Integration
- **WalletConnect**: Ethereum wallet connection for optional user authentication
- **ethers.js**: Ethereum library for wallet interactions

### UI Component Libraries
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities
- **embla-carousel**: Carousel component
- **react-day-picker**: Calendar/date picker component
- **vaul**: Drawer component
- **cmdk**: Command palette component

### Build & Development
- **Vite**: Frontend build tool with React and Tailwind plugins
- **esbuild**: Server bundling for production builds
- **tsx**: TypeScript execution for development