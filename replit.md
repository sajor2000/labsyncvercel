# Lab Manager - Medical Research Lab LabSync

## Overview
LabSync is a comprehensive medical research lab management system designed to streamline research workflows for laboratories. Its purpose is to provide study lifecycle management, AI-powered standup meetings, real-time collaboration, and task tracking, encapsulated by the tagline "Making Science Easier". It aims to be a full-stack application that simplifies lab operations and enhances scientific collaboration.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX Structure: Bucket → Project/Study → Subtasks hierarchy for organization with both Kanban board and Monday.com-style table workflows.
Lab Management: Support for multiple separate research labs with toggle functionality.
Team Flexibility: Allow team members to be in multiple labs (e.g., J.C. Rojas as PI in both RICCC and RHEDAS).
Color Scheme: Slack-inspired dark theme with professional color palette (purple primary, green accent, neutral grays).
Navigation Cleanup: Removed redundant "Task Board" page since Task Management already includes kanban view.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with custom design system variables
- **Build Tool**: Vite
- **Authentication**: Session-based authentication integrated with Replit's OIDC system

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM
- **Authentication**: Passport.js with OpenID Connect strategy for Replit authentication
- **Session Management**: Express sessions with PostgreSQL session store
- **File Handling**: Multer for multipart form handling
- **WebSocket Support**: WebSocket server for real-time features

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Management**: Drizzle Kit for migrations
- **Key Entities**: Users, Labs, Buckets, Studies, Tasks, Standup Meetings, Action Items, and Sessions
- **Hierarchy Structure**: Labs → Buckets → Studies/Projects → Tasks/Subtasks relationship

### Authentication & Authorization
- **Provider**: Replit OIDC integration with comprehensive team member validation
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Authorization**: Role-based access control with comprehensive lab roles and ownership validation
- **Access Control**: Whitelist-based access for registered team members with smart name matching (handles "J.C." vs "JC"), dual email support, and case-insensitive matching
- **User Support**: Works with any Replit user who is registered in the team members database, providing secure access control while maintaining ease of use

### File Storage & AI Integration
- **Cloud Storage**: Google Cloud Storage for file uploads
- **File Upload**: Uppy.js integration for robust file upload experience
- **AI Processing**: OpenAI GPT-4o-mini integration for intelligent meeting transcription and task extraction with production-validated workflow system.

### Real-time Features
- **WebSocket Connection**: Custom WebSocket implementation for live collaboration, meeting participation, notifications, and real-time lab context switching.

### Task Assignment System
- **Multi-User Assignment**: Supports single or multiple team member assignment per task with integrated selection and visual display.

### Avatar Upload System
- **File Upload**: Supports JPG and PNG images, displayed as circular profile pictures, stored on Google Cloud Storage.

### Theme & Styling
- **Brand Integration**: LabSync logo integration with sophisticated network connectivity theme.
- **Professional Color System**: Primary deep teal (#4C9A92), accent bright cyan (#5DD5E6), with supporting semantic colors.
- **Visual Design**: Glassmorphism effects, dynamic gradients, subtle glow effects, and micro-animations.

### Development & Deployment
- **Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas.
- **Error Handling**: Comprehensive error handling with proper HTTP status codes and professional error responses.
- **Complete CRUD Matrix**: Full Create, Read, Update, Delete operations for all entities with professional data integrity controls.
- **Database Operations**: Soft delete implementation for data preservation, cascade delete options, and dependency validation.
- **Code Quality**: All TypeScript compilation errors resolved (August 2025) - fixed enum mismatches, Drizzle query construction issues, authentication configuration, validation workflow bugs, and foreign key constraint handling. Complete CRUD endpoint implementation finalized (January 2025).

### Security Features
- **Authorization**: All CRUD endpoints require authentication with comprehensive permission validation.
- **Enhanced DELETE Security**: Professional-grade DELETE operations with dependency checking, soft delete for data integrity, and cascade operations with force parameters.
- **Audit Logging**: Complete audit trail for all CRUD operations including user ID, timestamp, and deletion events.
- **RBAC**: Enhanced role-based access control with permission templates, granular resource permissions, and cross-lab access control.

### Core Features
- **Complete CRUD Operations**: Full Create, Read, Update, Delete matrix across all entities with professional-grade DELETE operations featuring dependency checking, soft delete for data integrity, cascade options, and comprehensive audit logging.
- **Professional DELETE Endpoints**: Studies and Labs use soft delete with dependency validation (409 conflicts), Standup Meetings use hard delete with cascade cleanup, all operations return proper HTTP status codes (204 No Content on success, 404/403/409 for errors) and maintain audit trails.
- **Microsoft Planner-Style Email Notifications**: Professional task assignment notifications via Resend API with rich HTML content.
- **Automated Task Reminder Emails**: Beautiful HTML email reminders with dual triggers - immediate notification on task creation and 1-day-before-due-date reminders, plus overdue task alerts with configurable frequency, weekly digest support, and comprehensive user preference management.
- **Persistent Recording**: Global recording context for uninterrupted recording across navigation with a floating indicator.
- **Google Slides Integration**: Embedded presentation functionality in standup recordings with smart URL parsing and session persistence.
- **Team Member Role Management**: Robust role persistence with lab-specific roles and automatic admin flag assignment for Co-PIs.
- **World-Class Calendar System**: Integrated multiple event sources (standups, deadlines, tasks, studies, meetings, milestones) with advanced filtering and multi-view support.
- **Direct Calendar Event Creation**: Create calendar events directly in LabSync with automatic Google Calendar synchronization and rich metadata support.
- **Intelligent Task-to-Calendar Sync**: Automatically convert task due dates into calendar events with priority-based color coding and Google Calendar integration.
- **Meeting-Centric Task Synchronization**: Bulk sync project tasks to calendar during meetings with comprehensive project context and deadline tracking.
- **Global Search System**: Real-time, cross-entity search across studies, tasks, ideas, and documents with smart navigation and relevance sorting.
- **Production AI Workflow System**: End-to-end meeting processing pipeline with real transcript validation, automated task extraction, and email delivery confirmed operational.

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL
- **Authentication**: Replit OIDC system
- **File Storage**: Google Cloud Storage
- **Session Store**: PostgreSQL-based session persistence

### UI & User Experience
- **Component Library**: Radix UI
- **Icon System**: Font Awesome
- **Typography**: Google Fonts (Inter)
- **File Upload**: Uppy.js

### Active Integrations
- **AI Services**: OpenAI GPT-4o-mini
- **Email System**: Resend API with clif-icu.org domain (jcrojas@clif-icu.org from address)