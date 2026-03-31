import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { surveysApi, Survey, ResponseSummary, ResponseOut } from "../api";

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 860, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  h1: { margin: 0, fontSize: 22, fontWeight: 700 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 },
  btnSecondary: { background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb" },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  th: { textAlign: "left" as const, padding: "12px 16px", fontSize: 13, fontWeight: 600, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#374151" },
  td: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid #f3f4f6", verticalAlign: "top" as const },
  row: { display: "flex", gap: 8 },
  error: { color: "#dc2626", fontSize: 14 },
  modal: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modalBox: { background: "#fff", borderRadius: 10, padding: 28, width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto" as const },
  answerLabel: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 2, marginTop: 10 },
  answerValue: { fontSize: 14 },
};

function ResponseModal({ surveyId, responseId, survey, onClose }: {
  surveyId: string;
  responseId: string;
  survey: Survey;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ResponseOut | null>(null);
  useEffect(() => {
    surveysApi.getResponse(surveyId, responseId).then(setDetail).catch(console.error);
  }, [surveyId, responseId]);

  const qMap = Object.fromEntries(survey.questions.map((q) => [q.id, q.label]));

  return (
    <div style={s.modal} onClick={onClose}>
      <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <strong style={{ fontSize: 16 }}>Response Detail</strong>
          <button style={{ ...s.btn, ...s.btnSecondary, padding: "4px 12px" }} onClick={onClose}>Close</button>
        </div>
        {!detail ? <p>Loading…</p> : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
              {detail.respondent_email || "Anonymous"} · {new Date(detail.submitted_at).toLocaleString()}
            </p>
            {detail.answers.map((a) => (
              <div key={a.question_id}>
                <p style={s.answerLabel}>{qMap[a.question_id] ?? a.question_id}</p>
                <p style={s.answerValue}>
                  {Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "—")}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function SurveyResponsesPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<ResponseSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!surveyId) return;
    Promise.all([surveysApi.get(surveyId), surveysApi.listResponses(surveyId)])
      .then(([s, r]) => { setSurvey(s); setResponses(r); })
      .catch((e: Error) => setError(e.message));
  }, [surveyId]);

  if (!surveyId) return null;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <button style={{ ...s.btn, ...s.btnSecondary, marginBottom: 8 }} onClick={() => navigate("/")}>
            ← Back
          </button>
          <h1 style={s.h1}>{survey?.title ?? "Responses"}</h1>
        </div>
        <a href={surveysApi.exportUrl(surveyId)}>
          <button style={{ ...s.btn, ...s.btnPrimary }}>Export CSV</button>
        </a>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {responses.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "48px 0" }}>No responses yet.</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Respondent</th>
              <th style={s.th}>Submitted</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r, i) => (
              <tr key={r.id}>
                <td style={s.td}>{i + 1}</td>
                <td style={s.td}>{r.respondent_email || <em style={{ color: "#9ca3af" }}>Anonymous</em>}</td>
                <td style={s.td}>{new Date(r.submitted_at).toLocaleString()}</td>
                <td style={s.td}>
                  <button style={{ ...s.btn, ...s.btnSecondary, padding: "4px 12px" }} onClick={() => setSelected(r.id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && survey && (
        <ResponseModal
          surveyId={surveyId}
          responseId={selected}
          survey={survey}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
