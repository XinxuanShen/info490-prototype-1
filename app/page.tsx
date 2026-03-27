"use client"

import { useState, useCallback } from "react"
import { ArticlePanel } from "@/components/article-panel"
import { NotesPanel } from "@/components/notes-panel"
import { FileText, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type TaskType = "summary" | "explanation"

interface Note {
  id: string
  sourceText: string
  summary: string
  taskType: TaskType
  createdAt: Date
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [highlightedText, setHighlightedText] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  const handleHighlight = useCallback((text: string, taskType: TaskType) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      sourceText: text,
      summary: "",
      taskType,
      createdAt: new Date(),
    }
    
    setNotes((prev) => [newNote, ...prev])
  }, [])

  const handleViewSource = useCallback((note: Note) => {
    setHighlightedText(note.sourceText)
    
    // Clear the highlight after a few seconds
    setTimeout(() => {
      setHighlightedText(null)
    }, 3000)
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
          <span className="text-sm font-medium text-foreground">Article Reader</span>
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
            highlightedText={highlightedText}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border" />

        {/* Notes Panel */}
        <div 
          className={`
            ${isPanelOpen ? "w-full md:w-96" : "hidden"}
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
            onDeleteNote={handleDeleteNote}
            onDeleteNotes={handleDeleteNotes}
          />
        </div>
      </div>
    </div>
  )
}
