import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span']
const ALLOWED_ATTR = ['class']

export function sanitizeRichText(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

export function isRichTextEmpty(html: string): boolean {
  if (!html.trim()) return true

  const sanitized = sanitizeRichText(html)
  const text = sanitized
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()

  return !text
}

export function richTextToPlainText(html: string): string {
  if (!html) return ''
  if (!/<[^>]+>/.test(html)) return html

  const sanitized = sanitizeRichText(html)
  return sanitized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
