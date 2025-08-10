# Lab Manager - Medical Research Lab Management System

## Overview
LabSync is a comprehensive medical research lab management system designed to streamline research workflows for laboratories like Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC) and Rush Health Equity Data Analytics Studio (RHEDAS). It provides study lifecycle management, AI-powered standup meetings, real-time collaboration, and task tracking, all under the tagline "Making Science Easier". The system is a full-stack application with a React frontend and Express backend, utilizing PostgreSQL for data persistence and integrating with external services for file storage and AI processing.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX Structure: Bucket → Project/Study → Subtasks hierarchy for organization with both Kanban board and Monday.com-style table workflows.
Lab Management: Support for multiple separate research labs with toggle functionality.
Team Flexibility: Allow team members to be in multiple labs (e.g., J.C. Rojas as PI in both RICCC and RHEDAS).
Color Scheme: Slack-inspired dark theme with professional color palette (purple primary, green accent, neutral grays).

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
- **Provider**: Replit OIDC integration
- **Session Storage**: PostgreSQL-backed sessions
- **Authorization**: Role-based access control with comprehensive lab roles.

### File Storage & AI Integration
- **Cloud Storage**: Google Cloud Storage for file uploads
- **File Upload**: Uppy.js integration for robust file upload experience
- **AI Processing**: OpenAI GPT-4o-mini integration for intelligent meeting transcription and task extraction

### Real-time Features
- **WebSocket Connection**: Custom WebSocket implementation for live collaboration
- **Meeting Management**: Real-time standup meeting participation
- **Notifications**: Live notification system
- **Lab Context Switching**: Real-time lab switching with automatic data filtering

### Task Assignment System
- **Multi-User Assignment**: Supports single or multiple team member assignment per task.
- **Assignment Workflow**: Integrated selection during task creation with searchable multi-select.
- **Visual Assignment Display**: Task cards show assignment status with user icons.

### Avatar Upload System
- **File Upload**: Supports JPG and PNG images, displayed as circular profile pictures.
- **Object Storage**: Google Cloud Storage for secure file storage and serving.

### Theme & Styling
- **Brand Integration**: LabSync logo integration with sophisticated network connectivity theme.
- **Professional Color System**: Primary deep teal (#4C9A92), accent bright cyan (#5DD5E6), with supporting semantic colors.
- **Visual Design**: Glassmorphism effects, dynamic gradients, subtle glow effects, and micro-animations.
- **Component Enhancement**: Buttons, cards, and navigation enhanced with gradients and glow effects.

### Development & Deployment
- **Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas.
- **Development Server**: Vite dev server with HMR.
- **Production Build**: Optimized builds with esbuild for backend and Vite for frontend.
- **Error Handling**: Comprehensive error handling.

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL
- **Authentication**: Replit OIDC system
- **File Storage**: Google Cloud Storage
- **Session Store**: PostgreSQL-based session persistence

### Development Tools
- **Package Manager**: npm
- **Build System**: Vite (frontend), esbuild (backend)
- **Type Checking**: TypeScript compiler
- **Schema Management**: Drizzle Kit

### UI & User Experience
- **Component Library**: Radix UI
- **Icon System**: Font Awesome
- **Typography**: Google Fonts (Inter)
- **File Upload**: Uppy.js

### Active Integrations
- **AI Services**: OpenAI GPT-4o-mini
- **Email System**: Resend API
- **Authentication**: Replit OIDC system
- **Database**: PostgreSQL with Drizzle ORM