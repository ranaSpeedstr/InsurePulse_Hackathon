# Client Sentiment & Churn Reduction Dashboard

## Overview

This is a modern web application designed to help businesses monitor client sentiment and reduce churn through AI-powered analytics. The dashboard integrates multiple data sources (emails, call transcripts, Excel files, and XML client profiles) to provide comprehensive insights into client relationships and risk factors.

The application features real-time sentiment analysis, predictive churn modeling, and automated alerting systems to enable proactive client management. It includes visualization dashboards, client 360-degree views, and what-if simulation capabilities for strategic decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing without unnecessary complexity
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible interfaces
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Data Processing**: Custom parsers for XML, TXT, and Excel file formats
- **Email Integration**: IMAP client for Gmail integration with automated sentiment analysis
- **AI Integration**: Planned integration with HuggingFace/OpenAI APIs for sentiment analysis and root cause extraction

### Database Design
- **Primary Tables**: 
  - `clients` - Client profile information from XML sources
  - `conversations` - Parsed call transcripts with sentiment analysis
  - `client_metrics` - Performance metrics from Excel data
  - `client_retention` - Retention and churn risk indicators
  - `users` - Application user management
- **Schema Management**: Drizzle Kit for database migrations and schema evolution

### Data Processing Pipeline
- **Multi-source Ingestion**: Automated processing of emails (IMAP), call transcripts (TXT files), Excel metrics, and XML client profiles
- **Sentiment Analysis**: Real-time analysis of client communications using AI APIs
- **Risk Calculation**: Algorithmic computation of churn probability based on multiple data points
- **Alert Generation**: Automated email notifications for high-risk scenarios

### Component Architecture
- **Modular Design**: Reusable dashboard components for metrics, charts, and data tables
- **Chart Library**: Recharts for responsive data visualizations
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Toast Notifications**: Custom toast system for user feedback

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless) for scalable data storage
- **Email Service**: SendGrid for automated alert notifications
- **Development Platform**: Replit for cloud-based development environment

### AI/ML Services
- **Sentiment Analysis**: HuggingFace API or OpenAI API for natural language processing
- **Predictive Modeling**: Custom algorithms for churn probability calculation

### Email Integration
- **IMAP Client**: Gmail integration for automated email ingestion and analysis
- **Email Processing**: Custom parsing for client feedback extraction

### UI/UX Libraries
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts library for interactive data visualizations
- **Date Handling**: date-fns for robust date manipulation
- **Styling**: PostCSS with Autoprefixer for CSS processing

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for production
- **Path Mapping**: Custom import aliases for clean code organization