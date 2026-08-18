import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import ReactQuill from 'react-quill-new'
import Delta from 'quill-delta'
import 'react-quill-new/dist/quill.snow.css'
import { isRichTextEmpty, prepareWordPasteHtml, sanitizeRichText } from '../lib/richText'
import './RichTextEditor.css'

export type RichTextEditorHandle = {
  getHtmlForSave: () => string
}

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }, { align: [] }],
    ['clean'],
  ],
}

const formats = [
  'bold',
  'italic',
  'underline',
  'list',
  'indent',
  'direction',
  'align',
]

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      onChange,
      placeholder = 'Start typing...',
      minHeight = 120,
      className = '',
    },
    ref,
  ) {
    const quillRef = useRef<ReactQuill>(null)

    useImperativeHandle(ref, () => ({
      getHtmlForSave: () =>
        quillRef.current?.getEditor().root.innerHTML ?? value,
    }))

    const handleChange = (html: string) => {
      const sanitized = sanitizeRichText(html)
      const next = isRichTextEmpty(sanitized) ? '' : sanitized
      const current = isRichTextEmpty(value) ? '' : value
      if (next === current) return
      onChange(next)
    }

    useEffect(() => {
      const quill = quillRef.current?.getEditor()
      if (!quill) return

      quill.root.setAttribute('dir', 'rtl')

      quill.clipboard.addMatcher('BR', () => new Delta().insert('\n'))

      const applyRtlToRange = (start: number, length: number) => {
        if (length <= 0) return
        quill.formatText(start, length, { direction: 'rtl', align: 'right' }, 'silent')
      }

      const handlePaste = (event: ClipboardEvent) => {
        const rawHtml = event.clipboardData?.getData('text/html') ?? ''
        const plainText = event.clipboardData?.getData('text/plain') ?? ''
        console.log('[quill-paste] raw text/html', rawHtml)
        console.log('[quill-paste] hasBr', /<br\s*\/?>/i.test(rawHtml))

        event.preventDefault()
        event.stopPropagation()

        const selection = quill.getSelection(true)
        const index = selection?.index ?? quill.getLength()
        const length = selection?.length ?? 0

        if (!rawHtml.trim()) {
          if (!plainText.trim()) return

          quill.deleteText(index, length, 'silent')
          quill.insertText(index, plainText, { direction: 'rtl' }, 'user')
          applyRtlToRange(index, plainText.length)
          quill.setSelection(index + plainText.length, 0, 'silent')
          return
        }

        const normalized = sanitizeRichText(prepareWordPasteHtml(rawHtml))
        const brCount = (normalized.match(/<br\s*\/?>/gi) ?? []).length
        const pCount = (normalized.match(/<p[\s>]/gi) ?? []).length
        console.log('[quill-paste] normalized', {
          brCount,
          pCount,
          preview: normalized.slice(0, 500),
        })

        const pasted = quill.clipboard.convert({ html: normalized })
        const update = new Delta().retain(index).delete(length).concat(pasted)
        quill.updateContents(update, 'user')
        applyRtlToRange(index, pasted.length())
        quill.setSelection(index + pasted.length(), 0, 'silent')
      }

      quill.root.addEventListener('paste', handlePaste, true)
      return () => {
        quill.root.removeEventListener('paste', handlePaste, true)
      }
    }, [])

    return (
      <div
        className={`rich-text-editor ${className}`.trim()}
        dir="rtl"
        style={{ ['--rte-min-height' as string]: `${minHeight}px` }}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          preserveWhitespace
        />
      </div>
    )
  },
)

export default RichTextEditor
