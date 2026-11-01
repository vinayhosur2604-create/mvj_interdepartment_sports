# MVJ INTERDEPARTMENT SPORTS
### Official Sports Management & Tournament Portal
### MVJ College of Engineering (MVJCE)

A complete, production-ready, mobile-first sports management digital portal built for **MVJ College of Engineering**.

---

## 🌟 Overview & Key Architecture

The platform provides two completely separate, synchronized experiences:

1. **Student / Public Website (Zero Login Required):**
   - **Homepage (`index.html`):** Hero section with tournament tagline, live status pulse, live statistics cards, podium design for top 3 departments (Gold, Silver, Bronze), complete department leaderboard sorted automatically by points and tie-breakers, latest match results, upcoming fixtures, and official announcements.
   - **All Sports (`sports.html`):** Dynamic catalog of 10+ interdepartment sports competitions (Cricket, Football, Volleyball, Basketball, Kabaddi, Badminton, Table Tennis, Chess, Throwball, Athletics). Features match counts (total, finished, upcoming), tournament stages, and search filter.
   - **Dynamic Fixtures (`fixtures.html?sport=cricket`):** Single URL-driven dynamic fixtures template supporting all sports with:
     - **Section A:** Regular Matches
     - **Section B:** Semi-Finals
     - **Section C:** The Grand Final (gold championship showcase card with trophy and winner status)
     - Filter by status (All, Live Now, Upcoming, Completed) and search by department name.

2. **Admin Control Dashboard (Authenticated & Protected):**
   - **Authentication (`admin/login.html`):** Admin ID & password verification with Supabase Auth + local administrative session tokens. Protected routes redirect unauthorized visitors.
   - **Dashboard Overview (`admin/dashboard.html`):**
     - **Circular Donut Chart (Chart.js):** Mandatory Department Performance Analytics showing point distribution across all departments with total points centered inside the donut!
     - **Leaderboard Rankings beside chart:** Live auto-sorted department rankings.
     - **Points Bar Chart & Match Status Doughnut Chart.**
     - Recent match activity log.
   - **Department & Score Management (`admin/departments.html`):**
     - Full CRUD for departments (Name, Code, Points, Gold, Silver, Bronze, Color).
     - **Quick Department Score Editor:** Fast inline score editor for physical education directors to update medals and points with single-click saving.
   - **Sports Management (`admin/sports.html`):**
     - Add new sports dynamically via modal (`+ ADD NEW SPORT`).
     - Edit sports, change icons, stages, and descriptions.
     - Delete check: prevents deleting sports with active matches to preserve tournament integrity.
   - **Fixtures & Live Score Management (`admin/fixtures.html`):**
     - `+ ADD NEW MATCH` dynamic modal with auto-populated department dropdowns.
     - Quick Result & Live Score modal to push real-time score updates to students.
     - Manage regular matches, semi-finals, and grand finals.
   - **Settings & Announcements (`admin/settings.html`):**
     - Publish tournament notices, postponements, and schedule updates.
     - Configure tournament title, academic year, status, tagline, and public announcements with optional shared photo uploads.
     - Supabase URL and public anon key are deployment-wide settings in `js/config.js`.

---

## 🎨 Official Branding & Design System

- **Official MVJCE Logo:** `assets/images/mvj-logo.png` (authentic high-res logo with transparent background).
- **Header Alignment:** Logo on the left, "MVJ \n INTERDEPARTMENT SPORTS" beside the logo, and "MVJ COLLEGE OF ENGINEERING" below.
- **Colour Palette:**
  - Primary Background: `#F5F7FB`
  - Card Background: `#FFFFFF`
  - Primary Blue: `#174EA6`
  - Secondary Blue: `#2878D0`
  - Light Blue: `#EAF2FF`
  - Main Text: `#172B4D`
  - Secondary Text: `#64748B`
  - Borders: `#E2E8F0`
  - Gold: `#E5A000`
  - Success Green: `#16A36A`
  - Error Red: `#DC2626`
- **Mobile-First Responsive Layout:** Tested for mobile phones, iPhones, tablets, and desktops with touch-friendly targets, hamburger navigation drawer, and stacked responsive tables.

---

## 🔐 Administrative Credentials

- **Admin Login URL:** `admin/login.html`
- **Default Email:** `vinayhosur2604@gmail.com`
- **Default Password:** `vinay@2604`
- An interactive **"Auto-fill Authorized Credentials"** button is also provided on the login page for testing.

---

## 🗄️ Database & Supabase Setup

The application is architected to work seamlessly with **Supabase PostgreSQL** while having a built-in offline-first fallback sync layer.

### To connect to your Supabase Project:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the entire script from `supabase_schema.sql`.
   - This sets up all 6 tables: `departments`, `sports`, `matches`, `announcements`, `tournament_settings`, `admin_profiles`.
   - Sets up Row Level Security (RLS) policies allowing public read and authenticated admin CRUD.
   - Seeds all 8 engineering departments, 10 sports, 18+ sample fixtures, and announcements.
   - Enables Realtime replication channels.
3. For an existing Supabase project, run `supabase_announcements_storage_migration.sql` in the SQL Editor. Do not rerun `supabase_schema.sql` on a live project; it drops and recreates tables. A fresh project can use `supabase_schema.sql`.
4. Set the **Supabase Project URL** and **public anon key** in `js/config.js`, then deploy the updated files. Connection settings saved in one browser are not shared with student phones. Never put a `service_role` key in frontend code.
5. Admin changes to departments, scores, sports, matches, announcements, and portal settings are written to Supabase and sent to connected devices in real time. Mobile pages refresh when connectivity returns or the page is brought back into view. Announcement photos are stored in the shared public `announcement-photos` bucket; admins can upload JPG, PNG, WebP, or GIF files up to 5 MB.

---

## 📁 File Structure

```
mvj-interdepartment-sports/
├── index.html                   # Public Homepage (Hero, Stats, Leaderboard, Podium, Updates)
├── sports.html                  # Public Sports Catalog (10+ sports cards with match counts)
├── fixtures.html                # Public Dynamic Fixtures (?sport=cricket, semi-finals, grand final)
├── supabase_schema.sql          # Full PostgreSQL Schema, RLS policies, & seed data
├── README.md                    # Documentation & Setup Guide
├── admin/
│   ├── login.html               # Admin Login Page with Supabase Auth integration
│   ├── dashboard.html           # Admin Dashboard with Donut Chart, Ranking List, Analytics
│   ├── departments.html         # Manage Departments & Quick Score Management
│   ├── sports.html              # Manage Sports (+ ADD NEW SPORT modal)
│   ├── fixtures.html            # Manage Fixtures (+ ADD NEW MATCH modal, live scores)
│   └── settings.html            # Tournament Settings & Announcement Management
├── css/
│   ├── style.css                # Core design system, variables, header, podium, leaderboard
│   ├── sports.css               # Sports listing grid and sport cards
│   ├── fixtures.css             # Match cards, semi-finals, grand final championship showcase
│   ├── admin.css                # Admin layout, sidebar, stats, tables, and modal styles
│   └── responsive.css           # Mobile-first responsive rules & hamburger menu
├── js/
│   ├── config.js                # Default seed data and Supabase configuration
│   ├── supabase.js              # Unified database & realtime synchronization layer
│   ├── auth.js                  # Authentication guard and session manager
│   ├── charts.js                # Chart.js donut chart with center text and bar charts
│   ├── main.js                  # Homepage rendering logic & tie-breaker calculations
│   ├── sports.js                # Sports catalog rendering & search filter
│   ├── fixtures.js              # Dynamic fixtures handler (?sport=slug)
│   ├── dashboard.js             # Admin dashboard analytics & real-time listeners
│   ├── departments.js           # Department CRUD & quick score editing
│   ├── admin-sports.js          # Sports CRUD & match dependency validation
│   ├── admin-fixtures.js        # Match scheduling, stage management & live score publishing
│   └── announcements.js         # Notice board & portal settings manager
└── assets/
    ├── images/
    │   ├── mvj-logo.png         # Official MVJ College of Engineering Logo
    │   ├── sports/
    │   └── banners/
    └── icons/
```

---

## 🚀 How to Run the Website

You can open the project in any modern web browser or start a lightweight local web server:

```bash
# Using Python built-in HTTP server:
cd "C:\Users\SHREYA C\.gemini\antigravity\scratch\mvj-interdepartment-sports"
python -m http.server 8000
```

Then visit:
- **Public Website:** `http://localhost:8000/`
- **Sports Page:** `http://localhost:8000/sports.html`
- **Dynamic Fixtures (Cricket):** `http://localhost:8000/fixtures.html?sport=cricket`
- **Dynamic Fixtures (Football):** `http://localhost:8000/fixtures.html?sport=football`
- **Dynamic Fixtures (Volleyball):** `http://localhost:8000/fixtures.html?sport=volleyball`
- **Admin Login:** `http://localhost:8000/admin/login.html`
- **Admin Dashboard:** `http://localhost:8000/admin/dashboard.html`
