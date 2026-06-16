# Campus Connect — Frontend

Next.js (App Router) + React 19 + TypeScript + Tailwind CSS v4 + HeroUI v3.
Talks to the Django backend over REST. Package manager: **pnpm**.

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** — install with `npm install -g pnpm` if you don't have it
- The **backend running** (see [../backend/README.md](../backend/README.md))

---

## Setup

```bash
cd frontend

# 1. Environment
cp .env.local.example .env.local
#   NEXT_PUBLIC_API_URL          → backend API base, e.g. http://localhost:8000/api
#   NEXT_PUBLIC_GOOGLE_CLIENT_ID → optional, enables Google sign-in

# 2. Install
pnpm install

# 3. Run the dev server
pnpm dev          # → http://localhost:3000
```

### Other scripts
```bash
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # eslint
npx tsc --noEmit  # type-check without emitting
```

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend API base URL **including `/api`**. Defaults to `http://localhost:8000/api` if unset. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | no | Google OAuth client ID. When blank, the Google button is hidden. |

> Anything prefixed `NEXT_PUBLIC_` is exposed to the browser — never put secrets here.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx            root layout (fonts, providers, no-flash theme script)
│   ├── icon.svg              favicon (the Campus Connect logo)
│   ├── (auth)/login/         login + register
│   └── (main)/               authenticated area (navbar + dialogs)
│       ├── feed/  campus/  profile/
├── components/
│   ├── Logo.tsx              the SVG brand mark
│   ├── AboutModal / HelpModal
│   ├── layout/               AppNavbar, NotificationsBell, ThemePicker
│   ├── posts/                PostCard (like/edit/delete), CreatePostModal
│   ├── profile/              EditProfileModal (avatar/template/details)
│   └── campus/ comments/
├── contexts/                 Auth, ThemeAccent, Dialogs
├── hooks/                    SWR data hooks (usePosts, useCampuses, useComments)
├── lib/                      api (axios), avatars (DiceBear), banners, templates, themes
└── types/                    shared TypeScript interfaces
```

---

## How a few things work

- **Theming** — the whole app's accent is driven by one CSS variable, `--app-hue`, on
  `<html>`. The 🎨 picker in the navbar sets it; it's persisted in `localStorage` and
  applied pre-paint by an inline script in `layout.tsx`. Light/dark is handled by
  `next-themes`.
- **Avatars / campus emblems** — generated on the fly via the free DiceBear API
  (`lib/avatars.ts`). A user's chosen avatar is saved as their `avatar_url`.
- **Modals** — dialogs (create/edit post, edit profile, about, help) render via
  `createPortal` into `document.body` for reliable centering.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Every API call fails / 401 | Backend not running, or `NEXT_PUBLIC_API_URL` is wrong (must end in `/api`). |
| CORS error in console | Add your origin to `CORS_ALLOWED_ORIGINS` in the backend settings. |
| Changed `.env.local` but nothing changed | Restart `pnpm dev` — env is read at boot. |
| Google button missing | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is blank (expected) — set it to enable. |
| Avatars/banners blank | DiceBear/Unsplash are external; check connectivity. |
| Port 3000 in use | `pnpm dev -p 3001`. |
