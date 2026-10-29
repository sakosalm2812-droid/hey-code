import { lazy, Suspense, useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, MotionConfig } from "framer-motion";

import ConnectionNotice from "./components/ConnectionNotice.jsx";
import Intro from "./components/Intro/Intro";
import IdleScreensaver from "./components/IdleScreensaver";

import TutorialOverlay from "./components/tutorials/TutorialOverlay";
import UniversalActionPalette from "./components/UniversalActionPalette.jsx";
import { PaletteProvider, Palette } from "./components/palette/index.js";
import { ToastHost, NotificationCenter } from "./components/notifications/index.js";
import InfinityStatusBar from "./components/InfinityStatusBar.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import BackgroundLayer from "./components/background/BackgroundLayer";
import IslandHost from "./components/island/IslandHost.jsx";

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import AppLayout from "./components/layout/AppLayout";

// Auth
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import ResetPasswordPage from "./ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallback.jsx";

// Public Pages
const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Features = lazy(() => import("./pages/Features.jsx"));
const Customization = lazy(() => import("./pages/Customization.jsx"));
const Pricing = lazy(() => import("./pages/Pricing.jsx"));
const LivePage = lazy(() => import("./pages/Live.jsx"));
const CreatePage = lazy(() => import("./pages/Create.jsx"));
const DownloadPage = lazy(() => import("./pages/Download.jsx"));

// App Pages
const StudioPage = lazy(() => import("./StudioPage.jsx"));
const MediaStudio = lazy(() => import("./pages/MediaStudio.jsx"));
const Dashboard = lazy(() => import("./Dashboard.jsx"));
const ChatPage = lazy(() => import("./ChatPage.jsx"));
const VoicePage = lazy(() => import("./pages/VoicePage.jsx"));
const CosmosPage = lazy(() => import("./CosmosPage.jsx"));
const ForgePage = lazy(() => import("./ForgePage.jsx"));
const MemoryPage = lazy(() => import("./MemoryPage.jsx"));
const CalendarPage = lazy(() => import("./CalendarPage.jsx"));
const DeenPage = lazy(() => import("./pages/DeenPage.jsx"));
const TasksPage = lazy(() => import("./TasksPage.jsx"));
const LearnPage = lazy(() => import("./LearnPage.jsx"));
const AgentsPage = lazy(() => import("./AgentsPage.jsx"));
const AnalyticsPage = lazy(() => import("./AnalyticsPage.jsx"));
const FinancePage = lazy(() => import("./FinancePage.jsx"));
const GoalsPage = lazy(() => import("./GoalsPage.jsx"));
const HabitsPage = lazy(() => import("./HabitsPage.jsx"));
const HealthPage = lazy(() => import("./HealthPage.jsx"));
const JournalPage = lazy(() => import("./JournalPage.jsx"));
const NotesPage = lazy(() => import("./NotesPage.jsx"));
const ProjectsPage = lazy(() => import("./ProjectsPage.jsx"));
const MorningMode = lazy(() => import("./MorningMode.jsx"));
const CrisisMode = lazy(() => import("./CrisisMode.jsx"));
const ModesPage = lazy(() => import("./pages/ModesPage.jsx"));
const SettingsPage = lazy(() => import("./SettingsPage.jsx"));
const PermissionsPage = lazy(() => import("./PermissionsPage.jsx"));
const CapabilitiesPage = lazy(() => import("./CapabilitiesPage.jsx"));
const DeviceCenterPage = lazy(() => import("./DeviceCenterPage.jsx"));
const DebugPage = lazy(() => import("./DebugPage.jsx"));
const MissionControl = lazy(() => import("./pages/MissionControl.jsx"));
const WorldStudio = lazy(() => import("./pages/WorldStudio.jsx"));
const InfinityInboxPage = lazy(() => import("./pages/InboxPage.jsx"));
const OwnerAccessPage = lazy(() => import("./pages/OwnerAccessPage.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const ErrorPage = lazy(() => import("./pages/ErrorPages.jsx").then((module) => ({ default: module.default })));
const LegalPage = lazy(() => import("./pages/Legal.jsx"));
const SupportPage = lazy(() => import("./pages/Support.jsx"));


function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}


function PublicPage({ children }) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}


function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* PUBLIC */}
        <Route
          path="/"
          element={
            <PublicPage>
              <Home />
            </PublicPage>
          }
        />

        <Route
          path="/features"
          element={
            <PublicPage>
              <Features />
            </PublicPage>
          }
        />

        <Route
          path="/voice"
          element={
            <ProtectedLayout>
              <VoicePage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/customization"
          element={
            <PublicPage>
              <Customization />
            </PublicPage>
          }
        />

        <Route
          path="/pricing"
          element={
            <PublicPage>
              <Pricing />
            </PublicPage>
          }
        />

        <Route path="/privacy" element={<PublicPage><LegalPage document="privacy" /></PublicPage>} />
        <Route path="/terms" element={<PublicPage><LegalPage document="terms" /></PublicPage>} />
        <Route path="/cookies" element={<PublicPage><LegalPage document="cookies" /></PublicPage>} />
        <Route path="/dpa" element={<PublicPage><LegalPage document="dpa" /></PublicPage>} />
        <Route path="/about" element={<PublicPage><About /></PublicPage>} />
        <Route path="/support" element={<PublicPage><SupportPage /></PublicPage>} />

        <Route
          path="/live"
          element={
            <PublicPage>
              <LivePage />
            </PublicPage>
          }
        />

        <Route
          path="/create"
          element={
            <PublicPage>
              <CreatePage />
            </PublicPage>
          }
        />

        <Route
          path="/download"
          element={
            <PublicPage>
              <DownloadPage />
            </PublicPage>
          }
        />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* PROTECTED APP */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedLayout>
              <ChatPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/voice/live"
          element={<Navigate to="/voice" replace />}
        />

        <Route
          path="/cosmos"
          element={
            <ProtectedLayout>
              <CosmosPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/forge"
          element={
            <ProtectedLayout>
              <ForgePage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/memory"
          element={
            <ProtectedLayout>
              <MemoryPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedLayout>
              <CalendarPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/deen"
          element={
            <ProtectedLayout>
              <DeenPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedLayout>
              <TasksPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/learn"
          element={
            <ProtectedLayout>
              <LearnPage />
            </ProtectedLayout>
          }
        />

        <Route path="/studio" element={<ProtectedLayout><StudioPage /></ProtectedLayout>} />
        <Route path="/media" element={<ProtectedLayout><MediaStudio /></ProtectedLayout>} />
        <Route path="/agents" element={<ProtectedLayout><AgentsPage /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} />
        <Route path="/finance" element={<ProtectedLayout><FinancePage /></ProtectedLayout>} />
        <Route path="/goals" element={<ProtectedLayout><GoalsPage /></ProtectedLayout>} />
        <Route path="/habits" element={<ProtectedLayout><HabitsPage /></ProtectedLayout>} />
        <Route path="/health" element={<ProtectedLayout><HealthPage /></ProtectedLayout>} />
        <Route path="/journal" element={<ProtectedLayout><JournalPage /></ProtectedLayout>} />
        <Route path="/notes" element={<ProtectedLayout><NotesPage /></ProtectedLayout>} />
        <Route path="/projects" element={<ProtectedLayout><ProjectsPage /></ProtectedLayout>} />

        <Route
          path="/morning"
          element={
            <ProtectedLayout>
              <MorningMode />
            </ProtectedLayout>
          }
        />

        <Route
          path="/crisis"
          element={
            <ProtectedLayout>
              <CrisisMode />
            </ProtectedLayout>
          }
        />

        <Route
          path="/modes"
          element={
            <ProtectedLayout>
              <ModesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <SettingsPage />
            </ProtectedLayout>
          }
        />
        <Route path="/permissions" element={<ProtectedLayout><PermissionsPage /></ProtectedLayout>} />
        <Route path="/capabilities" element={<ProtectedLayout><CapabilitiesPage /></ProtectedLayout>} />
        <Route path="/device" element={<ProtectedLayout><DeviceCenterPage /></ProtectedLayout>} />
        <Route path="/debug" element={<ProtectedLayout><DebugPage /></ProtectedLayout>} />
        <Route path="/missions" element={<ProtectedLayout><MissionControl /></ProtectedLayout>} />
        <Route path="/inbox" element={<ProtectedLayout><InfinityInboxPage /></ProtectedLayout>} />
        <Route path="/world" element={<ProtectedLayout><WorldStudio /></ProtectedLayout>} />
        <Route path="/owner" element={<ProtectedLayout><OwnerAccessPage /></ProtectedLayout>} />

        <Route path="/error/401" element={<PublicPage><ErrorPage code="401" /></PublicPage>} />
        <Route path="/error/403" element={<PublicPage><ErrorPage code="403" /></PublicPage>} />
        <Route path="/error/429" element={<PublicPage><ErrorPage code="429" /></PublicPage>} />
        <Route path="/error/500" element={<PublicPage><ErrorPage code="500" /></PublicPage>} />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<PublicPage><NotFound /></PublicPage>}
        />
      </Routes>
    </AnimatePresence>
  );
}


export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try { return window.location.pathname === "/" && localStorage.getItem("hey_intro_seen") !== "true"; } catch { return false; }
  });
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  // Handle notification center open event
  useEffect(() => {
    const handleOpen = () => setNotificationCenterOpen(true);
    window.addEventListener('hey:open-notification-center', handleOpen);
    return () => window.removeEventListener('hey:open-notification-center', handleOpen);
  }, []);


  const finishIntro = () => {
    try { localStorage.setItem("hey_intro_seen", "true"); } catch { /* Continue when storage is unavailable. */ }
    setShowIntro(false);
  };


  if (showIntro) {
    return (
      <MotionConfig reducedMotion="user">
        <Intro finish={finishIntro} />
      </MotionConfig>
    );
  }


  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <PaletteProvider>
          <BrowserRouter>
            <BackgroundLayer />
            <Suspense fallback={<div className="hey-route-loading"><span className="hey-script">HEY</span><small>loading your world</small></div>}>
              <AnimatedRoutes />
            </Suspense>
            <ConnectionNotice />

            <UniversalActionPalette />
            <Palette />
            <ToastHost />
            <NotificationCenter isOpen={notificationCenterOpen} onClose={() => setNotificationCenterOpen(false)} />
            <InfinityStatusBar />
            <TutorialOverlay />
            <IdleScreensaver />
          </BrowserRouter>
          <IslandHost />
        </PaletteProvider>
      </MotionConfig>
    </AppErrorBoundary>
  );
}



