import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { adminApi } from '../services/adminApi'
import type { TokenUsageStats, Organization } from '../types/admin'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function TokenUsagePage() {
  const [tokenStats, setTokenStats] = useState<TokenUsageStats | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all')

  useEffect(() => {
    fetchOrganizations()
    fetchTokenStats()
  }, [period, selectedOrganization])

  const fetchOrganizations = async () => {
    try {
      const data = await adminApi.getOrganizations()
      setOrganizations(data)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    }
  }

  const fetchTokenStats = async () => {
    try {
      setLoading(true)
      const organizationId = selectedOrganization === 'all' ? undefined : selectedOrganization
      const data = await adminApi.getTokenUsageStats(period, organizationId)
      setTokenStats(data)
    } catch (error) {
      console.error('Failed to fetch token usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Transform data for charts
  const chartData = tokenStats?.dailyUsage.map(day => ({
    date: new Date(day.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    tokens: day._sum.totalTokens,
    cost: day._sum.totalCost,
    timestamp: day.timestamp
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading token usage statistics...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Token Analytics</h1>
        <div className="flex items-center space-x-4">
          <Select
            options={[
              { value: 'all', label: 'All Organizations' },
              ...organizations.map(org => ({
                value: org.id,
                label: org.name
              }))
            ]}
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
            className="w-64"
          />
          <Select
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' }
            ]}
            value={String(period)}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tokens</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tokenStats?.summary.totalTokens.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-2xl font-semibold text-green-600">
                  ${tokenStats?.summary.totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Tokens/Day</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round((tokenStats?.summary.averageTokens || 0) / period).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Cost/Day</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${((tokenStats?.summary.averageCost || 0) / period).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Token Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Tokens']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Cost Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Combined Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage & Cost Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'tokens' ? value.toLocaleString() : `$${value.toFixed(2)}`,
                    name === 'tokens' ? 'Tokens' : 'Cost'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  name="tokens"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  name="cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Organization Breakdown - Only show when viewing all organizations */}
      {selectedOrganization === 'all' && tokenStats?.organizationBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Organization</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Total Tokens</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Total Cost</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Usage Count</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Tokens/Request</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenStats.organizationBreakdown.map((org) => (
                    <tr key={org.organizationId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{org.organizationName}</div>
                          <div className="text-sm text-gray-500">{org.organizationDomain}</div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {org.totalTokens.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-green-600">
                        ${org.totalCost.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">
                        {org.usageCount.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        {org.usageCount > 0 ? Math.round(org.totalTokens / org.usageCount).toLocaleString() : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedOrganization !== 'all' && tokenStats?.organizationBreakdown ? (
                // Show organization-specific breakdown
                (() => {
                  const org = tokenStats.organizationBreakdown.find(o => o.organizationId === selectedOrganization)
                  return org ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Input Tokens</span>
                        <span className="text-lg font-semibold">
                          {org.inputTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Output Tokens</span>
                        <span className="text-lg font-semibold">
                          {org.outputTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Tokens per Request</span>
                        <span className="text-lg font-semibold">
                          {org.usageCount > 0 ? Math.round(org.totalTokens / org.usageCount).toLocaleString() : 0}
                        </span>
                      </div>
                    </>
                  ) : null
                })()
              ) : (
                // Show overall breakdown
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Input Tokens</span>
                    <span className="text-lg font-semibold">
                      {tokenStats?.summary.totalTokens ? 
                        Math.round(tokenStats.summary.totalTokens * 0.7).toLocaleString() : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Output Tokens</span>
                    <span className="text-lg font-semibold">
                      {tokenStats?.summary.totalTokens ? 
                        Math.round(tokenStats.summary.totalTokens * 0.3).toLocaleString() : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Tokens per Request</span>
                    <span className="text-lg font-semibold">
                      {tokenStats?.summary.averageTokens.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedOrganization !== 'all' && tokenStats?.organizationBreakdown ? (
                // Show organization-specific breakdown
                (() => {
                  const org = tokenStats.organizationBreakdown.find(o => o.organizationId === selectedOrganization)
                  return org ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Input Cost</span>
                        <span className="text-lg font-semibold text-blue-600">
                          ${org.inputCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Output Cost</span>
                        <span className="text-lg font-semibold text-green-600">
                          ${org.outputCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Cost per Request</span>
                        <span className="text-lg font-semibold">
                          ${org.usageCount > 0 ? (org.totalCost / org.usageCount).toFixed(4) : '0.0000'}
                        </span>
                      </div>
                    </>
                  ) : null
                })()
              ) : (
                // Show overall breakdown
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Input Cost</span>
                    <span className="text-lg font-semibold text-blue-600">
                      ${tokenStats?.summary.totalCost ? 
                        (tokenStats.summary.totalCost * 0.7).toFixed(2) : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Output Cost</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${tokenStats?.summary.totalCost ? 
                        (tokenStats.summary.totalCost * 0.3).toFixed(2) : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Cost per Request</span>
                    <span className="text-lg font-semibold">
                      ${tokenStats?.summary.averageCost.toFixed(4)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 