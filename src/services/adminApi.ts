import { api } from './api'
import type { 
  Organization, 
  User, 
  SystemStats, 
  ConnectorStats, 
  TokenUsageStats, 
  PaginatedResponse,
  UserFilters,
  ToolPrompt,
  ToolPromptResponse,
  ToolPromptUpdateRequest,
  ToolPromptUpdateResponse
} from '../types/admin'

const API_BASE = '/admin'

export const adminApi = {
  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const response = await api.get(`${API_BASE}/organizations`)
    return response.data
  },

  async getOrganization(id: string): Promise<Organization> {
    const response = await api.get(`${API_BASE}/organizations/${id}`)
    return response.data
  },

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    const response = await api.put(`${API_BASE}/organizations/${id}`, data)
    return response.data
  },

  async deleteOrganization(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/organizations/${id}`)
    return response.data
  },

  // Users
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await api.get(`${API_BASE}/users`, { params: filters })
    return response.data
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get(`${API_BASE}/users/${id}`)
    return response.data
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`${API_BASE}/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/users/${id}`)
    return response.data
  },

  // Statistics
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get(`${API_BASE}/stats`)
    return response.data
  },

  async getConnectorStats(): Promise<ConnectorStats> {
    const response = await api.get(`${API_BASE}/connectors/stats`)
    return response.data
  },

  async getTokenUsageStats(period: number = 30, organizationId?: string): Promise<TokenUsageStats> {
    const params: Record<string, any> = { period }
    if (organizationId) params.organizationId = organizationId
    const response = await api.get(`${API_BASE}/token-usage/stats`, { params })
    return response.data
  },

  // Logs
  async getLogs(page: number = 1, limit: number = 50, level?: string, search?: string) {
    const params: Record<string, any> = { page, limit }
    if (level) params.level = level
    if (search) params.search = search
    
    const response = await api.get(`${API_BASE}/logs`, { params })
    return response.data
  },

  // Tool Prompts
  async getToolPrompts(): Promise<ToolPromptResponse> {
    const response = await api.get(`${API_BASE}/tools`)
    return response.data
  },

  async getToolPrompt(toolName: string, connectorType: string): Promise<ToolPrompt> {
    const response = await api.get(`${API_BASE}/tools/${toolName}/${connectorType}`)
    return response.data
  },

  async updateToolPrompt(
    toolName: string, 
    connectorType: string, 
    data: ToolPromptUpdateRequest
  ): Promise<ToolPromptUpdateResponse> {
    const response = await api.put(`${API_BASE}/tools/${toolName}/${connectorType}`, data)
    return response.data
  }
} 