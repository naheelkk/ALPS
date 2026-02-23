import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import EditCourse from './pages/admin/EditCourse'
import AssessmentManager from './pages/admin/AssessmentManager'
// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import CourseList from './pages/courses/CourseList'
import CourseDetail from './pages/courses/CourseDetail'
import Quiz from './pages/quiz/Quiz'
import QuizResult from './pages/quiz/QuizResult'
import Recommendations from './pages/Recommendations'
import Profile from './pages/Profile'
import Progress from './pages/Progress'
import MyAssessments from './pages/MyAssessments'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import CourseManager from './pages/admin/CourseManager'
import CreateCourse from './pages/admin/CreateCourse'
import UserManagement from './pages/admin/UserManagement'

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

// Protected Route
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  
  if (!hasHydrated) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  return children
}

// Admin Route
const AdminRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  
  if (!hasHydrated) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  console.log('AdminRoute Debug:', { user, role: user?.role })
  
  if (user?.role !== 'admin' && user?.role !== 'tutor') {
    console.log('Redirecting to dashboard: Not admin/tutor')
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Public Route
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  
  if (!hasHydrated) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  
  return children
}

function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  
  if (!hasHydrated) return <LoadingScreen />

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/quiz/:quizId" element={<Quiz />} />
        <Route path="/quiz/:quizId/result" element={<QuizResult />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/assessments" element={<MyAssessments />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute><MainLayout /></AdminRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/courses" element={<CourseManager />} />
        <Route path="/admin/courses/create" element={<CreateCourse />} />
        <Route path='/admin/courses/:courseId/edit' element={<EditCourse />} />
        <Route path='/admin/assessments/:assessmentId/grade' element={<AssessmentManager />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App