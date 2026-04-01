/**
 * Plugin page — Survey management dashboard.
 * Self-contained: no imports from shared/ so this file can be dropped into
 * the YFW plugin UI directory and just work.
 */
import React, { useEffect, useState } from "react";
import { ShareInternalModal } from "./ShareInternalModal";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  is_active: boolean;
  allow_anonymous: boolean;
  created_at: string;
  expires_at?: string;
  response_count: number;
  questions: Question[];
}

interface Question {
  id?: string;
  question_type: string;
  label: string;
  required: boolean;
  order_index: number;
  options?: string[] | Record<string, unknown> | null;
}

const API_PREFIX = "/api/v1/surveys";

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: "system-ui, sans-serif", padding: "24px", maxWidth: 900 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  h1: { margin: 0, fontSize: 22, fontWeight: 600 },
  btn: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnDanger: { background: "#dc2626", color: "#fff" },
  btnSecondary: { background: "#f3f4f6", color: "#111", border: "1px solid #e5e7eb" },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 500,
  },
  badgeActive: { background: "#dcfce7", color: "#166534" },
  badgeInactive: { background: "#fee2e2", color: "#991b1b" },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box" as const,
    marginBottom: 12,
  },
  textarea: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box" as const,
    marginBottom: 12,
    minHeight: 80,
    resize: "vertical" as const,
  },
  label: { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" },
  modal: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 10,
    padding: 28,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90vh",
    overflowY: "auto" as const,
  },
  row: { display: "flex", gap: 8, alignItems: "center" },
  error: { color: "#dc2626", fontSize: 14, marginBottom: 12 },
  empty: { color: "#6b7280", textAlign: "center" as const, padding: "48px 0" },
  link: { color: "#2563eb", textDecoration: "none", fontSize: 13 },
};

// ── CreateSurveyModal ──────────────────────────────────────────────────────────

function CreateSurveyModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (survey: Survey) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      { question_type: "text", label: "", required: false, order_index: qs.length },
    ]);

  const removeQuestion = (i: number) =>
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const survey = await apiFetch<Survey>(API_PREFIX, {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          allow_anonymous: allowAnonymous,
          expires_at: expiresAt || null,
          questions,
        }),
      });
      onCreate(survey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create survey");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>New Survey</h2>
        {error && <p style={styles.error}>{error}</p>}
        <label style={styles.label}>Title *</label>
        <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Survey title" />
        <label style={styles.label}>Description</label>
        <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />

        <div style={{ ...styles.row, marginBottom: 12, gap: 16 }}>
          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
            <input type="checkbox" checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} />
            Allow Anonymous Responses
          </label>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Close Date (Optional)</label>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>Questions</strong>
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={addQuestion}>+ Add Question</button>
        </div>

        {questions.map((q, i) => (
          <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={styles.row}>
              <select
                style={{ ...styles.input, marginBottom: 0, width: "auto" }}
                value={q.question_type}
                onChange={(e) => updateQuestion(i, { question_type: e.target.value })}
              >
                <option value="text">Short text</option>
                <option value="paragraph">Paragraph</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="checkbox">Checkboxes</option>
                <option value="rating">Rating</option>
                <option value="boolean">Yes / No</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} />
                Required
              </label>
              <button style={{ ...styles.btn, ...styles.btnDanger, padding: "4px 10px" }} onClick={() => removeQuestion(i)}>✕</button>
            </div>
            <input
              style={{ ...styles.input, marginTop: 8 }}
              value={q.label}
              onChange={(e) => updateQuestion(i, { label: e.target.value })}
              placeholder={`Question ${i + 1} text`}
            />
            {(q.question_type === "multiple_choice" || q.question_type === "checkbox") && (
              <textarea
                style={{ ...styles.textarea, marginBottom: 0 }}
                value={Array.isArray(q.options) ? (q.options as string[]).join("\n") : ""}
                onChange={(e) => updateQuestion(i, { options: e.target.value.split("\n").filter(Boolean) })}
                placeholder="One option per line"
              />
            )}
            {q.question_type === "rating" && (
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Rating scale: 1–5</p>
            )}
          </div>
        ))}

        <div style={{ ...styles.row, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating…" : "Create Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditSurveyModal ────────────────────────────────────────────────────────────

function EditSurveyModal({ survey, onClose, onUpdate }: {
  survey: Survey;
  onClose: () => void;
  onUpdate: (survey: Survey) => void;
}) {
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");
  const [allowAnonymous, setAllowAnonymous] = useState(survey.allow_anonymous);
  const [expiresAt, setExpiresAt] = useState(survey.expires_at ? survey.expires_at.substring(0, 16) : "");
  const [questions, setQuestions] = useState<Question[]>(survey.questions || []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      { question_type: "text", label: "", required: false, order_index: qs.length },
    ]);

  const removeQuestion = (i: number) =>
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch<Survey>(`${API_PREFIX}/${survey.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          allow_anonymous: allowAnonymous,
          expires_at: expiresAt || null,
          questions,
        }),
      });
      onUpdate(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update survey");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Edit Survey</h2>
        {error && <p style={styles.error}>{error}</p>}
        <label style={styles.label}>Title *</label>
        <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Survey title" />
        <label style={styles.label}>Description</label>
        <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />

        <div style={{ ...styles.row, marginBottom: 12, gap: 16 }}>
          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
            <input type="checkbox" checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} />
            Allow Anonymous Responses
          </label>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Close Date (Optional)</label>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>Questions</strong>
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={addQuestion}>+ Add Question</button>
        </div>

        {questions.map((q, i) => (
          <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={styles.row}>
              <select
                style={{ ...styles.input, marginBottom: 0, width: "auto" }}
                value={q.question_type}
                onChange={(e) => updateQuestion(i, { question_type: e.target.value })}
              >
                <option value="text">Short text</option>
                <option value="paragraph">Paragraph</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="checkbox">Checkboxes</option>
                <option value="rating">Rating</option>
                <option value="boolean">Yes / No</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} />
                Required
              </label>
              <button style={{ ...styles.btn, ...styles.btnDanger, padding: "4px 10px" }} onClick={() => removeQuestion(i)}>✕</button>
            </div>
            <input
              style={{ ...styles.input, marginTop: 8 }}
              value={q.label}
              onChange={(e) => updateQuestion(i, { label: e.target.value })}
              placeholder={`Question ${i + 1} text`}
            />
            {(q.question_type === "multiple_choice" || q.question_type === "checkbox") && (
              <textarea
                style={{ ...styles.textarea, marginBottom: 0 }}
                value={Array.isArray(q.options) ? (q.options as string[]).join("\n") : ""}
                onChange={(e) => updateQuestion(i, { options: e.target.value.split("\n").filter(Boolean) })}
                placeholder="One option per line"
              />
            )}
          </div>
        ))}

        <div style={{ ...styles.row, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SurveysPage ────────────────────────────────────────────────────────────────

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editSurvey, setEditSurvey] = useState<Survey | null>(null);
  const [shareSurvey, setShareSurvey] = useState<Survey | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Survey[]>(API_PREFIX);
      setSurveys(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (survey: Survey) => {
    try {
      const updated = await apiFetch<Survey>(`${API_PREFIX}/${survey.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !survey.is_active }),
      });
      setSurveys((ss) => ss.map((s) => (s.id === updated.id ? updated : s)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm("Delete this survey and all its responses?")) return;
    try {
      await apiFetch(`${API_PREFIX}/${id}`, { method: "DELETE" });
      setSurveys((ss) => ss.filter((s) => s.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const publicLink = (slug: string) =>
    `${window.location.origin}/surveys/${slug}`;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Surveys</h1>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowCreate(true)}>
          + New Survey
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      ) : surveys.length === 0 ? (
        <p style={styles.empty}>No surveys yet. Create your first one!</p>
      ) : (
        surveys.map((s) => (
          <div key={s.id} style={styles.card}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                <span style={{ ...styles.badge, ...(s.is_active ? styles.badgeActive : styles.badgeInactive) }}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
                {" · "}
                {s.response_count} response{s.response_count !== 1 ? "s" : ""}
                {" · "}
                <a
                  href={publicLink(s.slug)}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.link}
                >
                  Share link ↗
                </a>
                {" · "}
                <a
                  href={`${API_PREFIX}/${s.id}/export`}
                  style={styles.link}
                >
                  Export CSV
                </a>
              </div>
            </div>
            <div style={styles.row}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setShareSurvey(s)}
                title="Share internally and create reminders"
              >
                Internal Share
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setEditSurvey(s)}
              >
                Edit
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary, color: s.is_active ? "#dc2626" : "#2563eb" }}
                onClick={() => toggleActive(s)}
              >
                {s.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnDanger }}
                onClick={() => deleteSurvey(s.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {showCreate && (
        <CreateSurveyModal
          onClose={() => setShowCreate(false)}
          onCreate={(survey) => {
            setSurveys((ss) => [survey, ...ss]);
            setShowCreate(false);
          }}
        />
      )}

      {editSurvey && (
        <EditSurveyModal
          survey={editSurvey}
          onClose={() => setEditSurvey(null)}
          onUpdate={(updated) => {
            setSurveys((ss) => ss.map((s) => (s.id === updated.id ? updated : s)));
            setEditSurvey(null);
          }}
        />
      )}

      {shareSurvey && (
        <ShareInternalModal
          survey={shareSurvey}
          onClose={() => setShareSurvey(null)}
        />
      )}
    </div>
  );
}
