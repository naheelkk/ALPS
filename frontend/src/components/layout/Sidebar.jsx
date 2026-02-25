import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import {
  LayoutDashboard,
  BookOpen,
  Target,
  TrendingUp,
  User,
  X,
  GraduationCap,
  Settings,
  Users,
  FileText,
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  const user = useAuthStore((state) => state.user)
  const isAdminOrTutor = user?.role === 'admin' || user?.role === 'tutor'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'My Assessments', href: '/assessments', icon: FileText },
    { name: 'Recommendations', href: '/recommendations', icon: Target },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: Settings },
    { name: 'Manage Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
  ]

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 w-64',
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        'transform transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">LearnAI</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Learning
        </p>
        
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}

        {/* Admin Section */}
        {isAdminOrTutor && (
          <>
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Management
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}