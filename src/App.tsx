import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/firebase/auth.tsx";
import { ProgressProvider } from "@/app/ProgressContext.tsx";
import { TopBar } from "@/components/TopBar.tsx";
import { Practice } from "@/components/Practice.tsx";
import { Profile } from "@/components/Profile.tsx";
import { Settings } from "@/components/Settings.tsx";
import "@/styles/global.css";

// Vite injects BASE_URL ("/typenator/" in production, "/" in dev). React Router
// wants the basename without a trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <BrowserRouter basename={basename}>
          <div className="app">
            <TopBar />
            <main className="container">
              <Routes>
                <Route path="/" element={<Practice />} />
                <Route path="/progress" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <footer className="footer container">
              <span className="faint">
                Typenator · adaptive, ad-free touch typing · inspired by keybr
              </span>
            </footer>
          </div>
        </BrowserRouter>
      </ProgressProvider>
    </AuthProvider>
  );
}
