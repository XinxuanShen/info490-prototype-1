"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { FileText, Lightbulb, BookOpen, HelpCircle, Plus, X, RefreshCw } from "lucide-react"
import type { TaskType, Note } from "@/app/page"

interface ArticlePanelProps {
  onHighlight: (
    text: string,
    taskType: TaskType,
    importance: "High" | "Medium" | "Low"
  ) => void
  onAddSelection: (text: string) => void
  onClearSelections: () => void
  onUpdateNote: (noteId: string, newText: string, taskType: TaskType) => void
  highlightedText: string | null
  hoveredNote: Note | null
  pendingSelections: string[]
  findOverlappingNote: (texts: string[]) => Note | null
}

interface ToolbarPosition {
  x: number
  y: number
}

const articleContent = [
  {
    type: "heading",
    content: "The Art of Deep Work"
  },
  {
    type: "paragraph",
    content: "In an age of constant distraction, the ability to focus deeply on cognitively demanding tasks has become increasingly rare—and increasingly valuable. Deep work, a term coined by computer science professor Cal Newport, refers to professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit."
  },
  {
    type: "paragraph",
    content: "These efforts create new value, improve your skill, and are hard to replicate. Deep work is like a superpower in our increasingly competitive twenty-first century economy. The ability to quickly master hard things and produce at an elite level, in terms of both quality and speed, are two core abilities for thriving in today's economy."
  },
  {
    type: "subheading",
    content: "The Science Behind Focus"
  },
  {
    type: "paragraph",
    content: "Neuroscientific research has shown that when we focus intensely on a task, we trigger a process called myelination. Myelin is a layer of fatty tissue that grows around neurons, acting like insulation around electrical wiring. This allows the neural circuit to fire faster and more accurately. The more we practice a skill in a state of deep concentration, the more myelin develops around the relevant neurons."
  },
  {
    type: "paragraph",
    content: "This biological reality explains why deliberate practice works: By focusing intensely on a specific skill, you're forcing the relevant circuit to fire, again and again, in isolation. This repetitive use of a specific circuit triggers cells called oligodendrocytes to begin wrapping layers of myelin around the neurons in the circuits—effectively cementing the skill."
  },
  {
    type: "subheading",
    content: "Strategies for Cultivating Deep Work"
  },
  {
    type: "paragraph",
    content: "The first strategy is to work deeply by deciding on your depth philosophy. Some people thrive with the monastic philosophy, dedicating extended periods exclusively to deep work. Others prefer the bimodal philosophy, dividing their time between deep work periods and shallow periods. The rhythmic philosophy chains deep work sessions together as a regular habit, while the journalistic philosophy fits deep work wherever possible in a busy schedule."
  },
  {
    type: "paragraph",
    content: "Another crucial strategy is to embrace boredom. The ability to concentrate intensely is a skill that must be trained. If every moment of potential boredom—waiting in line, riding the subway—is relieved with a quick glance at your smartphone, your brain has likely been rewired to a point where it's not ready for deep work."
  },
  {
    type: "paragraph",
    content: "Finally, quit social media—or at least be more intentional about it. Social media fragments our attention and trains our minds to crave distraction. By being more selective about our digital tools and adopting a craftsman approach to tool selection, we can reclaim the mental space necessary for deep work."
  }
]

export function ArticlePanel({ 
  onHighlight, 
  onAddSelection,
  onClearSelections,
  onUpdateNote,
  highlightedText, 
  hoveredNote,
  pendingSelections,
  findOverlappingNote
}: ArticlePanelProps) {
  const articleRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null)
  const [overlappingNote, setOverlappingNote] = useState<Note | null>(null)

  const safePendingSelections = pendingSelections ?? []

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
      const rect = range.getBoundingClientRect()
      const articleRect = articleRef.current.getBoundingClientRect()
      
      setSelectedText(text)
      setToolbarPosition({
        x: rect.left + rect.width / 2 - articleRect.left,
        y: rect.top - articleRect.top + articleRef.current.scrollTop - 10
      })
      
      // Check for overlapping notes
      const existing = findOverlappingNote([...(pendingSelections ?? []), text])
      setOverlappingNote(existing)
    }
  }, [findOverlappingNote, pendingSelections])

  const handleTaskSelect = useCallback((taskType: TaskType) => {
    if (selectedText) {
      onHighlight(
        selectedText,
        taskType,
        taskType === "explanation"
          ? "High"
          : taskType === "question"
          ? "Low"
          : "Medium"
      )
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, onHighlight])

  const handleUpdateExisting = useCallback((taskType: TaskType) => {
    if (selectedText && overlappingNote) {
      onUpdateNote(overlappingNote.id, selectedText, taskType)
      setSelectedText(null)
      setToolbarPosition(null)
      setOverlappingNote(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, overlappingNote, onUpdateNote])

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

    // Clear all previous highlights
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

    // Also highlight important sentences if hovering
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
    
    // Clear pending highlights
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
    { type: "concept", label: "Key Concept", icon: BookOpen },
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
            {/* Update existing note option */}
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
            
            {/* Main action buttons */}
            <div className="flex">
              {/* Add to multi-select button */}
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
        {articleContent.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h1 
                key={index} 
                className="text-4xl font-bold text-foreground mb-6 tracking-tight"
              >
                {block.content}
              </h1>
            )
          }
          if (block.type === "subheading") {
            return (
              <h2 
                key={index} 
                className="text-xl font-semibold text-foreground mt-10 mb-4 tracking-tight"
              >
                {block.content}
              </h2>
            )
          }
          return (
            <p 
              key={index} 
              className="text-foreground/80 leading-relaxed mb-5 text-[15px] selection:bg-highlight"
            >
              {block.content}
            </p>
          )
        })}
      </article>
    </div>
  )
}
