# PR Sentinel Frontend

PR Sentinel is a Next.js 16 engineering-intelligence dashboard for GitHub pull-request review operations. It connects to the PR Sentinel backend, displays repositories and pull requests, tracks review status and findings, provides diff inspection, and includes an AI review chat surface.

## What the application does

- Authenticates users through sign-in, sign-up, and auth callback flows.
- Connects a user or organization GitHub installation to PR Sentinel.
- Synchronizes accessible GitHub repositories from the backend.
- Shows a dashboard summary of repository, pull-request, reviewed, and failed counts.
- Lists pull requests with repository, status, author, and filtering context.
- Opens a pull-request review workspace with overview, diff, findings, and chat views.
- Loads individual changed files and displays their patches in the diff viewer.
- Groups AI review comments by severity, category, file, and line location.
- Supports retrying failed reviews and refreshing live pull-request data.
- Shows repository detail pages and repository pull-request activity.
- Shows findings and activity views for engineering follow-up.
- Provides settings for workspace/account configuration.
- Handles loading, empty, error, authentication, and connection states.
- Supports responsive desktop and mobile layouts with a collapsible dashboard navigation.

## Core user workflow

1. Open the application and authenticate at `/sign-in` or create an account at `/sign-up`.
2. Open the GitHub integration page at `/dashboard/github`.
3. Install or manage the PR Sentinel GitHub App and select repositories.
4. Return to the dashboard to see synchronized repository and pull-request data.
5. Open a pull request from `/dashboard/pull-requests`.
6. Review the summary, changed files, diff, findings, and AI review chat.
7. Use severity labels and file locations to prioritize fixes.
8. Refresh live status or retry a failed review when needed.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4 and project-specific CSS design tokens
- Redux Toolkit and React Redux for application/store state
- SWR for cached API fetching and live synchronization
- Lucide React for interface icons
- ESLint 9 with the Next.js configuration

## Architecture

The frontend is intentionally separated into route composition, reusable UI, API access, and state management layers.

```text
src/
├── app/
│   ├── auth/callback/                 Authentication callback
│   ├── dashboard/                     Authenticated application routes
│   │   ├── activity/                  Activity timeline
│   │   ├── findings/                  Review findings
│   │   ├── github/                    GitHub integration
│   │   ├── pull-requests/             Pull-request list and detail
│   │   ├── repositories/              Repository list and detail
│   │   ├── reviews/                   Review list and detail
│   │   └── settings/                  Workspace and account settings
│   ├── github/                        GitHub setup and installation callbacks
│   ├── sign-in/                       Sign-in route
│   ├── sign-up/                       Sign-up route
│   ├── layout.tsx                     Metadata, fonts, and global providers
│   └── globals.css                    Theme tokens and responsive styling
├── components/
│   ├── dashboard-shell.tsx            Sidebar, top bar, account menu, navigation
│   ├── pr-sentinel-dashboard.tsx      Dashboard summary and recent activity
│   ├── pull-requests-page.tsx        Pull-request queue
│   ├── pull-request-detail-page.tsx  Pull-request summary/detail
│   ├── pr-review-workspace.tsx       Tabs for overview, diff, findings, and chat
│   ├── diff-viewer.tsx               Changed-file patch viewer
│   ├── ai-review-chat.tsx            AI review conversation interface
│   ├── github-integration.tsx        GitHub installation and repository sync
│   ├── repositories-page.tsx         Repository list
│   ├── repository-detail-page.tsx    Repository details and PRs
│   ├── findings-page.tsx             Findings list and severity views
│   ├── activity-page.tsx             Activity timeline
│   ├── auth-form.tsx                 Shared authentication form
│   ├── auth-gate.tsx                 Authenticated route guard
│   └── ui/                           Shared badges, empty, error, and loading states
└── lib/
    ├── api/client.ts                 Centralized typed fetch client
    ├── api/hooks.ts                  SWR/live data hooks
    ├── api/github.ts                 GitHub installation operations
    ├── api/pull-requests.ts          Pull-request and file operations
    ├── api/repositories.ts           Repository operations
    ├── api/reviews.ts                Review and retry operations
    ├── api/realtime.ts               Live update helpers
    ├── api/types.ts                  Backend entity and response types
    ├── auth.ts                       Authentication helpers
    ├── config.ts                     Runtime API configuration
    └── store/                        Redux store and GitHub connection state
```

## Routes

| Route | Functionality |
| --- | --- |
| `/` | Application landing or entry point |
| `/sign-in` | User sign-in |
| `/sign-up` | User registration |
| `/auth/callback` | Authentication callback handling |
| `/dashboard` | Review intelligence overview |
| `/dashboard/github` | GitHub App installation and repository sync |
| `/dashboard/repositories` | Connected repository list |
| `/dashboard/repositories/[id]` | Repository details and related pull requests |
| `/dashboard/pull-requests` | Pull-request queue |
| `/dashboard/pull-requests/[id]` | Pull-request detail and review workspace |
| `/dashboard/reviews` | Review history and status |
| `/dashboard/reviews/[id]` | Review detail and comments |
| `/dashboard/findings` | Findings grouped by severity and category |
| `/dashboard/activity` | Recent engineering activity |
| `/dashboard/settings` | Workspace and account settings |
| `/github/setup` | GitHub installation setup |
| `/github/installation/callback` | GitHub installation callback |

## API integration

All backend requests go through `src/lib/api/client.ts`. The client:

- Uses `NEXT_PUBLIC_API_URL` as the backend base URL.
- Sends cookies with `credentials: "include"` for authenticated requests.
- Serializes JSON request bodies and query parameters.
- Supports GET, POST, PATCH, PUT, and DELETE requests.
- Unwraps the backend success envelope when present.
- Handles empty `204` responses.
- Converts HTTP failures into typed `ApiError` instances.
- Exposes status helpers for authentication, authorization, not-found, and server errors.
- Supports abort signals and idempotency keys for safe mutations.

The frontend models the backend entities `Installation`, `Repository`, `PullRequest`, `PrFile`, `Review`, and `ReviewComment`, plus dashboard statistics, GitHub connection status, chat requests, and pull-request filters.

## Environment variables

Create `.env.local` for local development. Never commit secrets.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | PR Sentinel backend API base URL |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL used by callback/link flows |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Development authentication redirect URL |

`NEXT_PUBLIC_*` variables are exposed to the browser. Do not put private tokens, service-role keys, or other secrets in them.

## Getting started

### Requirements

- Node.js 20 or newer
- npm

### Install

```bash
npm install
```

### Configure the environment

```bash
cp .env.example .env.local
```

Update `.env.local` with the API and callback values required by the backend.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create and validate a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## UI and UX implementation

- Shared dashboard shell with responsive sidebar navigation.
- Mobile navigation drawer with dismissible backdrop and route-aware closing behavior.
- Dark/light theme tokens defined in `src/app/globals.css`.
- Semantic status, severity, success, warning, and error treatments.
- Responsive stat grids, content panels, data lists, and review workspaces.
- Accessible labels, keyboard focus states, external-link attributes, and loading/error feedback.
- Custom PR Sentinel favicon and application mark in `public/pr-sentinel-mark.svg`.
- Account menu with styled sign-out action and clear destructive-action affordance.

## Data and state behavior

- SWR hooks cache and revalidate dashboard, repository, pull-request, and review data.
- Live pull-request updates are exposed through the API/realtime helpers.
- Redux stores GitHub connection and installation state shared across dashboard views.
- Components do not send a client-provided `userId`; authenticated cookies identify the user server-side.
- Loading, empty, error, and unauthorized states are represented through shared UI components.

## Production checklist

1. Set all environment variables in the deployment environment.
2. Confirm the frontend can reach the configured backend API.
3. Verify authentication callback URLs match the deployed frontend URL.
4. Verify the GitHub App installation callback is configured correctly.
5. Run `npm run lint` and `npm run build`.
6. Test sign-in, GitHub installation, repository sync, pull-request navigation, diff loading, findings, retry, and sign-out.
7. Confirm no private credentials are present in client-exposed environment variables.

## License

This project is private and intended for internal or product development use.
