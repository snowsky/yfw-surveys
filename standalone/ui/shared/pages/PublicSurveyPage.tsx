import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi, Survey, Question } from "../api";

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f9fafb", padding: "40px 16px" },
  card: { maxWidth: 640, margin: "0 auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 32 },
  title: { margin: "0 0 8px", fontSize: 24, fontWeight: 700 },
  desc: { margin: "0 0 28px", color: "#6b7280", fontSize: 15 },
  label: { display: "block", fontWeight: 500, marginBottom: 6, fontSize: 15 },
  required: { color: "#dc2626", marginLeft: 3 },
  input: { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 15, boxSizing: "border-box" as const },
  textarea: { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 15, boxSizing: "border-box" as const, minHeight: 100, resize: "vertical" as const },
  optionRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  qBlock: { marginBottom: 24 },
  btn: { padding: "12px 24px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, background: "#2563eb", color: "#fff", width: "100%", marginTop: 8 },
  error: { color: "#dc2626", fontSize: 14, marginBottom: 16 },
  success: { textAlign: "center" as const, padding: "48px 0" },
  ratingRow: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  ratingBtn: { padding: "10px 18px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", fontSize: 16, fontWeight: 500, background: "#fff" },
  ratingBtnActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
};

type AnswerMap = Record<string, unknown>;

function QuestionField({ q, value, onChange }: { q: Question; value: unknown; onChange: (v: unknown) => void }) {
  if (q.question_type === "text") {
    return <input style={s.input} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Your answer" />;
  }
  if (q.question_type === "paragraph") {
    return <textarea style={s.textarea} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Your answer" />;
  }
  if (q.question_type === "boolean") {
    return (
      <div style={s.ratingRow}>
        {["Yes", "No"].map((opt) => (
          <button
            key={opt}
            type="button"
            style={{ ...s.ratingBtn, ...(value === opt ? s.ratingBtnActive : {}) }}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }
  if (q.question_type === "rating") {
    return (
      <div style={s.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            style={{ ...s.ratingBtn, ...(value === n ? s.ratingBtnActive : {}) }}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }
  if (q.question_type === "multiple_choice") {
    const opts = Array.isArray(q.options) ? q.options as string[] : [];
    return (
      <div>
        {opts.map((opt) => (
          <label key={opt} style={s.optionRow}>
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  if (q.question_type === "checkbox") {
    const opts = Array.isArray(q.options) ? q.options as string[] : [];
    const selected = Array.isArray(value) ? value as string[] : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt];
      onChange(next);
    };
    return (
      <div>
        {opts.map((opt) => (
          <label key={opt} style={s.optionRow}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  return null;
}

export default function PublicSurveyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!slug) return;
    publicApi.getSurvey(slug).then(setSurvey).catch((e: Error) => setLoadError(e.message));
  }, [slug]);

  const setAnswer = (qid: string, val: unknown) =>
    setAnswers((prev) => ({ ...prev, [qid]: val }));

  const handleSubmit = async () => {
    if (!survey || !slug) return;
    setError("");
    // Check required fields
    const missing = survey.questions.filter((q) => q.required && !answers[q.id]);
    if (missing.length > 0) {
      setError(`Please answer all required questions (${missing.length} remaining)`);
      return;
    }
    setSubmitting(true);
    try {
      await publicApi.submit(slug, {
        respondent_email: email || undefined,
        answers: survey.questions.map((q) => ({ question_id: q.id, value: answers[q.id] ?? null })),
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={{ color: "#dc2626", textAlign: "center" }}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return <div style={s.page}><div style={s.card}><p style={{ color: "#6b7280" }}>Loading…</p></div></div>;
  }

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.success}>
            <p style={{ fontSize: 40, margin: "0 0 16px" }}>✓</p>
            <h2 style={{ margin: "0 0 8px" }}>Thank you!</h2>
            <p style={{ color: "#6b7280" }}>Your response has been recorded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>{survey.title}</h1>
        {survey.description && <p style={s.desc}>{survey.description}</p>}

        {survey.allow_anonymous && (
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Email <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        )}

        {survey.questions.map((q) => (
          <div key={q.id} style={s.qBlock}>
            <label style={s.label}>
              {q.label}
              {q.required && <span style={s.required}>*</span>}
            </label>
            <QuestionField q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        ))}

        {error && <p style={s.error}>{error}</p>}

        <button style={s.btn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Response"}
        </button>
      </div>
    </div>
  );
}
