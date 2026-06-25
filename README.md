# CRM Core — Phase 1 (Multi-Tenant CRM Foundation)

This is **Phase 1** of the full Salesforce-style CRM build: the core, production-grade
foundation that every later module (Billing, WhatsApp, Meta Lead Ads, AI Campaign
Analyzer, White-Label) will plug into.

## What's included in this phase

- **Multi-tenant architecture** — shared database, row-level isolation via `tenant_id`.
  Scales to 1000+ companies without schema-per-tenant complexity.
- **Authentication** — JWT access + refresh tokens, bcrypt password hashing.
- **RBAC (Role-Based Access Control)** — permission catalogue + roles
  (`super_admin`, `company_admin`, `manager`, `sales_rep`), enforced on every route.
- **Core CRM objects** — Leads, Contacts, Deals, with ownership-based visibility
  (`view_own` vs `view_all` permissions), soft deletes, and an audit Activity log.
- **Super Admin panel (API)** — manage all tenants, suspend/activate, platform stats.
- **React frontend** — login/signup, dashboard, and CRUD screens for Leads/Contacts/Deals/Team.
- **Docker Compose** — Postgres + backend + frontend, one command to run everything.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| ORM / DB | Sequelize + PostgreSQL |
| Auth | JWT (access + refresh) + bcrypt |
| Frontend | React (Vite) + React Router + Axios |
| Deployment | Docker + Docker Compose, Nginx for frontend |

## Architecture: why row-level multi-tenancy

Every tenant-owned table (`users`, `leads`, `contacts`, `deals`, `roles`, `activities`)
carries a `tenant_id` column. Every query in the backend filters by `req.tenantId`,
which is derived from the authenticated user's JWT — never from client input. This is:

- Simpler to operate than schema-per-tenant (one connection pool, one migration path).
- Proven to scale to 100,000s of rows per tenant with proper indexing (already added
  on `tenant_id` and common filter columns).
- Easy to later shard by `tenant_id` if a handful of very large tenants need it.

## ER Diagram (Phase 1)

```
Tenant (1) ──── (M) User ──── (1) Role ──── (M) RolePermission ──── (M) Permission
   │                  │
   │                  └──── (M) Lead / Contact / Deal   [owner_id]
   │
   ├──── (M) Lead
   ├──── (M) Contact ──── (M) Deal   [contact_id]
   ├──── (M) Deal
   └──── (M) Activity   [audit log: who did what, on which record]

Lead (1) ──── (1) Contact   [conversion link, lead_id]
```

Full column-level detail is in the model files under `backend/src/models/`.

## RBAC permission map

| Role | Key permissions |
|---|---|
| `super_admin` | Everything, including managing all tenants |
| `company_admin` | Full access within their own tenant, including user management |
| `manager` | View/create/update all leads, contacts, deals; invite users |
| `sales_rep` | View/create/update only **their own** leads, contacts, deals |

Permissions are stored in the database (`permissions` + `role_permissions` tables),
not hardcoded — so you can add custom roles per tenant later without code changes.

## Running locally (without Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env     # edit DB credentials, JWT secrets
npm install
npm run db:migrate       # creates tables
node src/seed/seed.js    # creates permission catalogue + super admin user
npm run dev              # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env     # set VITE_API_URL if backend isn't on localhost:5000
npm install
npm run dev               # starts on http://localhost:5173
```

Sign up a new company at `/signup`, or log in as the bootstrap super admin using the
credentials from `backend/.env` (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`).

## Running with Docker (recommended for a quick full-stack spin-up)

```bash
docker compose up --build
```

This starts:
- Postgres on `localhost:5432`
- Backend API on `localhost:5000` (auto-runs migrations + seed on boot)
- Frontend on `localhost:8080`

**Change `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `SUPER_ADMIN_PASSWORD` in
`docker-compose.yml` before deploying anywhere outside your own laptop.**

## API reference (Phase 1)

Base URL: `/api`

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Create a new tenant + first admin user (starts 14-day trial) |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| GET | `/auth/me` | Current user, role, permissions |

### Leads / Contacts / Deals (identical shape, swap the path)
| Method | Path | Permission required |
|---|---|---|
| GET | `/leads` | `lead.view_own` or `lead.view_all` |
| GET | `/leads/:id` | same |
| POST | `/leads` | `lead.create` |
| PATCH | `/leads/:id` | `lead.update` |
| DELETE | `/leads/:id` | `lead.delete` (soft delete) |

Query params on list endpoints: `q` (search), `page`, `limit`, `status`/`stage`.

### Users (team management, tenant-scoped)
| Method | Path | Permission |
|---|---|---|
| GET | `/users` | `user.manage` or `user.invite` |
| POST | `/users/invite` | `user.invite` |
| PATCH | `/users/:id` | `user.manage` |

### Admin (super admin only)
| Method | Path |
|---|---|
| GET | `/admin/tenants` |
| PATCH | `/admin/tenants/:id/status` |
| GET | `/admin/stats` |

## What's deliberately NOT in this phase

These were in the original spec but belong to later phases, since each needs its own
real-world setup (API keys, webhooks, gateway accounts) beyond just code:

1. **Billing & Subscriptions** — Razorpay/Stripe/PayPal, invoicing, GST.
2. **WhatsApp Business API** — shared inbox, templates, automation.
3. **Meta Lead Ads sync** — Facebook/Instagram webhook ingestion.
4. **AI Campaign Analyzer** — CSV/Excel upload + AI-driven ad performance analysis.
5. **White-labeling** — custom domain, theme, logo (DB fields already scaffolded on `Tenant`).
6. **Google/Outlook integrations** — Gmail, Calendar, Sheets import/export.

The `Tenant` model already has placeholder fields (`custom_domain`, `logo_url`,
`theme_color`) and the `Lead` model has placeholder fields (`campaign_name`,
`ad_set_name`, `ad_name`) so these slot in without breaking existing schema.

## Suggested next phase

**Billing & Subscriptions** is the natural next step — it gates access to the rest of
the product (trial expiry, plan limits) and is needed before any other module makes
commercial sense to ship.
