// Types based on Prisma schema and admin routes
export interface Organization {
  id: string
  name: string
  emailDomain: string
  createdAt: string
  updatedAt: string
  verified: boolean
  allowModelChange: boolean
  _count?: {
    users: number
    connectors: number
  }
  users?: User[]
  connectors?: Connector[]
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role: 'user' | 'admin' | 'superadmin'
  verified: boolean
  createdAt: string
  updatedAt: string
  lastSynced?: string
  organizationId: string
  organization?: {
    id: string
    name: string
    emailDomain: string
  }
  title?: string
  function?: string
  onboardingComplete: boolean
  timeZone?: string
  filesProcessed: number
  filesProcessingFailed: number
  lastFileProcessedAt?: string
  _count?: {
    chats: number
    connectors: number
    tokenUsage: number
    userMemory: number
  }
  chats?: Chat[]
  connectors?: Connector[]
  tokenUsage?: TokenUsage[]
}

export interface Connector {
  id: string
  name: string
  userId: string
  organizationId: string
  type: ConnectorType
  webhookEnabled: boolean
  webhookConfig?: any
  metadata?: any
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: string
  lastSynced?: string
  createdAt: string
  updatedAt: string
  status: ConnectorStatus
  setupComplete: boolean
  syncAble: boolean
  completedOauth: boolean
  shareable: boolean
  sharedUsers: string[]
  sharedGroups: string[]
}

export interface TokenUsage {
  id: string
  userId: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost: number
  outputCost?: number
  totalCost: number
  purpose?: string
  timestamp: string
}

export interface Chat {
  id: string
  userId: string
  title?: string
  type: 'GENERAL' | 'BI_CHAT'
  dashboardId?: string
  createdAt: string
  updatedAt: string
  memoryProcessed: boolean
  projectMemoryProcessed: boolean
  organizationId?: string
}

export interface SystemStats {
  totalOrganizations: number
  totalUsers: number
  totalConnectors: number
  totalChats: number
  totalTokens: number
  totalCost: number
  recentUsers: number
  recentOrganizations: number
}

export interface ConnectorStats {
  connectorStats: Array<{
    type: ConnectorType
    status: ConnectorStatus
    _count: { id: number }
  }>
  totalConnectors: number
  activeConnectors: number
  successRate: number
}

export interface OrganizationBreakdown {
  organizationId: string
  organizationName: string
  organizationDomain: string
  totalTokens: number
  totalCost: number
  inputTokens: number
  outputTokens: number
  inputCost: number
  outputCost: number
  usageCount: number
}

export interface TokenUsageStats {
  period: number
  summary: {
    totalTokens: number
    totalCost: number
    averageTokens: number
    averageCost: number
  }
  organizationBreakdown: OrganizationBreakdown[]
  dailyUsage: Array<{
    timestamp: string
    _sum: {
      totalTokens: number
      totalCost: number
    }
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export type ConnectorType = 
  | 'googleDrive' | 'googleGmail' | 'slack' | 'linear' | 'notion' | 'postgres' 
  | 'googleCalendar' | 'github' | 'mysql' | 'asana' | 'freshdesk' | 'freshchat' 
  | 'discord' | 'jira' | 'dropbox' | 'sentry' | 'pipedrive' | 'hubspot' 
  | 'newrelic' | 'salesforce' | 'confluence' | 'bamboohr' | 'airtable' 
  | 'datadog' | 'amplitude' | 'zendesk' | 'stripe' | 'fireflies'

export type ConnectorStatus = 'syncStarted' | 'syncCompleted' | 'syncFailed'

export interface UserFilters {
  page?: number
  limit?: number
  organizationId?: string
  role?: string
  search?: string
}

// Tool Prompt Types
export interface ToolPrompt {
  promptTemplate: string
  description: string
  version: number
  isCustom: boolean
}

export interface OrganizationToolPrompts {
  [toolConnectorKey: string]: ToolPrompt
}

export interface ToolPromptResponse {
  organizationId: string
  toolPrompts: OrganizationToolPrompts
  count: number
}

export interface ToolPromptUpdateRequest {
  customPrompt: string
}

export interface ToolPromptUpdateResponse {
  success: boolean
  message: string
  toolName: string
  connectorType: string
} 