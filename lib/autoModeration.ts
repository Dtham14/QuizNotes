// @ts-ignore - bad-words package has module resolution issues
const Filter = require('bad-words')

// Initialize profanity filter
const filter = new Filter()

/**
 * Check if text contains profanity
 * Uses the bad-words library with built-in word list
 */
export function containsProfanity(text: string): boolean {
  return filter.isProfane(text)
}

/**
 * Clean profanity from text by replacing with asterisks
 */
export function cleanProfanity(text: string): string {
  return filter.clean(text)
}

/**
 * Check if text is likely spam based on various heuristics
 */
export function isLikelySpam(text: string): boolean {
  // Check for excessive links (more than 3 URLs)
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = text.match(urlRegex)
  if (urls && urls.length > 3) return true

  // Check for all caps (excluding short text)
  if (text.length > 20) {
    const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length
    if (uppercaseRatio > 0.7) return true
  }

  // Check for repetitive characters (e.g., "aaaaaaa", "!!!!!!!!")
  if (/(.)\1{6,}/.test(text)) return true

  // Check for excessive exclamation marks or question marks
  const exclamationCount = (text.match(/!/g) || []).length
  const questionCount = (text.match(/\?/g) || []).length
  if (exclamationCount > 5 || questionCount > 5) return true

  // Check for excessive emoji usage (more than 10 emojis in short text)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  const emojis = text.match(emojiRegex)
  if (emojis && emojis.length > 10 && text.length < 200) return true

  // Check for common spam phrases
  const spamPhrases = [
    'click here',
    'buy now',
    'limited time offer',
    'make money fast',
    'work from home',
    'lose weight fast',
    'free money',
    'click this link',
    'dm me',
    'check out my profile',
  ]
  const lowerText = text.toLowerCase()
  for (const phrase of spamPhrases) {
    if (lowerText.includes(phrase)) return true
  }

  return false
}

/**
 * Get all moderation flags for content
 * Returns array of issues found
 */
export function getModerationFlags(text: string): string[] {
  const flags: string[] = []

  if (containsProfanity(text)) {
    flags.push('profanity')
  }

  if (isLikelySpam(text)) {
    flags.push('spam')
  }

  // Check for very short content (potential low-quality posts)
  if (text.trim().length < 10) {
    flags.push('too_short')
  }

  // Check for very long content (potential copy-paste spam)
  if (text.length > 20000) {
    flags.push('too_long')
  }

  return flags
}

/**
 * Check if content should be auto-flagged for moderator review
 */
export function shouldAutoFlag(text: string): boolean {
  const flags = getModerationFlags(text)

  // Auto-flag if profanity or spam detected
  return flags.includes('profanity') || flags.includes('spam')
}

/**
 * Check if content should be auto-rejected (not posted at all)
 * Very aggressive spam or inappropriate content
 */
export function shouldAutoReject(text: string): boolean {
  // For now, we'll be lenient and only flag, not reject
  // This can be made more aggressive if needed
  const flags = getModerationFlags(text)

  // Auto-reject if multiple severe flags
  const severeFlags = flags.filter((f) => f === 'profanity' || f === 'spam')
  return severeFlags.length >= 2
}

/**
 * Rate limiting helper - check if user is posting too frequently
 * Returns true if user should be rate limited
 */
export interface RateLimitConfig {
  maxPosts: number
  maxComments: number
  periodHours: number
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxPosts: 5, // Max 5 posts per hour
  maxComments: 20, // Max 20 comments per hour
  periodHours: 1,
}

/**
 * Validate content length
 */
export function validateContentLength(
  content: string,
  type: 'post' | 'comment'
): { valid: boolean; error?: string } {
  const trimmed = content.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Content cannot be empty' }
  }

  if (type === 'post') {
    if (trimmed.length < 10) {
      return { valid: false, error: 'Post must be at least 10 characters' }
    }
    if (trimmed.length > 10000) {
      return { valid: false, error: 'Post cannot exceed 10,000 characters' }
    }
  } else {
    if (trimmed.length < 1) {
      return { valid: false, error: 'Comment cannot be empty' }
    }
    if (trimmed.length > 2000) {
      return { valid: false, error: 'Comment cannot exceed 2,000 characters' }
    }
  }

  return { valid: true }
}

/**
 * Validate post title
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' }
  }

  if (trimmed.length < 5) {
    return { valid: false, error: 'Title must be at least 5 characters' }
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Title cannot exceed 200 characters' }
  }

  return { valid: true }
}
