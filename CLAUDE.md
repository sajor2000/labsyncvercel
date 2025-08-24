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

## UI/UX Spec: Multi‑Lab Toggle and Navigation

The app must support seamless switching between multiple labs with a consistent, modern, dark-mode friendly UI. Do not hardcode marketing copy; use data-driven labels from the database. Follow these requirements:

- **Lab Switcher (Top Bar)**
  - Place a compact lab switcher in the top navigation next to the global search input.
  - Use a searchable combobox with the current lab name and badge/status indicator.
  - Keyboard support: `Cmd/Ctrl + K` opens global search; `L` inside search focuses lab filter; arrow keys navigate options; `Enter` selects.
  - Persist the last selected lab per user in local storage AND server profile so the choice syncs across devices.

- **Labs Directory View**
  - Grid of lab cards (2–3 columns responsive) with: name, short description, KPI chips (studies, buckets, members), created date, and quick actions (View, Buckets).
  - Each card uses subtle elevation, rounded corners, and iconography; hover state increases shadow and outlines the primary accent.
  - Provide a “Search labs…” input above the grid with debounce and empty-state messaging.

- **Sidebar Context**
  - Left sidebar shows the active lab near the top with a small logo/avatar and online indicator.
  - Sidebar sections remain constant across labs (Overview, Labs, Buckets, Studies, Tasks, Ideas, Deadlines, Files, Settings) but filter data by the active lab.
  - The “Labs” item navigates to the directory view described above.

- **Dashboard Overview (Per‑Lab)**
  - Cards for Research Labs count, Active Studies, Project Buckets, Task Progress.
  - Right rail widget for task status breakdown (In Progress, Completed, Urgent, etc.).
  - Recent Studies list with status pills; actions to view all.

- **Responsiveness & Theming**
  - Dark theme by default; support light theme via `next-themes`.
  - 3 breakpoints minimum: mobile (single column), tablet (two columns), desktop (three columns where applicable).

- **State & Persistence**
  - Selected lab affects routing and data queries. All list/detail pages must filter by active lab unless explicitly “All labs”.
  - If a user loses access to a lab, gracefully fall back to the next available lab or the Labs directory.

- **Empty & Loading States**
  - Provide skeleton loaders for cards and lists.
  - Clear empty states with CTA buttons (e.g., “Create Study”, “Invite Members”).

- **Accessibility**
  - All interactive elements must be keyboard accessible with visible focus.
  - Use ARIA roles for combobox, menu, and listbox components.

- **Performance**
  - Lazy-load lab-specific widgets; cache recent lab lists; prefetch dashboard data on switch.

- **Content & Internationalization**
  - Do not hardcode copy; all labels should be driven by data or i18n resources.
  - Support truncation with tooltips for long lab names.

- **QA Scenarios**
  - User with 2+ labs can switch without page reload flicker.
  - User with 1 lab sees switcher but disabled dropdown.
  - No labs: directory shows empty state with “Create Lab”.
  - Access revoked mid-session gracefully redirects.

Implementation hint: use shadcn/ui `Command` for the searchable switcher, `DropdownMenu` for quick actions, and persistent store (localStorage + server profile) for the active lab. All routes under `app/dashboard/*` should read active lab from a single source of truth.

### Detailed UI Structure (from reference screenshots)

- **Top Bar**
  - Left: compact brand mark (24–28px) and product wordmark.
  - Center: global search input (rounded-2xl, subtle inner shadow). Placeholder: “Search studies, tasks, ideas, deadlines…”. Prefix icon: search. Suffix: a small segmented lab switcher showing the active lab name as a pill (e.g., “RHDAS”) with a chevron; clicking opens the lab combobox.
  - Right: theme toggle, notifications (with red unread dot counter), user avatar with name/subtitle in the account dropdown.

- **Sidebar**
  - Top section shows the active lab name with a green status dot and mini lab logo. Clicking the lab name opens the same lab switcher.
  - Navigation items (order): Overview, Labs, Buckets, Studies, Study Board, Stacked by Bucket, Task Management, Ideas Board, Deadlines, File Management, Calendar, Calendar Setup, Analytics.
  - Lower section: Profile, Settings, Email Notifications, Sign out.
  - Active item style: filled/brand tint on the left with bold label; hover: subtle background tint.
  - Collapsible behavior on narrow viewports; icons persist with tooltips.

- **Labs Directory Cards**
  - Card layout: rounded-xl (~16px), 1px border on dark surfaces (alpha), soft shadow. Internal padding ~20–24px, 2–3 column grid responsive.
  - Header: lab name (semibold), actions gear icon (for lab settings) on the top-right.
  - Body: single-paragraph description (2–3 lines, clamp). KPI row with 3 chips: Studies (beaker icon), Buckets (folder icon), Members (users icon). Each chip shows a numeric count.
  - Footer: two ghost buttons “View” and “Buckets”; created date aligned along the bottom edge in muted text.
  - Hover: elevate shadow + 1px brand border alpha; active/focus rings are visible.

- **Dashboard Overview (per-lab)**
  - Title + subtitle describing the lab at the top.
  - Primary action buttons on the right: “Schedule” (secondary/outline) and “+ New Project” (primary/filled).
  - KPI cards row: Research Labs, Active Studies, Project Buckets, Task Progress. Each card has an icon, bold number, label, and subtle description.
  - Recent Studies panel with a “View All” button; each study shows title and status pill (e.g., Planning, In Progress).

- **Right Rail (Task Overview)**
  - Vertical card with segment list: In Progress (amber), Completed (green), Urgent (red). Each shows a numeric badge; include an overall progress percentage and small progress bar.

- **Interactions & Motion**
  - Micro-interactions on hover for cards and buttons (elevation, subtle scale 1.01, color accent).
  - Combobox opens with fade/slide; list items highlight on arrow-key navigation; Enter selects.
  - Skeleton loaders for KPI cards and lists.

- **Visual Language**
  - Dark theme baseline: near-black surfaces (#0F172A–#0B1220 range), cards slightly lighter, borders low alpha.
  - Primary and accent hues follow Tailwind tokens; keep contrast ratios AA.
  - Typography: Inter; weights 500–700 for headings; buttons use 600–700.
  - Iconography: lucide-react with consistent sizes (16/18/20/24) and stroke width.

- **Data & Routing Rules**
  - All list/data queries must include the active lab ID filter.
  - URLs should reflect lab context where appropriate (e.g., `/dashboard?lab=<id>` or in state); soft navigation when switching labs.

- **Error & Empty States**
  - Directory: If no labs, show CTA “Create Lab”. If search misses, show “No labs found” with clear-reset.
  - Dashboard: If no studies, show CTA “New Project”.

- **Non-functional Requirements**
  - Performance: keep first-contentful paint smooth on lab switch; prefetch dashboard on combobox highlight.
  - Accessibility: all interactive elements tabbable; ARIA roles for combobox/listbox; visible focus rings.

## Development Guidelines

### Environment Configuration
Required environment variables are validated via `validate-config.cjs`. Key variables:
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- OpenAI: `OPENAI_API_KEY`
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_API_KEY`
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