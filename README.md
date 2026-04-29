# Najah Courses Dashboard

Modern admin dashboard for Najah Academy built with React, TypeScript, and Vite. The UI is structured for scale and integrates with the Najah backend API for auth, students, courses, topics, and lectures.

## Setup

1. Install dependencies

```
npm install
```

2. Configure the API base URL in [.env](.env)

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

3. Start the dev server

```
npm run dev
```

## Scripts

- `npm run dev` Start the dev server
- `npm run build` Build for production
- `npm run preview` Preview the production build
- `npm run lint` Run lint checks

## Project structure

- src/api: API client and endpoints
- src/app: router and query client
- src/components: reusable UI blocks
- src/features: domain-specific state and helpers
- src/layouts: page layouts
- src/pages: route pages
- src/types: shared TypeScript types
- src/lib: utilities and helpers

## Notes

- Auth token is stored in local storage under `najah_token`.
- File uploads for courses and topics use multipart form data.
