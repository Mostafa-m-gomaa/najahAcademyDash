import { sanitizeRichText } from '../lib/richText'
import './RichTextEditor.css'

type RichTextContentProps = {
  content: string
  className?: string
}

export default function RichTextContent({
  content,
  className = '',
}: RichTextContentProps) {
  if (!content) return null

  const hasHtmlTags = /<[^>]+>/.test(content)
  const sanitized = sanitizeRichText(content)

  if (!hasHtmlTags) {
    return (
      <span className={`rich-text-content ${className}`.trim()}>{content}</span>
    )
  }

  return (
    <div
      className={`rich-text-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
