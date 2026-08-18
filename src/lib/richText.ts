import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'span',
  'ul',
  'ol',
  'li',
]
const ALLOWED_ATTR = ['class', 'dir']

const RTL_BLOCK_TAGS = new Set(['P', 'LI', 'DIV', 'SPAN', 'UL', 'OL'])

const stripInlineDirection = (element: Element) => {
  const style = element.getAttribute('style')
  if (!style) return

  const cleaned = style
    .split(';')
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false
      const key = part.split(':')[0]?.trim().toLowerCase()
      return key !== 'direction' && key !== 'text-align'
    })
    .join('; ')

  if (cleaned) element.setAttribute('style', cleaned)
  else element.removeAttribute('style')
}

/** Force RTL on pasted Word/HTML so Arabic/Hebrew always flows right-to-left. */
export function forceRtlPasteHtml(html: string): string {
  if (!html?.trim()) return ''
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const { body } = doc

  body.querySelectorAll('*').forEach((element) => {
    stripInlineDirection(element)

    const dir = element.getAttribute('dir')?.toLowerCase()
    if (dir === 'ltr' || dir === 'auto') element.removeAttribute('dir')

    if (RTL_BLOCK_TAGS.has(element.tagName)) {
      element.setAttribute('dir', 'rtl')
    }
  })

  body.setAttribute('dir', 'rtl')
  return body.innerHTML
}

const JUNK_SELECTORS = 'meta, style, script, link, head, title'
const WORD_BREAK_SELECTORS = 'w\\:br, br'

const isEmptyElement = (element: Element) => {
  const inner = element.innerHTML
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
  return !inner || !element.textContent?.replace(/\u00a0/g, ' ').trim()
}

const preserveTextNodeLineBreaks = (body: HTMLElement, doc: Document) => {
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text)

  textNodes.forEach((textNode) => {
    const value = textNode.nodeValue ?? ''
    if (!/\r?\n/.test(value)) return

    const parts = value.split(/\r?\n/)
    const fragment = doc.createDocumentFragment()
    parts.forEach((part, index) => {
      if (part) fragment.appendChild(doc.createTextNode(part))
      if (index < parts.length - 1) fragment.appendChild(doc.createElement('br'))
    })
    textNode.replaceWith(fragment)
  })
}

/** Normalize Word/WhatsApp clipboard HTML so soft line breaks survive Quill paste. */
export function prepareWordPasteHtml(html: string): string {
  if (!html?.trim()) return ''
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const { body } = doc

  // Word soft breaks / empty office paragraphs -> <br>
  body.querySelectorAll('o\\:p').forEach((element) => {
    if (isEmptyElement(element)) {
      element.replaceWith(doc.createElement('br'))
      return
    }
    const fragment = doc.createDocumentFragment()
    while (element.firstChild) fragment.appendChild(element.firstChild)
    element.replaceWith(fragment)
  })

  body.querySelectorAll(WORD_BREAK_SELECTORS).forEach((element) => {
    if (element.tagName.toLowerCase() === 'br') return
    element.replaceWith(doc.createElement('br'))
  })

  body.querySelectorAll(JUNK_SELECTORS).forEach((element) => element.remove())

  // Empty or line-only divs -> <br>; content divs -> <p>
  Array.from(body.querySelectorAll('div')).forEach((div) => {
    if (isEmptyElement(div)) {
      div.replaceWith(doc.createElement('br'))
      return
    }
    const paragraph = doc.createElement('p')
    while (div.firstChild) paragraph.appendChild(div.firstChild)
    div.replaceWith(paragraph)
  })

  preserveTextNodeLineBreaks(body, doc)

  return forceRtlPasteHtml(body.innerHTML)
}

const isBreakOnlyParagraph = (paragraph: Element) =>
  isEmptyElement(paragraph) ||
  (paragraph.childNodes.length === 1 && paragraph.firstChild?.nodeName === 'BR')

/** Canonical empty Quill paragraph: `<p><br></p>`. Preserves block structure. */
const normalizeBlocksForSave = (body: HTMLElement) => {
  body.querySelectorAll('p').forEach((paragraph) => {
    if (isBreakOnlyParagraph(paragraph)) {
      paragraph.innerHTML = '<br>'
    }
  })
}

/** Prepare API/DB HTML for Quill editor load without adding or removing blank lines. */
export function normalizePromptHtmlForEditor(html: string): string {
  if (!html?.trim()) return ''
  if (!/<[^>]+>/.test(html)) return html
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const { body } = doc

  normalizeBlocksForSave(body)

  return body.innerHTML
}

/** Serialize editor HTML for API: preserve Quill block structure (no paragraph merge). */
export function serializePromptHtmlForSave(html: string): string {
  if (!html?.trim()) return ''
  if (!/<[^>]+>/.test(html)) {
    return html.split(/\r?\n/).join('<br>')
  }
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const { body } = doc

  preserveTextNodeLineBreaks(body, doc)
  normalizeBlocksForSave(body)

  return body.innerHTML
}

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
