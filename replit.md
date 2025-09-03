# Smart Tourist Safety Monitoring System

## Overview

This is a Smart Tourist Safety Monitoring & Incident Response System that leverages AI, geo-fencing, and blockchain-based digital ID technology to enhance tourist safety. The application provides a comprehensive platform for tourists to register for digital IDs, report incidents, access safety maps, and receive real-time safety alerts. It also includes an authority dashboard for monitoring and responding to incidents.

The system is built as a full-stack web application with a React frontend and Express.js backend, designed to work seamlessly across desktop and mobile devices with a mobile-first approach.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens and mobile-first responsive design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Design Pattern**: Component-based architecture with reusable UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for CRUD operations
- **Data Storage**: In-memory storage with interface for future database integration
- **Architecture Pattern**: Layered architecture with separate routes, storage, and business logic

### Mobile-First Design
- **Responsive Layout**: Mobile-optimized interface with bottom navigation
- **Progressive Web App**: Configured for mobile app-like experience
- **Touch-Friendly**: Large touch targets and intuitive mobile interactions
- **Status Bar**: Native mobile status bar simulation

### Authentication & Security
- **Digital Identity**: Blockchain-based digital ID system with mock implementation
- **Data Validation**: Zod schema validation for all API inputs
- **Anonymous Reporting**: Optional anonymous incident reporting capability

### Key Features Architecture
- **Incident Reporting**: Multi-step form with location tracking and photo upload capabilities
- **Safety Mapping**: Interactive safety zone visualization with real-time incident overlays
- **Geo-fencing**: Location-based safety zone monitoring and alerts
- **Emergency Response**: Quick access to emergency contacts and services
- **Authority Dashboard**: Real-time monitoring and incident response management

### Data Models
The system uses strongly-typed data models for:
- Tourist profiles with blockchain-verified digital IDs
- Incident reports with location data and priority levels
- Safety zones with geo-coordinates and radius definitions
- Emergency contacts with relationship mapping
- Location history tracking for safety monitoring
- Safety alerts with severity levels and geographic targeting

## External Dependencies

### UI Framework
- **Radix UI**: Comprehensive set of accessible, unstyled UI components
- **Lucide React**: Modern icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for rapid styling

### Data & State Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Database & ORM
- **Drizzle ORM**: Type-safe SQL ORM configured for PostgreSQL
- **Neon Database**: Serverless PostgreSQL database (via @neondatabase/serverless)
- **Database Migrations**: Drizzle Kit for schema migrations and management

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

### Utility Libraries
- **Date-fns**: Modern date utility library for time handling
- **Class Variance Authority**: Utility for creating component variants
- **CLSX**: Conditional className utility for dynamic styling

### Development Environment
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Development server with hot module replacement
- **Error Overlay**: Runtime error display for development debugging