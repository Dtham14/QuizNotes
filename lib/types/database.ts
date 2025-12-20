// Database types for Supabase
// You can regenerate this file using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'admin' | 'teacher' | 'student'
          avatar: string | null
          subscription_status: 'none' | 'active' | 'canceled' | 'expired' | 'past_due' | 'inactive'
          subscription_plan: 'monthly' | 'yearly' | 'student_premium' | null
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'admin' | 'teacher' | 'student'
          avatar?: string | null
          subscription_status?: 'none' | 'active' | 'canceled' | 'expired' | 'past_due' | 'inactive'
          subscription_plan?: 'monthly' | 'yearly' | 'student_premium' | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'teacher' | 'student'
          avatar?: string | null
          subscription_status?: 'none' | 'active' | 'canceled' | 'expired' | 'past_due' | 'inactive'
          subscription_plan?: 'monthly' | 'yearly' | 'student_premium' | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      classes: {
        Row: {
          id: string
          teacher_id: string
          name: string
          description: string | null
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          description?: string | null
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          description?: string | null
          code?: string
          created_at?: string
        }
      }
      class_enrollments: {
        Row: {
          id: string
          class_id: string
          student_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          enrolled_at?: string
        }
      }
      custom_quizzes: {
        Row: {
          id: string
          teacher_id: string
          title: string
          description: string | null
          questions: Json
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          title: string
          description?: string | null
          questions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          title?: string
          description?: string | null
          questions?: Json
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          teacher_id: string
          quiz_id: string | null
          quiz_type: string | null
          title: string
          description: string | null
          due_date: string | null
          max_attempts: number | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id: string
          quiz_id?: string | null
          quiz_type?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          max_attempts?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          teacher_id?: string
          quiz_id?: string | null
          quiz_type?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          max_attempts?: number | null
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_type: string
          score: number
          total_questions: number
          answers: Json | null
          assignment_id: string | null
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_type: string
          score: number
          total_questions: number
          answers?: Json | null
          assignment_id?: string | null
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_type?: string
          score?: number
          total_questions?: number
          answers?: Json | null
          assignment_id?: string | null
          pdf_url?: string | null
          created_at?: string
        }
      }
      level_thresholds: {
        Row: {
          level: number
          name: string
          xp_required: number
          color: string
        }
        Insert: {
          level: number
          name: string
          xp_required: number
          color: string
        }
        Update: {
          level?: number
          name?: string
          xp_required?: number
          color?: string
        }
      }
      user_gamification: {
        Row: {
          user_id: string
          total_xp: number
          current_level: number
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          quizzes_today: number
          daily_goal: number
          daily_goal_met: boolean
          total_quizzes_completed: number
          total_perfect_scores: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          quizzes_today?: number
          daily_goal?: number
          daily_goal_met?: boolean
          total_quizzes_completed?: number
          total_perfect_scores?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          quizzes_today?: number
          daily_goal?: number
          daily_goal_met?: boolean
          total_quizzes_completed?: number
          total_perfect_scores?: number
          created_at?: string
          updated_at?: string
        }
      }
      xp_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          reason: string
          quiz_attempt_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          reason: string
          quiz_attempt_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          reason?: string
          quiz_attempt_id?: string | null
          created_at?: string
        }
      }
      achievement_definitions: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          category: 'quiz' | 'streak' | 'score' | 'milestone' | 'special'
          xp_reward: number
          requirement_type: string
          requirement_value: number | null
          is_hidden: boolean
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          description: string
          icon: string
          category: 'quiz' | 'streak' | 'score' | 'milestone' | 'special'
          xp_reward?: number
          requirement_type: string
          requirement_value?: number | null
          is_hidden?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: 'quiz' | 'streak' | 'score' | 'milestone' | 'special'
          xp_reward?: number
          requirement_type?: string
          requirement_value?: number | null
          is_hidden?: boolean
          sort_order?: number
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      leaderboard_periods: {
        Row: {
          id: string
          period_type: 'weekly' | 'monthly'
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          period_type: 'weekly' | 'monthly'
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          period_type?: 'weekly' | 'monthly'
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      leaderboard_entries: {
        Row: {
          id: string
          period_id: string
          user_id: string
          xp_earned: number
          quizzes_completed: number
          perfect_scores: number
          updated_at: string
        }
        Insert: {
          id?: string
          period_id: string
          user_id: string
          xp_earned?: number
          quizzes_completed?: number
          perfect_scores?: number
          updated_at?: string
        }
        Update: {
          id?: string
          period_id?: string
          user_id?: string
          xp_earned?: number
          quizzes_completed?: number
          perfect_scores?: number
          updated_at?: string
        }
      }
      pdf_downloads: {
        Row: {
          id: string
          user_id: string
          attempt_id: string
          downloaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          attempt_id: string
          downloaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          attempt_id?: string
          downloaded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_level_from_xp: {
        Args: { xp: number }
        Returns: number
      }
      get_xp_for_next_level: {
        Args: { current_level: number }
        Returns: number | null
      }
      initialize_user_gamification: {
        Args: { p_user_id: string }
        Returns: void
      }
      get_current_leaderboard_period: {
        Args: { p_period_type: string }
        Returns: string
      }
      get_user_daily_download_count: {
        Args: { p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type ClassEnrollment = Database['public']['Tables']['class_enrollments']['Row']
export type CustomQuiz = Database['public']['Tables']['custom_quizzes']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row']

// PDF Downloads types
export type PdfDownload = Database['public']['Tables']['pdf_downloads']['Row']

// Gamification types
export type LevelThreshold = Database['public']['Tables']['level_thresholds']['Row']
export type UserGamification = Database['public']['Tables']['user_gamification']['Row']
export type XPTransaction = Database['public']['Tables']['xp_transactions']['Row']
export type AchievementDefinition = Database['public']['Tables']['achievement_definitions']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
export type LeaderboardPeriod = Database['public']['Tables']['leaderboard_periods']['Row']
export type LeaderboardEntry = Database['public']['Tables']['leaderboard_entries']['Row']

// Combined types for UI
export type UserAchievementWithDetails = UserAchievement & {
  achievement: AchievementDefinition
}

export type LeaderboardEntryWithUser = LeaderboardEntry & {
  profile: Pick<Profile, 'id' | 'name' | 'email'>
  rank?: number
}

export type GamificationStats = UserGamification & {
  level_info: LevelThreshold
  next_level_xp: number | null
  xp_progress: number // Percentage to next level
  recent_achievements: UserAchievementWithDetails[]
  daily_goal_streak: number // Consecutive days meeting daily goal
}
