"use client"

import { useState, useCallback } from "react"
import { ArticlePanel } from "@/components/article-panel"
import { NotesPanel } from "@/components/notes-panel"
import { FileText, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export type TaskType = "summary" | "explanation" | "concept" | "question"
export type ImportanceLevel = "High" | "Medium" | "Low"

export interface ImportantSentence {
  text: string
  importance: "high" | "medium"
}

export interface Note {
  id: string
  sourceText: string
  sourceTexts: string[]
  summary: string
  taskType: TaskType
  importance: ImportanceLevel
  createdAt: Date
  importantSentences?: ImportantSentence[]
}

function deriveImportance(text: string, taskType: TaskType): ImportanceLevel {
  const wordCount = text.trim().split(/\s+/).length
  if (taskType === "summary" && wordCount >= 20) return "High"
  if (taskType === "explanation") return "High"
  if (wordCount <= 8) return "Low"
  return "Medium"
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [highlightedText, setHighlightedText] = useState<string | null>(null)
  const [hoveredNote, setHoveredNote] = useState<Note | null>(null)
  const [pendingSelections, setPendingSelections] = useState<string[]>([])
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  const handleHighlight = useCallback((text: string, taskType: TaskType) => {
    const sourceTexts = pendingSelections.length > 0 ? [...pendingSelections, text] : [text]

    const newNote: Note = {
      id: crypto.randomUUID(),
      sourceText: sourceTexts.join(" "),
      sourceTexts,
      summary: "",
      taskType,
      importance: deriveImportance(text, taskType),
      createdAt: new Date(),
      importantSentences: [],
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
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              sourceText: `${note.sourceText} ${newText}`.trim(),
              sourceTexts: [...(note.sourceTexts ?? [note.sourceText]), newText],
              taskType,
              importance: deriveImportance(newText, taskType),
            }
          : note
      )
    )
  }, [])

  const findOverlappingNote = useCallback((texts: string[]) => {
    return notes.find((note) =>
      texts.some((text) =>
        (note.sourceTexts ?? [note.sourceText]).includes(text)
      )
    ) ?? null
  }, [notes])

  const handleViewSource = useCallback((note: Note) => {
    setHighlightedText(note.sourceText)
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

      <div className="flex-1 flex overflow-hidden">
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

        <div className="hidden md:block w-px bg-border" />

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
            onHoverNote={setHoveredNote}
          />
        </div>
      </div>
    </div>
  )
}