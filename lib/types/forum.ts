// Forum type definitions

export interface ForumTag {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string
  post_count: number
  created_at: string
}

export interface ForumPost {
  id: string
  author_id: string
  title: string
  content: string
  content_html: string | null
  is_pinned: boolean
  is_locked: boolean
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  view_count: number
  reply_count: number
  vote_score: number
  last_activity_at: string
  created_at: string
  updated_at: string
  // Optional populated relations
  author?: {
    id: string
    name: string | null
    email: string
    role: 'admin' | 'teacher' | 'student'
    avatar: string | null
    avatar_url: string | null
  }
  tags?: ForumTag[]
}

export interface ForumComment {
  id: string
  post_id: string
  parent_id: string | null
  author_id: string
  content: string
  content_html: string | null
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  vote_score: number
  depth: number
  created_at: string
  updated_at: string
  // Optional populated relations
  author?: {
    id: string
    name: string | null
    email: string
    role: 'admin' | 'teacher' | 'student'
    avatar: string | null
    avatar_url: string | null
  }
  replies?: ForumComment[]
}

export interface ForumVote {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  vote_type: 'upvote' | 'downvote'
  created_at: string
  updated_at: string
}

export interface ForumReport {
  id: string
  reporter_id: string
  post_id: string | null
  comment_id: string | null
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other'
  description: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_notes: string | null
  created_at: string
  // Optional populated relations
  reporter?: {
    id: string
    name: string | null
    email: string
  }
  post?: ForumPost
  comment?: ForumComment
}

export interface ForumNotification {
  id: string
  user_id: string
  type: 'reply_to_post' | 'reply_to_comment' | 'mention' | 'post_locked' | 'post_pinned'
  post_id: string | null
  comment_id: string | null
  actor_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  // Optional populated relations
  post?: ForumPost
  comment?: ForumComment
  actor?: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    avatar_url: string | null
  }
}

export interface UserForumReputation {
  user_id: string
  reputation_score: number
  posts_created: number
  comments_created: number
  helpful_votes_received: number
  total_votes_given: number
  created_at: string
  updated_at: string
}

// API request/response types

export interface CreatePostRequest {
  title: string
  content: string
  tag_ids: string[]
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  tag_ids?: string[]
}

export interface CreateCommentRequest {
  post_id: string
  parent_id?: string | null
  content: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface VoteRequest {
  target_type: 'post' | 'comment'
  target_id: string
  vote_type: 'upvote' | 'downvote'
}

export interface CreateReportRequest {
  target_type: 'post' | 'comment'
  target_id: string
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other'
  description?: string
}

export interface PostsListResponse {
  posts: ForumPost[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface SinglePostResponse {
  post: ForumPost
  comments: ForumComment[]
  user_vote: 'upvote' | 'downvote' | null
}

export interface NotificationsResponse {
  notifications: ForumNotification[]
  unread_count: number
}

export interface SearchResponse {
  posts: ForumPost[]
  total: number
}

// Reputation badge tiers
export type ReputationTier = 'newcomer' | 'contributor' | 'knowledgeable' | 'expert' | 'master'

export interface ReputationBadge {
  tier: ReputationTier
  label: string
  color: string
  minScore: number
  maxScore: number | null
}

export const REPUTATION_TIERS: Record<ReputationTier, ReputationBadge> = {
  newcomer: {
    tier: 'newcomer',
    label: 'Newcomer',
    color: 'gray',
    minScore: 0,
    maxScore: 50,
  },
  contributor: {
    tier: 'contributor',
    label: 'Contributor',
    color: 'green',
    minScore: 51,
    maxScore: 200,
  },
  knowledgeable: {
    tier: 'knowledgeable',
    label: 'Knowledgeable',
    color: 'blue',
    minScore: 201,
    maxScore: 500,
  },
  expert: {
    tier: 'expert',
    label: 'Expert',
    color: 'purple',
    minScore: 501,
    maxScore: 1000,
  },
  master: {
    tier: 'master',
    label: 'Master',
    color: 'yellow',
    minScore: 1001,
    maxScore: null,
  },
}

// Helper function to get reputation tier
export function getReputationTier(score: number): ReputationBadge {
  if (score <= 50) return REPUTATION_TIERS.newcomer
  if (score <= 200) return REPUTATION_TIERS.contributor
  if (score <= 500) return REPUTATION_TIERS.knowledgeable
  if (score <= 1000) return REPUTATION_TIERS.expert
  return REPUTATION_TIERS.master
}
