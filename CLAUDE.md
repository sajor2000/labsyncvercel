# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev                 # Start development server (Next.js) - Note: May show TypeScript warnings but will run
npm run build              # Build production version
npm run start              # Start production server  
npm run type-check         # TypeScript type checking (may show path resolution warnings)
npm run lint               # Run ESLint
npm run validate-config    # Validate environment configuration
```

### Development Notes
- **Next.js Warning**: You may see warnings about workspace root inference and multiple lockfiles. This is expected after the recent reorganization and doesn't affect functionality.
- **TypeScript Errors**: The `type-check` command may show module resolution errors, but the `dev` and `build` commands work correctly as Next.js handles path resolution internally.
- **Sentry Warnings**: Build process may show Sentry configuration warnings - these don't affect development.

### Database
```bash
# Database is managed via Supabase migrations
# Run migrations by applying supabase/migrations/001_initial_schema.sql to your Supabase project
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) 
- **Authentication**: Supabase Auth with Google OAuth
- **Caching/Rate Limiting**: Upstash Redis
- **AI Integration**: OpenAI GPT-4 and Whisper
- **Monitoring**: Sentry
- **Styling**: Tailwind CSS with shadcn/ui components
- **Email**: Resend
- **Calendar**: Google Calendar API integration

### Database Architecture

The application uses a **multi-lab membership model** where users can belong to multiple research labs with different roles and permissions:

#### Core Tables
- `labs` - Research laboratories 
- `lab_members` - Many-to-many relationship between users and labs with 48+ granular permissions
- `user_profiles` - Extended user data (references Supabase `auth.users`)
- `studies` - Research projects within labs
- `tasks` - Individual work items with assignees and priorities
- `standup_meetings` - AI-processed meeting records with transcriptions
- `standup_action_items` - Tasks extracted from meetings by AI
- `calendar_events` - Meeting and deadline tracking
- `deadlines` - Important milestone tracking
- `workflow_steps` - AI processing pipeline tracking
- `ideas` - Research idea collaboration

#### Key Database Features
- **Row Level Security (RLS)**: All tables use RLS policies for lab-based data isolation
- **Granular Permissions**: 48+ permission types in `lab_members` table for fine-grained access control
- **Enums**: `user_role`, `study_status`, `task_status`, `priority`, `funding_type`
- **Audit Trails**: Automated `updated_at` triggers on all tables
- **Multi-lab Context**: Users can switch between labs seamlessly

### Supabase Integration Patterns

#### Client vs Server Usage
- **Client (`lib/supabase/client.ts`)**: For browser-side operations, uses anon key
- **Server (`lib/supabase/server.ts`)**: For API routes and SSR, uses service role key
- **Middleware**: Handles auth session management and route protection

#### Authentication Flow
1. Middleware checks auth status and redirects appropriately
2. Protected routes require authentication
3. Auth routes redirect logged-in users to dashboard
4. Google OAuth integrated with automatic profile creation

### AI Integration Architecture

#### Core AI Services (`lib/ai/openai-client.ts`)
- **Transcription**: Whisper API for meeting audio processing
- **Task Extraction**: GPT-4 analyzes transcripts to identify action items
- **Email Generation**: AI-generated professional communications
- **Meeting Summaries**: Automated standup meeting analysis

#### AI Processing Pipeline
1. Audio uploaded via `/api/ai/transcribe`
2. Transcript processed via `/api/ai/process-transcript` 
3. Action items extracted and stored in database
4. Email notifications generated if configured

### Rate Limiting System (`lib/rate-limit/rate-limiter.ts`)

Multi-tier rate limiting using Upstash Redis:
- **API Endpoints**: 100 requests/minute per user
- **AI Operations**: Stricter limits (5-20 requests/minute depending on operation)
- **Authentication**: 10 attempts per 15 minutes
- **Middleware Integration**: Automatic rate limiting on all API routes

### Error Handling & Monitoring

#### Error System (`lib/errors/api-errors.ts`)
- Custom error classes: `ValidationError`, `AuthenticationError`, etc.
- Correlation IDs for request tracking
- Structured error responses with context

#### Sentry Integration
- Performance monitoring for AI operations
- Error tracking with correlation IDs
- Custom instrumentation for critical operations
- Breadcrumb trails for debugging

### Security Implementation

#### Middleware Security (`middleware.ts`)
- Content Security Policy (CSP) headers
- Rate limiting enforcement
- Authentication state management
- Security headers (HSTS, X-Frame-Options, etc.)

#### Data Protection
- RLS policies ensure lab-based data isolation
- Service role key used only for server operations
- Input validation with Zod schemas
- CSRF protection via Next.js defaults

### Component Architecture

#### UI System
- **shadcn/ui components**: Consistent design system built on Radix UI
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme System**: Dark/light mode support via `next-themes`
- **Form Handling**: React Hook Form with Zod validation

#### Key Pages
- **Dashboard (`app/dashboard/page.tsx`)**: Overview with lab stats, recent meetings, pending tasks
- **Auth Pages**: Signin/signup with Google OAuth integration
- **API Routes**: RESTful endpoints for all data operations

## Development Guidelines

### Environment Configuration
Required environment variables are validated via `validate-config.cjs`. Key variables:
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- OpenAI: `OPENAI_API_KEY`
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_API_KEY`
- Monitoring: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- Email: `RESEND_API_KEY2`, `FROM_EMAIL`

### Database Schema Updates
1. Create migration SQL file in `supabase/migrations/`
2. Apply via Supabase dashboard or CLI
3. Update `lib/supabase/database.types.ts` if needed (can be auto-generated)
4. Test with existing data and RLS policies

### Adding New API Endpoints
1. Create route in `app/api/[feature]/route.ts`
2. Add rate limiting using appropriate limit type
3. Include correlation ID and error handling
4. Add Sentry instrumentation for monitoring
5. Follow existing authentication patterns

### AI Feature Development
1. Use `AIService` class for OpenAI integration
2. Implement proper rate limiting for AI operations
3. Add correlation IDs for request tracking
4. Store processing results in database when appropriate
5. Handle errors gracefully with user-friendly messages

### Lab-Based Feature Development
When adding features that should respect lab boundaries:
1. Always filter data by user's lab memberships
2. Check permissions via `lab_members` table
3. Use RLS policies as primary data security
4. Test multi-lab scenarios thoroughly
5. Ensure proper cleanup when users leave labs

## Testing Infrastructure

The codebase does not currently have automated tests configured. When adding tests:
- Use Jest for unit tests
- Consider Playwright for E2E testing
- Test lab-based data isolation thoroughly
- Mock AI services for reliable testing
- Test rate limiting behavior