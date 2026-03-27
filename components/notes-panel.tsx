"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Sparkles, ExternalLink, Trash2, X } from "lucide-react"

interface Note {
  id: string
  sourceText: string
  summary: string
  range: Range
  createdAt: Date
}

interface NotesPanelProps {
  notes: Note[]
  onViewSource: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onDeleteNotes: (noteIds: string[]) => void
}

const fakeSummaries = [
  "This passage discusses the importance of focused concentration in professional work, suggesting it creates value and improves skills in ways that are difficult to replicate.",
  "The key insight here relates to how deep work acts as a competitive advantage in the modern economy, enabling both skill mastery and high-quality output.",
  "This section explains the neurological basis of skill development through myelination, which occurs during intense focus and deliberate practice.",
  "The argument presented emphasizes the biological mechanism behind why concentrated practice leads to skill improvement over time.",
  "This part outlines different philosophical approaches to scheduling deep work, from complete dedication to fitting it into available time slots.",
  "The main point addresses how constant digital stimulation may impair our ability to focus deeply when needed.",
]

export function NotesPanel({ notes, onViewSource, onDeleteNote, onDeleteNotes }: NotesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)

  const toggleSelect = (noteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === notes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notes.map((n) => n.id)))
    }
  }

  const handleDeleteSelected = () => {
    onDeleteNotes(Array.from(selectedIds))
    setSelectedIds(new Set())
    setIsSelecting(false)
  }

  const cancelSelection = () => {
    setSelectedIds(new Set())
    setIsSelecting(false)
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Notes</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          </div>
          {notes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSelecting(!isSelecting)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isSelecting ? "Done" : "Select"}
            </Button>
          )}
        </div>

        {isSelecting && notes.length > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedIds.size === notes.length && notes.length > 0}
                onCheckedChange={selectAll}
              />
              <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                Select all ({selectedIds.size} selected)
              </label>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelSelection}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No notes yet</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Highlight text in the article to generate AI-powered notes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <div 
                key={note.id}
                className={`bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all ${
                  selectedIds.has(note.id) ? "ring-2 ring-primary/20 border-primary/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSelecting && (
                    <Checkbox
                      checked={selectedIds.has(note.id)}
                      onCheckedChange={() => toggleSelect(note.id)}
                      className="mt-1 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-5 h-5 rounded bg-accent flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-3 w-3 text-accent-foreground" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {fakeSummaries[index % fakeSummaries.length]}
                      </p>
                    </div>
                    
                    <div className="pl-7">
                      <div className="bg-muted/50 rounded-md p-2.5 mb-3 border-l-2 border-border">
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          &ldquo;{note.sourceText}&rdquo;
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewSource(note)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          View Source
                        </Button>
                        {!isSelecting && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteNote(note.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
