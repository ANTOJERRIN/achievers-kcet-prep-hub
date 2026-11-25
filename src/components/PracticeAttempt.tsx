import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAttempt, saveAnswer, submitAttempt, type Attempt } from "@/lib/prep-api";

function readClock(attempt: Attempt) {
  return { attempt, localDeadline: Date.now() + Date.parse(attempt.deadline) - Date.parse(attempt.serverTime) };
}

export function PracticeAttempt({ initial, onGraded }: { initial: Attempt; onGraded: () => void }) {
  const [{ attempt, localDeadline }, setAttempt] = useState(() => readClock(initial));
  const [now, setNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingAnswer, setPendingAnswer] = useState<{ questionId: number; selected: number | null } | null>(null);
  const remaining = Math.max(0, Math.ceil((localDeadline - now) / 1000));
  const graded = attempt.status === "graded";

  useEffect(() => {
    if (graded) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [graded]);

  useEffect(() => {
    if (graded || remaining !== 0 || saving || error) return;
    let current = true;
    getAttempt(attempt.id).then((result) => {
      if (!current) return;
      setNow(Date.now());
      setAttempt(readClock(result));
      if (result.status === "graded") onGraded();
    }).catch((failure) => {
      if (current) setError(failure.message);
    });
    return () => { current = false; };
  }, [attempt.id, error, graded, onGraded, remaining, saving]);

  const update = async (action: () => Promise<Attempt>) => {
    setSaving(true);
    setError("");
    try {
      const result = await action();
      setNow(Date.now());
      setAttempt(readClock(result));
      if (result.status === "graded") onGraded();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const choose = async (questionId: number, selected: number | null) => {
    setPendingAnswer({ questionId, selected });
    await update(() => saveAnswer(attempt.id, questionId, selected, attempt.revision));
    setPendingAnswer(null);
  };

  return (
    <div className="space-y-4">
      {graded ? (
        <p role="status" className="rounded bg-muted p-3 font-medium">
          Score {attempt.score}/{attempt.questionsCount} · {attempt.answeredCount} answered · {attempt.elapsedSeconds}s
        </p>
      ) : (
        <div className="sticky top-0 z-10 flex justify-between rounded bg-background p-2 border">
          <span>{Object.keys(attempt.answers).length}/{attempt.questionsCount} saved</span>
          <span role="timer" className="font-semibold tabular-nums">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} remaining
          </span>
        </div>
      )}
      {attempt.questions.map((question, index) => {
        const selected = pendingAnswer?.questionId === question.id
          ? pendingAnswer.selected ?? undefined
          : attempt.answers[question.id];
        return (
          <fieldset key={question.id} disabled={!graded && (saving || remaining === 0)} className="space-y-2 border-b pb-4">
            <legend className="font-medium">{index + 1}. {question.prompt}</legend>
            {question.options.map((option, optionIndex) => (
              <label key={optionIndex} className="flex gap-2 items-baseline">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selected === optionIndex}
                  disabled={graded}
                  onChange={() => choose(question.id, optionIndex)}
                />
                <span>{option}{graded && question.correctIndex === optionIndex && " (correct)"}</span>
              </label>
            ))}
            {graded && <p className="text-sm text-muted-foreground">{question.explanation}</p>}
            {!graded && selected !== undefined && (
              <Button type="button" variant="ghost" size="sm" disabled={saving || remaining === 0}
                onClick={() => choose(question.id, null)}
              >Clear answer</Button>
            )}
          </fieldset>
        );
      })}
      {error && (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => update(() => getAttempt(attempt.id))} disabled={saving}>Reload attempt</Button>
        </div>
      )}
      {!graded && (
        <Button onClick={() => update(() => submitAttempt(attempt.id))} disabled={saving || Boolean(error)}>
          {saving ? "Saving…" : "Submit attempt"}
        </Button>
      )}
    </div>
  );
}
