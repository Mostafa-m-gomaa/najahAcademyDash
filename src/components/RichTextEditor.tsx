import { useEffect, useRef, type MouseEvent } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { sanitizeRichText } from '../lib/richText'
import './RichTextEditor.css'

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const preventToolbarBlur = (event: MouseEvent<HTMLButtonElement>) => {
  event.preventDefault()
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 120,
}: RichTextEditorProps) {
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: nextEditor }) => {
      isInternalUpdate.current = true
      onChange(sanitizeRichText(nextEditor.getHTML()))
    },
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }

    const nextValue = sanitizeRichText(value || '')
    const currentValue = sanitizeRichText(editor.getHTML())

    if (nextValue !== currentValue) {
      editor.commands.setContent(nextValue || '', { emitUpdate: false })
    }
  }, [editor, value])

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isBold: currentEditor.isActive('bold'),
      isItalic: currentEditor.isActive('italic'),
      isUnderline: currentEditor.isActive('underline'),
    }),
  })

  const { isBold, isItalic, isUnderline } = toolbarState ?? {
    isBold: false,
    isItalic: false,
    isUnderline: false,
  }

  if (!editor) {
    return (
      <div className="rich-text-editor">
        <div className="rich-text-editor__content" style={{ minHeight }}>
          <p className="muted">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <div className="rich-text-editor__toolbar">
        <button
          className={`rich-text-editor__button${isBold ? ' is-active' : ''}`}
          type="button"
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          className={`rich-text-editor__button${isItalic ? ' is-active' : ''}`}
          type="button"
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          className={`rich-text-editor__button${isUnderline ? ' is-active' : ''}`}
          type="button"
          onMouseDown={preventToolbarBlur}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>
      </div>
      <div className="rich-text-editor__content" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
