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
  const classes = `question-content rich-text-content ${className}`.trim()

  if (!hasHtmlTags) {
    return (
      <span className={`${classes} rich-text-content--plain`.trim()}>
        {content}
      </span>
    )
  }

  return (
    <div
      className={classes}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
