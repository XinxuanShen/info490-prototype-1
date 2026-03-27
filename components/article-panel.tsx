"use client"

import { useCallback, useRef, useEffect } from "react"

interface ArticlePanelProps {
  onHighlight: (text: string, range: Range) => void
  highlightedRange: Range | null
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

export function ArticlePanel({ onHighlight, highlightedRange }: ArticlePanelProps) {
  const articleRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const selectedText = selection.toString().trim()
    if (selectedText.length < 5) return

    const range = selection.getRangeAt(0)
    
    // Check if selection is within the article
    if (articleRef.current?.contains(range.commonAncestorContainer)) {
      onHighlight(selectedText, range)
    }
  }, [onHighlight])

  // Apply highlight when highlightedRange changes
  useEffect(() => {
    // Clear all previous highlights
    const existingHighlights = document.querySelectorAll(".active-highlight")
    existingHighlights.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el)
        parent.normalize()
      }
    })

    if (highlightedRange) {
      try {
        const span = document.createElement("span")
        span.className = "active-highlight bg-highlight highlight-flash rounded-sm px-0.5 -mx-0.5"
        highlightedRange.surroundContents(span)
        
        // Scroll to the highlight
        span.scrollIntoView({ behavior: "smooth", block: "center" })
      } catch {
        // Range may span multiple elements, use alternative approach
      }
    }
  }, [highlightedRange])

  return (
    <div 
      ref={articleRef}
      className="h-full overflow-y-auto px-8 py-12 md:px-16 lg:px-24"
      onMouseUp={handleMouseUp}
    >
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
