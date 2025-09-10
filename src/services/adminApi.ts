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
  ToolPromptUpdateResponse,
  Prompt,
  CreatePromptRequest,
  UpdatePromptRequest,
  PromptTestRequest,
  PromptTestResponse,
  ClearCacheRequest,
  PromptVersion,
  PromptVersionHistory,
  PromptDiff,
  VersionComparison,
  RevertPromptRequest,
  RevertPromptResponse,
  Connector,
  ConnectorsResponse
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

  async getConnectors(): Promise<ConnectorsResponse> {
    const response = await api.get(`${API_BASE}/connectors`)
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
  },

  // Prompt Management
  async getPrompts(): Promise<Prompt[]> {
    const response = await api.get(`${API_BASE}/prompts`)
    return response.data
  },

  async getPrompt(id: string): Promise<Prompt> {
    const response = await api.get(`${API_BASE}/prompts/${id}`)
    return response.data
  },

  async getPromptsByIdentifier(identifier: string): Promise<Prompt[]> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}`)
    return response.data
  },

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    const response = await api.post(`${API_BASE}/prompts`, data)
    return response.data
  },

  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<Prompt> {
    const response = await api.put(`${API_BASE}/prompts/${id}`, data)
    return response.data
  },

  async deletePrompt(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/prompts/${id}`)
    return response.data
  },

  async testPrompt(id: string, data: PromptTestRequest): Promise<PromptTestResponse> {
    const response = await api.post(`${API_BASE}/prompts/${id}/test`, data)
    return response.data
  },

  async clearPromptCache(data: ClearCacheRequest = {}): Promise<{ message: string }> {
    const response = await api.post(`${API_BASE}/prompts/cache/clear`, data)
    return response.data
  },

  // Version Management
  async getPromptVersions(identifier: string): Promise<PromptVersionHistory> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/versions`)
    return response.data
  },

  async comparePromptVersions(identifier: string, fromVersion: number, toVersion: number): Promise<VersionComparison> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/compare/${fromVersion}/${toVersion}`)
    return response.data
  },

  async getPromptDiff(identifier: string, fromVersion: number, toVersion: number): Promise<PromptDiff> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/diff/${fromVersion}/${toVersion}`)
    return response.data
  },

  async revertPromptToVersion(identifier: string, version: number, data: RevertPromptRequest = {}): Promise<RevertPromptResponse> {
    const response = await api.post(`${API_BASE}/prompts/identifier/${identifier}/revert/${version}`, data)
    return response.data
  },

  async updatePromptTemplate(id: string, template: string, changeMessage?: string): Promise<Prompt> {
    const response = await api.put(`${API_BASE}/prompts/${id}`, { 
      template,
      changeMessage 
    })
    return response.data
  },

  async getPromptVersion(identifier: string, version: number): Promise<PromptVersion> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/version/${version}`)
    return response.data
  }
} 