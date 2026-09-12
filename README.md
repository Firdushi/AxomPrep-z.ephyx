# AxomPrep

**Learn. Practice. Prepare.**

AxomPrep is an independent Assam-focused learning and exam-preparation platform for school students, HS/HSLC students, college/university students, competitive-exam aspirants, Assam government-job aspirants and general learners.

## Tech stack

- Next.js 16 App Router + React 19 + TypeScript
- Supabase Auth, PostgreSQL, RLS and Storage
- `@supabase/ssr` for cookie-based SSR authentication
- Vercel-compatible deployment
- Plain CSS for a reliable, dependency-light UI

## Project structure

```text
AxomPrep/
├── app/
│   ├── login/ signup/ auth/confirm/
│   ├── dashboard/ notes/ tests/ gk/ current-affairs/
│   ├── about/ mission/ vision/ contact/ privacy/ terms/ disclaimer/
│   ├── admin/
│   └── api/
├── components/
├── lib/
├── supabase/
├── public/
├── .env.example
├── next.config.ts
├── package.json
├── proxy.ts
└── README.md
```

## Installation

```bash
npm install
npm run type-check
npm run build
npm start
```

For development:

```bash
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the current Supabase publishable key. Do **not** put a service-role key in frontend or `.env.example`.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/functions.sql`.
5. Run `supabase/seed.sql`.
6. Add the environment variables above to `.env.local`.
7. Run the app locally.

The SQL files are ordered intentionally: schema first, functions/triggers second, seed data last.

## Storage

`schema.sql` creates the private `notes-pdfs` bucket and policies. Admins can upload/update/delete objects in this bucket. Published notes can be accessed by authenticated users through short-lived signed URLs generated server-side.

For an existing project where the bucket already exists, the `insert ... on conflict` statement is safe to rerun; review existing storage policies before reapplying policies in a production database.

## Authentication configuration

In Supabase Authentication URL Configuration:

- Site URL: your Vercel URL, for example `https://your-project.vercel.app`
- Redirect URL: `https://your-project.vercel.app/auth/confirm`
- For local development: `http://localhost:3000/auth/confirm`

The signup page sends the confirmation link to `/auth/confirm`, which exchanges the Supabase authorization code for a session and redirects to the dashboard.

## Admin setup

Admin status is **never** assigned automatically.

1. Sign up normally.
2. In Supabase Table Editor or SQL Editor, find the user's UUID in `auth.users`.
3. Promote only the intended account:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = 'USER_UUID';
```

Never hard-code an admin email or password.

## Content management

### Notes

Go to `/admin/notes/new`, enter bilingual title/content, choose a category, optionally set the private PDF storage path, and publish when ready. PDFs should be uploaded to the `notes-pdfs` bucket by an admin.

### MCQs

Use `/admin/questions/new` for individual questions. Use `/admin/questions/import` for CSV imports. The template is `public/mcq-template.csv` and can also be downloaded at `/mcq-template.csv`.

Required CSV columns:

`question_en, option_a, option_b, option_c, option_d, correct_index, difficulty, category`

Optional columns include `question_as`, `explanation_en`, and `explanation_as`.

The importer validates required columns, row shape, correct index, difficulty and category names before inserting.

### Tests

Create a test at `/admin/tests/new`. Provide question UUIDs in the desired order. Tests are only visible to learners after publication.

## Test security

Correct answers are stored only in PostgreSQL. The learner test RPC returns question text, options and position but not `correct_index`. Submission calls a security-definer PostgreSQL function that validates the authenticated user, attempt ownership, test publication state and duplicate submission state before calculating the score.

## User features

- Supabase email/password authentication
- Email confirmation
- Protected dashboard
- Test attempts and server-side scoring
- Bookmarks
- Profile role/language fields
- Private note PDF access through signed URLs

## Vercel deployment

1. Push the extracted `AxomPrep` folder to GitHub.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel Environment Variables.
4. Deploy.
5. Update Supabase Site URL and Redirect URLs to the deployed Vercel domain.
6. Test `/api/health` and a signup/login flow.

## Troubleshooting

- **Auth confirmation fails:** verify the Site URL and `/auth/confirm` Redirect URL in Supabase.
- **Dashboard redirects to login:** verify Supabase environment variables and cookie/session configuration.
- **Admin redirects to dashboard:** verify the user's `profiles.role` is `admin`.
- **Notes are empty:** run `schema.sql`, `functions.sql`, then `seed.sql` and check that rows are published.
- **Tests have no questions:** ensure `test_questions` contains the question mappings.
- **PDF is inaccessible:** confirm the object is in the private `notes-pdfs` bucket and its path exactly matches `notes.pdf_path`.

## Health check

`GET /api/health` returns:

```json
{"ok":true,"service":"AxomPrep"}
```

## Independent-platform notice

AxomPrep is an independent educational platform and is not officially affiliated with any government, college, university, recruitment board or examination authority.

## Validation

Run the repository-level static validation before deployment:

```bash
npm run validate
npm run type-check
npm run build
```

`npm run validate` checks TypeScript/TSX syntax and every local/`@/*` import target. `npm run build` remains the authoritative production compilation check.

## Current dependency versions

The project targets Next.js 16.3.5 with React 19.3.0 and the Supabase SSR/JS packages declared in `package.json`. Use the Node.js version supported by the selected Next.js release (Node 20.9+ is required by current Next.js documentation).

## PDF workflow

Admins can upload PDFs directly from the note create/edit screens. Files are stored in the private `notes-pdfs` Supabase Storage bucket. Public note pages generate short-lived signed URLs only for authorized users.

## Search

`/search?q=...` searches published notes, categories, mock tests and current affairs. The homepage search box uses this unified search.
