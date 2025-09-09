# Admin Interface Documentation

This admin interface provides comprehensive management capabilities for the Libra platform, built with React, TypeScript, and Tailwind CSS.

## Features

### 🏠 Dashboard
- **System Overview**: Real-time statistics showing total organizations, users, connectors, and chats
- **Token Usage Analytics**: Visual representation of token consumption and costs
- **Connector Status**: Overview of connector health and success rates
- **Recent Activity**: Quick insights into system performance

### 🏢 Organizations Management
- **List View**: Complete list of all organizations with search and filtering
- **Organization Details**: View organization information, users, and connectors
- **CRUD Operations**: Create, read, update, and delete organizations
- **Status Management**: Verify organizations and manage model change permissions

### 👥 Users Management
- **Advanced Filtering**: Filter by organization, role, and search terms
- **Pagination**: Handle large user datasets efficiently
- **User Profiles**: Detailed user information including activity metrics
- **Role Management**: Manage user roles (user, admin, superadmin)
- **Bulk Operations**: Edit and delete users with confirmation

### 📊 Token Usage Analytics
- **Usage Statistics**: Comprehensive token consumption metrics
- **Cost Analysis**: Detailed cost breakdown and trends
- **Time Period Selection**: Analyze data for different time ranges (7, 30, 90, 365 days)
- **Visual Charts**: Bar charts showing daily usage patterns
- **Performance Metrics**: Average tokens and costs per request

### 🔌 Connectors Management
- **Status Overview**: Monitor connector health and sync status
- **Type Breakdown**: Statistics by connector type (Google Drive, Slack, GitHub, etc.)
- **Performance Metrics**: Success rates and failure analysis
- **Visual Indicators**: Color-coded status badges for quick identification

### 📋 System Logs
- **Real-time Monitoring**: View system logs with filtering capabilities
- **Log Levels**: Filter by error, warning, info, and debug levels
- **Search Functionality**: Search through log messages
- **System Status**: Monitor API health, database connectivity, and performance

## Technical Architecture

### Components Structure
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   └── select.tsx
│   └── layout/
│       └── AdminLayout.tsx # Main admin layout with navigation
├── pages/                  # Admin page components
│   ├── AdminDashboard.tsx
│   ├── OrganizationsPage.tsx
│   ├── UsersPage.tsx
│   ├── TokenUsagePage.tsx
│   ├── ConnectorsPage.tsx
│   └── LogsPage.tsx
├── services/
│   └── adminApi.ts        # API service for admin endpoints
└── types/
    └── admin.ts           # TypeScript type definitions
```

### API Integration
The admin interface integrates with the following API endpoints:

- `GET /api/admin/stats` - System statistics
- `GET /api/admin/organizations` - List organizations
- `GET /api/admin/users` - List users with pagination
- `GET /api/admin/token-usage/stats` - Token usage analytics
- `GET /api/admin/connectors/stats` - Connector statistics
- `GET /api/admin/logs` - System logs

### TypeScript Types
All data structures are fully typed based on the Prisma schema:
- `Organization` - Organization data with user/connector counts
- `User` - User data with activity metrics
- `TokenUsage` - Token consumption records
- `Connector` - Connector configuration and status
- `SystemStats` - Overall system metrics

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- React 18+
- TypeScript 4.8+
- Tailwind CSS

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## Usage

### Accessing the Admin Interface
Navigate to `/admin` to access the main dashboard. The interface is protected by authentication middleware.

### Navigation
Use the sidebar navigation to switch between different admin sections:
- **Dashboard**: System overview and key metrics
- **Organizations**: Manage organizations and their settings
- **Users**: User management and role administration
- **Token Usage**: Analytics and cost monitoring
- **Connectors**: Connector health and status monitoring
- **System Logs**: Real-time system monitoring

### Key Features

#### Search and Filtering
- Use the search bars to find specific organizations, users, or logs
- Apply filters by role, organization, or status
- Combine multiple filters for precise results

#### Data Management
- Edit organization and user details inline
- Bulk operations for efficient management
- Confirmation dialogs for destructive actions

#### Analytics
- Interactive charts showing usage trends
- Export capabilities for reporting
- Real-time data updates

## Security Considerations

- All admin routes are protected by authentication
- Role-based access control for different admin functions
- API endpoints require superadmin privileges
- Sensitive operations require confirmation

## Customization

### Styling
The interface uses Tailwind CSS for styling. Customize the appearance by modifying:
- Color schemes in `tailwind.config.ts`
- Component styles in individual component files
- Layout configurations in `AdminLayout.tsx`

### Adding New Features
1. Create new page components in `src/pages/`
2. Add corresponding API methods in `src/services/adminApi.ts`
3. Define TypeScript types in `src/types/admin.ts`
4. Add routes in `src/App.tsx`
5. Update navigation in `src/components/layout/AdminLayout.tsx`

## Troubleshooting

### Common Issues
- **API Errors**: Check network connectivity and API endpoint availability
- **Authentication Issues**: Ensure proper login and session management
- **Data Loading**: Verify API responses and data structure

### Performance
- Large datasets are paginated for optimal performance
- Lazy loading for charts and complex components
- Debounced search for better user experience

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team. 