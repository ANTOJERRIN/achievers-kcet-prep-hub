export interface Student {
  name: string;
  email: string;
}

interface Session {
  user: Student | null;
  csrfToken: string;
}

export interface NoteSummary {
  id: number;
  title: string;
  completed: boolean;
}

export interface Note extends NoteSummary {
  body: string;
  topic: string;
}

export interface Topic {
  id: string;
  title: string;
  accuracy: number | null;
  attempts: number;
  weak: boolean;
  notes: NoteSummary[];
  quizzes: { id: number; title: string; durationSeconds: number }[];
}

export interface AttemptSummary {
  id: string;
  quizTitle: string;
  topicTitle: string;
  questionsCount: number;
  answeredCount: number;
  score: number | null;
  elapsedSeconds: number | null;
  submittedAt: string | null;
}

export interface Attempt extends AttemptSummary {
  status: "active" | "graded";
  deadline: string;
  serverTime: string;
  revision: number;
  answers: Record<string, number>;
  questions: {
    id: number;
    prompt: string;
    options: string[];
    correctIndex?: number;
    explanation?: string;
  }[];
}

export interface DashboardData {
  subjects: { id: string; name: string; topics: Topic[] }[];
  stats: { completedAttempts: number; notesRead: number; accuracy: number | null; weakTopics: number };
  recommendations: { subject: string; topic: string; accuracy: number }[];
  recentAttempts: AttemptSummary[];
  activeAttempts: { id: string; quizTitle: string; deadline: string }[];
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let csrfToken: string | undefined;

async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    if (!csrfToken) await getSession();
    headers["X-CSRFToken"] = csrfToken ?? "";
  }
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(`/api/${path}`, {
    method, headers, credentials: "same-origin", body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    if (response.status === 403) csrfToken = undefined;
    throw new ApiError(data?.error ?? "The prep service is unavailable. Please try again.", response.status);
  }
  return data;
}

async function updateSession(path: string, method = "GET", body?: object) {
  const result = await request<Session>(path, method, body);
  csrfToken = result.csrfToken;
  return result.user;
}

export const getSession = () => updateSession("auth/session/");
export const register = (data: Student & { password: string }) => updateSession("auth/register/", "POST", data);
export const login = (data: { email: string; password: string }) => updateSession("auth/login/", "POST", data);
export const logout = () => updateSession("auth/logout/", "POST");
export const getDashboard = () => request<DashboardData>("dashboard/");
export const getNote = (id: number) => request<Note>(`lessons/${id}/`);
export const completeNote = (id: number) => request<Note>(`lessons/${id}/`, "POST");
export const startQuiz = (id: number) => request<Attempt>(`quizzes/${id}/attempts/`, "POST");
export const getAttempt = (id: string) => request<Attempt>(`attempts/${id}/`);
export const submitAttempt = (id: string) => request<Attempt>(`attempts/${id}/submit/`, "POST");
export const saveAnswer = (id: string, question: number, selected: number | null, revision: number) =>
  request<Attempt>(`attempts/${id}/answers/${question}/`, "PUT", { selected, revision });
