# Deployment Guide - Wonder Mentorship Homework Partner

## Prerequisites

- Node.js 18+ installed
- An Anthropic API key (get one at https://console.anthropic.com)
- A Supabase project (free at https://supabase.com)
- A Vercel, Railway, or similar hosting account (for production)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at https://supabase.com/dashboard
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql` to create all tables and security policies
3. Go to **Authentication > Providers** and ensure **Email** is enabled
4. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment variables

Copy the example env file and fill in your keys:

```bash
cp env.example .env.local
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Production Deployment

### Option A: Vercel (Recommended)

Vercel is the simplest option for Next.js apps.

1. Push your code to a GitHub repository.

2. Go to https://vercel.com and import your repository.

3. Add your environment variables in the Vercel dashboard:
   - Go to **Settings > Environment Variables**
   - Add `ANTHROPIC_API_KEY` with your Anthropic API key
   - Add `NEXT_PUBLIC_SUPABASE_URL` with your Supabase project URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your Supabase anon key
   - Apply all to **Production**, **Preview**, and **Development**

4. Click **Deploy**. Vercel will build and deploy automatically.

5. Every push to `main` will trigger a new deployment.

### Option B: Railway

1. Go to https://railway.app and create a new project from your GitHub repo.

2. Add the environment variables `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Railway dashboard.

3. Railway will auto-detect Next.js and deploy. No additional config needed.

### Option C: Docker (Self-Hosted)

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.ts`:

```ts
const nextConfig = {
  output: "standalone",
};
```

Build and run:

```bash
docker build -t wonder-mentorship .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-xxx \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  wonder-mentorship
```

### Option D: Node.js Server

Build and start manually on any Linux/macOS server:

```bash
npm run build
npm start
```

Use a process manager like PM2 for production:

```bash
npm install -g pm2
pm2 start npm --name "wonder-mentorship" -- start
pm2 save
pm2 startup
```

---

## Environment Variables Reference

| Variable                       | Required | Description                          |
| ------------------------------ | -------- | ------------------------------------ |
| `ANTHROPIC_API_KEY`            | Yes      | Your Anthropic API key               |
| `NEXT_PUBLIC_SUPABASE_URL`     | Yes      | Your Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Yes      | Your Supabase anonymous/public key   |
| `PORT`                         | No       | Server port (default: 3000)          |
| `NODE_ENV`                     | No       | Set to `production` for prod builds  |

---

## Cost Considerations

- The app uses Claude claude-sonnet-4-6 for AI responses.
- Each homework grading or practice generation request costs approximately $0.003-$0.01 depending on length.
- For a nonprofit serving many students, consider:
  - Setting up rate limiting (e.g., per-student daily limits)
  - Using Anthropic's usage dashboard to monitor costs
  - Applying for Anthropic's nonprofit program if available

---

## Supabase Setup

The database schema is in `supabase/schema.sql`. It creates:

| Table               | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `profiles`          | User accounts with role (parent or student)    |
| `students`          | Child profiles with join codes, linked to parents |
| `grading_sessions`  | Homework submission history per student        |
| `grading_results`   | Individual problem results per session         |
| `practice_sessions` | Practice problem generation history            |

Row-level security (RLS) is enabled on all tables:
- Parents can only see their own children's data
- Students can only see their own data
- Join codes are publicly readable so students can look them up during linking

### Authentication

The app uses Supabase Auth with email/password. In your Supabase dashboard:

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Optionally disable email confirmation for development (Authentication > Settings > "Enable email confirmations" toggle)

---

## Security Checklist

- [ ] API keys are stored in environment variables, never in code
- [ ] `.env.local` is in `.gitignore` (it is by default)
- [ ] Supabase RLS policies are applied (included in schema.sql)
- [ ] Supabase anon key is used (not the service role key) in the frontend
- [ ] Rate limiting is configured for production
- [ ] HTTPS is enabled (automatic on Vercel/Railway)
- [ ] Student content guardrails are active (built into the app)

---

## Monitoring

- Check the Anthropic dashboard for API usage: https://console.anthropic.com
- Check the Supabase dashboard for database usage and auth activity
- Monitor server logs for errors in the `/api/*` routes
- On Vercel: use the built-in **Functions** tab for serverless function logs
