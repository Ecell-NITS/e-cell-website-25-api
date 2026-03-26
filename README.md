<p align="center">
  <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="80" />
</p>

<h1 align="center">E-Cell NIT Silchar — Backend API</h1>

<p align="center">
  RESTful API powering the official <a href="https://ecellnits.org">ecellnits.org</a> platform — authentication, blogging, event registrations, newsletters, and more.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Express-5.x-000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-ISC-blue" alt="License" />
</p>

---

## 📖 About

This is the core backend API for the **Entrepreneurship Cell, NIT Silchar** website. It handles user authentication, blog management with admin approval, event registrations, newsletter subscriptions, contact form queries, and file uploads.

> **Note:** Event registrations and Team Recruitment are handled by a separate dedicated microservices — see [Related Repositories](#-related-repositories).

---

## ✨ Features

### 🔐 Authentication & Authorization
- Email/Password login with **bcrypt** hashing
- **Google OAuth 2.0** Sign-In
- **OTP-based email verification** for registration
- **JWT access tokens** + **refresh token rotation** (httpOnly cookies)
- Forgot/reset password flow
- Role-based access control — `CLIENT`, `ADMIN`, `SUPERADMIN`

### 📝 Blog Platform
- Create, edit, delete, and publish blog posts
- **Admin approval workflow** — new blogs are reviewed before publishing
- Like/unlike system, comment threads
- Tag-based filtering, slug-based lookups, pagination
- Draft visibility restricted to author and admins
- Admin email notification on new blog submissions

### 🎪 Event Registrations
- Team or Individual registrations
- Duplicate prevention via compound unique indexes

### 📬 Newsletter
- Subscribe / unsubscribe / check subscription status
- Automated welcome email on subscription

### 💬 Contact Queries
- Submit contact form messages
- Dual-email flow — user confirmation + admin notification
- Admin CRUD (view, mark read/unread, delete)

### 📷 File Uploads
- **Cloudinary** integration via Multer
- Profile pictures and blog images

### 🛡️ Security
- **Helmet** HTTP security headers
- **CORS** whitelisting with credentials
- **Rate limiting** — tiered per endpoint (auth, OTP, registration)
- JSON body size limit (10KB)
- httpOnly / Secure / SameSite cookies

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express 5 |
| **Language** | TypeScript 5 |
| **ORM** | Prisma |
| **Database** | MongoDB Atlas |
| **Auth** | JWT + bcrypt + Google OAuth 2.0 |
| **Email** | Brevo (Sendinblue) Transactional API |
| **File Storage** | Cloudinary + Multer |
| **Validation** | Zod |
| **Security** | Helmet, express-rate-limit, CORS |
| **Code Quality** | ESLint, Prettier, Husky, lint-staged |

---

## 📁 Project Structure

```
src/
├── config/          # Environment variables & app config
├── controllers/
│   ├── auth/        # Login, register, Google OAuth, password, profile
│   └── events/      # 5 event registration controllers
├── middlewares/      # Auth guard, RBAC, rate limiter, error handler
├── routes/
│   └── events/      # Event-specific route definitions
├── schemas/         # Prisma-related schemas
├── types/           # TypeScript type definitions
├── utils/           # Prisma client, OTP, email, Cloudinary, AppError
├── validators/      # Zod validation schemas
│   └── events/      # Event-specific validators
├── app.ts           # Express app setup (middleware + routes)
└── server.ts        # Server entry point
prisma/
└── schema.prisma    # Database schema (13+ models)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (recommended) or npm
- **MongoDB Atlas** cluster (or local MongoDB)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ecell-NITS/e-cell-website-25-api.git
cd e-cell-website-25-api

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# ── Application ──
NODE_ENV=development
PORT=4000

# ── URLs ──
CLIENT_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# ── Database (MongoDB Atlas) ──
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/ecell

# ── JWT ──
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=7d

# ── Google OAuth ──
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ── Email (Brevo) ──
BREVO_API_KEY=your-brevo-api-key
BREVO_EMAIL=your-sender@email.com

# ── Cloudinary ──
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Running

```bash
# Generate Prisma client
npx prisma generate

# Development (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

The API will be available at `http://localhost:4000`.

---

## 📡 API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health status |
| `GET` | `/version` | API version |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/send-otp` | ❌ | Send OTP to email |
| `POST` | `/verify-otp` | ❌ | Verify OTP |
| `POST` | `/checkEmail` | ❌ | Check if email exists |
| `POST` | `/register` | ❌ | Register with email + OTP |
| `POST` | `/login` | ❌ | Login with email/password |
| `POST` | `/refresh` | 🍪 | Refresh access token |
| `POST` | `/logout` | 🍪 | Logout & revoke tokens |
| `GET` | `/google` | ❌ | Redirect to Google OAuth |
| `GET` | `/google/callback` | ❌ | Google OAuth callback |
| `POST` | `/forgot-password` | ❌ | Request password reset |
| `POST` | `/reset-password` | ❌ | Reset password with OTP |
| `GET` | `/me` | 🔒 | Get current user profile |
| `PATCH` | `/edit-profile` | 🔒 | Update profile |
| `PATCH` | `/update-password` | 🔒 | Change password |
| `DELETE` | `/delete-account` | 🔒 | Delete account |
| `GET` | `/all-accounts` | 👑 | List all users (Admin) |

### Blogs (`/api/blog`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ❌ | Get all blogs |
| `GET` | `/accepted` | ❌ | Get published blogs |
| `GET` | `/:blogId` | ❌ | Get blog by ID |
| `GET` | `/slug/:slug` | ❌ | Get blog by slug |
| `POST` | `/create` | 🔒 | Create blog (sent for review) |
| `PUT` | `/edit/:blogId` | 🔒 | Edit blog |
| `DELETE` | `/delete/:blogId` | 🔒 | Delete blog |
| `POST` | `/like/:blogId` | 🔒 | Toggle like |
| `PUT` | `/publish/:Id` | 👑 | Approve & publish (Admin) |

### Newsletter (`/api/newsletter`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/subscribe` | Subscribe to newsletter |
| `POST` | `/check` | Check subscription status |
| `POST` | `/unsubscribe` | Unsubscribe |
| `GET` | `/subscribers` | List subscribers (Admin) |

### Contact Queries (`/api/query`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Submit a query |
| `GET` | `/` | Get all queries (Admin) |
| `PATCH` | `/:id/read` | Mark as read (Admin) |
| `DELETE` | `/:id` | Delete query (Admin) |

> **Legend:** ❌ Public · 🔒 Requires JWT · 🍪 Requires refresh token cookie · 👑 Admin/Superadmin only

---

## 🔗 Related Repositories

| Repository | Description |
|-----------|-------------|
| [**ecell-website-2026**](https://github.com/Ecell-NITS/ecell-website-2026) | Frontend — Next.js 15 + React 19 website |
| [**eic-registration-api**](https://github.com/Ecell-NITS/eic-registration-api) | EIC 2026 event registration microservice |
| [**empresario-registration-api**](https://github.com/Ecell-NITS/event-registrations-api) | Empresario event registration microservice |
| [**allteam-recruitments-api**](https://github.com/Ecell-NITS/tech-recruitment-24) | All Team Recruitments microservice |

---

## 👨‍💻 Developed By

**E-Cell NIT Silchar — Technical Team 2025-26**

### Technical Heads

| Name | Role | GitHub | LinkedIn |
|------|------|--------|----------|
| Bishal Das | Technical Head | [GitHub](https://github.com/Bishal-NITS-2003) | [LinkedIn](https://www.linkedin.com/in/bishal-das-babbb02a3) |
| Muskan Bharti | Technical Head | [GitHub](https://github.com/muskan170604) | [LinkedIn](https://www.linkedin.com/in/muskan-bharti-a7440b28b/) |
| Gulista Khatun | Senior Web Associate | [GitHub](https://github.com/GulistaKhatun06) | [LinkedIn](https://www.linkedin.com/in/gulista-khatun-9414b6314/) |

### Junior Members

| Name | Role | GitHub | LinkedIn |
|------|------|--------|----------|
| Dhruba Agarwalla | Junior Web Developer | [GitHub](https://github.com/DhrubaAgarwalla) | [LinkedIn](https://www.linkedin.com/in/dhruba-kumar-agarwalla-7a5346270/) |
| Harshit Agarwal | Junior Web Developer | [GitHub](https://github.com/agarwal-harshit00) | [LinkedIn](https://www.linkedin.com/in/harshit-agarwal-a119a4332/) |
| Madhurjya Kaushik | Junior Web Developer | [GitHub](https://github.com/xanthate8) | [LinkedIn](https://www.linkedin.com/in/madhurjya-kaushik-752a53323) |
| Nabonit Paul | Junior Web Developer | [GitHub](https://github.com/studen-bot) | [LinkedIn](https://www.linkedin.com/in/nabonit-paul-869050320) |
| Swarup Das | Junior Web Developer | [GitHub](https://github.com/swarup081) | [LinkedIn](https://www.linkedin.com/in/swarup81/) |

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Made with ❤️ by <a href="https://ecellnits.org">E-Cell NIT Silchar</a>
</p>
