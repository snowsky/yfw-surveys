/**
 * Typed API client for yfw-surveys.
 */
import { API_PREFIX, BASE_URL, PUBLIC_PREFIX } from "./config";
import { authHeaders } from "./setup";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  survey_id: string;
  question_type: string;
  label: string;
  required: boolean;
  order_index: number;
  options?: string[] | Record<string, unknown> | null;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  is_active: boolean;
  allow_anonymous: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  questions: Question[];
  response_count: number;
  company_name?: string;
}

export interface SurveySummary {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  response_count: number;
}

export interface QuestionCreate {
  question_type: string;
  label: string;
  required?: boolean;
  order_index?: number;
  options?: string[] | Record<string, unknown> | null;
}

export interface SurveyCreate {
  title: string;
  description?: string;
  allow_anonymous?: boolean;
  expires_at?: string;
  questions?: QuestionCreate[];
}

export interface SurveyUpdate {
  title?: string;
  description?: string;
  is_active?: boolean;
  allow_anonymous?: boolean;
  expires_at?: string;
}

export interface AnswerSubmit {
  question_id: string;
  value: unknown;
}

export interface SurveySubmit {
  respondent_email?: string;
  answers: AnswerSubmit[];
}

export interface SubmitResult {
  success: boolean;
  response_id: string;
  message: string;
}

export interface ResponseSummary {
  id: string;
  respondent_email?: string;
  submitted_at: string;
}

export interface AnswerOut {
  question_id: string;
  value: unknown;
}

export interface ResponseOut {
  id: string;
  survey_id: string;
  respondent_email?: string;
  submitted_at: string;
  answers: AnswerOut[];
}

// ── Core fetch ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Survey API ─────────────────────────────────────────────────────────────────

export const surveysApi = {
  list: (skip = 0, limit = 50) =>
    apiFetch<SurveySummary[]>(`${API_PREFIX}?skip=${skip}&limit=${limit}`),

  get: (id: string) => apiFetch<Survey>(`${API_PREFIX}/${id}`),

  create: (body: SurveyCreate) =>
    apiFetch<Survey>(API_PREFIX, { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: SurveyUpdate) =>
    apiFetch<Survey>(`${API_PREFIX}/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: string) => apiFetch<void>(`${API_PREFIX}/${id}`, { method: "DELETE" }),

  addQuestion: (surveyId: string, body: QuestionCreate) =>
    apiFetch<Question>(`${API_PREFIX}/${surveyId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateQuestion: (surveyId: string, questionId: string, body: Partial<QuestionCreate>) =>
    apiFetch<Question>(`${API_PREFIX}/${surveyId}/questions/${questionId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteQuestion: (surveyId: string, questionId: string) =>
    apiFetch<void>(`${API_PREFIX}/${surveyId}/questions/${questionId}`, { method: "DELETE" }),

  listResponses: (surveyId: string) =>
    apiFetch<ResponseSummary[]>(`${API_PREFIX}/${surveyId}/responses`),

  getResponse: (surveyId: string, responseId: string) =>
    apiFetch<ResponseOut>(`${API_PREFIX}/${surveyId}/responses/${responseId}`),

  exportUrl: (surveyId: string) => `${BASE_URL}${API_PREFIX}/${surveyId}/export`,
};

// ── Public API (no auth) ───────────────────────────────────────────────────────

export const publicApi = {
  getSurvey: (slug: string) =>
    apiFetch<Survey>(`${PUBLIC_PREFIX}/${slug}`, { headers: {} }),

  submit: (slug: string, body: SurveySubmit) =>
    apiFetch<SubmitResult>(`${PUBLIC_PREFIX}/${slug}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {},
    }),
};

// ── Setup helpers ──────────────────────────────────────────────────────────────

export async function testConnection(apiUrl: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/health`, { headers: { "X-API-Key": apiKey } });
    return res.ok;
  } catch {
    return false;
  }
}
