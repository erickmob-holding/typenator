#!/usr/bin/env node
/**
 * Admin: reset (delete) all typing results for a specific user, by uid.
 *
 * Progress lives at `users/<uid>/results`; this deletes that whole subcollection
 * and leaves the user's settings (`users/<uid>`) untouched. The browser client
 * can't do this for other users (Firestore rules only allow a user to touch
 * their own data), so this runs server-side via the Firebase CLI.
 *
 * Prerequisites:
 *   - firebase-tools installed and authenticated as a project owner/editor
 *     (`firebase login`). This repo's .firebaserc already targets `typenator`.
 *
 * Usage:
 *   node scripts/reset-user-progress.mjs <uid>
 *   node scripts/reset-user-progress.mjs <uid> --dry-run   # show what would run
 *
 * Find a user's uid in the Firebase console under Authentication → Users.
 */
import { execFileSync } from "node:child_process";

const [uid, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");

if (!uid || uid.startsWith("-")) {
  console.error("Usage: node scripts/reset-user-progress.mjs <uid> [--dry-run]");
  process.exit(1);
}

const path = `users/${uid}/results`;
const args = ["firestore:delete", path, "--recursive", "--force"];

console.log(`Resetting progress for user ${uid}`);
console.log(`  firebase ${args.join(" ")}`);

if (dryRun) {
  console.log("(dry run — nothing deleted)");
  process.exit(0);
}

try {
  execFileSync("firebase", args, { stdio: "inherit" });
  console.log("Done. The user's results were deleted; their settings were kept.");
} catch {
  // Fall back to npx if the firebase CLI is not on PATH.
  console.log("`firebase` not found on PATH — retrying via npx firebase-tools…");
  execFileSync("npx", ["--yes", "firebase-tools", ...args], { stdio: "inherit" });
  console.log("Done. The user's results were deleted; their settings were kept.");
}
