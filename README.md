<img src="./frontend/Screenshot from 2025-07-29 04-45-10.png" alt="Component Generator Logo" width="200">

# 🚀 AI-Powered Component Generator Platform

A stateful, AI-driven micro-frontend playground where authenticated users can iteratively generate, preview, tweak, and export React components with full chat history and code persistence.

## 🎯 Live Demo

**Demo URL**: [Your Live Hosted URL Here]

## ✨ Features

### ✅ Mandatory Features (Implemented)

- **🔐 Authentication & Persistence**: JWT-based auth with MongoDB persistence
- **💬 Conversational UI**: Side-panel chat with text + image inputs
- **🎨 Live Component Rendering**: Real-time micro-frontend preview
- **📝 Code Inspection & Export**: Syntax-highlighted JSX/CSS with copy/download
- **🔄 Iterative Refinement**: Chat-driven component modifications
- **💾 Statefulness & Resume**: Auto-save and session restoration

### 🌟 Bonus Features

- **🎛️ Interactive Property Editor**: Click-to-edit element properties
- **🖼️ Image-to-Component**: Upload images for AI analysis
- **📚 Component Variations**: Generate multiple design approaches
- **🎭 Multi-Framework Support**: React/Vue/Angular (extensible)
- **🌙 Dark Mode**: Full theme switching support
- **📱 Responsive Design**: Mobile-first UI/UX

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (Node.js)     │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React 18      │◄───┤ • Express       │    │ • MongoDB       │
│ • TypeScript    │    │ • JWT Auth      │    │ • Redis Cache   │
│ • Tailwind CSS  │    │ • Rate Limiting │    │ • OpenRouter AI │
│ • Monaco Editor │    │ • File Upload   │    │ • Qwen3-Coder   │
│ • React Query   │    │ • WebSockets    │    │                 │
│ • Context API   │    │ • Error Handling│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend

- **Framework**: Node.js + Express
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis (Upstash)
- **Authentication**: JWT with bcryptjs
- **AI Integration**: OpenRouter API (Qwen3-Coder)
- **File Upload**: Multer
- **Security**: Helmet, Rate Limiting, CORS

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Context API + React Query
- **Code Editor**: Monaco Editor
- **UI Components**: Custom components with Framer Motion
- **File Handling**: JSZip for exports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Redis instance (Upstash or local)
- OpenRouter API key

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📋 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Sessions

- `GET /api/sessions` - List user sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/chat` - Add chat message

### AI Generation

- `POST /api/ai/generate` - Generate component
- `POST /api/ai/refine` - Refine existing component
- `POST /api/ai/generate-variations` - Generate variations
- `POST /api/ai/generate-with-image` - Generate from image

## 🎮 Usage Guide

### 1. Authentication

- Register a new account or login
- Profile settings allow theme and framework preferences

### 2. Creating Sessions

- Click "New Session" to start
- Configure framework and styling preferences
- Sessions auto-save on every interaction

### 3. Generating Components

- Use the chat interface to describe your component
- Upload images for visual inspiration
- AI generates JSX and CSS code instantly

### 4. Iterative Refinement

- Continue chatting to refine the component
- Each iteration preserves chat history
- Version history tracks all changes

### 5. Code Inspection & Export

- View generated code in syntax-highlighted editor
- Copy individual files or download as ZIP
- Export includes full project structure

## 🏆 Evaluation Checklist

| Feature  
| -------------------------------------------------
| **Auth & Backend**  
| • JWT authentication with secure password hashing
| • RESTful API with proper error handling  
| • MongoDB schema design with relationships  
| **State Management**  
| • Context API + React Query for state management  
| • Auto-save functionality  
| • Session restoration on reload  
| **AI Integration**  
| • OpenRouter API integration  
| • Streaming responses with error handling  
| • Context-aware prompt engineering  
| **Micro-Frontend Rendering**  
| • Secure iframe sandbox  
| • Hot-reload without full refresh  
| • Component isolation  
| **Code Editor & Export**  
| • Monaco Editor with syntax highlighting  
| • Copy/download functionality  
| • ZIP export with project structure  
| **Iterative Workflow**  
| • Clear chat UX with turn delineation  
| • Incremental patches vs full replaces  
| • Version history tracking  
| **Persistence & Resume**  
| • Auto-save triggers on interactions  
| • Fast session loading with Redis cache  
| • Graceful error recovery  
| **Polish & Accessibility**  
| • Responsive design with mobile support  
| **Bonus Features**  
| • ARIA roles and keyboard navigation  
| • Loading/error/empty states  
| • Interactive Property Editor  
| • Chat-Driven Element Targeting  
| • Image-to-Component Generation

## 🎯 Key Decisions & Trade-offs

### State Management Strategy

- **Choice**: Context API + React Query
- **Rationale**: Balanced approach between simplicity and performance
- **Trade-off**: More complex than plain Context, simpler than Redux

### Sandboxing Approach

- **Choice**: Iframe sandbox with postMessage communication
- **Rationale**: Maximum security and isolation
- **Trade-off**: More complex than direct rendering, safer than eval

### Auto-save Logic

- **Choice**: Debounced saves on chat interactions
- **Rationale**: Balance between data safety and performance
- **Trade-off**: Potential data loss vs server load

### AI Model Selection

- **Choice**: Qwen3-Coder via OpenRouter
- **Rationale**: Free tier access with good code generation
- **Trade-off**: Rate limits vs cost efficiency

## 🙏 Acknowledgments

- OpenRouter for AI API access
- Upstash for Redis hosting
- Vercel for frontend hosting
- MongoDB Atlas for database hosting
