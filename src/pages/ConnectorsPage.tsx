import  { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { adminApi } from '../services/adminApi'
import type { ConnectorStats, Connector, ConnectorsResponse } from '../types/admin'

export default function ConnectorsPage() {
  const [connectorStats, setConnectorStats] = useState<ConnectorStats | null>(null)
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [connectorsResponse, setConnectorsResponse] = useState<ConnectorsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, connectorsData] = await Promise.all([
        adminApi.getConnectorStats(),
        adminApi.getConnectors()
      ])
      setConnectorStats(statsData)
      setConnectorsResponse(connectorsData)
      setConnectors(connectorsData.connectors) // Extract connectors array from response
    } catch (error) {
      console.error('Failed to fetch connector data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'syncCompleted':
        return 'success'
      case 'syncStarted':
        return 'warning'
      case 'syncFailed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getConnectorTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      googleDrive: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      slack: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      github: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      notion: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      postgres: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      mysql: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
    }
    return icons[type] || 'M13 10V3L4 14h7v7l9-11h-7z'
  }

  const formatConnectorType = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading connector statistics...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Connectors</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Connectors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {connectorStats?.totalConnectors.toLocaleString()}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Connectors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {connectorStats?.activeConnectors.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Connectors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Connectors</CardTitle>
            {connectorsResponse && (
              <div className="text-sm text-gray-500">
                Showing {connectorsResponse.connectors.length} of {connectorsResponse.pagination.total} connectors
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectors.map((connector) => (
                <TableRow key={connector.id}>
                  <TableCell>
                    <div className="flex items-center">
                        <div className="font-medium text-gray-900">
                          {connector.name && connector.name.length > 30 ? (
                            <span title={connector.name}>
                              {connector.name.substring(0, 30)}&hellip;
                            </span>
                          ) : (
                            connector.name
                          )}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {formatConnectorType(connector.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(connector.status) as any}>
                      {connector.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {connector.organizationName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {connector.organizationDomain || connector.organizationId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {connector.userName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {connector.userEmail || '—'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(connector.lastSynced)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(connector.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connectorStats?.connectorStats.reduce((acc, stat) => {
                const status = stat.status
                if (!acc[status]) acc[status] = 0
                acc[status] += stat._count.id
                return acc
              }, {} as Record<string, number>).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge variant={getStatusColor(status) as any} className="mr-2">
                      {status}
                    </Badge>
                    <span className="text-sm text-gray-600 capitalize">
                      {status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {connectorStats ? 
                    ((connectorStats.activeConnectors / connectorStats.totalConnectors) * 100).toFixed(1) : 0
                  }%
                </span>
              </div> */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inactive Connectors</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {connectorStats ? 
                    connectorStats.totalConnectors - connectorStats.activeConnectors : 0
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Syncs</span>
                <span className="text-lg font-semibold text-red-600">
                  {connectorStats?.connectorStats
                    .filter(stat => stat.status === 'syncFailed')
                    .reduce((sum, stat) => sum + stat._count.id, 0) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 