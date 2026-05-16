"use client"

import Image from "next/image"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Sparkles, ExternalLink, Trash2, X, Lightbulb, Download } from "lucide-react"

type TaskType = "summary" | "explanation" | "concept" | "question"

interface Note {
  id: string
  sourceText: string
  sourceTexts?: string[]
  summary: string
  taskType: TaskType
  createdAt: Date
  articlePosition: number
}

interface NotesPanelProps {
  notes: Note[]
  articleFullText?: string
  onViewSource: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onDeleteNotes: (noteIds: string[]) => void
  onUpdateNoteLabels: (
    noteId: string,
    updates: Partial<Pick<Note, "taskType">>
  ) => void
  onHoverNote?: (note: Note | null) => void
}

const TASK_TYPE_STYLES: Record<TaskType, string> = {
  summary: "bg-blue-50 text-blue-600",
  explanation: "bg-amber-50 text-amber-600",
  concept: "bg-purple-50 text-purple-600",
  question: "bg-rose-50 text-rose-600",
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

function getFakeSummary(note: Note, index: number): string {
  const summaries = fakeSummaries[note.taskType] ?? fakeSummaries.summary
  return summaries[index % summaries.length]
}


// ── Export helpers ───────────────────────────────────────────────────────────
function exportNotes(notes: Note[], sortedNotes: Note[]): void {
  const lines: string[] = [
    "# Article Notes Export",
    `Exported: ${new Date().toLocaleString()}`,
    `Total notes: ${sortedNotes.length}`,
    "",
    "---",
    "",
  ]

  sortedNotes.forEach((note, idx) => {
    const summary = getFakeSummary(note, idx)
    const taskLabel =
      note.taskType === "summary" ? "Summary"
      : note.taskType === "explanation" ? "Explanation"
      : note.taskType === "concept" ? "Key Points"
      : "Question"

    lines.push(`## Note ${idx + 1} — ${taskLabel}`)
    lines.push("")
    lines.push(`**AI Note:** ${summary}`)
    lines.push("")
    lines.push(`**Source excerpt:** "${note.sourceText}"`)
    lines.push("")
    lines.push(`*Added: ${formatRelativeTime(note.createdAt)}*`)
    lines.push("")
    lines.push("---")
    lines.push("")
  })

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `article-notes-${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function NotesPanel({
  notes,
  articleFullText,
  onViewSource,
  onDeleteNote,
  onDeleteNotes,
  onUpdateNoteLabels,
  onHoverNote,
}: NotesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [filterType, setFilterType] = useState<TaskType | "all">("all")
  const [showMindMap, setShowMindMap] = useState(false)

  // Always sort by article position (stable, never reshuffles)
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => a.articlePosition - b.articlePosition),
    [notes]
  )

  const filteredNotes = useMemo(() => {
    if (filterType === "all") return sortedNotes
    return sortedNotes.filter((n) => n.taskType === filterType)
  }, [sortedNotes, filterType])

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
      case "summary": return "Summary"
      case "explanation": return "Explanation"
      case "concept": return "Key Points"
      case "question": return "Question"
      default: return "Summary"
    }
  }

  const getTaskIcon = (taskType: TaskType) => {
    switch (taskType) {
      case "summary": return FileText
      case "explanation": return Lightbulb
      case "concept": return Sparkles
      case "question": return FileText
      default: return FileText
    }
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMindMap(true)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              Mind Map
            </Button>
            {notes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportNotes(notes, sortedNotes)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Export notes as Markdown"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
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
        </div>

        {/* Filter by type */}
        {notes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
<select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TaskType | "all")}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="all">All</option>
              <option value="summary">Summary</option>
              <option value="explanation">Explanation</option>
              <option value="concept">Key Points</option>
              <option value="question">Question</option>
            </select>
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
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
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
            {filteredNotes.map((note, index) => {
              const TaskIcon = getTaskIcon(note.taskType)
              return (
                <div
                  key={note.id}
                  id={`note-${note.id}`}
                  onMouseEnter={() => onHoverNote?.(note)}
                  onMouseLeave={() => onHoverNote?.(null)}
                  className={`bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all relative ${
                    selectedIds.has(note.id) ? "ring-2 ring-primary/20 border-primary/30" : ""
                  }`}
                >
                  {/* Task type label row */}
                  <div className="flex items-center justify-end gap-1.5 mb-3">
<select
                      value={note.taskType}
                      onChange={(e) =>
                        onUpdateNoteLabels(note.id, { taskType: e.target.value as TaskType })
                      }
                      className={`h-7 w-[112px] rounded-md px-2 text-[10px] font-medium border-0 shadow-none outline-none ${TASK_TYPE_STYLES[note.taskType]}`}
                    >
                      <option value="summary">Summary</option>
                      <option value="explanation">Explanation</option>
                      <option value="concept">Key Points</option>
                      <option value="question">Question</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-3">
                    {isSelecting && (
                      <Checkbox
                        checked={selectedIds.has(note.id)}
                        onCheckedChange={() => toggleSelect(note.id)}
                        className="mt-1 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
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
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onHoverNote?.(null)
                                  onDeleteNote(note.id)
                                }}
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

      {showMindMap && (
        <div className="fixed inset-0 z-[9999] bg-background">
          <div className="absolute top-0 left-0 right-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h2 className="text-xl font-semibold">Mind Map Overview</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMindMap(false)}
              aria-label="Close mind map"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute inset-0 pt-16 flex items-center justify-center overflow-auto bg-background p-6">
            <Image
              src="/mindmap-placeholder.png"
              alt="Mind Map Overview"
              width={900}
              height={1600}
              className="h-[calc(100vh-6rem)] w-auto max-w-[96vw] object-contain"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}
