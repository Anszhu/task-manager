import { navigate } from "../hooks/useRoute";
import type { User } from "../types";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/projects", label: "Projects" },
  { href: "/app/tasks", label: "Tasks" }
];

export const AppShell = ({
  currentPath,
  user,
  onLogout,
  children
}: {
  currentPath: string;
  user: User;
  onLogout: () => Promise<void>;
  children: preact.ComponentChildren;
}) => (
  <div className="shell">
    <aside className="sidebar card">
      <div>
        <p className="eyebrow">Team Task Manager</p>
        <h1>Keep every sprint visible and moving.</h1>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={currentPath === item.href ? "nav-link active" : "nav-link"}
            onClick={(event) => {
              event.preventDefault();
              navigate(item.href);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="user-pill">
          <strong>{user.name}</strong>
          <span>{user.role === "admin" ? "Admin access" : "Member access"}</span>
        </div>
        <button className="secondary-button" type="button" onClick={() => void onLogout()}>
          Log out
        </button>
      </div>
    </aside>

    <main className="content">{children}</main>
  </div>
);
