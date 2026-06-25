import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Keyboard, keyboardById } from "@/keyboard";
import { PhoneticModel } from "@/phonetic";
import { Result } from "@/result";
import {
  loadLocalSettings,
  saveLocalSettings,
  type Settings,
} from "@/settings";
import { useAuth } from "@/firebase/auth.tsx";
import {
  clearLocalResults,
  loadLocalResults,
  loadRemoteResults,
  loadRemoteSettings,
  mergeGuestResults,
  saveLocalResults,
  saveRemoteResult,
  saveRemoteSettings,
} from "@/firebase/results.ts";

type ProgressState = {
  readonly settings: Settings;
  readonly results: readonly Result[];
  readonly keyboard: Keyboard;
  readonly model: PhoneticModel;
  readonly syncing: boolean;
  updateSettings(patch: Partial<Settings>): void;
  appendResult(result: Result): void;
  /** Bulk-imports results (e.g. a keybr export), de-duplicated. Returns how many were added. */
  importResults(incoming: readonly Result[]): Promise<number>;
};

const ProgressContext = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(() => loadLocalSettings());
  const [results, setResults] = useState<readonly Result[]>(() =>
    loadLocalResults(),
  );
  const [syncing, setSyncing] = useState(false);
  const uidRef = useRef<string | null>(null);

  // The phonetic model is built once; the keyboard follows the layout setting.
  const model = useMemo(() => PhoneticModel.english(), []);
  const keyboard = useMemo(() => keyboardById(settings.layout), [settings.layout]);

  // Reflect the theme on the document for global styling.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // React to sign-in / sign-out: load the right data source and merge guests.
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (user) {
        setSyncing(true);
        try {
          const guest = loadLocalResults();
          if (guest.length > 0) {
            await mergeGuestResults(user.uid, guest);
            clearLocalResults();
          }
          const [remoteResults, remoteSettings] = await Promise.all([
            loadRemoteResults(user.uid),
            loadRemoteSettings(user.uid),
          ]);
          if (cancelled) {
            return;
          }
          uidRef.current = user.uid;
          setResults(remoteResults);
          if (remoteSettings) {
            setSettings(remoteSettings);
          } else {
            // First sign-in: persist the current local settings to the account.
            await saveRemoteSettings(user.uid, settings, user.displayName);
          }
        } finally {
          if (!cancelled) {
            setSyncing(false);
          }
        }
      } else {
        uidRef.current = null;
        setResults(loadLocalResults());
        setSettings(loadLocalSettings());
      }
    }
    void sync();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch } as Settings;
        if (uidRef.current) {
          void saveRemoteSettings(uidRef.current, next, user?.displayName ?? null);
        } else {
          saveLocalSettings(next);
        }
        return next;
      });
    },
    [user],
  );

  const appendResult = useCallback((result: Result) => {
    setResults((prev) => {
      const next = [...prev, result];
      if (uidRef.current) {
        void saveRemoteResult(uidRef.current, result);
      } else {
        saveLocalResults(next);
      }
      return next;
    });
  }, []);

  const importResults = useCallback(
    async (incoming: readonly Result[]): Promise<number> => {
      const keyOf = (r: Result) => `${r.timeStamp}_${r.layout}_${r.length}`;
      const existing = new Set(results.map(keyOf));
      const fresh = incoming.filter((r) => !existing.has(keyOf(r)));
      if (fresh.length === 0) {
        return 0;
      }
      const merged = [...results, ...fresh].sort(
        (a, b) => a.timeStamp - b.timeStamp,
      );
      if (uidRef.current) {
        await mergeGuestResults(uidRef.current, fresh);
      } else {
        saveLocalResults(merged);
      }
      setResults(merged);
      return fresh.length;
    },
    [results],
  );

  const value = useMemo<ProgressState>(
    () => ({
      settings,
      results,
      keyboard,
      model,
      syncing,
      updateSettings,
      appendResult,
      importResults,
    }),
    [
      settings,
      results,
      keyboard,
      model,
      syncing,
      updateSettings,
      appendResult,
      importResults,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressState {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return ctx;
}
