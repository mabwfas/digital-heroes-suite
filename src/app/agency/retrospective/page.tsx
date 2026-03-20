"use client";

import { useState, useMemo } from "react";
import { MessageCircle, Plus, Trash2, ThumbsUp, ArrowUp, ArrowDown, CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface RetroItem {
  id: string;
  text: string;
  category: "good" | "bad" | "action";
  votes: number;
  done: boolean;
  author: string;
}

interface Sprint {
  id: string;
  name: string;
  date: string;
  items: RetroItem[];
}

export default function RetrospectivePage() {
  const [sprints, setSprints] = useLocalStorage<Sprint[]>("agency-retro-sprints", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSprintName, setNewSprintName] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<"good" | "bad" | "action">("good");
  const [newItemAuthor, setNewItemAuthor] = useState("");

  const activeActions = useMemo(() => {
    return sprints.flatMap((s) =>
      s.items
        .filter((i) => i.category === "action" && !i.done)
        .map((i) => ({ ...i, sprintName: s.name, sprintId: s.id }))
    );
  }, [sprints]);

  function addSprint() {
    if (!newSprintName.trim()) return;
    setSprints((prev) => [
      { id: generateId(), name: newSprintName.trim(), date: new Date().toISOString().split("T")[0], items: [] },
      ...prev,
    ]);
    setNewSprintName("");
  }

  function deleteSprint(id: string) {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  }

  function addItem(sprintId: string) {
    if (!newItemText.trim()) return;
    const item: RetroItem = {
      id: generateId(),
      text: newItemText.trim(),
      category: newItemCategory,
      votes: 0,
      done: false,
      author: newItemAuthor.trim(),
    };
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, items: [...s.items, item] } : s))
    );
    setNewItemText("");
  }

  function removeItem(sprintId: string, itemId: string) {
    setSprints((prev) =>
      prev.map((s) =>
        s.id === sprintId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      )
    );
  }

  function voteItem(sprintId: string, itemId: string) {
    setSprints((prev) =>
      prev.map((s) =>
        s.id === sprintId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, votes: i.votes + 1 } : i)) }
          : s
      )
    );
  }

  function toggleDone(sprintId: string, itemId: string) {
    setSprints((prev) =>
      prev.map((s) =>
        s.id === sprintId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : s
      )
    );
  }

  const categoryConfig = {
    good: { label: "Went Well", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: "text-emerald-500" },
    bad: { label: "Didn't Go Well", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: "text-red-500" },
    action: { label: "Action Item", color: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: "text-violet-500" },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sprint Retrospective"
        description="Record what went well, what didn't, and action items. Vote on items, track action items across sprints."
        icon={MessageCircle}
        badge="Agency"
        replaces="Retro boards / FunRetro"
      />

      {activeActions.length > 0 && (
        <Card className="border-violet-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-violet-600 uppercase tracking-wider">
              Open Action Items ({activeActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activeActions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleDone(a.sprintId, a.id)}
                  className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted/50 text-sm"
                >
                  <Circle className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="flex-1">{a.text}</span>
                  <Badge variant="outline" className="text-[10px]">{a.sprintName}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Input value={newSprintName} onChange={(e) => setNewSprintName(e.target.value)} placeholder="Sprint name (e.g. Sprint 12)" className="flex-1" onKeyDown={(e) => e.key === "Enter" && addSprint()} />
        <Button onClick={addSprint} disabled={!newSprintName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />New Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No retrospectives yet</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const isExpanded = expandedId === sprint.id;
            const sortedItems = [...sprint.items].sort((a, b) => b.votes - a.votes);
            const goodItems = sortedItems.filter((i) => i.category === "good");
            const badItems = sortedItems.filter((i) => i.category === "bad");
            const actionItems = sortedItems.filter((i) => i.category === "action");

            return (
              <Card key={sprint.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : sprint.id)}>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">{sprint.name}</span>
                      <span className="text-xs text-muted-foreground">{sprint.date}</span>
                      <Badge variant="secondary" className="text-xs">{sprint.items.length} items</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteSprint(sprint.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-2 items-end">
                        <Input value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add item..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && addItem(sprint.id)} />
                        <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value as RetroItem["category"])} className="flex h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                          <option value="good">Went Well</option>
                          <option value="bad">Didn&#39;t Go Well</option>
                          <option value="action">Action Item</option>
                        </select>
                        <Input value={newItemAuthor} onChange={(e) => setNewItemAuthor(e.target.value)} placeholder="Author" className="w-24" />
                        <Button size="sm" onClick={() => addItem(sprint.id)}><Plus className="h-3.5 w-3.5" /></Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(["good", "bad", "action"] as const).map((cat) => {
                          const items = cat === "good" ? goodItems : cat === "bad" ? badItems : actionItems;
                          const cfg = categoryConfig[cat];
                          return (
                            <div key={cat} className={`rounded-lg border p-3 ${cfg.color}`}>
                              <p className="text-xs font-medium mb-2 uppercase tracking-wider">{cfg.label} ({items.length})</p>
                              <div className="space-y-1">
                                {items.map((item) => (
                                  <div key={item.id} className="flex items-start gap-2 p-2 rounded bg-background/50">
                                    {cat === "action" ? (
                                      <button onClick={() => toggleDone(sprint.id, item.id)} className="mt-0.5 shrink-0">
                                        {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                      </button>
                                    ) : null}
                                    <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {item.author && <span className="text-[10px] text-muted-foreground">{item.author}</span>}
                                      <button onClick={() => voteItem(sprint.id, item.id)} className="flex items-center gap-0.5 text-xs hover:text-violet-600">
                                        <ThumbsUp className="h-3 w-3" />{item.votes}
                                      </button>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive" onClick={() => removeItem(sprint.id, item.id)}>
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
