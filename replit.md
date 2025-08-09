# Lab Manager - Medical Research Lab Management System

## Overview

LabSync is a comprehensive medical research lab management system designed to streamline the research workflow for laboratories like Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC) and Rush Health Equity Data Analytics Studio (RHEDAS). The system provides study lifecycle management, AI-powered standup meetings, real-time collaboration, and task tracking capabilities with the tagline "Making Science Easier". It's built as a full-stack application with a React frontend and Express backend, utilizing PostgreSQL for data persistence and integrating with external services for file storage and AI processing.

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Structure: Bucket → Project/Study → Subtasks hierarchy for organization and Kanban board workflow.
Lab Management: Support for multiple separate research labs with toggle functionality.
Team Flexibility: Allow team members to be in multiple labs (e.g., J.C. Rojas as PI in both RICCC and RHEDAS).
Color Scheme: Slack-inspired dark theme with professional color palette (purple primary, green accent, neutral grays).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system variables for consistent theming
- **Build Tool**: Vite for fast development and optimized production builds
- **Authentication**: Session-based authentication integrated with Replit's OIDC system

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for API development
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: Passport.js with OpenID Connect strategy for Replit authentication
- **Session Management**: Express sessions with PostgreSQL session store for persistence
- **File Handling**: Multer for multipart form handling with memory storage
- **WebSocket Support**: WebSocket server for real-time features like standup meetings

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Entities**: Users, Labs, Buckets, Studies, Tasks, Standup Meetings, Action Items, and Sessions
- **Hierarchy Structure**: Labs → Buckets → Studies/Projects → Tasks/Subtasks relationship
- **Enums**: Strongly typed enums for user roles, study statuses, funding types, and priority levels
- **Relationships**: Proper foreign key relationships with indexes for performance

### Authentication & Authorization
- **Provider**: Replit OIDC integration for seamless authentication in the Replit environment
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: Automatic user creation and profile management
- **Authorization**: Role-based access control with comprehensive lab roles (Principal Investigator, Data Scientist, Data Analyst, Clinical Research Coordinator, Regulatory Coordinator, Staff Coordinator, Fellow, Medical Student, Volunteer Research Assistant, Research Assistant)

### File Storage & AI Integration
- **Cloud Storage**: Google Cloud Storage integration for file uploads and document management
- **File Upload**: Uppy.js integration for robust file upload experience with drag-and-drop support
- **AI Processing**: Placeholder architecture for AI-powered standup meeting transcription and analysis
- **Audio Processing**: Framework ready for OpenAI Whisper integration for meeting transcription

### Real-time Features
- **WebSocket Connection**: Custom WebSocket implementation for live collaboration
- **Meeting Management**: Real-time standup meeting participation and status updates
- **Notifications**: Live notification system for task updates and meeting alerts
- **Lab Context Switching**: Real-time lab switching with automatic data filtering across all pages

### Task Assignment System
- **Multi-User Assignment**: Complete system supporting single or multiple team member assignment per task
- **Assignment Workflow**: Integrated assignment selection during task creation with searchable multi-select interface
- **Visual Assignment Display**: Task cards show assignment status with user icons and member badges
- **Project-Based Filtering**: Assignment options filtered by project/study team membership
- **Assignment Management**: Backend API routes for creating, retrieving, and managing task assignments
- **Database Integration**: Leverages TaskAssignments table with proper foreign key relationships

### Avatar Upload System
- **File Upload**: Comprehensive avatar upload system supporting JPG and PNG images
- **Circular Images**: All avatars display as circular profile pictures with proper object-fit styling
- **Object Storage**: Google Cloud Storage integration for secure file storage and serving
- **Upload Interface**: User-friendly camera button overlay with green accent color for easy avatar changes
- **Cross-Page Integration**: Avatar display and upload functionality across Sidebar, headers, and user profiles
- **Styling**: Fixed container sizing and image constraints to prevent overlapping issues

### Theme & Styling
- **Branding**: LabSync logo with teal network design and "Making Science Easier" tagline
- **Color Palette**: Teal-based professional theme with teal primary (#0D9488), purple accent (#8B5FE6), and neutral grays
- **Dark Mode**: Default dark theme with proper contrast ratios and accessibility considerations
- **Scrollbars**: Custom Slack-style scrollbar design for better visual consistency
- **Focus States**: Enhanced accessibility with proper focus indicators
- **Design Inspiration**: Monday.com-inspired visual task management with Airtable's flexible data views
- **UI Patterns**: Modern glassmorphism effects, gradient accents, smooth animations, and micro-interactions

### Development & Deployment
- **Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas
- **Development Server**: Vite dev server with HMR for rapid development
- **Production Build**: Optimized builds with esbuild for backend and Vite for frontend
- **Environment Configuration**: Environment-based configuration with development and production modes
- **Error Handling**: Comprehensive error handling with user-friendly error reporting

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL for serverless database hosting
- **Authentication**: Replit OIDC system for user authentication and session management
- **File Storage**: Google Cloud Storage for document and file management
- **Session Store**: PostgreSQL-based session persistence

### Development Tools
- **Package Manager**: npm for dependency management
- **Build System**: Vite for frontend bundling and esbuild for backend compilation
- **Type Checking**: TypeScript compiler for static type analysis
- **Schema Management**: Drizzle Kit for database migrations and schema management

### UI & User Experience
- **Component Library**: Radix UI primitives for accessible component foundations
- **Icon System**: Font Awesome for comprehensive icon coverage
- **Typography**: Google Fonts (Inter) for consistent typography
- **File Upload**: Uppy.js ecosystem for advanced file upload capabilities

### Planned Integrations
- **AI Services**: OpenAI Whisper for audio transcription and OpenRouter/Claude for meeting analysis
- **Notification System**: Framework ready for email/SMS notification integration
- **Calendar Integration**: Architecture prepared for calendar system integration
- **Export Systems**: Ready for document generation and data export functionality

### Future UI/UX Enhancements
- **Timeline/Gantt View**: Visual project timeline for comprehensive project planning
- **Inline Editing**: Direct data editing capabilities within table and card views
- **Command Palette**: Quick navigation system with keyboard shortcuts (⌘K)
- **Real-time Collaboration**: Live cursors and collaborative editing features
- **Custom Themes**: User-defined color schemes and personalization options