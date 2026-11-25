import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Atom, BookOpen, Calculator, Download, FileText, FlaskConical, LogOut, Share2, Target, Timer, TrendingUp, Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  completeNote, getAttempt, getDashboard, getNote, startQuiz,
  type Attempt, type Note, type Student, type Topic,
} from "@/lib/prep-api";
import { Logo } from "./Logo";
import { OnlineResources } from "./OnlineResources";
import { PracticeAttempt } from "./PracticeAttempt";

const styles = {
  physics: { icon: Atom, accent: "from-blue-500 to-blue-600", border: "border-blue-200" },
  chemistry: { icon: FlaskConical, accent: "from-green-500 to-green-600", border: "border-green-200" },
  mathematics: { icon: Calculator, accent: "from-purple-500 to-purple-600", border: "border-purple-200" },
};

type ResourcePanel = "practice" | "notes" | "videos";

type Panel =
  | { kind: ResourcePanel; title: string; topics: Topic[] }
  | { kind: "note"; note: Note }
  | { kind: "attempt"; attempt: Attempt };

export function Dashboard({ user, onLogout }: { user: Student; onLogout: () => Promise<void> }) {
  const queryClient = useQueryClient();
  const { data, error: dashboardError, isPending, refetch } = useQuery({
    queryKey: ["dashboard", user.email], queryFn: getDashboard, retry: false,
  });
  const [panel, setPanel] = useState<Panel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const refreshDashboard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["dashboard", user.email] });
  }, [queryClient, user.email]);

  const perform = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const showResources = (kind: ResourcePanel, title: string, topics: Topic[]) => {
    setError("");
    setPanel({ kind, title, topics });
  };
  const openAttempt = (id: string) => perform(async () => setPanel({ kind: "attempt", attempt: await getAttempt(id) }));
  const share = () => perform(async () => {
    if (navigator.share) {
      await navigator.share({ title: "Achievers Club KCET Prep", url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("Link copied.");
    }
  });

  const stats = data && [
    { label: "Practice sets completed", value: data.stats.completedAttempts, icon: Target, color: "text-brand-red" },
    { label: "Concept notes read", value: data.stats.notesRead, icon: BookOpen, color: "text-brand-green" },
    { label: "Overall accuracy", value: data.stats.accuracy === null ? "—" : `${data.stats.accuracy}%`, icon: TrendingUp, color: "text-brand-black" },
    { label: "Topics to revisit", value: data.stats.weakTopics, icon: Timer, color: "text-brand-red" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-white">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between gap-3 items-center">
          <Logo />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={share}><Share2 className="w-4 h-4 mr-2" />Share</Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/study-plan.pdf"><Download className="w-4 h-4 mr-2" />Study plan</a>
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => perform(onLogout)}>
              <LogOut className="w-4 h-4 mr-2" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-black mb-2">Welcome, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Review a concept, take a timed practice set, and track what to revisit.</p>
          {status && <p role="status" className="mt-2">{status}</p>}
          {error && !panel && <p role="alert" className="text-destructive mt-2">{error}</p>}
        </div>
        {isPending && <p role="status">Loading your progress…</p>}
        {dashboardError && (
          <div role="alert" className="space-y-2">
            <p className="text-destructive">{dashboardError.message}</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div><p className="text-sm text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
                    <Icon className={`w-7 h-7 ${color}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
            <section aria-labelledby="subjects">
              <h2 id="subjects" className="text-2xl font-bold text-brand-black mb-4">Your KCET subjects</h2>
              {data.subjects.length === 0 && <p>No study material has been published yet.</p>}
              <div className="grid gap-5 md:grid-cols-3">
                {data.subjects.map((subject) => {
                  const { icon: Icon, accent, border } = styles[subject.id] ?? styles.physics;
                  const weakTopics = subject.topics.filter((topic) => topic.weak);
                  return (
                    <Card key={subject.id} className={`border-2 ${border}`}>
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${accent} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl text-brand-black">{subject.name}</CardTitle>
                        <CardDescription>{subject.topics.map((topic) => topic.title).join(" · ") || "Topics coming soon"}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {weakTopics.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {weakTopics.map((topic) => <Badge key={topic.id} variant="secondary">{topic.title} · {topic.accuracy}%</Badge>)}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" className="flex-1 bg-brand-red hover:bg-brand-red/90" disabled={busy}
                            onClick={() => showResources("practice", subject.name, subject.topics)}>
                            <FileText className="w-4 h-4 mr-1" />Practice
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" disabled={busy}
                            onClick={() => showResources("notes", subject.name, subject.topics)}>
                            <BookOpen className="w-4 h-4 mr-1" />Notes
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" disabled={busy}
                            onClick={() => showResources("videos", subject.name, subject.topics)}>
                            <Video className="w-4 h-4 mr-1" />Videos
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {data.recommendations.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader><CardTitle className="text-xl">What to revisit</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.recommendations.map((item) => (
                      <li key={`${item.subject}/${item.topic}`}><strong>{item.topic}</strong> · {item.subject} · {item.accuracy}% accuracy</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-xl">Practice history</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!data.activeAttempts.length && !data.recentAttempts.length && <p>Start a practice set to see your results here.</p>}
                {data.activeAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex flex-wrap gap-2 justify-between items-center border-b pb-2">
                    <span>{attempt.quizTitle}</span>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => openAttempt(attempt.id)}>Resume</Button>
                  </div>
                ))}
                {data.recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex flex-wrap gap-2 justify-between items-center border-b pb-2">
                    <span>{attempt.quizTitle} · {attempt.score}/{attempt.questionsCount}</span>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => openAttempt(attempt.id)}>Review</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Dialog open={panel !== null} onOpenChange={(open) => {
        if (!open && !busy) { setPanel(null); setError(""); refreshDashboard(); }
      }}>
        {panel && (
          <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{panel.kind === "attempt" ? panel.attempt.quizTitle : panel.kind === "note" ? panel.note.title : panel.title}</DialogTitle>
              <DialogDescription>
                {panel.kind === "attempt" ? "Timed practice results and answers"
                  : panel.kind === "note" ? panel.note.topic
                  : panel.kind === "notes" ? "Concept notes and online readings"
                  : panel.kind === "videos" ? "Video tutorials by topic" : "Timed practice sets"}
              </DialogDescription>
            </DialogHeader>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {"topics" in panel && (
              <div className="space-y-4">
                {(!panel.topics.length || (panel.kind === "practice" && !panel.topics.some((topic) => topic.quizzes.length))) &&
                  <p>No material has been published here yet.</p>}
                {panel.topics.map((topic) => {
                  const resources = panel.kind === "notes" ? topic.notes : panel.kind === "practice" ? topic.quizzes : [];
                  if (panel.kind === "practice" && !resources.length) return null;
                  return (
                    <section key={topic.id} className="space-y-2">
                      <h3 className="font-semibold">{topic.title}</h3>
                      {resources.map((resource) => (
                        <div key={resource.id} className="flex flex-wrap gap-2 justify-between items-center border rounded-md p-2">
                          <span>{resource.title} {"completed" in resource && resource.completed && "✓"}</span>
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => perform(async () => {
                            if (panel.kind === "notes") {
                              setPanel({ kind: "note", note: await getNote(resource.id) });
                            } else {
                              setPanel({ kind: "attempt", attempt: await startQuiz(resource.id) });
                            }
                          })}>{panel.kind === "notes" ? "Read" : "Start or resume"}</Button>
                        </div>
                      ))}
                      {panel.kind !== "practice" && (
                        <OnlineResources topic={topic.title} resources={topic.resources}
                          kind={panel.kind === "videos" ? "video" : "reading"} />
                      )}
                    </section>
                  );
                })}
              </div>
            )}
            {panel.kind === "note" && (
              <>
                <p className="whitespace-pre-wrap">{panel.note.body}</p>
                <Button disabled={busy || panel.note.completed} onClick={() => perform(async () => {
                  setPanel({ kind: "note", note: await completeNote(panel.note.id) });
                  refreshDashboard();
                })}>{panel.note.completed ? "Completed" : "Mark as read"}</Button>
                <section aria-label="Related online resources" className="space-y-2 border-t pt-4">
                  <h3 className="font-semibold">Related online resources</h3>
                  <OnlineResources topic={panel.note.topic} resources={panel.note.resources} />
                </section>
              </>
            )}
            {panel.kind === "attempt" && <PracticeAttempt key={panel.attempt.id} initial={panel.attempt} onGraded={refreshDashboard} />}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
