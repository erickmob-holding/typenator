# Typenator

Adaptive, **ad-free** touch-typing trainer — a faithful reimplementation of the
[keybr](https://www.keybr.com) learning model, with Firebase auth and cloud
progress sync.

Type generated, pronounceable pseudo-words built only from the letters you've
"unlocked". As each key reaches your target speed, a new letter is introduced.
Every keystroke is measured per-key, and the profile page shows your learning
curve, per-key speed, accuracy streaks, and a daily-goal ring.

## Stack

- **Vite + React + TypeScript** SPA
- **Firebase** — Auth (Google + Email/Password) and Firestore for progress sync
- **Vitest** for the engine unit tests

## How it works (the engine)

The `src/` engine modules are framework-free and unit-tested, mirroring keybr's
algorithm. The exact formulas are documented in
`/.claude/plans/i-bought-a-new-delightful-snowglobe.md`. In short:

| Concept | Where | Rule |
| --- | --- | --- |
| Speed | `result/result.ts` | `(length / (time/1000)) * 60` CPM; WPM = CPM ÷ 5 |
| Accuracy | `result/result.ts` | `(length − errors) / length` |
| Score | `result/result.ts` | `(speed × complexity / (errors+1)) × (length/50)` |
| Per-key speed | `result/keystats.ts` | exponential smoothing, α = 0.1 |
| Confidence | `lesson/target.ts` | `60000/targetSpeed ÷ timeToType`; ≥ 1 = graduated |
| Letter unlocking | `lesson/guided.ts` | new letter only once all included keys hit target |
| Prediction | `lesson/learningrate.ts` | polynomial regression, accepted at R² ≥ 0.5 |
| Pseudo-words | `phonetic/model.ts` | character Markov model restricted to unlocked letters |

## Module map

```
src/
  math/        regression, polynomial, exponential filter
  keyboard/    QWERTY layout + geometry + frequency order
  phonetic/    Markov model + seeded RNG + word corpus
  textinput/   typing state machine, histogram, per-lesson stats
  result/      Result, key/summary/daily stats, streaks, speed units
  lesson/      Target, guided algorithm, learning rate, daily goal, text gen
  settings/    typed settings + local persistence
  firebase/    app init, AuthProvider, Firestore results/settings repo
  app/         ProgressProvider (settings + results + sync orchestration)
  components/   Practice, Profile, Settings, Keyboard, Charts, TopBar, AuthDialog
```

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # engine unit tests
npm run lint
npm run build
```

## Firebase setup

The web config for the `typenator` project ships in `src/firebase/app.ts`
(public by design — access is enforced by `firestore.rules`). Two one-time
console steps are required for live auth/sync:

1. **Authentication → Sign-in method:** enable **Google** and **Email/Password**.
2. **Firestore:** create the database, then deploy the rules:
   ```bash
   npx firebase deploy --only firestore:rules
   ```

Deploy the app with `npm run build && npx firebase deploy --only hosting`.

## Data model

- `users/{uid}` — `{ displayName, settings, updatedAt }`
- `users/{uid}/results/{id}` — one document per completed lesson; all higher-level
  stats are recomputed on the client from this append-only log.

Guest progress is kept in `localStorage` and merged into the account on first
sign-in.
