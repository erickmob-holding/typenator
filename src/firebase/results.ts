import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { Result } from "@/result";
import { type Settings, mergeSettings } from "@/settings";
import { db } from "./app.ts";

const LOCAL_RESULTS_KEY = "typenator.results";

type ResultJSON = ReturnType<Result["toJSON"]>;

// --- Local (guest) result cache -------------------------------------------

export function loadLocalResults(): Result[] {
  try {
    const raw = localStorage.getItem(LOCAL_RESULTS_KEY);
    if (raw) {
      return (JSON.parse(raw) as ResultJSON[]).map(Result.fromJSON);
    }
  } catch {
    // Ignore malformed storage.
  }
  return [];
}

export function saveLocalResults(results: readonly Result[]): void {
  try {
    localStorage.setItem(
      LOCAL_RESULTS_KEY,
      JSON.stringify(results.map((r) => r.toJSON())),
    );
  } catch {
    // Non-fatal.
  }
}

export function clearLocalResults(): void {
  try {
    localStorage.removeItem(LOCAL_RESULTS_KEY);
  } catch {
    // Non-fatal.
  }
}

// --- Firestore (signed-in) -------------------------------------------------

/** A stable doc id per result so re-syncing the same result is idempotent. */
function resultId(r: Result): string {
  return `${r.timeStamp}_${r.layout}_${r.length}`;
}

export async function loadRemoteResults(uid: string): Promise<Result[]> {
  const snap = await getDocs(collection(db, "users", uid, "results"));
  return snap.docs
    .map((d) => Result.fromJSON(d.data() as ResultJSON))
    .sort((a, b) => a.timeStamp - b.timeStamp);
}

export async function saveRemoteResult(uid: string, result: Result): Promise<void> {
  await setDoc(
    doc(db, "users", uid, "results", resultId(result)),
    result.toJSON(),
  );
}

/** Deletes every result for a user, keeping their settings doc intact. */
export async function deleteAllRemoteResults(uid: string): Promise<void> {
  const snap = await getDocs(collection(db, "users", uid, "results"));
  let batch = writeBatch(db);
  let count = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    if (++count === 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }
}

/** Uploads any local guest results into the account, de-duplicated by id. */
export async function mergeGuestResults(
  uid: string,
  local: readonly Result[],
): Promise<void> {
  if (local.length === 0) {
    return;
  }
  const col = collection(db, "users", uid, "results");
  let batch = writeBatch(db);
  let count = 0;
  for (const r of local) {
    batch.set(doc(col, resultId(r)), r.toJSON());
    if (++count === 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }
}

// --- Per-user settings -----------------------------------------------------

export async function loadRemoteSettings(uid: string): Promise<Settings | null> {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();
  return data?.settings ? mergeSettings(data.settings) : null;
}

export async function saveRemoteSettings(
  uid: string,
  settings: Settings,
  displayName: string | null,
): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    { settings, displayName, updatedAt: Date.now() },
    { merge: true },
  );
}
