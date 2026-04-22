"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Sparkles, ExternalLink, Trash2, X, Lightbulb, ArrowUpDown } from "lucide-react"

type TaskType = "summary" | "explanation" | "concept" | "question"
type ImportanceLevel = "High" | "Medium" | "Low"
type SortOption =
  | "created-newest"
  | "created-oldest"
  | "importance-high"
  | "importance-low"

interface Note {
  id: string
  sourceText: string
  summary: string
  taskType: TaskType
  importance: ImportanceLevel
  createdAt: Date
}

interface NotesPanelProps {
  notes: Note[]
  onViewSource: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onDeleteNotes: (noteIds: string[]) => void
}

const IMPORTANCE_ORDER: Record<ImportanceLevel, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

const TASK_TYPE_STYLES: Record<TaskType, string> = {
  summary: "bg-blue-50 text-blue-600",
  explanation: "bg-amber-50 text-amber-600",
  concept: "bg-purple-50 text-purple-600",
  question: "bg-rose-50 text-rose-600",
}

const IMPORTANCE_STYLES: Record<ImportanceLevel, string> = {
  High: "bg-red-50 text-red-600 ring-1 ring-red-200",
  Medium: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  Low: "bg-green-50 text-green-600 ring-1 ring-green-200",
}

const fakeSummaries: Record<TaskType, string[]> = {
  summary: [
    "This passage discusses the importance of focused concentration in professional work, suggesting it creates value and improves skills in ways that are difficult to replicate.",
    "The key insight here relates to how deep work acts as a competitive advantage in the modern economy, enabling both skill mastery and high-quality output.",
    "This section explains the neurological basis of skill development through myelination, which occurs during intense focus and deliberate practice.",
  ],
  explanation: [
    "Think of deep work like training for a marathon: just as consistent running builds endurance, focused mental effort strengthens neural pathways. The more you practice without distractions, the faster your brain processes similar tasks.",
    "Myelination is like adding insulation to electrical wires in your brain. When you concentrate deeply, you're essentially upgrading your brain's wiring, making thoughts flow faster and more efficiently along practiced pathways.",
    "The different deep work philosophies are like workout routines: some people do best with intense daily sessions, others need longer recovery periods. Finding your rhythm is key to sustainable focus.",
  ],
  concept: [
    "Key concept extracted from the text.",
    "This highlights an important idea introduced in the passage.",
  ],
  question: [
    "What does this imply about deep work?",
    "How can this idea be applied in real life?",
  ],
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)

  if (diffSecs < 10) return "just now"
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NotesPanel({ notes, onViewSource, onDeleteNote, onDeleteNotes }: NotesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("created-newest")
  const [filterType, setFilterType] = useState<TaskType | "all">("all")

  const filteredNotes = useMemo(() => {
  if (filterType === "all") return notes
  return notes.filter((n) => n.taskType === filterType)
}, [notes, filterType])

  const sortedNotes = useMemo(() => {
    const copy = [...filteredNotes]

    switch (sortOption) {
      case "created-newest":
        return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      case "created-oldest":
        return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      case "importance-high":
        return copy.sort(
          (a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
        )
      case "importance-low":
        return copy.sort(
          (a, b) => IMPORTANCE_ORDER[b.importance] - IMPORTANCE_ORDER[a.importance]
        )
    }
  }, [filteredNotes, sortOption])

  const toggleSelect = (noteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === notes.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(notes.map((n) => n.id)))
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

  const getTaskLabel = (taskType: TaskType) => {
    switch (taskType) {
      case "summary":
        return "Summary"
      case "explanation":
        return "Explanation"
      case "concept":
        return "Key Concept"
      case "question":
        return "Question"
      default:
        return "Summary"
    }
  }

  const getTaskIcon = (taskType: TaskType) => {
    switch (taskType) {
      case "summary":
        return FileText
      case "explanation":
        return Lightbulb
      case "concept":
        return Sparkles
      case "question":
        return FileText
      default:
        return FileText
    }
  }

  const getFakeSummary = (note: Note, index: number) => {
    const summaries = fakeSummaries[note.taskType] ?? fakeSummaries.summary
    return summaries[index % summaries.length]
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
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

        {/* Sort control */}
        {notes.length > 0 && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select
              value={sortOption}
              onValueChange={(v) => setSortOption(v as SortOption)}
            >
              <SelectTrigger className="h-7 text-xs border-border bg-background shadow-none w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-newest" className="text-xs">
                  Newest First
                </SelectItem>
                <SelectItem value="created-oldest" className="text-xs">
                  Oldest First
                </SelectItem>
                <SelectItem value="importance-high" className="text-xs">
                  Importance: High → Low
                </SelectItem>
                <SelectItem value="importance-low" className="text-xs">
                  Importance: Low → High
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filter by type */}
        {notes.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Filter:</span>

            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as TaskType | "all")}
            >
              <SelectTrigger className="h-7 text-xs border border-border bg-background px-2">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="summary" className="text-xs">Summary</SelectItem>
                <SelectItem value="explanation" className="text-xs">Explanation</SelectItem>
                <SelectItem value="concept" className="text-xs">Concept</SelectItem>
                <SelectItem value="question" className="text-xs">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bulk select bar */}
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

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedNotes.length === 0 ? (
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
            {sortedNotes.map((note, index) => {
              const TaskIcon = getTaskIcon(note.taskType)
              return (
                <div
                  key={note.id}
                  className={`bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all relative ${
                    selectedIds.has(note.id) ? "ring-2 ring-primary/20 border-primary/30" : ""
                  }`}
                >
                  {/* Top-right badges row */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {/* Importance badge */}
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                        IMPORTANCE_STYLES[note.importance]
                      }`}
                    >
                      {note.importance}
                    </span>
                    {/* Task type badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${TASK_TYPE_STYLES[note.taskType]}`}
                    >
                      <TaskIcon className="h-3 w-3" />
                      {getTaskLabel(note.taskType)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {isSelecting && (
                      <Checkbox
                        checked={selectedIds.has(note.id)}
                        onCheckedChange={() => toggleSelect(note.id)}
                        className="mt-1 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 pr-24">
                      {/* AI summary */}
                      <div className="flex items-start gap-2 mb-3">
                        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="h-3 w-3 text-accent-foreground" />
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {getFakeSummary(note, index)}
                        </p>
                      </div>

                      <div className="pl-7">
                        {/* Source quote */}
                        <div className="bg-muted/50 rounded-md p-2.5 mb-3 border-l-2 border-border">
                          <p className="text-xs text-muted-foreground line-clamp-2 italic">
                            &ldquo;{note.sourceText}&rdquo;
                          </p>
                        </div>

                        {/* Footer: timestamp + actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatRelativeTime(note.createdAt)}
                          </span>
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
