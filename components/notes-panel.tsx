"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  X, 
  Lightbulb, 
  BookOpen, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Filter
} from "lucide-react"
import type { TaskType, Note } from "@/app/page"

interface NotesPanelProps {
  notes: Note[]
  onViewSource: (note: Note) => void
  onNoteHover: (noteId: string | null) => void
  onDeleteNote: (noteId: string) => void
  onDeleteNotes: (noteIds: string[]) => void
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
    "Deep Work: Professional activities performed in distraction-free concentration that push cognitive capabilities to their limit, creating new value and improving skills.",
    "Myelination: The biological process where focused practice causes fatty tissue to grow around neurons, improving signal transmission speed and accuracy.",
    "Depth Philosophy: A personal framework for scheduling deep work sessions, ranging from monastic (extended isolation) to journalistic (fitting focus wherever possible).",
  ],
  question: [
    "How might you restructure your daily schedule to incorporate at least 2 hours of uninterrupted deep work? What specific distractions would you need to eliminate?",
    "If myelination requires focused repetition, what skill in your current work would benefit most from deliberate practice sessions?",
    "Which deep work philosophy (monastic, bimodal, rhythmic, or journalistic) aligns best with your lifestyle, and how could you implement it this week?",
  ]
}

const taskConfig: Record<TaskType, { label: string; icon: typeof FileText; bgColor: string; textColor: string }> = {
  summary: { label: "Summary", icon: FileText, bgColor: "bg-blue-50", textColor: "text-blue-600" },
  explanation: { label: "Explanation", icon: Lightbulb, bgColor: "bg-amber-50", textColor: "text-amber-600" },
  concept: { label: "Key Concept", icon: BookOpen, bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
  question: { label: "Question", icon: HelpCircle, bgColor: "bg-purple-50", textColor: "text-purple-600" },
}

export function NotesPanel({ notes, onViewSource, onNoteHover, onDeleteNote, onDeleteNotes }: NotesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [expandedExplainIds, setExpandedExplainIds] = useState<Set<string>>(new Set())
  const [activeFilters, setActiveFilters] = useState<Set<TaskType>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const toggleFilter = (taskType: TaskType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(taskType)) {
        next.delete(taskType)
      } else {
        next.add(taskType)
      }
      return next
    })
  }

  const clearFilters = () => {
    setActiveFilters(new Set())
  }

  const filteredNotes = activeFilters.size === 0 
    ? notes 
    : notes.filter((note) => activeFilters.has(note.taskType))

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

  const toggleExplain = (noteId: string) => {
    setExpandedExplainIds((prev) => {
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

  const getFakeSummary = (note: Note, index: number) => {
    const summaries = fakeSummaries[note.taskType]
    return summaries[index % summaries.length]
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Notes</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filteredNotes.length}{activeFilters.size > 0 ? `/${notes.length}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {notes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-7 px-2 text-xs ${
                  activeFilters.size > 0 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filter
                {activeFilters.size > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {activeFilters.size}
                  </span>
                )}
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

        {/* Filter options */}
        {showFilters && notes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Filter by label</span>
              {activeFilters.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(taskConfig) as TaskType[]).map((taskType) => {
                const config = taskConfig[taskType]
                const TaskIcon = config.icon
                const isActive = activeFilters.has(taskType)
                const count = notes.filter((n) => n.taskType === taskType).length
                
                return (
                  <button
                    key={taskType}
                    onClick={() => toggleFilter(taskType)}
                    disabled={count === 0}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive 
                        ? `${config.bgColor} ${config.textColor} ring-2 ring-offset-1 ring-current/20` 
                        : count === 0
                        ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <TaskIcon className="h-3 w-3" />
                    {config.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      isActive ? "bg-white/50" : "bg-background"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
        ) : filteredNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No matching notes</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Try adjusting your filters to see more notes
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="mt-3 text-xs"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note, index) => {
              const config = taskConfig[note.taskType]
              const TaskIcon = config.icon
              const isExplainExpanded = expandedExplainIds.has(note.id)
              
              return (
                <div 
                  key={note.id}
                  className={`bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all relative ${
                    selectedIds.has(note.id) ? "ring-2 ring-primary/20 border-primary/30" : ""
                  }`}
                  onMouseEnter={() => onNoteHover(note.id)}
                  onMouseLeave={() => onNoteHover(null)}
                >
                  {/* Task Type Tag */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${config.bgColor} ${config.textColor}`}>
                      <TaskIcon className="h-3 w-3" />
                      {config.label}
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
                    <div className="flex-1 min-w-0 pr-20">
                      <div className="flex items-start gap-2 mb-3">
                        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="h-3 w-3 text-accent-foreground" />
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {getFakeSummary(note, index)}
                        </p>
                      </div>
                      
                      <div className="pl-7">
                        {/* Source text quotes */}
                        <div className="space-y-2 mb-3">
                          {note.sourceTexts.map((text, idx) => (
                            <div key={idx} className="bg-muted/50 rounded-md p-2.5 border-l-2 border-border">
                              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                &ldquo;{text}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Why this note section */}
                        <div className="mb-3">
                          <button
                            onClick={() => toggleExplain(note.id)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Info className="h-3 w-3" />
                            <span>Why this note?</span>
                            {isExplainExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                          
                          {isExplainExpanded && (
                            <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border">
                              <p className="text-xs text-muted-foreground mb-2">
                                This note was generated based on your highlighted text and key supporting sentences:
                              </p>
                              {note.importantSentences.length > 0 && (
                                <ul className="space-y-1.5">
                                  {note.importantSentences.map((sentence, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs">
                                      <span className={`inline-block w-2 h-2 rounded-full mt-1 shrink-0 ${
                                        sentence.importance === "high" ? "bg-amber-400" : "bg-amber-200"
                                      }`} />
                                      <span className="text-muted-foreground">
                                        <span className="font-medium text-foreground/80">
                                          {sentence.importance === "high" ? "High" : "Medium"} relevance:
                                        </span>{" "}
                                        &ldquo;{sentence.text.slice(0, 80)}...&rdquo;
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
