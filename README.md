# Libra Admin Panel

A modern React admin panel built with Vite, TypeScript, and Redux Toolkit.

## Features

- 🔐 **Google OAuth Authentication** - Simple redirect-based authentication
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 📱 **Responsive Design** - Works on all device sizes
- 🔄 **State Management** - Redux Toolkit for global state
- 🛡️ **Protected Routes** - Automatic authentication checks
- ⚡ **Fast Development** - Vite for lightning-fast builds

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx          # Google OAuth login page
│   │   └── ProtectedRoute.tsx     # Route protection component
│   ├── layout/
│   │   └── DashboardLayout.tsx    # Main dashboard layout
│   └── ui/
│       └── button.tsx             # shadcn/ui components
├── hooks/
│   ├── useAppDispatch.ts          # Typed Redux dispatch
│   ├── useAppSelector.ts          # Typed Redux selector
│   └── useAuth.ts                 # Authentication hook
├── lib/
│   ├── constants.ts               # App constants
│   └── utils.ts                   # Utility functions
├── pages/
│   └── Dashboard.tsx              # Main dashboard page
├── services/
│   └── api.ts                     # API service layer
├── store/
│   ├── index.ts                   # Redux store configuration
│   └── slices/
│       └── authSlice.ts           # Authentication state
└── App.tsx                        # Main app component
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_BACKEND_API_URL=http://localhost:3001
   VITE_APP_NAME=Libra Admin
   VITE_APP_VERSION=1.0.0
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Authentication Flow

1. User clicks "Sign in with Google" button
2. Redirects to `${BACKEND_API_URL}/auth/google`
3. Backend handles OAuth and redirects back with token
4. Frontend stores token in localStorage
5. Protected routes check authentication status

## State Management

The app uses **Redux Toolkit** for state management with the following structure:

- **Auth State**: User information, authentication status, loading states
- **Future States**: Can easily add more slices for other features

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Backend Integration

The frontend expects a backend API with the following endpoints:

- `GET /auth/verify` - Verify authentication token
- `POST /auth/logout` - Logout user
- `GET /auth/google` - Google OAuth redirect (handled by backend)

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Follow the established naming conventions
4. Add proper error handling
5. Test your changes thoroughly
