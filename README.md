# TaskMaster | Elite Project & Task Management

TaskMaster is a high-fidelity, production-grade project management system built for high-performance teams. Inspired by industry leaders and refined with a custom "Elite" design language, it provides a seamless, real-time environment for managing organizational modules, tracking complex work items, and scaling team collaboration.

This repository is optimized for a single-page, non-scrollable **"Eye-Sight View"** to maximize focus and eliminate visual clutter.

## 🚀 Vision & Design Philosophy

TaskMaster is engineered to eliminate the friction of traditional management tools through a "Google-inspired" minimal architecture.
- **Eye-Sight View**: Every configuration panel and workspace is optimized for an immediate, non-scrollable view.
- **Muted Flush Design**: Inputs and selectors utilize backdrop blurs and subtle background tints for a tactile, focused user experience.
- **Translucent Identity**: Sophisticated use of layered shadows and high-contrast typography to maintain visual density.

## 🛠 Elite Feature Matrix

### 1. Workspace Intelligence
- **Mission Pulse Dashboard**: Real-time KPI tracking with high-fidelity donut visualizations of workspace distribution.
- **Organizational Modules**: High-performance grid and list views optimized for professional project containment.
- **Unified Issue Hub**: A sophisticated side-panel system for non-blocking task updates, comments, and attachments.

### 2. High-Performance UI/UX
- **Tactile Feedback Engine**: Standardized "Elite" hover states and scaling transitions across all interactive triggers.
- **Dynamic Lifecycle States**: Custom workflows (Backlog, In Progress, Blocked) with vibrant visual "Glow Indicators."
- **Adaptive Architecture**: Fully responsive experience that maintains visual density across desktop and mobile.

### 3. Enterprise Infrastructure
- **Secure Identity Protocol**: Robust OTP (One-Time Password) email verification and custom Google Auth integration.
- **RBAC Enforcement**: Role-Based Access Control (Admin, PM, Developer) synced across Firestore and Auth.
- **Mission Audit Log**: ISO-compliant real-time monitoring of all critical workspace operations.

## 💻 Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router & Server Actions) |
| **Database & Auth** | [Firebase 11](https://firebase.google.com/) (Firestore, Auth, Storage) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Components** | [ShadCN UI](https://ui.shadcn.com/) (Radix UI Primitives) |
| **Analytics** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

## 🏁 Getting Started

```bash
npm install
cp .env.example .env    # Configure your Firebase and SMTP credentials
npm run dev             # Start the workspace at http://localhost:9002
```

## ⚙️ Environment Variables

TaskMaster requires the following variables for the full identity and notification protocol to function.

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_SERVICE_ACCOUNT` | JSON string of your service account (for Server Actions) |
| `SMTP_USER` | SMTP username for transaction emails (OTP/Invites) |
| `SMTP_PASS` | SMTP app password |
| `SMTP_FROM_NAME` | Display name for outbound emails |
| `APP_URL` | The base URL of your deployment (used for invite links) |

## 📂 Project Structure

```text
src/
 ├── app/
 │    ├── (app)/        # Authenticated workspace routes (Dashboard, Issues, Teams)
 │    ├── (auth)/       # Secure onboarding and sign-in flows
 │    └── actions/      # Authoritative server actions for RBAC and Auth
 ├── components/        # Reusable UI primitives and Workspace-specific panels
 ├── firebase/          # Real-time subscription hooks and SDK orchestration
 ├── hooks/             # Reactive logic for organizations and responsive viewports
 └── lib/               # Global constants, email templates, and utility engines
```

## 🧪 Testing Guide

### Manual QA Checklist
- [ ] **Identity Verification**: Trigger an Email OTP reset and verify the secure handshake.
- [ ] **Onboarding**: Send a workspace invitation and accept it with a new user account.
- [ ] **Mission Pulse**: Create/Delete issues and verify the real-time donut chart distribution.
- [ ] **Eye-Sight Form**: Open "Edit Module" and verify the centered, non-scrollable configuration card.
- [ ] **Unified Hub**: Open an issue side-panel, add an attachment, and verify the autosave update.

## ⚠️ Assumptions & Known Limitations

- **Browser-First View**: Optimized for the latest versions of Chrome and Safari.
- **Attachment Limits**: File attachments are currently capped at 700KB to ensure high-speed synchronization.
- **Static Workflows**: Multi-workflow support is currently in development; a standard elite workflow is applied by default.

---

&copy; 2025 TaskMaster Global | Designed for High-Performance Teams.
