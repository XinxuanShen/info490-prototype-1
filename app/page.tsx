"use client"

import { useState, useCallback, useMemo } from "react"
import { ArticlePanel } from "@/components/article-panel"
import { NotesPanel } from "@/components/notes-panel"
import { FileText, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export type TaskType = "summary" | "explanation" | "concept" | "question"
export type ImportanceLevel = "high" | "medium" | "low"

export interface ImportantSentence {
  text: string
  importance: "high" | "medium"
}

export interface Note {
  id: string
  sourceTexts: string[]
  summary: string
  taskType: TaskType
  importance: ImportanceLevel
  importantSentences: ImportantSentence[]
  createdAt: Date
}

// Map task types to importance levels
const taskImportanceMap: Record<TaskType, ImportanceLevel> = {
  concept: "high",
  question: "high",
  summary: "medium",
  explanation: "medium",
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [highlightedText, setHighlightedText] = useState<string | null>(null)
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [pendingSelections, setPendingSelections] = useState<string[]>([])

  // Find note being hovered to highlight its source
  const hoveredNote = useMemo(() => {
    if (!hoveredNoteId) return null
    return notes.find(n => n.id === hoveredNoteId) || null
  }, [hoveredNoteId, notes])

  // Check if text overlaps with existing notes
  const findOverlappingNote = useCallback((texts: string[]): Note | null => {
    for (const note of notes) {
      for (const sourceText of note.sourceTexts) {
        for (const text of texts) {
          // Check if texts overlap significantly
          if (sourceText.includes(text) || text.includes(sourceText)) {
            return note
          }
          // Check for partial overlap (at least 50 chars match)
          const minLen = Math.min(sourceText.length, text.length)
          if (minLen > 50) {
            const overlap = findOverlapLength(sourceText, text)
            if (overlap > minLen * 0.5) {
              return note
            }
          }
        }
      }
    }
    return null
  }, [notes])

  // Helper to find overlap length between two strings
  const findOverlapLength = (str1: string, str2: string): number => {
    let maxOverlap = 0
    const shorter = str1.length < str2.length ? str1 : str2
    const longer = str1.length < str2.length ? str2 : str1
    
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter.slice(i))) {
        maxOverlap = Math.max(maxOverlap, shorter.length - i)
        break
      }
    }
    return maxOverlap
  }

  // Generate fake important sentences from source text
  const generateImportantSentences = (texts: string[]): ImportantSentence[] => {
    const sentences: ImportantSentence[] = []
    texts.forEach(text => {
      const textSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
      if (textSentences.length > 0) {
        sentences.push({ text: textSentences[0].trim(), importance: "high" })
      }
      if (textSentences.length > 1) {
        sentences.push({ text: textSentences[1].trim(), importance: "medium" })
      }
    })
    return sentences
  }

  const handleHighlight = useCallback((text: string, taskType: TaskType) => {
    const allTexts = [...pendingSelections, text]
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      sourceTexts: allTexts,
      summary: "",
      taskType,
      importantSentences: generateImportantSentences(allTexts),
      createdAt: new Date(),
    }
    
    setNotes((prev) => [newNote, ...prev])
    setPendingSelections([])
  }, [pendingSelections])

  const handleAddSelection = useCallback((text: string) => {
    setPendingSelections((prev) => [...prev, text])
  }, [])

  const handleClearSelections = useCallback(() => {
    setPendingSelections([])
  }, [])

  const handleUpdateNote = useCallback((noteId: string, newText: string, taskType: TaskType) => {
    setNotes((prev) => prev.map(note => {
      if (note.id === noteId) {
        const allTexts = [...note.sourceTexts, newText]
        return {
          ...note,
          sourceTexts: allTexts,
          taskType,
          importantSentences: generateImportantSentences(allTexts),
        }
      }
      return note
    }))
    setPendingSelections([])
  }, [])

  const handleViewSource = useCallback((note: Note) => {
    setHighlightedText(note.sourceTexts[0])
    
    setTimeout(() => {
      setHighlightedText(null)
    }, 3000)
  }, [])

  const handleNoteHover = useCallback((noteId: string | null) => {
    setHoveredNoteId(noteId)
  }, [])

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }, [])

  const handleDeleteNotes = useCallback((noteIds: string[]) => {
    const idsSet = new Set(noteIds)
    setNotes((prev) => prev.filter((n) => !idsSet.has(n.id)))
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">AutoNote</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="h-8 w-8 p-0 md:hidden"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Article Panel */}
        <div className={`flex-1 ${isPanelOpen ? "hidden md:block" : "block"}`}>
          <ArticlePanel 
            onHighlight={handleHighlight}
            onAddSelection={handleAddSelection}
            onClearSelections={handleClearSelections}
            onUpdateNote={handleUpdateNote}
            highlightedText={highlightedText}
            hoveredNote={hoveredNote}
            pendingSelections={pendingSelections}
            findOverlappingNote={findOverlappingNote}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border" />

        {/* Notes Panel */}
        <div 
          className={`
            ${isPanelOpen ? "w-full md:w-[420px]" : "hidden"}
            shrink-0 border-l border-border md:border-l-0
          `}
        >
          <div className="md:hidden flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-medium">Notes</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPanelOpen(false)}
              className="h-8 px-3 text-xs"
            >
              Back to Article
            </Button>
          </div>
          <NotesPanel 
            notes={notes} 
            onViewSource={handleViewSource}
            onNoteHover={handleNoteHover}
            onDeleteNote={handleDeleteNote}
            onDeleteNotes={handleDeleteNotes}
          />
        </div>
      </div>
    </div>
  )
}
