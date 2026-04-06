import React from 'react';
import type { PluginRouteConfig, PluginNavItem, PluginPublicPage } from '@/types/plugin-routes';

// Lazy-load the main surveys page
// This correctly points to SurveysPage.tsx in the same folder
const SurveysPage = React.lazy(() => import('./SurveysPage'));
const PublicSurveyPage = React.lazy(() => import('../../shared/ui/pages/PublicSurveyPage'));
const SurveyResponsesPage = React.lazy(() => import('../../shared/ui/pages/SurveyResponsesPage'));
const SurveyPortalPage = React.lazy(() => import('./SurveyPortalPage'));

/**
 * Route configuration for the Surveys plugin.
 * Consumed by the main App.tsx to register application routes.
 */
export const pluginRoutes: PluginRouteConfig[] = [
  {
    path: '/surveys',
    component: SurveysPage,
    pluginId: 'surveys',
    pluginName: 'Surveys',
    label: 'Survey Management',
  },
  {
    path: '/surveys/:slug',
    component: PublicSurveyPage,
    pluginId: 'surveys',
    pluginName: 'Surveys',
    label: 'Public Survey',
    isPublic: true,
  },
  {
    path: '/surveys/responses/:surveyId',
    component: SurveyResponsesPage,
    pluginId: 'surveys',
    pluginName: 'Surveys',
    label: 'Survey Responses',
  },
];

/**
 * Public portal page — accessible at /p/surveys/.
 * Access is gated by the tenant's public-access settings (disabled by default).
 */
export const publicPage: PluginPublicPage = {
  pluginId: 'surveys',
  pluginName: 'Surveys',
  path: '/p/surveys',
  component: SurveyPortalPage,
};

/**
 * Sidebar navigation item definition.
 * Consumed by AppSidebar.tsx to render the "Surveys" menu item.
 */
export const navItems: PluginNavItem[] = [
  {
    id: 'surveys',
    path: '/surveys',
    label: 'Surveys',
    icon: 'ClipboardList',
    priority: 10,
  },
];
