import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/firebase/auth.tsx";
import { useProgress } from "@/app/ProgressContext.tsx";
import { AuthDialog } from "./AuthDialog.tsx";
import "./TopBar.css";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { syncing } = useProgress();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">⌨</span> Typenator
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Practice
          </NavLink>
          <NavLink to="/progress" className="nav-link">
            Progress
          </NavLink>
          <NavLink to="/settings" className="nav-link">
            Settings
          </NavLink>
        </nav>

        <div className="account">
          {syncing && <span className="sync faint">syncing…</span>}
          {user ? (
            <div className="user-menu">
              <button className="btn btn-ghost user-btn" onClick={() => setMenuOpen((o) => !o)}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="avatar" />
                ) : (
                  <span className="avatar avatar-fallback">
                    {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="user-name">{user.displayName ?? user.email}</span>
              </button>
              {menuOpen && (
                <div className="menu card" onMouseLeave={() => setMenuOpen(false)}>
                  <button
                    className="btn btn-ghost menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
          )}
        </div>
      </div>

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </header>
  );
}
