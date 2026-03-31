import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { surveysApi, SurveySummary } from "../api";

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 860, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  h1: { margin: 0, fontSize: 24, fontWeight: 700 },
  btn: { padding: "9px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnSecondary: { background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb" },
  btnDanger: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: 600, fontSize: 16, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: "#6b7280", display: "flex", gap: 12, alignItems: "center" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 12, fontWeight: 500 },
  badgeActive: { background: "#dcfce7", color: "#166534" },
  badgeInactive: { background: "#fee2e2", color: "#991b1b" },
  actions: { display: "flex", gap: 8 },
  empty: { textAlign: "center" as const, color: "#6b7280", padding: "64px 0" },
  error: { color: "#dc2626", marginBottom: 16, fontSize: 14 },
  link: { color: "#2563eb", textDecoration: "none", fontSize: 13 },
};

export default function SurveysListPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    surveysApi.list().then(setSurveys).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const toggle = async (s: SurveySummary) => {
    try {
      const updated = await surveysApi.update(s.id, { is_active: !s.is_active });
      setSurveys((ss) => ss.map((x) => (x.id === updated.id ? { ...x, is_active: updated.is_active } : x)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this survey and all its responses?")) return;
    try {
      await surveysApi.delete(id);
      setSurveys((ss) => ss.filter((x) => x.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const publicLink = (slug: string) => `${window.location.origin}/surveys/${slug}`;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Surveys</h1>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => navigate("/editor")}>
          + New Survey
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      ) : surveys.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>No surveys yet</p>
          <p>Create your first survey to start collecting responses.</p>
        </div>
      ) : (
        surveys.map((survey) => (
          <div key={survey.id} style={s.card}>
            <div>
              <div style={s.cardTitle}>{survey.title}</div>
              <div style={s.cardMeta}>
                <span style={{ ...s.badge, ...(survey.is_active ? s.badgeActive : s.badgeInactive) }}>
                  {survey.is_active ? "Active" : "Inactive"}
                </span>
                <span>{survey.response_count} response{survey.response_count !== 1 ? "s" : ""}</span>
                <a href={publicLink(survey.slug)} target="_blank" rel="noreferrer" style={s.link}>
                  Share ↗
                </a>
                <a href={surveysApi.exportUrl(survey.id)} style={s.link}>
                  Export CSV
                </a>
              </div>
            </div>
            <div style={s.actions}>
              <button style={{ ...s.btn, ...s.btnSecondary }} onClick={() => navigate(`/editor/${survey.id}`)}>
                Edit
              </button>
              <button style={{ ...s.btn, ...s.btnSecondary }} onClick={() => navigate(`/responses/${survey.id}`)}>
                Responses
              </button>
              <button style={{ ...s.btn, ...s.btnSecondary }} onClick={() => toggle(survey)}>
                {survey.is_active ? "Pause" : "Resume"}
              </button>
              <button style={{ ...s.btn, ...s.btnDanger }} onClick={() => del(survey.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
