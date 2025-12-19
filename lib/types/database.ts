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
          subscription_status: 'none' | 'active' | 'canceled' | 'expired'
          subscription_plan: 'monthly' | 'yearly' | null
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'admin' | 'teacher' | 'student'
          subscription_status?: 'none' | 'active' | 'canceled' | 'expired'
          subscription_plan?: 'monthly' | 'yearly' | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'teacher' | 'student'
          subscription_status?: 'none' | 'active' | 'canceled' | 'expired'
          subscription_plan?: 'monthly' | 'yearly' | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
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
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
