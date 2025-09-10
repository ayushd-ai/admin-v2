// API Configuration
export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174'
// App Configuration
export const APP_NAME = 'Libra Admin'
export const APP_VERSION = '1.0.0'

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/',
  ADMIN: '/admin',
  ORGANIZATIONS: '/admin/organizations',
  USERS: '/admin/users',
  TOKEN_USAGE: '/admin/token-usage',
  CONNECTORS: '/admin/connectors',
  LOGS: '/admin/logs',
  TOOLS: '/admin/tools',
  PROMPT: '/admin/prompts',
  PROMPT_EDITOR: '/admin/prompts/editor/:identifier',
} as const 