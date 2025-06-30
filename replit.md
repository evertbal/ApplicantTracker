# ATS Portal - Replit Development Guide

## Overview

This is a comprehensive Applicant Tracking System (ATS) designed for Dutch recruitment agencies. The application is built as a full-stack web application with a modern React frontend and Express.js backend, featuring dual authentication systems and comprehensive candidate, client, and trajectory management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Dual system supporting both Replit OAuth and internal admin authentication
- **Session Management**: Express sessions with PostgreSQL storage
- **File Processing**: Multer for file uploads with Excel/CSV parsing capabilities

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon serverless pool for optimal performance

## Key Components

### Authentication System
The application implements a sophisticated dual authentication system:

1. **Replit OAuth Integration**: Primary authentication for external users with domain restrictions
2. **Internal Admin System**: JWT-based authentication for internal administrators with role-based permissions
3. **Session Management**: Persistent sessions stored in PostgreSQL with automatic cleanup
4. **Permission Matrix**: Granular role-based access control (admin, recruiter, viewer)

### Data Management Modules
1. **Candidate Management**: Complete candidate lifecycle with Dutch driving license normalization
2. **Client Management**: Business relationship tracking and contact management
3. **Trajectory Management**: Job placement workflow from interview to placement
4. **Document Storage**: File upload and management with entity associations
5. **Notes System**: Comprehensive annotation system for all entities

### Specialized Features
- **Dutch Driving License Normalization**: Intelligent parsing and validation of Dutch license categories
- **Excel Import/Export**: Bulk data operations with template-based Excel processing
- **Responsive Design**: Mobile-first approach with collapsible navigation
- **Real-time Updates**: Optimistic updates with query invalidation

## Data Flow

### Authentication Flow
1. User accesses application
2. System checks for existing Replit session or admin JWT token
3. Unauthenticated users redirected to appropriate login flow
4. Domain validation for Replit OAuth (restricted to doenersingroen.nl)
5. Session establishment with role assignment and permissions

### Data Operations Flow
1. Frontend components trigger API calls through TanStack Query
2. Express routes validate authentication and permissions
3. Business logic processing with data validation
4. Drizzle ORM executes type-safe database operations
5. Response formatting and error handling
6. Frontend state updates with optimistic UI patterns

### File Processing Flow
1. Client uploads Excel/CSV files through drag-drop interface
2. Multer middleware handles file validation and memory storage
3. XLSX library processes spreadsheet data
4. Driving license normalization applied to candidate data
5. Batch database operations with transaction support
6. Real-time progress updates and error reporting

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database operations
- **express**: Web application framework
- **bcryptjs**: Password hashing for admin authentication
- **jsonwebtoken**: JWT token management
- **@azure/msal-node**: Microsoft authentication library
- **multer**: File upload handling
- **xlsx**: Excel file processing

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production build compilation
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit modules
- **Database**: PostgreSQL 16 with automatic provisioning
- **Build Process**: Vite development server with HMR
- **Port Configuration**: Application runs on port 5000 with external mapping to port 80

### Production Build Process
1. **Frontend Build**: Vite builds React application to `dist/public`
2. **Backend Compilation**: esbuild bundles server code to `dist/index.js`
3. **Asset Optimization**: Static assets processed and optimized
4. **Environment Variables**: Database URL and secrets injected at runtime

### Deployment Configuration
- **Platform**: Replit with autoscale deployment target
- **Build Command**: `npm run build` for production assets
- **Start Command**: `npm run start` for production server
- **Health Checks**: Automatic port monitoring on 5000
- **Asset Serving**: Express serves built React application as SPA

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (auto-provisioned)
- **SESSION_SECRET**: Secure session encryption key
- **JWT_SECRET**: Admin authentication token signing key
- **REPL_ID**: Replit environment identifier
- **ISSUER_URL**: OAuth provider configuration

## Changelog

```
Changelog:
- June 30, 2025 (Latest). Added zoom/view functionality to all document locations with ZoomIn icon buttons
- June 30, 2025. Integrated DocumentViewer component across all three entity types (candidates, clients, trajectories)
- June 30, 2025. Enhanced document upload with comprehensive debugging and multiple query invalidation patterns
- June 30, 2025. Standardized document viewing patterns with consistent button layout: Zoom/View, Download, Delete
- June 30, 2025. Completed document upload functionality for all three entity types with full database persistence
- June 30, 2025. Fixed ES module import issues in upload route by replacing require() with proper import statements
- June 30, 2025. Added uploaded_by column to documents table and updated schema for complete document tracking
- June 30, 2025. Standardized document upload and viewing patterns across candidates, clients, and trajectories
- June 30, 2025. Implemented uniform document interface with green upload buttons and consistent viewing layout
- June 30, 2025. Fixed trajectory upload functionality in DetailModal with proper query invalidation
- June 30, 2025. Unified document display styling with FileText icons, timestamps, and Download/Delete actions
- June 27, 2025. Fixed trajectory edit JSON parsing error by correcting HTTP method mismatch (PATCH → PUT)
- June 27, 2025. Added proper error handling for non-JSON responses in trajectory form mutations
- June 27, 2025. Fixed Select component runtime errors by removing empty string values from trajectory form dropdowns
- June 27, 2025. Fixed trajectory display inconsistencies by implementing centralized data formatters
- June 27, 2025. Created trajectory-formatters.ts library with consistent data mapping for all trajectory components
- June 27, 2025. Synchronized trajectory display across cards, detail modal, and edit forms using shared formatters
- June 27, 2025. Added comprehensive data validation and error handling for trajectory operations
- June 27, 2025. Updated results counter styling from blue to green theme for brand consistency
- June 27, 2025. Removed duplicate "Filters wissen" button from collapsible filter panel
- June 27, 2025. Enhanced filter panel height when active filters are present to prevent content cutoff
- June 27, 2025. Added prominent results counter with filter information across all entity views
- June 27, 2025. Implemented clear all filters button in results counter for better UX
- June 27, 2025. Fixed client edit functionality to open proper edit modal instead of new client modal
- June 27, 2025. Added edit button to client DetailModal and integrated ClientForm for editing
- June 27, 2025. Fixed spacing between Edit button and close icon in DetailModal to prevent overlap
- June 27, 2025. Removed duplicate close icons from all modal headers leaving only the automatic Dialog close button
- June 27, 2025. Fixed trajectory detail view to show plain text instead of disabled input fields like candidate/client views
- June 27, 2025. Enhanced trajectory edit functionality with proper form pre-filling and consistent status colors
- June 27, 2025. Simplified trajectory cards with compact neutral styling showing [Functietitel] – [Kandidaatnaam] bij [Opdrachtgever]
- June 27, 2025. Fixed trajectory DetailModal to show all information correctly and added Edit button functionality
- June 27, 2025. Removed colored blocks from trajectory cards for cleaner minimalist design
- June 27, 2025. Enhanced trajectory display with proper candidate and client information visibility
- June 27, 2025. Enhanced candidate overview with dynamic filtered results counter showing detailed filter information
- June 27, 2025. Improved FilterPanel responsiveness with proper flexbox layout preventing button cutoff
- June 27, 2025. Made filter UI fully responsive with auto-scaling containers and clear button positioning
- June 27, 2025. Added gradient results counter with badge display for active filters
- June 27, 2025. Fixed trajectory edit functionality with proper form modal and error handling
- June 27, 2025. Added TrajectoryForm component integration to trajectory overview with full CRUD support
- June 27, 2025. Enhanced trajectory edit with validation for missing trajectory data and user feedback
- June 27, 2025. Implemented separate edit and new trajectory forms for better user experience
- June 27, 2025. Added prominent results counter to candidate overview showing total filtered results
- June 27, 2025. Enhanced results display with active filter details and clear all filters button
- June 27, 2025. Made results counter visually prominent with blue highlighting box
- June 27, 2025. Added comprehensive clear options to all dropdown components throughout the application
- June 27, 2025. Enhanced SearchableSelect component with clear functionality and "Geen selectie" option
- June 27, 2025. Updated all Select components in forms to include clear options for resetting selections
- June 27, 2025. Fixed TypeScript errors in FilterPanel and detail-modal components
- June 27, 2025. Changed all "beschrijving" labels to "beroep" throughout the application
- June 27, 2025. Repositioned profession field to display prominently at the top of all candidate views
- June 27, 2025. Updated profession field styling to match consistent design pattern across all views
- June 27, 2025. Removed duplicate profession field from candidate edit form, keeping only the top field
- June 27, 2025. Added user initials display to candidate notes showing who created each note
- June 27, 2025. Added filter result counts showing candidate quantities for each status and driving license
- June 27, 2025. Made region dropdown clearable with X button to remove selections
- June 27, 2025. Completely removed driving license notes field from all forms and detail views
- June 19, 2025. Enhanced timestamp display in notes to show both date and time consistently across all modals
- June 19, 2025. Fixed mobile modal scrolling issues with CSS body scroll lock and overflow handling
- June 18, 2025. Fixed 500 errors when adding candidates by correcting audit log user ID references
- June 17, 2025. Made DetailModal fully responsive for mobile devices with touch-friendly interfaces
- June 17, 2025. Made trajectories and clients views responsive like candidates view
- June 17, 2025. Extended CompactList component to support all three entity types
- June 17, 2025. Implemented dual authentication system with email/password and Replit Auth
- June 17, 2025. Added dedicated /auth page for email login to prevent 404 errors
- June 17, 2025. Updated admin password to 'admin123' for admin user access
- June 16, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```