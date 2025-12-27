import DOMPurify from 'isomorphic-dompurify'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

/**
 * Sanitize markdown content to prevent XSS attacks
 * Strips dangerous HTML tags and attributes
 */
export function sanitizeMarkdown(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a',
      'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * Convert markdown to HTML
 * Uses GitHub Flavored Markdown (GFM) for better formatting support
 */
export async function renderMarkdown(content: string): Promise<string> {
  try {
    const result = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, task lists, etc.)
      .use(remarkHtml, { sanitize: false }) // We'll sanitize separately with DOMPurify
      .process(content)

    const html = result.toString()

    // Sanitize the HTML output
    return sanitizeMarkdown(html)
  } catch (error) {
    console.error('Error rendering markdown:', error)
    // Return sanitized plain text as fallback
    return sanitizeMarkdown(content.replace(/\n/g, '<br>'))
  }
}

/**
 * Extract @username mentions from markdown content
 * Returns array of unique usernames (without @ symbol)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const matches = content.match(mentionRegex)

  if (!matches) return []

  // Remove @ symbol and get unique usernames
  const usernames = matches.map((match) => match.substring(1))
  return Array.from(new Set(usernames))
}

/**
 * Truncate markdown content to a specific length while preserving formatting
 * Useful for previews
 */
export function truncateMarkdown(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content

  // Try to cut at a word boundary
  let truncated = content.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    // If we can find a space in the last 20% of the content, cut there
    truncated = truncated.substring(0, lastSpace)
  }

  return truncated + '...'
}

/**
 * Strip markdown formatting and return plain text
 * Useful for meta descriptions and previews
 */
export function markdownToPlainText(content: string): string {
  return content
    // Remove headers
    .replace(/#+\s+/g, '')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/>\s+/g, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Normalize whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim()
}
