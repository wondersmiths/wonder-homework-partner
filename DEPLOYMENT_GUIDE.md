# Deployment Guide - Wonder Mentorship Homework Partner

## Prerequisites

- Node.js 18+ installed
- An Anthropic API key (get one at https://console.anthropic.com)
- A Vercel, Railway, or similar hosting account (for production)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and add your API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Start the development server

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

3. Add your environment variable in the Vercel dashboard:
   - Go to **Settings > Environment Variables**
   - Add `ANTHROPIC_API_KEY` with your API key
   - Apply to **Production**, **Preview**, and **Development**

4. Click **Deploy**. Vercel will build and deploy automatically.

5. Every push to `main` will trigger a new deployment.

### Option B: Railway

1. Go to https://railway.app and create a new project from your GitHub repo.

2. Add the environment variable `ANTHROPIC_API_KEY` in the Railway dashboard.

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
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-xxx wonder-mentorship
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

| Variable            | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | Your Anthropic API key             |
| `PORT`              | No       | Server port (default: 3000)        |
| `NODE_ENV`          | No       | Set to `production` for prod builds|

---

## Cost Considerations

- The app uses Claude claude-sonnet-4-6 for AI responses.
- Each homework grading or practice generation request costs approximately $0.003-$0.01 depending on length.
- For a nonprofit serving many students, consider:
  - Setting up rate limiting (e.g., per-student daily limits)
  - Using Anthropic's usage dashboard to monitor costs
  - Applying for Anthropic's nonprofit program if available

---

## Security Checklist

- [ ] API key is stored in environment variables, never in code
- [ ] `.env.local` is in `.gitignore` (it is by default)
- [ ] Rate limiting is configured for production
- [ ] HTTPS is enabled (automatic on Vercel/Railway)
- [ ] Student content guardrails are active (built into the app)

---

## Monitoring

- Check the Anthropic dashboard for API usage: https://console.anthropic.com
- Monitor server logs for errors in the `/api/*` routes
- On Vercel: use the built-in **Functions** tab for serverless function logs
