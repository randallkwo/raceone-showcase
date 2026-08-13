# RaceOne Showcase — Ultra Marathon Event Management Platform

> **Public showcase repository** for the RaceOne platform — demonstrating architecture, technical decisions, and reusable components without exposing proprietary business logic.

**Live Demo**: https://demo.raceone.ai (credentials: `viewer@demo.raceone.ai` / `demo1234`)  
**Technical Blog**: [blog.randallkwo.com/raceone-series](https://blog.randallkwo.com/raceone-series)  
**Full Platform**: https://www.raceone.ai (private, production deployment)

---

## 🏗️ What This Repository Contains

| Category | Contents | Purpose |
|----------|----------|---------|
| **Architecture & Specs** | `docs/software/` — SRS, Architecture Diagram, ERD, Component Guide, QA Process | System design documentation |
| **Core Utilities** | `src/lib/` — `brand-config.ts`, `permissions.ts`, `category-mapping.ts`, `utils.ts` | Reusable, framework-agnostic logic |
| **UI Components** | `src/components/ui/` — 10 shadcn/ui compatible components (Button, Table, Chart, etc.) | Design system foundation |
| **Brand Assets** | `public/logo-*.svg` — Logo variations, wordmark, icon | Visual identity |
| **Configuration** | `tailwind.config.ts`, `tsconfig.json`, `.gitignore` | Project setup reference |

---

## 🚫 What Is Intentionally Excluded

| Excluded | Reason |
|----------|--------|
| `src/app/` — Full page implementations, API routes | Proprietary business logic |
| `src/middleware.ts` — Auth routing, path protection | Security implementation details |
| `supabase/migrations/` — Full RLS policies, seed data | Data access control internals |
| `.env*`, `vercel.json`, `next.config.js` — Deployment secrets & rewrites | Infrastructure credentials |
| Hermes Bot Gateway, payment webhooks, Notion sync | External integration logic |

---

## 📚 Technical Deep-Dives (Blog Series)

| # | Title | Key Topics |
|---|-------|------------|
| 1 | **Supabase RLS: 6 Roles × 28 Tables Fine-Grained Access Control** | `EXISTS` subquery optimization, policy conflict resolution, test strategy |
| 2 | **Multi-Tenant White-Label Migration: From Single Event to SaaS** | Tenant isolation strategy, zero-downtime migration scripts, rollback plan |
| 3 | **Bot Gateway: Unified LINE/Telegram Routing with Hot-Reloadable Commands** | Webhook verification, command registry, audit logging, zero-downtime deploy |
| 4 | **Race-Day Timing: WebSocket + Supabase Realtime at 1M+ Writes/Event** | Segment timing, ranking calculation, reconnection, data consistency |
| 5 | **Release QA Gate: From Manual to Browserbase Automated Quality Gates** | 7-check pipeline, user simulation scripts, false-positive filtering, CI integration |

**Outlines in this repo**:
- 📄 [Article 1 — RLS Fine-Grained Access Control](docs/TECH_ARTICLE_RLS_DEEP_DIVE.md)
- 📄 [Article 2 — Multi-Tenant White-Label Migration](docs/TECH_ARTICLE_MULTI_TENANT_MIGRATION.md)

---

## 🏷️ GitHub Topics (for discoverability)

Add these **topics** on the repo's GitHub page (Settings → Topics on the repo homepage)
so recruiters and fellow engineers can find it:

`nextjs` · `supabase` · `postgresql` · `typescript` · `tailwindcss` · `multi-tenant` · `saas` · `rbac` · `row-level-security` · `white-label` · `admin-dashboard` · `event-management` · `sql` · `rest-api`

---

## 🛠️ Quick Start (Reference Only)

```bash
# This repo is for reference — it does NOT run standalone
# (missing: app pages, API routes, database, auth, external integrations)

git clone https://github.com/randallkwo/raceone-showcase.git
cd raceone-showcase
pnpm install
# pnpm dev  # Will fail — no app/ directory
```

**To run the full platform**, you need the private `raceone-admin` repository with:
- Complete `src/app/` implementation
- Supabase project with 28 tables + RLS policies
- Environment variables for Vercel, Supabase, LINE, Telegram, Resend, Notion, ECPay

---

## 🎨 Brand Identity (CIS)

| Element | Value |
|---------|-------|
| **Race Blue** | `#0066FF` |
| **Finish Green** | `#00D4AA` |
| **Alert Red** | `#FF3B30` |
| **Deep Space** | `#0A0E17` |
| **Clean White** | `#F8FAFC` |
| **Fonts** | Inter Variable / Noto Sans TC / JetBrains Mono |
| **Tagline** | FIRST TO FINISH / 率先完賽，零失誤，可複製 |

Centralized in [`src/lib/brand-config.ts`](src/lib/brand-config.ts).

---

## 🔐 RBAC Overview (Reference)

| Role | Transactions | Budget | Bot | Notion | Audit |
|------|-------------|--------|-----|--------|-------|
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `finance` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `content_editor` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `volunteer_lead` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sponsor_manager` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `viewer` | ❌ | ❌ | ❌ | ❌ | ❌ |

Implementation: **Database RLS** + **UI permissions.ts** + **Middleware** — three-layer defense.

---

## 📄 Documentation Index

```
docs/software/
├── README.md          # Documentation hub
├── SRS.md             # System Requirements Specification
├── architecture.html  # Interactive architecture diagram (open in browser)
├── ERD.md             # 28-table Entity Relationship Diagram
├── COMPONENTS.md      # Page ↔ API ↔ Table mapping
├── QA.md              # Release QA Gate + testing procedures
```

```
docs/
├── TECH_ARTICLE_RLS_DEEP_DIVE.md  # 技術文章大綱：RLS 細粒度權限控制實作
```

---

## 🚀 Demo Environment Setup

This repository includes scripts to deploy a **controlled demo environment** (`demo.raceone.ai`) with:
- Isolated Supabase project (1 tenant, 1 event, 3 categories)
- Pre-seeded data: registrations, timing records, budget, aid stations, news
- Demo accounts: `admin@demo.raceone.ai`, `finance@demo.raceone.ai`, `viewer@demo.raceone.ai` (all password: `demo1234`)
- **Read-only mode**: All write operations blocked via `demoGuard` / `demoApiGuard`

### Quick Deploy

```bash
# 1. Create a new Supabase project for demo
# 2. Run setup script (requires Supabase URL + Anon Key + Service Role Key)
chmod +x scripts/setup-demo.sh
./scripts/setup-demo.sh https://your-demo.supabase.co <ANON_KEY> <SERVICE_ROLE_KEY>

# 3. Copy .env.demo to .env.local (or add to Vercel Environment Variables)
cp .env.demo .env.local

# 4. Build and deploy
pnpm build
# Deploy to Vercel → demo.raceone.ai
```

### Demo Guard (Client + Server)

| File | Purpose |
|------|---------|
| `src/lib/demo-mode.ts` | Client-side guard for UI interactions (buttons, forms) |
| `src/lib/demo-api-guard.ts` | Server-side guard for API Routes & Server Actions |

Both check `NEXT_PUBLIC_DEMO_MODE=true` and block mutating operations with a friendly message.

---

## 📝 License

© 2026 RaceOne. All rights reserved. — see [LICENSE](LICENSE).  
This showcase repository is for **portfolio demonstration only**.  
White-label / multi-tenant deployment available — contact: `randallkwo@hotmail.com`