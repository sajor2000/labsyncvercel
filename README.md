# LabFlow - Medical Research Lab Management System

LabFlow is a comprehensive medical research lab management system designed to streamline research workflows for laboratories. It provides study lifecycle management, AI-powered standup meetings, real-time collaboration, and task tracking.

## 🚀 Features

### Core Functionality
- **Multi-Lab Support**: Users can belong to multiple labs with different roles
- **Study Lifecycle Management**: Complete CRUD operations for research studies
- **Task Management**: Kanban board and table views for task tracking
- **Real-time Collaboration**: WebSocket-powered live updates
- **AI-Powered Meetings**: Automated standup meeting transcription and task extraction

### Advanced Features
- **Calendar Integration**: Google Calendar sync with multi-view support
- **Deadline Management**: Comprehensive deadline tracking and notifications
- **File Management**: Google Cloud Storage integration
- **Email System**: Automated notifications and reminders
- **Analytics Dashboard**: Study and task performance metrics
- **Ideas Management**: Research idea tracking and collaboration

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for state management
- **shadcn/ui** components built on Radix UI
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication
- **WebSocket** server for real-time features
- **OpenAI GPT-4** for AI processing

### Database
- **PostgreSQL** with Neon serverless connection pooling
- **Multi-lab membership** support via `labMembers` table
- **Comprehensive RBAC** with 48+ permission types
- **Audit logging** for all operations

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Cloud Storage bucket
- OpenAI API key

### Installation
```bash
# Clone repository
git clone <repository-url>
cd LabFlow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_STORAGE_BUCKET=...
GOOGLE_APPLICATION_CREDENTIALS=...
RESEND_API_KEY=...
FROM_EMAIL=...
```

## 📦 Deployment

### Replit Deployment
1. Import project to Replit
2. Set environment variables in Replit secrets
3. Run `npm install`
4. Start with `npm run dev`

### Production Build
```bash
npm run build
npm start
```

## 🗃️ Database Schema

### Key Entities
- **Users**: System users with authentication
- **Labs**: Research laboratories
- **LabMembers**: Many-to-many relationship between users and labs
- **Studies**: Research projects
- **Tasks**: Individual work items
- **Deadlines**: Important dates and milestones
- **Standup Meetings**: AI-processed meeting records

### Multi-Lab Architecture
Users can belong to multiple labs with different roles:
- Principal Investigator
- Co-Principal Investigator
- Data Scientist
- Clinical Research Coordinator
- Research Assistant
- And more...

## 🔐 Security Features

- **Session-based authentication** with PostgreSQL storage
- **Role-based access control** (RBAC) with granular permissions
- **Rate limiting** on all API endpoints
- **CSRF protection** and security headers
- **Input validation** with Zod schemas
- **Audit logging** for all operations

## 🤝 API Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Lab Management
- `GET /api/labs` - List all labs
- `POST /api/labs` - Create new lab
- `PUT /api/labs/:id` - Update lab
- `DELETE /api/labs/:id` - Delete lab

### Lab Members
- `GET /api/lab-members/user/:userId` - Get user's lab memberships
- `GET /api/lab-members/lab/:labId` - Get lab members
- `POST /api/lab-members` - Add user to lab
- `PUT /api/lab-members/:userId/:labId` - Update membership
- `DELETE /api/lab-members/:userId/:labId` - Remove from lab

### Studies & Tasks
- `GET /api/studies` - List studies
- `POST /api/studies` - Create study
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task

## 🎨 UI/UX Guidelines

### Theme
- **Primary**: Deep teal (#4C9A92)
- **Accent**: Bright cyan (#5DD5E6)
- **Dark mode** support throughout

### Design System
- Clean, professional interface
- Glassmorphism effects
- Micro-animations
- Responsive design
- Accessibility compliant

## 📱 Mobile Support

LabFlow is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Progressive Web App (PWA) capable

## 🔄 Real-time Features

- Live task updates
- Meeting participation
- Notification system
- Cross-lab context switching
- Connection status monitoring

## 🤖 AI Integration

### OpenAI GPT-4 Integration
- Meeting transcription
- Automated task extraction
- Email content generation
- Smart summaries

## 📊 Performance

- **Optimized queries** with database indexing
- **Connection pooling** for database efficiency
- **Lazy loading** for large datasets
- **Caching strategies** for frequently accessed data

## 🧪 Testing

```bash
# Type checking
npm run check

# Build verification
npm run build
```

## 📄 License

This project is proprietary software developed for medical research laboratory management.

## 🤝 Contributing

This is a private project for medical research labs. Contact the development team for contribution guidelines.

## 📞 Support

For technical support or questions, please contact the development team.

---

**LabFlow** - Making Science Easier