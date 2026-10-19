# Case Hub — Discover. Share. Compete.

**Case Hub** is a student competition discovery, publishing, and collaboration platform designed specifically for the student community at **HSB Jaipur**.

The platform enables students to discover verified case competitions, business challenges, consulting challenges, hackathons, and professional opportunities. Students can instantly publish competitions, recruit teammates with complementary skill sets, save opportunities with automated deadline alerts, access case-preparation frameworks, and receive transactional email updates.

---

## 1. Product Identity & Design System

* **Product Name**: Case Hub *(strictly named Case Hub throughout all UI, metadata, and communications)*
* **Tagline**: *Discover. Share. Compete.*
* **Visual Identity**: HSB-inspired navy blue + classic academic elegance + old-money aesthetic + heritage editorial layouts + business-school professionalism.

### Design Tokens
| Token | Hex Value | Application |
|---|---|---|
| **Primary Navy** | `#102747` | Brand headers, primary buttons, major headlines |
| **Deep Navy** | `#0A1930` | Footers, dark cards, deep hero backgrounds |
| **Secondary Navy** | `#1C3557` | Button hover states, accents |
| **Ivory Background** | `#F7F4EC` | Platform body background, spacious canvas |
| **Warm Neutral** | `#EEE9DE` | Card backdrops, subtle banners |
| **Subtle Border** | `#DCD6CA` | Restrained card & divider borders |
| **Antique Brass** | `#AC925B` | Editorial accents, badges, highlights |
| **Academic Success** | `#355C48` | Verified badges, open status |
| **Academic Error / Urgent** | `#A94343` | Closing-soon alerts, error notices |

### Typography
* **Editorial Headlines**: Serif typography (*Playfair Display*, *Cormorant Garamond*, *Libre Baskerville*)
* **Interface & Body**: Readable sans-serif (*Inter*, *Source Sans 3*)

---

## 2. Core Functional Highlights

### ⚡ Instant Publishing (No Approval Queue)
* Every valid student submission publishes **instantly** to the live catalog upon submission.
* Submissions are immediately visible on the `/competitions` discovery feed and dedicated detail routes.
* Automated notification emails are immediately triggered to faculty administrators for governance, moderation, and archiving capabilities without blocking student visibility.

### 📧 Transactional Email Automation
* **Admin New Upload Notification**: Contains full competition details, poster preview, uploader display name, authenticated uploader email, and primary button **"View Competition on Case Hub"** linking directly to the internal detail route.
* **48-Hour Closing Soon Reminders**: Daily scheduled scanner identifying open opportunities with deadlines under 48 hours, dispatched to interested students with duplicate suppression.
* **Saved Opportunity Update Alerts**: Detects when a competition's deadline or event dates are modified, and automatically notifies students who saved the challenge with previous vs updated schedules.

### 🤝 Team Finder Collaboration
* Embedded on competition detail pages.
* Students can post team recruitment listings with target team sizes.
* Real-time join/leave workflows with backend capacity protection to prevent exceeding target sizes or duplicate memberships.

### 🛡️ Privacy Architecture
* Public competition queries **never expose uploader email addresses**.
* Sensitive submission metadata is strictly isolated to authorized administrators and the original uploader.

### 📊 Bulk Competition Import
* Administrator-only batch processing supporting Excel (`.xlsx`) and `.csv` files.
* Downloadable standard spreadsheet templates.
* Pre-import data preview table with row-level validation and error reporting.

---

## 3. Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
* **Database & Persistence**:
  * Unified persistent database engine with atomic file transactions (`data/case_hub.db.json`)
  * Full production Supabase PostgreSQL migration schema with Row-Level Security (`supabase/migrations/20261019_initial_schema.sql`)
* **Email Service**: Resend REST API integration with fallback persistent outbox logger and admin retry tools
* **Automation**: Next.js Server-side background schedulers and secure Cron API (`/api/cron/closing-soon`)

---

## 4. Getting Started

### Prerequisites
* Node.js v18+ (tested on Node v24)
* npm v9+

### Installation
```bash
# 1. Clone or navigate to the repository
cd "c:\Users\as701\OneDrive\Desktop\CASE HUB"

# 2. Install dependencies
npm install

# 3. Configure environment variables (a pre-configured .env.local is provided)
cp .env.example .env.local

# 4. Build and start production server
npm run build
npm run start
```
The application will be live at `http://localhost:3000`.

---

## 5. Pre-Seeded Test Accounts

You can test student and administrator workflows immediately using the **Quick Test Account Switcher** on the login page or navigation bar:

1. **Student Account (Aarav Mehta)**
   * **Role**: Student (`student`)
   * **Email**: `aarav.mehta@hsb.internal`
   * **Program**: MBA Core Strategy, Year 2
   * **Capabilities**: Submit competitions (instant publishing), save opportunities, manage personal posts, join and form teams.

2. **Student Account (Ananya Sen)**
   * **Role**: Student (`student`)
   * **Email**: `ananya.sen@hsb.internal`
   * **Program**: MBA Marketing & Product, Year 1

3. **Faculty Administrator (Prof. Raghavendra Sharma)**
   * **Role**: Administrator (`admin`)
   * **Email**: `admin@casehub.internal`
   * **Capabilities**: Admin dashboard, bulk spreadsheet import, user role management, report moderation, notification outbox & retries, competition archiving & verification.

---

## 6. End-to-End Verification Test Suite

An automated test suite is included that exercises all 8 required product journeys (**Journeys A through H**):

```bash
# Run the automated verification suite against the running server
node scripts/verify-e2e.js
```

### Verified Workflows
* **Journey A**: Public visitor browses competitions, searches, filters, and views details without authentication.
* **Journey B**: Authenticated student uploads competition -> persists -> **publishes instantly** -> triggers admin email notification.
* **Journey C**: Administrator email contains poster, details, and primary button linking to internal Case Hub detail route.
* **Journey D**: Student saves competition -> persists in saved portfolio -> isolated from other students.
* **Journey E**: Team Finder listing creation -> student joins -> capacity limit enforced (400 rejected on overflow) -> leave team.
* **Journey F**: Scheduled closing-soon reminder executes -> logs in outbox -> duplicate prevention prevents re-sending.
* **Journey G**: Schedule change detected -> automated update email sent to students who saved the challenge.
* **Journey H**: Admin accesses dashboard -> bulk imports spreadsheet -> row errors reported -> student files moderation report -> admin resolves.

---

## 7. Deployment Instructions

### Production Deployment to Vercel
1. Push repository to GitHub or GitLab.
2. Import project into [Vercel](https://vercel.com).
3. Set environment variables in the Vercel dashboard:
   * `NEXT_PUBLIC_APP_URL`: Your live domain (e.g. `https://casehub.hsb.edu.in`)
   * `ADMIN_NOTIFICATION_EMAIL`: `admin@casehub.internal`
   * `CRON_SECRET`: Generate a secure random string
   * `RESEND_API_KEY`: *(Optional)* Your Resend API key
4. Deploy. Vercel automatically detects Next.js App Router.

### Supabase Database Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor and execute the migration script:
   `supabase/migrations/20261019_initial_schema.sql`
3. Add the project URL and keys to your environment variables:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`

---

## 8. License & Governance
Built specifically for the student and faculty community at **HSB Jaipur**.
All rights reserved © 2026 Case Hub.
