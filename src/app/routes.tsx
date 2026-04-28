import { createBrowserRouter } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { MeasurePage } from './pages/MeasurePage';
import { PolygonPage } from './pages/PolygonPage';
import { ReportPage } from './pages/ReportPage';
import { AdminPage } from './pages/AdminPage';

/**
 * Route structure:
 *
 *  /           → LoginPage
 *
 *  ── Standalone full-screen map tools (NO AppShell sidebar) ──
 *  /map        → MapPage
 *  /measure    → MeasurePage
 *  /polygons   → PolygonPage
 *
 *  ── Shell-wrapped pages (dashboard, reports, admin) ──
 *  /dashboard  → AppShell → DashboardPage
 *  /reports    → AppShell → ReportPage
 *  /admin      → AppShell → AdminPage
 */
export const router = createBrowserRouter([
  // ── Auth ──
  {
    path: '/',
    Component: LoginPage,
  },

  // ── Full-screen map tools (standalone, no AppShell) ──
  {
    path: '/map',
    Component: MapPage,
  },
  {
    path: '/measure',
    Component: MeasurePage,
  },
  {
    path: '/polygons',
    Component: PolygonPage,
  },

  // ── Shell-wrapped pages ──
  {
    Component: AppShell,          // pathless layout route
    children: [
      { path: '/dashboard', Component: DashboardPage },
      { path: '/reports',   Component: ReportPage   },
      { path: '/admin',     Component: AdminPage    },
    ],
  },
]);
