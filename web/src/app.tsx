import { lazy, Suspense } from "preact/compat";
import { useEffect } from "preact/hooks";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./contexts/AuthContext";
import { navigate, useRoute } from "./hooks/useRoute";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));

const App = () => {
  const path = useRoute();
  const { booting, logout, user } = useAuth();

  useEffect(() => {
    if (booting) {
      return;
    }

    if (!user && !["/login", "/signup"].includes(path)) {
      navigate("/login");
      return;
    }

    if (user && ["/", "/login", "/signup"].includes(path)) {
      navigate("/app/dashboard");
    }
  }, [booting, path, user]);

  if (booting) {
    return <div className="app-loading">Preparing your workspace...</div>;
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="app-loading">Loading...</div>}>
        {path === "/signup" ? <SignupPage /> : <LoginPage />}
      </Suspense>
    );
  }

  let page = <DashboardPage />;
  if (path === "/app/projects") {
    page = <ProjectsPage />;
  } else if (path === "/app/tasks") {
    page = <TasksPage />;
  }

  return (
    <Suspense fallback={<div className="app-loading">Loading workspace...</div>}>
      <AppShell currentPath={path} user={user} onLogout={logout}>
        {page}
      </AppShell>
    </Suspense>
  );
};

export default App;
