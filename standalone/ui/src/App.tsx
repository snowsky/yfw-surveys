import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { USE_STANDALONE_SETUP } from "@shared/config";
import { loadSetupConfig } from "@shared/setup";
import SetupPage from "@shared/pages/SetupPage";
import SurveysListPage from "@shared/pages/SurveysListPage";
import SurveyEditorPage from "@shared/pages/SurveyEditorPage";
import SurveyResponsesPage from "@shared/pages/SurveyResponsesPage";
import PublicSurveyPage from "@shared/pages/PublicSurveyPage";

function RequireSetup({ children }: { children: React.ReactNode }) {
  if (USE_STANDALONE_SETUP) {
    const { apiUrl, apiKey } = loadSetupConfig();
    if (!apiUrl || !apiKey) return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        {/* Public survey route — no auth */}
        <Route path="/surveys/:slug" element={<PublicSurveyPage />} />
        {/* Authenticated management routes */}
        <Route path="/" element={<RequireSetup><SurveysListPage /></RequireSetup>} />
        <Route path="/editor/:surveyId?" element={<RequireSetup><SurveyEditorPage /></RequireSetup>} />
        <Route path="/responses/:surveyId" element={<RequireSetup><SurveyResponsesPage /></RequireSetup>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
