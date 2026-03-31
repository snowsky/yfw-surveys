import React from 'react';
import type { PluginRouteConfig, PluginNavItem } from '@/types/plugin-routes';

// Lazy-load the main surveys page
// This correctly points to SurveysPage.tsx in the same folder
const SurveysPage = React.lazy(() => import('./SurveysPage'));

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
];

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
