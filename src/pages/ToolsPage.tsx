import  { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { adminApi } from '../services/adminApi'
import { getToolIcon } from '../lib/icons'
import type {  OrganizationToolPrompts } from '../types/admin'

interface ToolPromptFormData {
  [toolConnectorKey: string]: string
}

export default function ToolsPage() {
  const [toolPrompts, setToolPrompts] = useState<OrganizationToolPrompts>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [formData, setFormData] = useState<ToolPromptFormData>({})
  const [error, setError] = useState<string | null>(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConnector, setSelectedConnector] = useState<string>('all')
  const [selectedToolType, setSelectedToolType] = useState<string>('all')

  useEffect(() => {
    fetchToolPrompts()
  }, [])

  const fetchToolPrompts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getToolPrompts()
      setToolPrompts(response.toolPrompts)
      
      // Initialize form data with current values
      const initialFormData: ToolPromptFormData = {}
      Object.entries(response.toolPrompts).forEach(([key, prompt]) => {
        initialFormData[key] = prompt.promptTemplate
      })
      setFormData(initialFormData)
    } catch (error) {
      console.error('Failed to fetch tool prompts:', error)
      setError('Failed to load tool prompts')
    } finally {
      setLoading(false)
    }
  }

  // Parse tool connector keys and create structured data
  const parsedToolPrompts = useMemo(() => {
    return Object.entries(toolPrompts).map(([key, toolPrompt]) => {
      const [toolName, connectorType] = key.split(':')
      return {
        toolName,
        connectorType,
        toolPrompt,
        key
      }
    })
  }, [toolPrompts])

  // Get unique connectors and tool types for filters
  const availableConnectors = useMemo(() => {
    const connectors = [...new Set(parsedToolPrompts.map(item => item.connectorType))]
    return connectors.sort()
  }, [parsedToolPrompts])

  const availableToolTypes = useMemo(() => {
    const toolTypes = [...new Set(parsedToolPrompts.map(item => item.toolName))]
    return toolTypes.sort()
  }, [parsedToolPrompts])

  // Filter and search logic
  const filteredToolPrompts = useMemo(() => {
    return parsedToolPrompts.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.connectorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toolPrompt.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesConnector = selectedConnector === 'all' || item.connectorType === selectedConnector
      const matchesToolType = selectedToolType === 'all' || item.toolName === selectedToolType
      
      return matchesSearch && matchesConnector && matchesToolType
    })
  }, [parsedToolPrompts, searchQuery, selectedConnector, selectedToolType])

  const handlePromptChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async (key: string) => {
    try {
      setSaving(key)
      setError(null)
      
      const [toolName, connectorType] = key.split(':')
      const customPrompt = formData[key] || ''
      await adminApi.updateToolPrompt(toolName, connectorType, { customPrompt })
      
      // Refresh the data to get updated values
      await fetchToolPrompts()
    } catch (error) {
      console.error('Failed to update tool prompt:', error)
      setError(`Failed to update ${key}`)
    } finally {
      setSaving(null)
    }
  }

  const getToolDisplayName = (toolName: string): string => {
    return toolName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getConnectorDisplayName = (connectorType: string): string => {
    const displayNames: { [key: string]: string } = {
      slack: 'Slack',
      googleGmail: 'Gmail',
      outlook: 'Outlook',
      discord: 'Discord',
      teams: 'Microsoft Teams',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      email: 'Email',
    }
    const formattedName = connectorType.charAt(0).toUpperCase() + connectorType.slice(1)
    return displayNames[connectorType] || formattedName
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tool prompts...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tool Prompts Management</h1>
        <Button 
          onClick={fetchToolPrompts}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Tools
              </label>
              <Input
                type="text"
                placeholder="Search by tool name, connector, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Connector Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Connector
              </label>
              <Select
                value={selectedConnector}
                onChange={(e) => setSelectedConnector(e.target.value)}
                className="w-full"
                options={[
                  { value: 'all', label: 'All Connectors' },
                  ...availableConnectors.map(connector => ({
                    value: connector,
                    label: getConnectorDisplayName(connector)
                  }))
                ]}
              />
            </div>

            {/* Tool Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Tool Type
              </label>
              <Select
                value={selectedToolType}
                onChange={(e) => setSelectedToolType(e.target.value)}
                className="w-full"
                options={[
                  { value: 'all', label: 'All Tool Types' },
                  ...availableToolTypes.map(toolType => ({
                    value: toolType,
                    label: getToolDisplayName(toolType)
                  }))
                ]}
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredToolPrompts.length} of {parsedToolPrompts.length} tool prompts
            </span>
            {(searchQuery || selectedConnector !== 'all' || selectedToolType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedConnector('all')
                  setSelectedToolType('all')
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tool Prompts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredToolPrompts.map(({ toolName, connectorType, toolPrompt, key }) => {
          const formValue = formData[key] || toolPrompt.promptTemplate
          
          return (
            <Card key={key} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="flex items-center justify-center">
                    {getToolIcon(connectorType)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-900  transition-colors duration-200">
                      {getToolDisplayName(toolName)}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      {getConnectorDisplayName(connectorType)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      toolPrompt.isCustom 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {toolPrompt.isCustom ? 'Custom' : 'Default'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      v{toolPrompt.version}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">
                        Description
                      </label>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {toolPrompt.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prompt Template */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      Prompt Template
                    </label>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Edit template to customize AI behavior</span>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={formValue}
                      onChange={(e) => handlePromptChange(key, e.target.value)}
                      className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm leading-relaxed bg-white transition-all duration-200 hover:border-gray-300"
                      placeholder="Enter custom prompt template..."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {formValue.length} characters
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Last saved: {toolPrompt.isCustom ? 'Recently' : 'Never (using default)'}
                  </div>
                  <Button
                    onClick={() => handleSave(key)}
                    disabled={saving === key}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                  >
                    {saving === key ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredToolPrompts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tool prompts found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedConnector !== 'all' || selectedToolType !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'No tool prompts are currently available for your organization.'
              }
            </p>
          </CardContent>
        </Card>
      )}

     
    </div>
  )
} 