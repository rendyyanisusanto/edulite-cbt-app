import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/admin/DashboardView.vue'
import ExamsView from '@/views/admin/ExamsView.vue'
import ExamDetailView from '@/views/admin/ExamDetailView.vue'
import AssignmentsView from '@/views/admin/AssignmentsView.vue'
import MonitoringListView from '@/views/monitoring/MonitoringListView.vue'
import MonitoringDetailView from '@/views/monitoring/MonitoringDetailView.vue'
import SettingsView from '@/views/admin/SettingsView.vue'
import StudentAccountsView from '@/views/admin/StudentAccountsView.vue'

// Teacher Views
import TeacherLayout from '@/layouts/TeacherLayout.vue'
import TeacherDashboardView from '@/views/teacher/DashboardView.vue'
import TeacherExamsView from '@/views/teacher/ExamsView.vue'
import TeacherAssignmentDetailView from '@/views/teacher/AssignmentDetailView.vue'
import TeacherQuestionsView from '@/views/teacher/QuestionsView.vue'
import TeacherPreviewView from '@/views/teacher/PreviewView.vue'
import TeacherResultsListView from '@/views/teacher/ResultsListView.vue'
import TeacherAssignmentResultsView from '@/views/teacher/AssignmentResultsView.vue'
import TeacherStudentResultDetailView from '@/views/teacher/StudentResultDetailView.vue'
import TeacherEssayGradingView from '@/views/teacher/EssayGradingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: (to) => {
        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          if (authStore.user?.roles?.includes('GURU') && !authStore.user?.roles?.includes('ADMIN')) {
            return '/teacher/dashboard'
          }
          return '/admin/dashboard'
        }
        return '/login'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false, title: 'Login - CBT Edulite' }
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, roles: ['ADMIN'] },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: DashboardView,
          meta: { title: 'Dashboard', description: 'Ringkasan sistem CBT' }
        },
        {
          path: 'exams',
          name: 'admin-exams',
          component: ExamsView,
          meta: { title: 'Manajemen Ujian', description: 'Kelola seluruh ujian CBT' }
        },
        {
          path: 'exams/:id',
          name: 'admin-exam-detail',
          component: ExamDetailView,
          meta: { title: 'Detail Ujian', description: 'Informasi lengkap dan penugasan ujian' }
        },
        {
          path: 'assignments',
          name: 'admin-assignments',
          component: AssignmentsView,
          meta: { title: 'Penugasan Guru', description: 'Kelola guru yang bertanggung jawab pada ujian' }
        },
        {
          path: 'schedules',
          name: 'admin-schedules',
          component: () => import('@/views/admin/SchedulesView.vue'),
          meta: { title: 'Jadwal Ujian', description: 'Kelola jadwal dan sesi pelaksanaan CBT' }
        },
        {
          path: 'schedules/:id',
          name: 'admin-schedule-detail',
          component: () => import('@/views/admin/ScheduleDetailView.vue'),
          meta: { title: 'Detail Jadwal Ujian', description: 'Informasi lengkap dan daftar peserta ujian' }
        },
        {
          path: 'monitoring',
          name: 'admin-monitoring',
          component: MonitoringListView,
          meta: { title: 'Monitoring Ujian', description: 'Pantau ujian yang sedang berlangsung' }
        },
        {
          path: 'monitoring/:scheduleId',
          name: 'admin-monitoring-detail',
          component: MonitoringDetailView,
          meta: { title: 'Detail Monitoring', description: 'Pantau aktivitas peserta' }
        },
        {
          path: 'student-accounts',
          name: 'admin-student-accounts',
          component: StudentAccountsView,
          meta: { title: 'Akun CBT Siswa', description: 'Kelola akun ujian siswa' }
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: SettingsView,
          meta: { title: 'Pengaturan', description: 'Konfigurasi sistem' }
        }
      ]
    },
    {
      path: '/teacher',
      component: TeacherLayout,
      meta: { requiresAuth: true, roles: ['GURU'] },
      children: [
        {
          path: '',
          redirect: '/teacher/dashboard'
        },
        {
          path: 'dashboard',
          name: 'teacher-dashboard',
          component: TeacherDashboardView,
          meta: { title: 'Dashboard Guru' }
        },
        {
          path: 'exams',
          name: 'teacher-exams',
          component: TeacherExamsView,
          meta: { title: 'Ujian Saya' }
        },
        {
          path: 'assignments/:id',
          name: 'teacher-assignment-detail',
          component: TeacherAssignmentDetailView,
          meta: { title: 'Detail Penugasan' }
        },
        {
          path: 'assignments/:id/questions',
          name: 'teacher-questions',
          component: TeacherQuestionsView,
          meta: { title: 'Kelola Soal' }
        },
        {
          path: 'assignments/:id/preview',
          name: 'teacher-preview',
          component: TeacherPreviewView,
          meta: { title: 'Preview Ujian' }
        },
        {
          path: 'results',
          name: 'teacher-results-list',
          component: TeacherResultsListView,
          meta: { title: 'Daftar Hasil Ujian' }
        },
        {
          path: 'assignments/:id/results',
          name: 'teacher-assignment-results',
          component: TeacherAssignmentResultsView,
          meta: { title: 'Hasil Ujian Siswa' }
        },
        {
          path: 'assignments/:assignmentId/results/:studentId',
          name: 'teacher-student-result-detail',
          component: TeacherStudentResultDetailView,
          meta: { title: 'Detail Hasil Siswa' }
        },
        {
          path: 'assignments/:assignmentId/grade-essays',
          name: 'teacher-essay-grading',
          component: TeacherEssayGradingView,
          meta: { title: 'Penilaian Essay' }
        },
        {
          path: 'monitoring',
          name: 'teacher-monitoring',
          component: MonitoringListView,
          meta: { title: 'Monitoring Ujian' }
        },
        {
          path: 'monitoring/:scheduleId',
          name: 'teacher-monitoring-detail',
          component: MonitoringDetailView,
          meta: { title: 'Detail Monitoring' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/admin/dashboard'
    }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const userRoles = authStore.user?.roles || []

  // 1. Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // 2. Redirect already-authenticated users away from login page
  if (to.path === '/login' && authStore.isAuthenticated) {
    if (userRoles.includes('ADMIN')) {
      return next('/admin/dashboard')
    }
    if (userRoles.includes('GURU')) {
      return next('/teacher/dashboard')
    }
    return next('/')
  }

  // 3. Role-based route protection
  if (to.meta.roles && to.meta.roles.length > 0) {
    const hasAccess = to.meta.roles.some((role) => userRoles.includes(role))
    if (!hasAccess) {
      // Redirect to the correct dashboard based on user role
      if (userRoles.includes('ADMIN')) return next('/admin/dashboard')
      if (userRoles.includes('GURU')) return next('/teacher/dashboard')
      return next('/login')
    }
  }

  // 4. Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} — CBT Edulite`
  }

  next()
})

export default router
