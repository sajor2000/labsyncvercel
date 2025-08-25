# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev                 # Start development server (Next.js)
npm run build              # Build production version
npm run start              # Start production server  
npm run type-check         # TypeScript type checking
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix ESLint issues
npm run validate-config    # Validate environment configuration
npm run test               # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate test coverage report
npm run clean              # Clean build cache
npm run clean:all          # Full clean and reinstall
```

### Deployment
```bash
vercel --prod --yes        # Deploy to Vercel production
git push                   # Auto-deploys via GitHub-Vercel integration
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth
- **AI Integration**: OpenAI GPT-4 and Whisper for transcription/task extraction
- **Email**: Resend for notifications
- **Calendar**: Google Calendar API (two-way sync)
- **Rate Limiting**: Upstash Redis
- **Monitoring**: Sentry (optional)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks with SWR for data fetching

### Database Schema (21 Tables)

The application uses a simplified multi-lab architecture with hierarchical data organization:

#### Core Hierarchy
```
labs → buckets → projects → tasks
```

#### Primary Tables
- `labs` - Research laboratories
- `lab_members` - User-lab relationships with 8 permission flags
- `user_profiles` - Extended user data (references Supabase auth.users)
- `buckets` - Project containers within labs
- `projects` - Research projects within buckets
- `tasks` - Work items within projects
- `meetings` - Meeting records with AI transcription
- `calendar_events` - Google Calendar integration
- `ideas` - Research ideas linked to projects

#### Permission System
Simplified 8-permission model in `lab_members`:
- `can_manage_members`
- `can_create_projects`
- `can_edit_all_projects`
- `can_delete_projects`
- `can_create_tasks`
- `can_edit_all_tasks`
- `can_delete_tasks`
- `can_view_analytics`

### Key Integration Points

#### Supabase Patterns
- **Client-side**: `utils/supabase/client.ts` for browser operations
- **Server-side**: `utils/supabase/server.ts` for API routes and SSR
- **RLS Policies**: All tables use RLS for lab-based data isolation
- **Soft Deletes**: `deleted_at` timestamps instead of hard deletes

#### AI Services (`lib/ai/simple-ai.ts`)
```typescript
transcribeAudio(audioFile: File): Promise<string>
extractTasks(text: string, projectId: string): Promise<Task[]>
generateProjectSummary(projectTitle: string, tasks: Task[]): Promise<string>
```

#### Email Notifications (`lib/email/notifications.ts`)
- Task assignment notifications
- Deadline reminders
- Meeting summaries
- Uses Resend API with HTML templates

#### Google Calendar (`lib/calendar/google-calendar.ts`)
- Two-way sync with calendar events
- OAuth2 authentication flow
- Automatic event creation for meetings
- Deadline synchronization

### API Routes Structure

All API routes follow RESTful patterns in `app/api/`:
- `/api/labs` - Lab CRUD operations
- `/api/buckets` - Bucket management
- `/api/projects` - Project operations
- `/api/tasks` - Task management
- `/api/ai/transcribe` - Audio transcription
- `/api/ai/extract-tasks` - Task extraction from text
- `/api/calendar/google-sync` - Calendar synchronization
- `/api/user/preferences` - User settings

### Component Architecture

#### Page Structure
- `app/dashboard/page.tsx` - Lab selection dashboard
- `app/dashboard/labs/[labId]/page.tsx` - Lab workspace
- `app/dashboard/labs/[labId]/projects/page.tsx` - Project management
- `app/dashboard/labs/[labId]/tasks/page.tsx` - Task kanban board
- `app/dashboard/join-lab/page.tsx` - Join existing lab

#### Key Components
- `components/dashboard/lab-selection-cards.tsx` - Lab grid view
- `components/dashboard/kanban-board.tsx` - Drag-and-drop task board
- `components/dashboard/create-lab-form.tsx` - Lab creation flow
- `components/ui/*` - shadcn/ui components

### Navigation Patterns

#### Button Navigation
Use `router.push()` with onClick handlers, not Link wrappers:
```typescript
// Correct
<Button onClick={() => router.push('/path')}>Navigate</Button>

// Incorrect - causes click issues
<Link href="/path"><Button>Navigate</Button></Link>
```

#### Lab Context
- Active lab stored in localStorage and user profile
- Lab ID passed via URL params: `/dashboard/labs/[labId]/*`
- All data queries filter by active lab

### Environment Configuration

Required variables (validated on build):
```env
# AI Integration
OPENAI_API_KEY=sk-proj-...

# Google Services  
GOOGLE_CALENDAR_API_KEY=AIzaSy...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Email
RESEND_API_KEY2=re_...
FROM_EMAIL=notifications@...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
GOOGLE_CALENDAR_ID=...
GOOGLE_CALENDAR_TIMEZONE=America/Chicago
```

### Database Migrations

Migrations are in `supabase/migrations/`:
1. `003_teardown_old_schema.sql` - Removes old tables
2. `004_setup_new_schema.sql` - Creates 21-table structure
3. Apply via Supabase dashboard SQL editor

### Common Development Tasks

#### Adding a New Feature
1. Create database migration if needed
2. Add API route in `app/api/[feature]/route.ts`
3. Create data fetching hook using SWR
4. Build UI components with shadcn/ui
5. Add to lab navigation if applicable

#### Modifying Permissions
1. Update `lab_members` table permissions
2. Modify permission checks in API routes
3. Update UI to reflect permission changes

#### Adding AI Capabilities
1. Add function to `lib/ai/simple-ai.ts`
2. Create API endpoint with rate limiting
3. Store results in appropriate database table
4. Add UI for triggering/displaying results

### Error Handling Patterns

- API routes return consistent error format:
  ```typescript
  return NextResponse.json({ error: 'Message' }, { status: 400 })
  ```
- Use toast notifications for user feedback
- Log errors to console with context
- Graceful fallbacks for missing data

### Performance Considerations

- Use SWR for client-side data fetching with caching
- Implement pagination for large datasets
- Lazy load heavy components
- Use database indexes on frequently queried columns
- Soft deletes to maintain referential integrity

### Security Best Practices

- All API routes check authentication
- RLS policies enforce lab-based data isolation
- Input validation with Zod schemas
- Rate limiting on AI and email operations
- Service role key only used server-side
- Environment variables validated on build