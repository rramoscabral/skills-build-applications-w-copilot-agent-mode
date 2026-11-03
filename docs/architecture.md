# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route-level components responsible for fetching, loading, empty, and error states while leaving business logic to the API and data layers. The UI should render real data from the `/api/*` contract and expose accessible status/error messaging instead of static placeholder text.
- Logic tier decision: Centralize behavior in the Express service layer and keep routes thin. Validation, reference checks, computed fields, aggregation, and user-specific recommendation logic belong in `octofit-tracker/backend/src/services/octofitService.ts`, while HTTP handlers in `src/routes/api.ts` only parse request data and return JSON responses.
- Data tier decision: Use Mongoose schemas with explicit `required` constraints, default values, and object references so invalid records fail at validation time and seed data remains idempotent across repeated runs. This avoids silent invalid rows and keeps the logic tier focused on contract behavior.
- Activity tracking approach: Require a valid `user`, `team`, `type`, and `minutes`, reject malformed or unknown IDs with deliberate 4xx responses, compute `points` from activity minutes, and store a timestamp in `occurredAt` for reporting and leaderboard calculations.
- Team management approach: Require `name` and `mascot`, maintain `members` as a default empty array, and preserve member references when teams are created or listed so both team creation and listing work without orphaned relationships.
- Leaderboard approach: Aggregate team totals across all activities, sort descending by total points, and assign a 1-based rank per entry. The leaderboard response should include `teamName`, `totalPoints`, and `rank` exactly as the API contract expects.
- Workout suggestions approach: Resolve the seeded user by email, map recent activity patterns to a matching workout focus such as endurance or strength, and include a human-readable `reason` explaining the match. Unknown users should return a deliberate 4xx instead of falling through to a generic server error.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`  
  This currently fails because the Mongoose models do not enforce the required schema fields for `User`, `Team`, `Activity`, and `Workout`. The seed idempotency check passes, which confirms the root issue is validation rather than persistence logic.
- API command: `npm run test:api --prefix octofit-tracker/backend`  
  This fails because the service layer still throws `501` placeholders for activity/team creation and returns an empty leaderboard. The workout suggestion test also shows the first recommendation is chosen by a generic fallback instead of recent user activity patterns.
- Frontend command: `npm test --prefix octofit-tracker/frontend`  
  This fails because the presentation tier still renders static placeholder text and never implements loading/empty/error state handling. The tests expect accessible `role="status"` and `role="alert"` behavior and real data iteration for activities, teams, leaderboard, and workouts.
- Backend build command: `npm run build --prefix octofit-tracker/backend`  
  This should be used after the data and logic contracts are implemented to catch TypeScript-level issues without running the full test suite.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`  
  This was verified as passing, so compile-time correctness is present even though the UI contract is not yet implemented. It confirms the codebase builds cleanly before runtime behavior is filled in.
Step 5 checkpoint
