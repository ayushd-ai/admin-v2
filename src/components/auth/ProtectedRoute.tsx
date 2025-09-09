// import type { ReactNode } from 'react'
// import { Navigate } from 'react-router-dom'
// import { useAppSelector } from '@/hooks/useAppSelector'
// import { ROUTES } from '@/lib/constants'

// interface ProtectedRouteProps {
//   children: ReactNode
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth)
//   console.log('Admin route check:', {
//       userRole: user?.role,
//       hasRole: !!user?.role,
//       isAdmin: user?.role === 'admin',
//       isSuperAdmin: user?.role === 'superadmin',
//       userObject: user,
//       isAuthenticated
//     })
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//       </div>
//     )
//   }

//   if (!isAuthenticated) {
//     return <Navigate to={ROUTES.LOGIN} replace />
//   }

//   // For admin routes, check if user has admin privileges
//   if (window.location.pathname.startsWith('/admin')) {
//     if (!user?.role || (user.role !== 'admin' && user.role !== 'superadmin')) {
//       return <Navigate to={ROUTES.DASHBOARD} replace />
//     }
//   }

//   return <>{children}</>
// }

// export default ProtectedRoute 