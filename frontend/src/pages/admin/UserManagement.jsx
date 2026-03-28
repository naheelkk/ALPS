import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Filter,
  Shield,
  GraduationCap,
  UserCog,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Edit,
  Trash2,
  MoreVertical,
  Crown,
  User,
} from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers()
      setUsers(data.users)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole)
      toast.success('User role updated!')
      fetchUsers()
      setShowEditModal(false)
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleDeleteUser = async () => {
    try {
      // You need to implement this endpoint
      await adminService.deleteUser(selectedUser.id)
      toast.success('User deleted')
      fetchUsers()
      setShowDeleteModal(false)
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    tutors: users.filter(u => u.role === 'tutor').length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white bg-animate">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <p className="text-white/90 text-lg">Manage platform users, roles, and permissions</p>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/50">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.total}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/50">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="badge-gradient-green">
                {Math.round((stats.students / stats.total) * 100)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.students}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/50">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div className="badge-gradient-purple">
                {Math.round((stats.tutors / stats.total) * 100)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.tutors}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tutors</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <Shield className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.admins}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-modern pl-12"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-modern pl-12 pr-10 appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="tutor">Tutors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="glass-card-hover p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                  user.role === 'admin' 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/50'
                    : user.role === 'tutor'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/50'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/50'
                }`}>
                  {user.name?.charAt(0) || 'U'}
                </div>
                
                {/* Role Badge */}
                {user.role === 'admin' && (
                  <div className="absolute -top-1 -right-1 p-1 bg-gradient-to-br from-orange-500 to-red-600 rounded-full">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
                {user.role === 'tutor' && (
                  <div className="absolute -top-1 -right-1 p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full">
                    <GraduationCap className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && (
                      <div className="badge-gradient-orange">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </div>
                    )}
                    {user.role === 'tutor' && (
                      <div className="badge-gradient-purple">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Tutor
                      </div>
                    )}
                    {user.role === 'student' && (
                      <div className="badge-gradient-blue">
                        <User className="w-3 h-3 mr-1" />
                        Student
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">0</p>
                      <p className="text-xs text-gray-500">Courses</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">0</p>
                      <p className="text-xs text-gray-500">Achievements</p>
                    </div>
                  </div>

                  {user.bio && (
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {user.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUser(user)
                    setShowEditModal(true)
                  }}
                  className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors group"
                >
                  <Edit className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                </button>
                
                <button
                  onClick={() => {
                    setSelectedUser(user)
                    setShowDeleteModal(true)
                  }}
                  className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
                >
                  <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Role Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <ModalHeader onClose={() => setShowEditModal(false)}>
          Edit User Role
        </ModalHeader>
        <ModalBody>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Role
                </label>
                <div className="space-y-2">
                  {['student', 'tutor', 'admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(selectedUser.id, role)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedUser.role === role
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {role === 'admin' && <Crown className="w-5 h-5 text-orange-500" />}
                      {role === 'tutor' && <GraduationCap className="w-5 h-5 text-purple-500" />}
                      {role === 'student' && <User className="w-5 h-5 text-blue-500" />}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{role}</p>
                        <p className="text-xs text-gray-500">
                          {role === 'admin' && 'Full platform access and management'}
                          {role === 'tutor' && 'Create and manage courses'}
                          {role === 'student' && 'Enroll and learn from courses'}
                        </p>
                      </div>
                      {selectedUser.role === role && (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader onClose={() => setShowDeleteModal(false)}>
          Delete User
        </ModalHeader>
        <ModalBody>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ This action cannot be undone. All user data, enrollments, and submissions will be permanently deleted.
                </p>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}