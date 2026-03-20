"use client";

import { useState, useMemo } from "react";
import {
  Vote,
  Plus,
  Trash2,
  Clock,
  Check,
  BarChart3,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  anonymous: boolean;
  deadline: string;
  createdAt: string;
  votedUsers: string[];
}

export default function PollsPage() {
  const [polls, setPolls] = useLocalStorage<Poll[]>("team-polls", []);
  const [currentUser] = useLocalStorage<string>("team-polls-user", "Me");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ question: "", options: ["", ""], anonymous: false, deadline: "" });

  const activePollsList = useMemo(() => polls.filter((p) => !p.deadline || new Date(p.deadline + "T23:59:59") >= new Date()), [polls]);
  const historyPollsList = useMemo(() => polls.filter((p) => p.deadline && new Date(p.deadline + "T23:59:59") < new Date()), [polls]);

  function openCreate() {
    setForm({ question: "", options: ["", ""], anonymous: false, deadline: "" });
    setDialogOpen(true);
  }

  function addOption() {
    if (form.options.length >= 6) return;
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }

  function removeOption(idx: number) {
    if (form.options.length <= 2) return;
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  }

  function updateOption(idx: number, text: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => i === idx ? text : o) }));
  }

  function save() {
    if (!form.question.trim() || form.options.filter((o) => o.trim()).length < 2) return;
    setPolls((prev) => [
      {
        id: generateId(),
        question: form.question.trim(),
        options: form.options.filter((o) => o.trim()).map((o) => ({ id: generateId(), text: o.trim(), votes: 0 })),
        anonymous: form.anonymous,
        deadline: form.deadline,
        createdAt: new Date().toISOString(),
        votedUsers: [],
      },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function vote(pollId: string, optionId: string) {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        if (p.votedUsers.includes(currentUser)) return p;
        return {
          ...p,
          options: p.options.map((o) => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
          votedUsers: [...p.votedUsers, currentUser],
        };
      })
    );
  }

  function deletePoll(id: string) {
    setPolls((prev) => prev.filter((p) => p.id !== id));
  }

  function renderPoll(poll: Poll) {
    const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
    const hasVoted = poll.votedUsers.includes(currentUser);
    const isExpired = poll.deadline && new Date(poll.deadline + "T23:59:59") < new Date();
    const maxVotes = Math.max(...poll.options.map((o) => o.votes));

    return (
      <Card key={poll.id} className="overflow-hidden hover:border-violet-500/30 transition-colors">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-base">{poll.question}</p>
              <div className="flex items-center gap-2 mt-1">
                {poll.anonymous && <Badge variant="secondary" className="text-[10px]">Anonymous</Badge>}
                {poll.deadline && (
                  <span className={`text-xs flex items-center gap-1 ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                    <Clock className="h-3 w-3" />{isExpired ? "Ended" : `Ends ${new Date(poll.deadline + "T12:00:00").toLocaleDateString()}`}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 shrink-0" onClick={() => deletePoll(poll.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>

          <div className="space-y-2">
            {poll.options.map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isWinner = opt.votes === maxVotes && maxVotes > 0;
              return (
                <div key={opt.id}>
                  {(!hasVoted && !isExpired) ? (
                    <button
                      onClick={() => vote(poll.id, opt.id)}
                      className="w-full text-left rounded-lg border border-border/60 hover:border-violet-500/50 px-4 py-2.5 transition-colors"
                    >
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  ) : (
                    <div className="rounded-lg bg-muted/30 px-4 py-2.5 relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 transition-all ${isWinner ? "bg-violet-500/15" : "bg-muted/50"}`}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm ${isWinner ? "font-medium" : ""}`}>{opt.text}</span>
                        <span className="text-xs font-medium text-muted-foreground">{pct}% ({opt.votes})</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {hasVoted && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0"><Check className="h-3 w-3 mr-1" />Voted</Badge>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Polls & Surveys"
        description="Create polls, vote on team decisions, and view results"
        icon={Vote}
        badge="Team"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Polls", value: polls.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Active", value: activePollsList.length, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Ended", value: historyPollsList.length, color: "text-muted-foreground" },
          { label: "Total Votes", value: polls.reduce((s, p) => s + p.options.reduce((ss, o) => ss + o.votes, 0), 0), color: "text-pink-600 dark:text-pink-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="active">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="active">Active Polls</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Create Poll
          </Button>
        </div>

        <TabsContent value="active" className="space-y-3">
          {activePollsList.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><Vote className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No active polls.</p><Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Poll</Button></CardContent></Card>
          ) : activePollsList.map(renderPoll)}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {historyPollsList.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No ended polls yet.</p></CardContent></Card>
          ) : historyPollsList.map(renderPoll)}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Poll</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Question *</Label><Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="What do you want to ask?" className="mt-1" /></div>
            <div>
              <Label>Options (2-6) *</Label>
              <div className="space-y-2 mt-1">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1" />
                    {form.options.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 shrink-0" onClick={() => removeOption(i)}><X className="h-4 w-4" /></Button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <Button variant="outline" size="sm" onClick={addOption}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Option</Button>
                )}
              </div>
            </div>
            <div><Label>Deadline (optional)</Label><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="mt-1" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.anonymous} onCheckedChange={(v) => setForm((f) => ({ ...f, anonymous: v }))} />
              <Label>Anonymous voting</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.question.trim() || form.options.filter((o) => o.trim()).length < 2} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Create Poll</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
