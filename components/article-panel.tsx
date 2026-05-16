"use client"

import { useCallback, useRef, useEffect, useState, type ReactNode } from "react"
import { FileText, Lightbulb, BookOpen, HelpCircle, Plus, X, RefreshCw, Upload } from "lucide-react"
import type { TaskType, Note } from "@/app/page"

interface ArticlePanelProps {
  onHighlight: (
    text: string,
    taskType: TaskType,
    position: number
  ) => void
  onAddSelection: (text: string) => void
  onClearSelections: () => void
  onUpdateNote: (noteId: string, newText: string, taskType: TaskType, position: number) => void
  highlightedText: string | null
  hoveredNote: Note | null
  pendingSelections: string[]
  findOverlappingNote: (texts: string[]) => Note | null
  notes?: Note[]
  onFootnoteClick?: (noteId: string) => void
  onArticleTextChange?: (text: string) => void
}

interface ToolbarPosition {
  x: number
  y: number
}

type ArticleBlock = { type: string; content: string }

const DEFAULT_CONTENT: ArticleBlock[] = []

function parseTxt(text: string): ArticleBlock[] {
  return text
    .split(/\n{2,}/)
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content) => ({
      type: "paragraph" as const,
      content,
    }))
}

async function parsePdf(file: File): Promise<ArticleBlock[]> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const paragraphs: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    if (pageText) paragraphs.push(pageText)
  }

  return paragraphs
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content) => ({
      type: "paragraph" as const,
      content,
    }))
}

async function parseDocx(file: File): Promise<ArticleBlock[]> {
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return parseTxt(result.value)
}

function inferTaskLabel(text: string): TaskType {
  const trimmed = text.trim()
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  const sentenceCount = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  const lower = ` ${trimmed.toLowerCase()} `

  const hasDefinitionKeyword =
    lower.includes(" is ") ||
    lower.includes(" means ") ||
    lower.includes(" refers to ")

  if (wordCount > 200) return "summary"
  if (sentenceCount > 3) return "concept"
  if (hasDefinitionKeyword) return "explanation"
  return "summary"
}

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

/** Returns the character offset of `needle` within the concatenated article text */
function getArticlePosition(needle: string, articleBlocks: ArticleBlock[]): number {
  const fullText = articleBlocks.map((b) => b.content).join("\n")
  const normalized = normalizeForMatch(needle)
  const idx = fullText.indexOf(normalized)
  return idx === -1 ? fullText.length : idx
}

function renderTextWithInlineFootnotes(
  content: string,
  notes: Note[] = [],
  // noteIndex here is the display order index (0-based, sorted by article position)
  sortedNotes: Note[],
  onFootnoteClick?: (noteId: string) => void
) {
  const normalizedContent = normalizeForMatch(content)

  const matches = sortedNotes
    .flatMap((note, sortedIndex) => {
      const sourceTexts = note.sourceTexts?.length ? note.sourceTexts : [note.sourceText]
      return sourceTexts.map((sourceText) => ({
        note,
        sortedIndex,
        sourceText,
        normalizedSource: normalizeForMatch(sourceText),
      }))
    })
    .filter(({ normalizedSource }) => normalizedSource.length > 0)
    .map((match) => {
      const start = normalizedContent.indexOf(match.normalizedSource)
      return { ...match, start, end: start + match.normalizedSource.length }
    })
    .filter((match) => match.start !== -1)
    .sort((a, b) => a.start - b.start || b.normalizedSource.length - a.normalizedSource.length)

  if (matches.length === 0) return content

  const parts: ReactNode[] = []
  let cursor = 0

  matches.forEach((match) => {
    if (match.start < cursor) return

    if (match.start > cursor) {
      parts.push(content.slice(cursor, match.start))
    }

    parts.push(content.slice(match.start, match.end))
    parts.push(
      <sup
        key={`${match.note.id}-${match.start}`}
        onClick={(event) => {
          event.stopPropagation()
          onFootnoteClick?.(match.note.id)
        }}
        className="ml-0.5 cursor-pointer rounded-full border border-blue-300 bg-blue-50 px-1 text-[10px] font-medium text-blue-600 hover:bg-blue-100"
        title="View linked note"
      >
        {match.sortedIndex + 1}
      </sup>
    )

    cursor = match.end
  })

  if (cursor < content.length) {
    parts.push(content.slice(cursor))
  }

  return parts
}

export function ArticlePanel({ 
  onHighlight, 
  onAddSelection,
  onClearSelections,
  onUpdateNote,
  highlightedText, 
  hoveredNote,
  pendingSelections,
  findOverlappingNote,
  notes = [],
  onFootnoteClick,
  onArticleTextChange,
}: ArticlePanelProps) {
  const articleRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null)
  const [overlappingNote, setOverlappingNote] = useState<Note | null>(null)
  const [articleContent, setArticleContent] = useState<ArticleBlock[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Notify parent whenever article content changes
  useEffect(() => {
    const fullText = articleContent.map((b) => b.content).join("\n")
    onArticleTextChange?.(fullText)
  }, [articleContent, onArticleTextChange])

  // Notes sorted by article position for stable footnote numbering
  const sortedNotes = [...notes].sort((a, b) => a.articlePosition - b.articlePosition)

  const safePendingSelections = pendingSelections ?? []

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    const isTxt  = name.endsWith(".txt")
    const isPdf  = name.endsWith(".pdf")
    const isDocx = name.endsWith(".docx")

    if (!isTxt && !isPdf && !isDocx) {
      setParseError("Unsupported file type. Please upload a .txt, .pdf, or .docx file.")
      e.target.value = ""
      return
    }

    setFileName(file.name)
    setIsLoading(true)
    setParseError(null)

    try {
      let blocks: ArticleBlock[]

      if (isTxt) {
        const text = await file.text()
        blocks = parseTxt(text)
      } else if (isPdf) {
        blocks = await parsePdf(file)
      } else {
        blocks = await parseDocx(file)
      }

      setArticleContent(blocks)
    } catch (err) {
      console.error("File parse error:", err)
      setParseError("Failed to parse file. Please try another file.")
      setFileName(null)
    } finally {
      setIsLoading(false)
    }

    e.target.value = ""
  }, [])

  const handleResetContent = useCallback(() => {
    setArticleContent([])
    setFileName(null)
    setParseError(null)
    onClearSelections()
  }, [])

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      return
    }

    const text = selection.toString().trim()
    if (text.length < 5) {
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      return
    }

    const range = selection.getRangeAt(0)
    if (articleRef.current?.contains(range.commonAncestorContainer)) {
      const inferredTaskType = inferTaskLabel(text)
      const position = getArticlePosition(text, articleContent)

      onHighlight(text, inferredTaskType, position)

      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [articleRef, onHighlight, articleContent])

  const handleTaskSelect = useCallback((taskType: TaskType) => {
    if (selectedText) {
      const position = getArticlePosition(selectedText, articleContent)
      onHighlight(selectedText, taskType, position)
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, onHighlight, articleContent])

  const handleUpdateExisting = useCallback((taskType: TaskType) => {
    if (selectedText && overlappingNote) {
      const position = getArticlePosition(selectedText, articleContent)
      onUpdateNote(overlappingNote.id, selectedText, taskType, position)
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, overlappingNote, onUpdateNote, articleContent])

  const handleAddToMulti = useCallback(() => {
    if (selectedText) {
      onAddSelection(selectedText)
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, onAddSelection])

  const handleClearPending = useCallback(() => {
    onClearSelections()
  }, [onClearSelections])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".selection-toolbar") && !target.closest(".pending-selections-bar")) {
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            setSelectedText(null)
            setToolbarPosition(null)
            setOverlappingNote(null)
          }
        }, 100)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Highlight text from View Source or hover
  useEffect(() => {
    if (!articleRef.current) return

    const existingHighlights = articleRef.current.querySelectorAll(".active-highlight, .hover-highlight, .importance-high, .importance-medium")
    existingHighlights.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el)
        parent.normalize()
      }
    })

    const textToHighlight = highlightedText || (hoveredNote?.sourceTexts || [])
    const isHover = !highlightedText && hoveredNote
    
    if (!textToHighlight || (Array.isArray(textToHighlight) && textToHighlight.length === 0)) return

    const textsToFind = Array.isArray(textToHighlight) ? textToHighlight : [textToHighlight]
    
    textsToFind.forEach((text, idx) => {
      if (!articleRef.current) return
      
      const treeWalker = document.createTreeWalker(
        articleRef.current,
        NodeFilter.SHOW_TEXT,
        null
      )

      let node: Text | null
      while ((node = treeWalker.nextNode() as Text | null)) {
        const textContent = node.textContent || ""
        const index = textContent.indexOf(text)
        
        if (index !== -1) {
          const range = document.createRange()
          range.setStart(node, index)
          range.setEnd(node, index + text.length)
          
          const span = document.createElement("span")
          if (isHover) {
            span.className = "hover-highlight bg-highlight/60 rounded-sm px-0.5 -mx-0.5 transition-colors"
          } else {
            span.className = "active-highlight bg-highlight highlight-flash rounded-sm px-0.5 -mx-0.5"
          }
          
          try {
            range.surroundContents(span)
            if (idx === 0 && !isHover) {
              span.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          } catch {
            // surroundContents failed
          }
          break
        }
      }
    })

    if (isHover && hoveredNote?.importantSentences) {
      hoveredNote.importantSentences.forEach((sentence) => {
        if (!articleRef.current) return
        
        const treeWalker = document.createTreeWalker(
          articleRef.current,
          NodeFilter.SHOW_TEXT,
          null
        )

        let node: Text | null
        while ((node = treeWalker.nextNode() as Text | null)) {
          const textContent = node.textContent || ""
          const index = textContent.indexOf(sentence.text)
          
          if (index !== -1) {
            const range = document.createRange()
            range.setStart(node, index)
            range.setEnd(node, index + sentence.text.length)
            
            const span = document.createElement("span")
            span.className = sentence.importance === "high" 
              ? "importance-high bg-amber-200/80 rounded-sm px-0.5 -mx-0.5 border-b-2 border-amber-400"
              : "importance-medium bg-amber-100/60 rounded-sm px-0.5 -mx-0.5 border-b border-amber-300"
            
            try {
              range.surroundContents(span)
            } catch {
              // surroundContents failed
            }
            break
          }
        }
      })
    }
  }, [highlightedText, hoveredNote])

  // Highlight pending selections
  useEffect(() => {
    if (!safePendingSelections.length) return
    if (!articleRef.current) return
    
    const existingPending = articleRef.current.querySelectorAll(".pending-highlight")
    existingPending.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el)
        parent.normalize()
      }
    })

    safePendingSelections.forEach((text) => {
      if (!articleRef.current) return
      
      const treeWalker = document.createTreeWalker(
        articleRef.current,
        NodeFilter.SHOW_TEXT,
        null
      )

      let node: Text | null
      while ((node = treeWalker.nextNode() as Text | null)) {
        const textContent = node.textContent || ""
        const index = textContent.indexOf(text)
        
        if (index !== -1) {
          const range = document.createRange()
          range.setStart(node, index)
          range.setEnd(node, index + text.length)
          
          const span = document.createElement("span")
          span.className = "pending-highlight bg-blue-100 rounded-sm px-0.5 -mx-0.5 border-b-2 border-blue-400"
          
          try {
            range.surroundContents(span)
          } catch {
            // surroundContents failed
          }
          break
        }
      }
    })
  }, [safePendingSelections]) 

  const taskOptions: { type: TaskType; label: string; icon: React.ElementType }[] = [
    { type: "summary", label: "Summarize", icon: FileText },
    { type: "explanation", label: "Explain", icon: Lightbulb },
    { type: "concept", label: "Key Points", icon: BookOpen },
    { type: "question", label: "Question", icon: HelpCircle },
  ]

  return (
    <div 
      ref={articleRef}
      className="h-full overflow-y-auto px-8 py-12 md:px-16 lg:px-24 relative"
      onMouseUp={handleMouseUp}
    >
      {/* Pending Selections Bar */}
      {safePendingSelections.length > 0 && (
        <div className="pending-selections-bar fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-lg shadow-lg p-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{safePendingSelections.length} selection{safePendingSelections.length > 1 ? "s" : ""}</span>
            <button
              onClick={handleClearPending}
              className="p-1 hover:bg-background/10 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="w-px h-5 bg-background/20" />
          <span className="text-xs text-background/70">Select more text or choose action:</span>
          <div className="flex gap-1">
            {taskOptions.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleTaskSelect(type)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium hover:bg-background/10 rounded transition-colors"
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Toolbar */}
      {selectedText && toolbarPosition && (
        <div 
          className="selection-toolbar absolute z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: toolbarPosition.x, 
            top: toolbarPosition.y 
          }}
        >
          <div className="bg-foreground text-background rounded-lg shadow-lg overflow-hidden">
            {overlappingNote && (
              <>
                <div className="px-3 py-2 bg-background/10 border-b border-background/20">
                  <div className="flex items-center gap-2 text-xs">
                    <RefreshCw className="h-3 w-3" />
                    <span>Update existing note?</span>
                  </div>
                </div>
                <div className="flex border-b border-background/20">
                  {taskOptions.map(({ type, label, icon: Icon }) => (
                    <button
                      key={`update-${type}`}
                      onClick={() => handleUpdateExisting(type)}
                      className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium hover:bg-background/10 transition-colors"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 text-[10px] text-background/60 bg-background/5">
                  Or create new:
                </div>
              </>
            )}
            
            <div className="flex">
              <button
                onClick={handleAddToMulti}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium hover:bg-background/10 transition-colors border-r border-background/20"
                title="Add to multi-selection"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              
              {taskOptions.map(({ type, label, icon: Icon }, idx) => (
                <button
                  key={type}
                  onClick={() => handleTaskSelect(type)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium hover:bg-background/10 transition-colors ${
                    idx < taskOptions.length - 1 ? "border-r border-background/20" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-foreground" />
          </div>
        </div>
      )}

      <article className="max-w-2xl mx-auto">
        {/* File upload bar */}
        <div className="mb-8 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground border border-dashed border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-3.5 w-3.5" />
            {isLoading ? "Parsing…" : "Upload .txt, .pdf, or .docx"}
          </button>
          {fileName && !isLoading && (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[160px]" title={fileName}>
                {fileName}
              </span>
              <button
                onClick={handleResetContent}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Clear uploaded article"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </>
          )}
          {parseError && (
            <span className="text-xs text-destructive">{parseError}</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {articleContent.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <p className="text-lg font-medium">Please upload your file here</p>
            <p className="mt-2 text-sm">Supports .txt, .pdf, and .docx</p>
          </div>
        ) : (
          articleContent.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h1
                  key={index}
                  data-source-text
                  className="text-4xl font-bold text-foreground mb-6 tracking-tight"
                >
                  {renderTextWithInlineFootnotes(block.content, notes, sortedNotes, onFootnoteClick)}
                </h1>
              )
            }

            if (block.type === "subheading") {
              return (
                <h2
                  key={index}
                  data-source-text
                  className="text-xl font-semibold text-foreground mt-10 mb-4 tracking-tight"
                >
                  {renderTextWithInlineFootnotes(block.content, notes, sortedNotes, onFootnoteClick)}
                </h2>
              )
            }

            return (
              <p
                key={index}
                data-source-text
                className="text-foreground/80 leading-relaxed mb-5 text-[15px] selection:bg-highlight"
              >
                {renderTextWithInlineFootnotes(block.content, notes, sortedNotes, onFootnoteClick)}
              </p>
            )
          })
        )}
      </article>
    </div>
  )
}
