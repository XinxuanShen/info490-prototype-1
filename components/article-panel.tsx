"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { FileText, Lightbulb } from "lucide-react"

type TaskType = "summary" | "explanation"

interface ArticlePanelProps {
  onHighlight: (text: string, taskType: TaskType) => void
  highlightedText: string | null
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

export function ArticlePanel({ onHighlight, highlightedText }: ArticlePanelProps) {
  const articleRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedText(null)
      setToolbarPosition(null)
      return
    }

    const text = selection.toString().trim()
    if (text.length < 5) {
      setSelectedText(null)
      setToolbarPosition(null)
      return
    }

    // Check if selection is within the article
    const range = selection.getRangeAt(0)
    if (articleRef.current?.contains(range.commonAncestorContainer)) {
      const rect = range.getBoundingClientRect()
      const articleRect = articleRef.current.getBoundingClientRect()
      
      setSelectedText(text)
      setToolbarPosition({
        x: rect.left + rect.width / 2 - articleRect.left,
        y: rect.top - articleRect.top + articleRef.current.scrollTop - 10
      })
    }
  }, [])

  const handleTaskSelect = useCallback((taskType: TaskType) => {
    if (selectedText) {
      onHighlight(selectedText, taskType)
      setSelectedText(null)
      setToolbarPosition(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selectedText, onHighlight])

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".selection-toolbar")) {
        // Small delay to allow button click to process
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            setSelectedText(null)
            setToolbarPosition(null)
          }
        }, 100)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Find and highlight text when highlightedText changes
  useEffect(() => {
    if (!articleRef.current) return

    // Clear all previous highlights
    const existingHighlights = articleRef.current.querySelectorAll(".active-highlight")
    existingHighlights.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el)
        parent.normalize()
      }
    })

    if (highlightedText && articleRef.current) {
      // Use TreeWalker to find the text in the article
      const treeWalker = document.createTreeWalker(
        articleRef.current,
        NodeFilter.SHOW_TEXT,
        null
      )

      let node: Text | null
      while ((node = treeWalker.nextNode() as Text | null)) {
        const textContent = node.textContent || ""
        const index = textContent.indexOf(highlightedText)
        
        if (index !== -1) {
          // Found the text, create a range and highlight it
          const range = document.createRange()
          range.setStart(node, index)
          range.setEnd(node, index + highlightedText.length)
          
          const span = document.createElement("span")
          span.className = "active-highlight bg-highlight highlight-flash rounded-sm px-0.5 -mx-0.5"
          
          try {
            range.surroundContents(span)
            // Scroll to the highlight
            span.scrollIntoView({ behavior: "smooth", block: "center" })
          } catch {
            // If surroundContents fails, try an alternative approach
          }
          break
        }
      }
    }
  }, [highlightedText])

  return (
    <div 
      ref={articleRef}
      className="h-full overflow-y-auto px-8 py-12 md:px-16 lg:px-24 relative"
      onMouseUp={handleMouseUp}
    >
      {/* Selection Toolbar */}
      {selectedText && toolbarPosition && (
        <div 
          className="selection-toolbar absolute z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ 
            left: toolbarPosition.x, 
            top: toolbarPosition.y 
          }}
        >
          <div className="bg-foreground text-background rounded-lg shadow-lg flex overflow-hidden">
            <button
              onClick={() => handleTaskSelect("summary")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-background/10 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Summary
            </button>
            <div className="w-px bg-background/20" />
            <button
              onClick={() => handleTaskSelect("explanation")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-background/10 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Explanation
            </button>
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
