'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/components/ProfileDropdown'
import type { GamificationStats, AchievementDefinition, UserAchievementWithDetails } from '@/lib/types/database'
import { formatQuizType } from '@/lib/quizBuilder/utils'

// Avatar options with musical themes
const AVATAR_OPTIONS = [
  { id: 'treble-clef', icon: '𝄞', label: 'Treble Clef', color: 'from-violet-500 to-purple-600' },
  { id: 'bass-clef', icon: '𝄢', label: 'Bass Clef', color: 'from-blue-500 to-cyan-600' },
  { id: 'quarter-note', icon: '♩', label: 'Quarter Note', color: 'from-amber-500 to-orange-600' },
  { id: 'eighth-notes', icon: '♫', label: 'Eighth Notes', color: 'from-rose-500 to-pink-600' },
  { id: 'piano', icon: '🎹', label: 'Piano', color: 'from-slate-600 to-slate-800' },
  { id: 'guitar', icon: '🎸', label: 'Guitar', color: 'from-amber-600 to-yellow-500' },
  { id: 'violin', icon: '🎻', label: 'Violin', color: 'from-orange-700 to-amber-600' },
  { id: 'trumpet', icon: '🎺', label: 'Trumpet', color: 'from-yellow-500 to-amber-500' },
  { id: 'microphone', icon: '🎤', label: 'Vocalist', color: 'from-pink-500 to-rose-600' },
  { id: 'headphones', icon: '🎧', label: 'Listener', color: 'from-indigo-500 to-blue-600' },
  { id: 'composer', icon: '🎼', label: 'Composer', color: 'from-emerald-500 to-teal-600' },
  { id: 'conductor', icon: '🪄', label: 'Conductor', color: 'from-purple-600 to-violet-700' },
]

// Motivational quotes for musicians
const MOTIVATION_QUOTES = [
  { quote: "Music is the universal language of mankind.", author: "Henry Wadsworth Longfellow" },
  { quote: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { quote: "Music gives a soul to the universe.", author: "Plato" },
  { quote: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
  { quote: "Music is the strongest form of magic.", author: "Marilyn Manson" },
  { quote: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { quote: "Music expresses that which cannot be said.", author: "Victor Hugo" },
  { quote: "The only truth is music.", author: "Jack Kerouac" },
]

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  avatar?: string | null
  avatarUrl?: string | null
  themeColor?: string | null
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | null
}


interface QuizAttempt {
  id: string
  quizType: string
  score: number
  totalQuestions: number
  createdAt: string
  pdfUrl?: string | null
}

interface PerformanceData {
  category: string
  score: number
  quizzes: number
  color: string
}

interface EnrolledClass {
  id: string
  name: string
  description: string | null
  code: string
  teacherName: string | null
  createdAt: Date
}

interface StudentAssignment {
  id: string
  classId: string
  className: string
  quizId: string | null
  quizType: string | null
  title: string
  description: string | null
  dueDate: Date | null
  maxAttempts: number
  attemptsUsed: number
  attemptsRemaining: number
  createdAt: Date
  completed: boolean
  bestScore: number | null
  lastScore: number | null
  totalQuestions: number | null
}

// Teacher types
interface TeacherClass {
  id: string
  name: string
  description: string | null
  code: string
  studentCount: number
  createdAt: Date
}

interface TeacherQuiz {
  id: string
  title: string
  description: string | null
  questions: string
  createdAt: Date
}

interface TeacherAssignment {
  id: string
  classId: string
  className: string
  quizId: string | null
  quizType: string | null
  title: string
  description: string | null
  dueDate: Date | null
  maxAttempts: number | null
  createdAt: Date
  stats: {
    totalStudents: number
    studentsCompleted: number
    completionRate: number
    averageScore: number | null
  }
}

interface TeacherStats {
  classCount: number
  studentCount: number
  quizCount: number
  assignmentCount: number
}

type TeacherTab = 'classes' | 'quizzes' | 'assignments'

// Admin types
type AdminTab = 'analytics' | 'users' | 'classes'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

interface AdminTeacher {
  id: string
  email: string
  name: string | null
  createdAt: string
  classCount: number
  totalStudents: number
  classes: {
    id: string
    name: string
    studentCount: number
  }[]
}

interface AdminClass {
  id: string
  name: string
  description: string | null
  code: string
  createdAt: string
  teacher: {
    id: string
    email: string
    name: string | null
  } | null
  studentCount: number
  students: {
    id: string
    email: string
    name: string | null
  }[]
}

interface AdminAnalytics {
  anonymous: {
    totalAttempts: number
    uniqueSessions: number
    byQuizType: Record<string, { count: number; totalScore: number; totalQuestions: number }>
    last24Hours: number
    last7Days: number
    last30Days: number
  }
  registered: {
    totalAttempts: number
    last24Hours: number
    last7Days: number
    last30Days: number
  }
  comparison: {
    anonymousPercentage: number
  }
}

interface AdminClassStats {
  totalTeachers: number
  totalClasses: number
  totalEnrollments: number
  totalUniqueStudents: number
}

// Icon map for achievements (same as AchievementCard)
const achievementIconMap: Record<string, React.ReactNode> = {
  rocket: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
  target: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  zap: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  award: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
  trophy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
  crown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l3.5 4L12 6l3.5 5L19 7v14" />,
  flame: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />,
  star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
  'trending-up': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  coins: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  'check-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  sunrise: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />,
  moon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [earned, setEarned] = useState<UserAchievementWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>('treble-clef')
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>('#8b5cf6')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [dailyQuote] = useState(() =>
    MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]
  )
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)
  // Classes and assignments state
  const [classes, setClasses] = useState<EnrolledClass[]>([])
  const [assignments, setAssignments] = useState<StudentAssignment[]>([])
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  // Journey tab state
  const [journeyTab, setJourneyTab] = useState<'quizzes' | 'downloads'>('quizzes')
  // PDF download stats
  const [pdfStats, setPdfStats] = useState<{
    downloadsUsed: number
    downloadsRemaining: number
    dailyLimit: number
    isPremium: boolean
  } | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // Teacher state
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('classes')
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [teacherQuizzes, setTeacherQuizzes] = useState<TeacherQuiz[]>([])
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([])
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassDescription, setNewClassDescription] = useState('')
  const [newAssignment, setNewAssignment] = useState({
    classId: '',
    quizId: '',
    quizType: '',
    title: '',
    description: '',
    dueDate: '',
    maxAttempts: '',
  })

  // Admin state
  const [adminTab, setAdminTab] = useState<AdminTab>('analytics')
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminTeachers, setAdminTeachers] = useState<AdminTeacher[]>([])
  const [adminClasses, setAdminClasses] = useState<AdminClass[]>([])
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics | null>(null)
  const [adminClassStats, setAdminClassStats] = useState<AdminClassStats | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          router.push('/login')
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)
        setSelectedAvatar(userData.user.avatar || 'treble-clef')
        setSelectedThemeColor(userData.user.themeColor || '#8b5cf6')
        if (userData.user.avatarUrl) {
          setAvatarPreview(userData.user.avatarUrl)
        }

        const [statsRes, attemptsRes, achievementsRes, pdfStatsRes] = await Promise.all([
          fetch('/api/gamification/stats'),
          fetch('/api/quiz/attempts'),
          fetch('/api/gamification/achievements'),
          fetch('/api/quiz/pdf/stats'),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.stats)
        }

        if (attemptsRes.ok) {
          const data = await attemptsRes.json()
          setAttempts(data.attempts || [])
        }

        if (achievementsRes.ok) {
          const data = await achievementsRes.json()
          setEarned(data.earned || [])
        }

        if (pdfStatsRes.ok) {
          const data = await pdfStatsRes.json()
          setPdfStats(data)
        }

        // Load classes and assignments for students
        if (userData.user.role === 'student') {
          const [classesRes, assignmentsRes] = await Promise.all([
            fetch('/api/student/enroll'),
            fetch('/api/student/assignments'),
          ])

          if (classesRes.ok) {
            const data = await classesRes.json()
            setClasses(data.classes || [])
          }

          if (assignmentsRes.ok) {
            const data = await assignmentsRes.json()
            setAssignments(data.assignments || [])
          }
        }

        // Load teacher data
        if (userData.user.role === 'teacher') {
          const [classesRes, quizzesRes, assignmentsRes] = await Promise.all([
            fetch('/api/teacher/classes'),
            fetch('/api/teacher/quizzes'),
            fetch('/api/teacher/assignments'),
          ])

          const classesData = classesRes.ok ? await classesRes.json() : { classes: [] }
          const quizzesData = quizzesRes.ok ? await quizzesRes.json() : { quizzes: [] }
          const assignmentsData = assignmentsRes.ok ? await assignmentsRes.json() : { assignments: [] }

          const classList = classesData.classes || []
          const quizList = quizzesData.quizzes || []
          const assignmentList = assignmentsData.assignments || []

          setTeacherClasses(classList)
          setTeacherQuizzes(quizList)
          setTeacherAssignments(assignmentList)

          const totalStudents = classList.reduce((acc: number, c: TeacherClass) => acc + (c.studentCount || 0), 0)
          setTeacherStats({
            classCount: classList.length,
            studentCount: totalStudents,
            quizCount: quizList.length,
            assignmentCount: assignmentList.length,
          })
        }

        // Load admin data
        if (userData.user.role === 'admin') {
          const [usersRes, analyticsRes, classesRes] = await Promise.all([
            fetch('/api/admin/users'),
            fetch('/api/admin/analytics'),
            fetch('/api/admin/classes'),
          ])

          if (usersRes.ok) {
            const data = await usersRes.json()
            setAdminUsers(data.users || [])
          }

          if (analyticsRes.ok) {
            const data = await analyticsRes.json()
            setAdminAnalytics(data)
          }

          if (classesRes.ok) {
            const data = await classesRes.json()
            setAdminClasses(data.classes || [])
            setAdminTeachers(data.teachers || [])
            setAdminClassStats(data.stats || null)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const handleAvatarSave = async () => {
    setSavingAvatar(true)
    setAvatarError(null)
    try {
      // If there's a custom avatar file to upload
      if (avatarFile) {
        setUploadingAvatar(true)
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        const uploadRes = await fetch('/api/profile/avatar-upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json()
          setAvatarError(data.error || 'Failed to upload avatar')
          setUploadingAvatar(false)
          setSavingAvatar(false)
          return
        }

        const uploadData = await uploadRes.json()
        setUploadingAvatar(false)

        // Save theme color
        await fetch('/api/profile/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeColor: selectedThemeColor }),
        })

        setUser(prev => prev ? {
          ...prev,
          avatar: null,
          avatarUrl: uploadData.avatarUrl,
          themeColor: selectedThemeColor
        } : null)
        setAvatarFile(null)
        setAvatarPreview(uploadData.avatarUrl) // Update preview to match new URL
        setShowAvatarPicker(false)
      } else if (avatarPreview && user?.avatarUrl) {
        // User has existing custom avatar displayed (avatarPreview shows it), just update theme color
        // This means user didn't select a predefined avatar (which would clear avatarPreview)
        await fetch('/api/profile/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeColor: selectedThemeColor }),
        })

        setUser(prev => prev ? {
          ...prev,
          themeColor: selectedThemeColor
        } : null)
        setShowAvatarPicker(false)
      } else {
        // Save predefined avatar
        const res = await fetch('/api/profile/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: selectedAvatar }),
        })
        if (res.ok) {
          // Clear custom avatar if using predefined
          if (user?.avatarUrl) {
            await fetch('/api/profile/avatar-upload', { method: 'DELETE' })
          }
          setUser(prev => prev ? { ...prev, avatar: selectedAvatar, avatarUrl: null } : null)
          setAvatarPreview(null)
          setShowAvatarPicker(false)
        }
      }
    } catch (error) {
      console.error('Failed to save avatar:', error)
      setAvatarError('Failed to save avatar. Please try again.')
    } finally {
      setSavingAvatar(false)
      setUploadingAvatar(false)
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setAvatarError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('File too large. Maximum size is 2MB.')
      return
    }

    setAvatarError(null)
    setAvatarFile(file)
    setSelectedAvatar('') // Clear predefined selection when custom is chosen

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleClearCustomAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(user?.avatarUrl || null)
    if (!user?.avatarUrl) {
      setSelectedAvatar('treble-clef')
    }
  }

  const handleNameSave = async () => {
    if (!editedName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/profile/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() }),
      })
      if (res.ok) {
        setUser(prev => prev ? { ...prev, name: editedName.trim() } : null)
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('Failed to save name:', error)
    } finally {
      setSavingName(false)
    }
  }

  const startEditingName = () => {
    setEditedName(user?.name || '')
    setIsEditingName(true)
  }

  const handleEnroll = async () => {
    if (!classCode.trim()) return
    setEnrolling(true)
    setEnrollError('')
    try {
      const res = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: classCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEnrollError(data.error || 'Failed to enroll')
        return
      }
      // Refresh classes list
      const classesRes = await fetch('/api/student/enroll')
      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }
      setShowEnrollModal(false)
      setClassCode('')
    } catch (error) {
      setEnrollError('Failed to enroll. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handlePdfDownload = async (attemptId: string) => {
    setDownloadingPdf(attemptId)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/quiz/pdf/${attemptId}`)
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setDownloadError(data.upgradeMessage || 'Daily download limit reached')
        } else {
          setDownloadError(data.error || 'Failed to download PDF')
        }
        return
      }

      // Update stats
      setPdfStats({
        downloadsUsed: data.downloadsUsed,
        downloadsRemaining: data.dailyLimit - data.downloadsUsed,
        dailyLimit: data.dailyLimit,
        isPremium: data.isPremium,
      })

      // Open the PDF in a new tab
      window.open(data.url, '_blank')
    } catch (error) {
      setDownloadError('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPdf(null)
    }
  }

  // Teacher handlers
  const refreshTeacherData = async () => {
    try {
      const [classesRes, quizzesRes, assignmentsRes] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/quizzes'),
        fetch('/api/teacher/assignments'),
      ])

      const classesData = classesRes.ok ? await classesRes.json() : { classes: [] }
      const quizzesData = quizzesRes.ok ? await quizzesRes.json() : { quizzes: [] }
      const assignmentsData = assignmentsRes.ok ? await assignmentsRes.json() : { assignments: [] }

      const classList = classesData.classes || []
      const quizList = quizzesData.quizzes || []
      const assignmentList = assignmentsData.assignments || []

      setTeacherClasses(classList)
      setTeacherQuizzes(quizList)
      setTeacherAssignments(assignmentList)

      const totalStudents = classList.reduce((acc: number, c: TeacherClass) => acc + (c.studentCount || 0), 0)
      setTeacherStats({
        classCount: classList.length,
        studentCount: totalStudents,
        quizCount: quizList.length,
        assignmentCount: assignmentList.length,
      })
    } catch (error) {
      console.error('Failed to refresh teacher data:', error)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, description: newClassDescription }),
      })
      if (res.ok) {
        setShowCreateClassModal(false)
        setNewClassName('')
        setNewClassDescription('')
        refreshTeacherData()
      }
    } catch (error) {
      console.error('Failed to create class:', error)
    }
  }

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this class?')) return
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })
      if (res.ok) refreshTeacherData()
    } catch (error) {
      console.error('Failed to delete class:', error)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return
    try {
      const res = await fetch('/api/teacher/quizzes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      })
      if (res.ok) refreshTeacherData()
    } catch (error) {
      console.error('Failed to delete quiz:', error)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssignment.classId || !newAssignment.title) {
      alert('Please fill in all required fields')
      return
    }
    if (!newAssignment.quizId && !newAssignment.quizType) {
      alert('Please select either a custom quiz or a quiz type')
      return
    }
    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: newAssignment.classId,
          quizId: newAssignment.quizId || null,
          quizType: newAssignment.quizType || null,
          title: newAssignment.title,
          description: newAssignment.description,
          dueDate: newAssignment.dueDate || null,
          maxAttempts: newAssignment.maxAttempts || null,
        }),
      })
      if (res.ok) {
        setShowCreateAssignmentModal(false)
        setNewAssignment({ classId: '', quizId: '', quizType: '', title: '', description: '', dueDate: '', maxAttempts: '' })
        refreshTeacherData()
      }
    } catch (error) {
      console.error('Failed to create assignment:', error)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      if (res.ok) refreshTeacherData()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  // Calculate performance by category
  const getPerformanceData = useCallback((): PerformanceData[] => {
    const categories: Record<string, { total: number; count: number }> = {}
    const colors = [
      'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
      'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'
    ]

    attempts.forEach(attempt => {
      const category = attempt.quizType
      if (!categories[category]) {
        categories[category] = { total: 0, count: 0 }
      }
      categories[category].total += (attempt.score / attempt.totalQuestions) * 100
      categories[category].count++
    })

    return Object.entries(categories).map(([category, data], index) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
      score: Math.round(data.total / data.count),
      quizzes: data.count,
      color: colors[index % colors.length],
    }))
  }, [attempts])

  // Get current avatar data
  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === (user?.avatar || selectedAvatar)) || AVATAR_OPTIONS[0]

  // Check if user has custom avatar
  const hasCustomAvatar = !!user?.avatarUrl
  const themeColor = user?.themeColor || '#8b5cf6'

  // Helper to darken a hex color
  const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  // Gradient style for custom avatar
  const customGradientStyle = hasCustomAvatar
    ? { background: `linear-gradient(to right, ${themeColor}, ${adjustColor(themeColor, -40)})` }
    : undefined

  // Calculate practice streak status
  const getPracticeStatus = () => {
    if (!stats) return { message: 'Complete your first quiz!', urgency: 'neutral' }

    const today = new Date().toISOString().split('T')[0]
    const isActiveToday = stats.last_activity_date === today

    if (isActiveToday) {
      return { message: 'Great work today! Keep the momentum going.', urgency: 'success' }
    } else if (stats.current_streak > 0) {
      return { message: 'Practice today to maintain your streak!', urgency: 'warning' }
    } else {
      return { message: 'Start a new streak today!', urgency: 'neutral' }
    }
  }

  const practiceStatus = getPracticeStatus()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-5xl mb-4">𝄞</div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const performanceData = getPerformanceData()
  const totalQuizzes = attempts.length
  const averageScore = totalQuizzes > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.score / a.totalQuestions) * 100, 0) / totalQuizzes)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-violet-50/50 flex flex-col">
      {/* Decorative staff lines background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-gray-900"
            style={{ top: `${20 + i * 3}%` }}
          />
        ))}
        <div className="absolute -right-20 top-1/4 text-[400px] text-gray-900 font-serif rotate-12">𝄞</div>
        <div className="absolute -left-16 bottom-1/4 text-[300px] text-gray-900 font-serif -rotate-12">𝄢</div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/quiznotes logo.jpg"
                  alt="QuizNotes Logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-gray-900">QuizNotes</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <span className="text-brand font-semibold text-sm">Dashboard</span>
                {user.role === 'admin' ? (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                    Admin Panel
                  </Link>
                ) : (
                  <>
                    <Link href="/quiz" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                      Quizzes
                    </Link>
                    {user.role === 'student' && (
                      <Link href="/student-premium" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors flex items-center gap-1">
                        Student Premium
                        {user.subscriptionStatus !== 'active' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">New</span>
                        )}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Profile Dropdown - Right Corner */}
            <ProfileDropdown user={user} stats={stats} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full relative">
        {/* Profile Header Card */}
        <div className="relative mb-8">
          {/* Decorative music notes */}
          <div className="absolute -top-4 -right-4 text-6xl text-violet-200/50 font-serif">♪</div>
          <div className="absolute -bottom-2 -left-2 text-4xl text-amber-200/50 font-serif">♫</div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Gradient header strip */}
            <div
              className={`h-52 ${hasCustomAvatar ? '' : `bg-gradient-to-r ${currentAvatar.color}`} relative overflow-hidden`}
              style={customGradientStyle}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-10 text-6xl text-white/30">♩</div>
                <div className="absolute bottom-2 right-20 text-5xl text-white/20">♪</div>
                <div className="absolute top-4 right-40 text-4xl text-white/25">♫</div>
              </div>
            </div>

            <div className="px-8 pb-8 -mt-36 relative">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                {/* Avatar */}
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="group relative"
                >
                  <div
                    className={`w-32 h-32 rounded-2xl ${hasCustomAvatar ? '' : `bg-gradient-to-br ${currentAvatar.color}`} flex items-center justify-center text-6xl text-white shadow-2xl border-4 border-white transition-transform group-hover:scale-105 overflow-hidden`}
                    style={hasCustomAvatar ? { background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -40)})` } : undefined}
                  >
                    {hasCustomAvatar ? (
                      <Image
                        key={user.avatarUrl}
                        src={user.avatarUrl!}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      currentAvatar.icon
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Change</span>
                  </div>
                </button>

                {/* User Info */}
                <div className="flex-1 pt-4 md:pt-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-2xl font-bold text-gray-900 bg-white border-2 border-white/50 rounded-lg px-3 py-1 focus:outline-none focus:border-white w-full max-w-xs"
                        placeholder="Enter your name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleNameSave()
                          if (e.key === 'Escape') setIsEditingName(false)
                        }}
                      />
                      <button
                        onClick={handleNameSave}
                        disabled={savingName}
                        className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1 group">
                      <h1 className="text-3xl font-bold text-white drop-shadow-sm">
                        {user.name || 'Music Learner'}
                      </h1>
                      <button
                        onClick={startEditingName}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit name"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-white font-semibold mb-3 drop-shadow-sm">{user.email}</p>

                  <div className="flex flex-wrap gap-3">
                    {user.role === 'admin' ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/30 to-violet-500/30 backdrop-blur-sm rounded-full border border-purple-300/50">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-white font-bold">Admin</span>
                      </div>
                    ) : (
                      <>
                        {/* Subscription Status */}
                        {user.subscriptionStatus === 'active' ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400/30 to-yellow-400/30 backdrop-blur-sm rounded-full border border-amber-300/50">
                            <span className="text-lg">👑</span>
                            <span className="text-white font-bold">Premium</span>
                          </div>
                        ) : (
                          <Link
                            href="/pricing"
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-colors"
                          >
                            <span className="text-white font-medium">Free Plan</span>
                            <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full text-white">Upgrade</span>
                          </Link>
                        )}
                        {stats && (
                          <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                              <span className="text-white font-bold">Level {stats.current_level}</span>
                              <span className="text-white/60">•</span>
                              <span className="text-white/90">{stats.level_info?.name || 'Beginner'}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                              <span className="text-white font-bold">{stats.total_xp.toLocaleString()} XP</span>
                            </div>
                            {stats.current_streak > 0 && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                <span className="text-lg">🔥</span>
                                <span className="text-white font-bold">{stats.current_streak} day streak</span>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-xl transition-colors flex items-center gap-2 border border-white/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Dashboard */}
        {user.role === 'admin' && (
          <>
            {/* Admin Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{adminUsers.length}</p>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{adminClassStats?.totalTeachers || 0}</p>
                    <p className="text-sm text-gray-500">Teachers</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl">🏫</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{adminClassStats?.totalClasses || 0}</p>
                    <p className="text-sm text-gray-500">Classes</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{(adminAnalytics?.anonymous.totalAttempts || 0) + (adminAnalytics?.registered.totalAttempts || 0)}</p>
                    <p className="text-sm text-gray-500">Total Quizzes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setAdminTab('analytics')}
                    className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${
                      adminTab === 'analytics'
                        ? 'text-brand border-b-2 border-brand bg-brand/5'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📊 Quiz Analytics
                  </button>
                  <button
                    onClick={() => setAdminTab('users')}
                    className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${
                      adminTab === 'users'
                        ? 'text-brand border-b-2 border-brand bg-brand/5'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    👥 Users
                  </button>
                  <button
                    onClick={() => setAdminTab('classes')}
                    className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${
                      adminTab === 'classes'
                        ? 'text-brand border-b-2 border-brand bg-brand/5'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🏫 Classes & Teachers
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Analytics Tab */}
                {adminTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Anonymous vs Registered */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-4">Quiz Attempts Breakdown</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Anonymous</span>
                            <span className="font-bold text-brand">{adminAnalytics?.anonymous.totalAttempts || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-brand h-3 rounded-full transition-all"
                              style={{ width: `${adminAnalytics?.comparison.anonymousPercentage || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Registered</span>
                            <span className="font-bold text-green-600">{adminAnalytics?.registered.totalAttempts || 0}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {adminAnalytics?.anonymous.uniqueSessions || 0} unique anonymous sessions
                          </p>
                        </div>
                      </div>

                      {/* Time-based Stats */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-gray-700">Last 24 Hours</span>
                            <span className="font-bold text-brand">
                              {(adminAnalytics?.anonymous.last24Hours || 0) + (adminAnalytics?.registered.last24Hours || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-gray-700">Last 7 Days</span>
                            <span className="font-bold text-brand">
                              {(adminAnalytics?.anonymous.last7Days || 0) + (adminAnalytics?.registered.last7Days || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-gray-700">Last 30 Days</span>
                            <span className="font-bold text-brand">
                              {(adminAnalytics?.anonymous.last30Days || 0) + (adminAnalytics?.registered.last30Days || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quiz Type Breakdown */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 mb-4">Anonymous Quizzes by Type</h4>
                      {adminAnalytics?.anonymous.byQuizType && Object.keys(adminAnalytics.anonymous.byQuizType).length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-4">
                          {Object.entries(adminAnalytics.anonymous.byQuizType).map(([type, stats]) => {
                            const avgScore = stats.totalQuestions > 0
                              ? Math.round((stats.totalScore / stats.totalQuestions) * 100)
                              : 0
                            return (
                              <div key={type} className="bg-white rounded-lg p-4">
                                <p className="font-medium text-gray-900 capitalize mb-2">{type.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-2xl font-bold text-brand">{stats.count}</p>
                                <p className="text-sm text-gray-500">Avg: {avgScore}%</p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No anonymous quiz attempts yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {adminTab === 'users' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-brand">{adminUsers.length}</p>
                        <p className="text-sm text-gray-500">Total</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{adminUsers.filter(u => u.role === 'teacher').length}</p>
                        <p className="text-sm text-gray-500">Teachers</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{adminUsers.filter(u => u.role === 'student').length}</p>
                        <p className="text-sm text-gray-500">Students</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Role</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.slice(0, 10).map((u) => (
                            <tr key={u.id} className="border-t hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 text-sm">{u.email}</td>
                              <td className="py-3 px-4 text-gray-900 text-sm">{u.name || '-'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  u.role === 'teacher' ? 'bg-green-100 text-green-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-500 text-sm">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {adminUsers.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        Showing 10 of {adminUsers.length} users. <Link href="/admin" className="text-brand hover:underline">View all in Admin Panel</Link>
                      </p>
                    )}
                  </div>
                )}

                {/* Classes & Teachers Tab */}
                {adminTab === 'classes' && (
                  <div className="space-y-6">
                    {/* Teachers Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Teachers ({adminTeachers.length})</h4>
                      {adminTeachers.length > 0 ? (
                        <div className="space-y-3">
                          {adminTeachers.map((teacher) => (
                            <div key={teacher.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">{teacher.name || teacher.email}</p>
                                  <p className="text-sm text-gray-500">{teacher.email}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">{teacher.classCount} classes</p>
                                  <p className="text-sm text-gray-500">{teacher.totalStudents} students</p>
                                </div>
                              </div>
                              {teacher.classes.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {teacher.classes.map((c) => (
                                    <span key={c.id} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600">
                                      {c.name} ({c.studentCount})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No teachers registered yet</p>
                      )}
                    </div>

                    {/* Classes Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">All Classes ({adminClasses.length})</h4>
                      {adminClasses.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Class Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Teacher</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Students</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Code</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminClasses.slice(0, 10).map((c) => (
                                <tr key={c.id} className="border-t hover:bg-gray-50">
                                  <td className="py-3 px-4 text-gray-900 text-sm font-medium">{c.name}</td>
                                  <td className="py-3 px-4 text-gray-600 text-sm">{c.teacher?.name || c.teacher?.email || '-'}</td>
                                  <td className="py-3 px-4 text-gray-600 text-sm">{c.studentCount}</td>
                                  <td className="py-3 px-4">
                                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">{c.code}</code>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No classes created yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </>
        )}

        {/* Teacher Dashboard */}
        {user.role === 'teacher' && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl">🏫</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teacherStats?.classCount || 0}</p>
                    <p className="text-sm text-gray-500">Classes</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teacherStats?.studentCount || 0}</p>
                    <p className="text-sm text-gray-500">Students</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teacherStats?.quizCount || 0}</p>
                    <p className="text-sm text-gray-500">Quizzes</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{teacherStats?.assignmentCount || 0}</p>
                    <p className="text-sm text-gray-500">Assignments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {[
                    { id: 'classes' as TeacherTab, label: 'Classes', icon: '🏫' },
                    { id: 'quizzes' as TeacherTab, label: 'Quizzes', icon: '📝' },
                    { id: 'assignments' as TeacherTab, label: 'Assignments', icon: '📋' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTeacherTab(tab.id)}
                      className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                        teacherTab === tab.id
                          ? 'text-brand border-b-2 border-brand bg-brand/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Classes Tab */}
                {teacherTab === 'classes' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
                      <button
                        onClick={() => setShowCreateClassModal(true)}
                        className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Class
                      </button>
                    </div>

                    {teacherClasses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">🏫</div>
                        <p className="text-gray-500 mb-4">No classes yet</p>
                        <button
                          onClick={() => setShowCreateClassModal(true)}
                          className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                        >
                          Create Your First Class
                        </button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teacherClasses.map((cls) => (
                          <Link
                            key={cls.id}
                            href={`/teacher/classes/${cls.id}`}
                            className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors block"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                              <button
                                onClick={(e) => handleDeleteClass(e, cls.id)}
                                className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                              >
                                Delete
                              </button>
                            </div>
                            {cls.description && <p className="text-gray-600 text-sm mb-3">{cls.description}</p>}
                            <div className="bg-brand/10 rounded-lg p-2 mb-3">
                              <p className="text-xs text-gray-600">Class Code</p>
                              <p className="text-lg font-bold text-brand font-mono">{cls.code}</p>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{cls.studentCount} students</span>
                              <span className="text-brand font-medium">View →</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quizzes Tab */}
                {teacherTab === 'quizzes' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">My Quizzes</h2>
                      <Link
                        href="/teacher/quizzes/create"
                        className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Quiz
                      </Link>
                    </div>

                    {teacherQuizzes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="text-gray-500 mb-4">No quizzes yet</p>
                        <Link
                          href="/teacher/quizzes/create"
                          className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                        >
                          Create Your First Quiz
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teacherQuizzes.map((quiz) => {
                          const questions = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions
                          const questionCount = Array.isArray(questions) ? questions.length : 0
                          return (
                            <div key={quiz.id} className="bg-gray-50 rounded-xl p-5">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                                <button
                                  onClick={() => handleDeleteQuiz(quiz.id)}
                                  className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                                >
                                  Delete
                                </button>
                              </div>
                              {quiz.description && <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>}
                              <div className="bg-brand/10 rounded-lg p-2 mb-3">
                                <p className="text-xs text-gray-600">Questions</p>
                                <p className="text-lg font-bold text-brand">{questionCount}</p>
                              </div>
                              <p className="text-xs text-gray-500">Created {new Date(quiz.createdAt).toLocaleDateString()}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Assignments Tab */}
                {teacherTab === 'assignments' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
                      <button
                        onClick={() => setShowCreateAssignmentModal(true)}
                        className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Assignment
                      </button>
                    </div>

                    {teacherAssignments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-500 mb-4">No assignments yet</p>
                        <button
                          onClick={() => setShowCreateAssignmentModal(true)}
                          className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                        >
                          Create Your First Assignment
                        </button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teacherAssignments.map((assignment) => (
                          <div key={assignment.id} className="bg-gray-50 rounded-xl p-5">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                              >
                                Delete
                              </button>
                            </div>
                            {assignment.description && <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-brand/10 rounded-lg p-2 text-center">
                                <p className="text-sm font-bold text-brand">{assignment.stats.studentsCompleted}/{assignment.stats.totalStudents}</p>
                                <p className="text-xs text-brand">Done</p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-2 text-center">
                                <p className="text-sm font-bold text-green-700">{assignment.stats.completionRate}%</p>
                                <p className="text-xs text-green-600">Rate</p>
                              </div>
                              <div className="bg-brand/10 rounded-lg p-2 text-center">
                                <p className="text-sm font-bold text-brand">{assignment.stats.averageScore !== null ? `${assignment.stats.averageScore}%` : '-'}</p>
                                <p className="text-xs text-brand">Avg</p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1 mb-3">
                              <p><span className="text-gray-400">Class:</span> {assignment.className}</p>
                              {assignment.dueDate && <p><span className="text-gray-400">Due:</span> {new Date(assignment.dueDate).toLocaleDateString()}</p>}
                            </div>
                            <Link
                              href={`/teacher/assignments/${assignment.id}/results`}
                              className="text-brand hover:text-brand-dark text-sm font-medium"
                            >
                              View Results →
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Student Dashboard */}
        {user.role === 'student' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Progress */}
          <div className="lg:col-span-2 space-y-8">
            {/* XP Progress Card */}
            {stats && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Level Progress
                </h2>

                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{stats.current_level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">{stats.level_info?.name || 'Beginner'}</span>
                      <span className="text-gray-500">{stats.xp_progress}%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${stats.xp_progress}%` }}
                      />
                    </div>
                    {stats.next_level_xp && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-semibold text-violet-600">{(stats.next_level_xp - stats.total_xp).toLocaleString()} XP</span> to Level {stats.current_level + 1}
                      </p>
                    )}
                  </div>
                </div>

                {/* XP Breakdown */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total_xp.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total XP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.quizzes_today}</p>
                    <p className="text-sm text-gray-500">Quizzes Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.daily_goal}</p>
                    <p className="text-sm text-gray-500">Daily Goal</p>
                  </div>
                </div>
              </div>
            )}

            {/* Performance by Category */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Performance by Topic
              </h2>

              {performanceData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎵</div>
                  <p className="text-gray-500">Complete quizzes to see your performance breakdown</p>
                  <Link
                    href="/quiz"
                    className="inline-block mt-4 px-6 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors"
                  >
                    Start Learning
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {performanceData.map((data) => (
                    <div key={data.category}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">{data.category}</span>
                        <span className="text-gray-500">
                          {data.quizzes} quiz{data.quizzes !== 1 ? 'zes' : ''} • <span className="font-semibold text-gray-900">{data.score}%</span>
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${data.color} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Stats */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Your Journey
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
                  <p className="text-3xl font-bold text-blue-600">{totalQuizzes}</p>
                  <p className="text-sm text-gray-600 mt-1">Quizzes Completed</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-3xl font-bold text-green-600">{averageScore}%</p>
                  <p className="text-sm text-gray-600 mt-1">Average Score</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center border border-amber-100">
                  <p className="text-3xl font-bold text-amber-600">{stats?.total_perfect_scores || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Perfect Scores</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 text-center border border-purple-100">
                  <p className="text-3xl font-bold text-purple-600">{stats?.longest_streak || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Best Streak</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                  onClick={() => setJourneyTab('quizzes')}
                  className={`px-4 py-2 font-semibold text-sm transition-colors ${
                    journeyTab === 'quizzes'
                      ? 'text-brand border-b-2 border-brand -mb-px'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Recent Quizzes
                </button>
                <button
                  onClick={() => setJourneyTab('downloads')}
                  className={`px-4 py-2 font-semibold text-sm transition-colors ${
                    journeyTab === 'downloads'
                      ? 'text-brand border-b-2 border-brand -mb-px'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  PDF Downloads
                </button>
              </div>

              {/* Recent Quizzes Tab */}
              {journeyTab === 'quizzes' && (
                <div className="space-y-3">
                  {attempts.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No quizzes completed yet</p>
                      <Link href="/quiz" className="text-brand font-semibold hover:underline mt-2 inline-block">
                        Take your first quiz
                      </Link>
                    </div>
                  ) : (
                    (() => {
                      // Deduplicate: show only the most recent attempt per quiz type
                      const seenTypes = new Set<string>()
                      const uniqueAttempts = attempts.filter((attempt) => {
                        if (seenTypes.has(attempt.quizType)) return false
                        seenTypes.add(attempt.quizType)
                        return true
                      })
                      return uniqueAttempts.slice(0, 5).map((attempt) => {
                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
                        const quizName = formatQuizType(attempt.quizType)
                        return (
                          <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                                percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}>
                                {percentage}%
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{quizName}</p>
                                <p className="text-xs text-gray-500">
                                  {attempt.score}/{attempt.totalQuestions} correct • {new Date(attempt.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {attempt.pdfUrl && (
                              <a
                                href={attempt.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        )
                      })
                    })()
                  )}
                </div>
              )}

              {/* PDF Downloads Tab */}
              {journeyTab === 'downloads' && (
                <div className="space-y-3">
                  {/* Download Stats */}
                  {pdfStats && (
                    <div className={`p-3 rounded-xl border ${pdfStats.downloadsRemaining === 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{pdfStats.isPremium ? '👑' : '📄'}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {pdfStats.downloadsRemaining} of {pdfStats.dailyLimit} downloads remaining today
                            </p>
                            <p className="text-xs text-gray-500">
                              {pdfStats.isPremium ? 'Premium Plan' : 'Free Plan'} • Resets daily
                            </p>
                          </div>
                        </div>
                        {!pdfStats.isPremium && (
                          <Link
                            href="/pricing"
                            className="text-xs font-semibold text-brand hover:text-brand-dark"
                          >
                            Upgrade
                          </Link>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pdfStats.downloadsRemaining === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${(pdfStats.downloadsRemaining / pdfStats.dailyLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Download Error */}
                  {downloadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-700">{downloadError}</p>
                        <button
                          onClick={() => setDownloadError(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {attempts.filter(a => a.pdfUrl).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No PDF reports available</p>
                      <p className="text-sm text-gray-400 mt-1">Complete quizzes to generate downloadable reports</p>
                    </div>
                  ) : (
                    attempts.filter(a => a.pdfUrl).slice(0, 10).map((attempt) => {
                      const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
                      const quizName = formatQuizType(attempt.quizType)
                      const isDownloading = downloadingPdf === attempt.id
                      const isDisabled = isDownloading || (pdfStats?.downloadsRemaining === 0)
                      return (
                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{quizName}</p>
                              <p className="text-xs text-gray-500">
                                Score: {percentage}% • {new Date(attempt.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePdfDownload(attempt.id)}
                            disabled={isDisabled}
                            className="px-3 py-1.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDownloading ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Classes, Assignments & Achievements */}
          <div className="space-y-8">
            {/* Motivation & Quick Actions Card */}
            <div className="rounded-2xl shadow-lg overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #439FDD, #2d7ab8)' }}>
              <div className="absolute right-0 top-0 text-white/10 text-[120px] font-serif leading-none -mt-6 -mr-4">𝄞</div>
              <div className="p-6 relative">
                <p className="text-lg font-light italic text-white mb-1">"{dailyQuote.quote}"</p>
                <p className="text-sky-100 text-sm font-medium mb-4">— {dailyQuote.author}</p>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-4 ${
                  practiceStatus.urgency === 'success' ? 'bg-emerald-500/30' :
                  practiceStatus.urgency === 'warning' ? 'bg-amber-500/30' :
                  'bg-white/20'
                } text-white`}>
                  <span>
                    {practiceStatus.urgency === 'success' ? '✓' :
                     practiceStatus.urgency === 'warning' ? '⚡' : '💪'}
                  </span>
                  <span className="font-medium">{practiceStatus.message}</span>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/quiz"
                    className="block w-full px-4 py-3 bg-white text-brand font-semibold rounded-xl text-center hover:bg-gray-100 transition-colors"
                  >
                    Start a Quiz
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="block w-full px-4 py-2.5 bg-white/20 text-white font-semibold rounded-xl text-center hover:bg-white/30 transition-colors"
                  >
                    View Leaderboard
                  </Link>
                </div>
              </div>
            </div>

            {/* My Classes Section */}
            {user.role === 'student' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">🏫</span>
                    My Classes
                  </h2>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="px-3 py-1.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors text-sm"
                  >
                    Join
                  </button>
                </div>

                {classes.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">No classes yet</p>
                    <button
                      onClick={() => setShowEnrollModal(true)}
                      className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors text-sm"
                    >
                      Join a Class
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classes.slice(0, 3).map((cls) => (
                      <div key={cls.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <h3 className="font-semibold text-gray-900 text-sm">{cls.name}</h3>
                        {cls.teacherName && (
                          <p className="text-xs text-gray-500">{cls.teacherName}</p>
                        )}
                      </div>
                    ))}
                    {classes.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">+{classes.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assignments Section */}
            {user.role === 'student' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Assignments
                </h2>

                {assignments.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Assignments that can still be attempted (not started or has attempts remaining) */}
                    {assignments.filter(a => a.attemptsRemaining > 0).slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className={`rounded-lg p-3 border ${assignment.attemptsUsed > 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{assignment.title}</h3>
                            <p className="text-xs text-gray-500">{assignment.className}</p>
                            {assignment.dueDate && (
                              <p className="text-xs text-amber-600 mt-1">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                            {assignment.maxAttempts > 1 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Attempts: {assignment.attemptsUsed}/{assignment.maxAttempts}
                                {assignment.bestScore !== null && ` • Best: ${assignment.bestScore}/${assignment.totalQuestions}`}
                              </p>
                            )}
                          </div>
                          <Link
                            href={assignment.quizId ? `/quiz/${assignment.quizId}?assignmentId=${assignment.id}` : '/quiz'}
                            className="px-3 py-1.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors text-xs flex-shrink-0"
                          >
                            {assignment.attemptsUsed > 0 ? 'Retry' : 'Start'}
                          </Link>
                        </div>
                      </div>
                    ))}

                    {/* Fully completed assignments (no attempts remaining) */}
                    {assignments.filter(a => a.completed).length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Completed</p>
                        {assignments.filter(a => a.completed).slice(0, 2).map((assignment) => (
                          <div key={assignment.id} className="bg-green-50 rounded-lg p-3 border border-green-200 mb-2">
                            <div className="flex justify-between items-center">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">{assignment.title}</h3>
                                {assignment.maxAttempts > 1 && (
                                  <p className="text-xs text-gray-500">
                                    Best: {assignment.bestScore}/{assignment.totalQuestions} ({assignment.attemptsUsed} attempts)
                                  </p>
                                )}
                              </div>
                              <p className="font-bold text-green-600 text-sm">
                                {assignment.bestScore}/{assignment.totalQuestions}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recent Achievements */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Achievements
                </h2>
                <Link
                  href="/achievements"
                  className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  View All
                </Link>
              </div>

              {earned.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎖️</div>
                  <p className="text-gray-500 text-sm">Complete quizzes to earn achievements!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earned.slice(0, 4).map((ua) => {
                    const iconPath = achievementIconMap[ua.achievement.icon] || achievementIconMap.star
                    return (
                      <div
                        key={ua.id}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {iconPath}
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{ua.achievement.name}</p>
                          <p className="text-xs text-gray-500">+{ua.achievement.xp_reward} XP</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{earned.length}</span> achievements earned
                </p>
              </div>
            </div>

          </div>
        </div>
        )}
      </main>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  id="className"
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="e.g., Music Theory 101"
                />
              </div>
              <div>
                <label htmlFor="classDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  id="classDescription"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="Brief description of your class"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowCreateClassModal(false); setNewClassName(''); setNewClassDescription(''); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors">Create Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="e.g., Week 3 Quiz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={newAssignment.classId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, classId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                >
                  <option value="">Select a class</option>
                  {teacherClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type</label>
                <select
                  value={newAssignment.quizType}
                  onChange={(e) => setNewAssignment({ ...newAssignment, quizType: e.target.value, quizId: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                >
                  <option value="">Select a quiz type</option>
                  <option value="intervals">Intervals</option>
                  <option value="chords">Chords</option>
                  <option value="scales">Scales</option>
                  <option value="noteIdentification">Note Identification</option>
                  <option value="ear-training">Ear Training</option>
                  <option value="mixed">Mixed Quiz</option>
                </select>
              </div>
              <div className="text-center text-sm text-gray-500">OR</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Quiz</label>
                <select
                  value={newAssignment.quizId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, quizId: e.target.value, quizType: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                >
                  <option value="">Select a custom quiz</option>
                  {teacherQuizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attempt Limit</label>
                <select
                  value={newAssignment.maxAttempts}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxAttempts: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                >
                  <option value="">Unlimited</option>
                  <option value="1">1 attempt</option>
                  <option value="2">2 attempts</option>
                  <option value="3">3 attempts</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowCreateAssignmentModal(false); setNewAssignment({ classId: '', quizId: '', quizType: '', title: '', description: '', dueDate: '', maxAttempts: '' }); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Customize Your Profile</h3>
              <button
                onClick={() => {
                  setShowAvatarPicker(false)
                  setAvatarError(null)
                  setAvatarFile(null)
                  setAvatarPreview(user?.avatarUrl || null)
                }}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Custom Avatar Upload Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Upload Your Photo</h4>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300"
                  style={avatarPreview ? { background: `linear-gradient(135deg, ${selectedThemeColor}, ${selectedThemeColor}dd)` } : undefined}
                >
                  {avatarPreview ? (
                    <Image
                      key={avatarPreview}
                      src={avatarPreview}
                      alt="Avatar preview"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose Photo
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WebP. Max 2MB.</p>
                  {avatarFile && (
                    <button
                      onClick={handleClearCustomAvatar}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {avatarError && (
                <p className="text-sm text-red-600 mt-2">{avatarError}</p>
              )}
            </div>

            {/* Theme Color Picker (only shown when custom avatar is selected) */}
            {(avatarPreview || avatarFile || user?.avatarUrl) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Card Theme Color</h4>
                <div className="space-y-3">
                  {/* Gradient Color Bar */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={(() => {
                        // Convert hex to hue
                        const hex = selectedThemeColor.replace('#', '')
                        const r = parseInt(hex.substring(0, 2), 16) / 255
                        const g = parseInt(hex.substring(2, 4), 16) / 255
                        const b = parseInt(hex.substring(4, 6), 16) / 255
                        const max = Math.max(r, g, b)
                        const min = Math.min(r, g, b)
                        let h = 0
                        if (max !== min) {
                          const d = max - min
                          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
                          else if (max === g) h = ((b - r) / d + 2) * 60
                          else h = ((r - g) / d + 4) * 60
                        }
                        return Math.round(h)
                      })()}
                      onChange={(e) => {
                        // Convert hue to hex (using full saturation and 50% lightness)
                        const h = parseInt(e.target.value)
                        const s = 0.7
                        const l = 0.55
                        const c = (1 - Math.abs(2 * l - 1)) * s
                        const x = c * (1 - Math.abs((h / 60) % 2 - 1))
                        const m = l - c / 2
                        let r = 0, g = 0, b = 0
                        if (h < 60) { r = c; g = x; b = 0 }
                        else if (h < 120) { r = x; g = c; b = 0 }
                        else if (h < 180) { r = 0; g = c; b = x }
                        else if (h < 240) { r = 0; g = x; b = c }
                        else if (h < 300) { r = x; g = 0; b = c }
                        else { r = c; g = 0; b = x }
                        const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
                        setSelectedThemeColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
                      }}
                      className="w-full h-8 rounded-lg cursor-pointer appearance-none"
                      style={{
                        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                      }}
                    />
                    <style jsx>{`
                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 24px;
                        height: 32px;
                        background: white;
                        border: 3px solid ${selectedThemeColor};
                        border-radius: 6px;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 24px;
                        height: 32px;
                        background: white;
                        border: 3px solid ${selectedThemeColor};
                        border-radius: 6px;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                      }
                    `}</style>
                  </div>
                  {/* Color preview and hex input */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg shadow-inner border border-gray-200"
                      style={{ backgroundColor: selectedThemeColor }}
                    />
                    <input
                      type="color"
                      value={selectedThemeColor}
                      onChange={(e) => setSelectedThemeColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                      title="Pick a custom color"
                    />
                    <input
                      type="text"
                      value={selectedThemeColor}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          setSelectedThemeColor(val)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm uppercase"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-500">or choose an icon</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Predefined Avatars */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    setSelectedAvatar(avatar.id)
                    setAvatarFile(null)
                    setAvatarPreview(null)
                  }}
                  className={`aspect-square rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-3xl text-white transition-all hover:scale-105 ${
                    selectedAvatar === avatar.id && !avatarFile && !avatarPreview ? 'ring-4 ring-brand ring-offset-2' : ''
                  }`}
                  title={avatar.label}
                >
                  {avatar.icon}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAvatarPicker(false)
                  setAvatarError(null)
                  setAvatarFile(null)
                  setAvatarPreview(user?.avatarUrl || null)
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAvatarSave}
                disabled={savingAvatar || uploadingAvatar}
                className="flex-1 px-4 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? 'Uploading...' : savingAvatar ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Join a Class</h3>
              <button
                onClick={() => {
                  setShowEnrollModal(false)
                  setClassCode('')
                  setEnrollError('')
                }}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Enter the class code provided by your teacher to join their class.
            </p>

            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="Enter class code (e.g., ABC123)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-mono text-center tracking-widest focus:border-brand focus:outline-none mb-4"
              maxLength={6}
            />

            {enrollError && (
              <p className="text-red-600 text-sm mb-4">{enrollError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEnrollModal(false)
                  setClassCode('')
                  setEnrollError('')
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling || !classCode.trim()}
                className="flex-1 px-4 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {enrolling ? 'Joining...' : 'Join Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-semibold text-white">QuizNotes</span>
            </div>
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QuizNotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
