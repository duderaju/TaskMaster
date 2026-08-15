# TaskMaster | Elite Project & Task Management

TaskMaster is a high-fidelity, production-grade project management system built for high-performance teams. Inspired by industry leaders and refined with a custom "Elite" design language, it provides a seamless, real-time environment for managing organizational modules, tracking complex work items, and scaling team collaboration.

## 🚀 Vision & Design Philosophy

TaskMaster is engineered to eliminate the visual clutter of traditional management tools.
- **Eye-Sight View**: Every configuration panel is optimized for a single-page, non-scrollable view.
- **Google-Inspired Architecture**: Minimalist card layouts with soft layered shadows and high-contrast typography.
- **Translucent Identity**: Sophisticated use of backdrop blurs and "Muted Flush" inputs for a focused user experience.

## 🛠 Features

### 1. Workspace Intelligence
- **Mission Pulse Dashboard**: Real-time KPI tracking with a high-fidelity donut visualization of issue distribution.
- **Organizational Modules**: Grid and List views optimized for professional project containment and lifecycle management.
- **Adaptive Workflows**: Custom states (Backlog, Blocked, In Review, etc.) with vibrant visual "Glow Indicators."

### 2. Elite UI/UX
- **Unified Issue Hub**: A sophisticated side-panel system for non-blocking task updates, comments, and attachments.
- **RBAC Enforcement**: Role-Based Access Control (Admin, Project Manager, Developer, etc.) synced across Firestore and Custom Claims.
- **Tactile Feedback**: Standardized "Elite" hover states and scaling transitions across all interactive triggers.

### 3. Enterprise Infrastructure
- **Secure Identity Protocol**: OTP (One-Time Password) email verification and custom token authentication.
- **Administrative Audit Log**: ISO-compliant real-time monitoring of all critical workspace operations.
- **Automation & Webhooks**: Create custom rules and receive external event triggers to keep the team in sync.

## 💻 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Server Actions)
- **Database/Auth**: [Firebase 11](https://firebase.google.com/) (Firestore, Auth, Storage)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [ShadCN UI](https://ui.shadcn.com/) (Radix UI Primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Analytics**: [Recharts](https://recharts.org/)

## 🏁 Getting Started

### Local Development
1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Create a `.env.local` file with your Firebase configuration and SMTP credentials.
3. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🚢 Production Deployment

### 1. Deploy to Firebase App Hosting
Connect your GitHub repository to **Firebase Console > Build > App Hosting**. TaskMaster is optimized for the App Hosting runtime.

### 2. Critical Environment Variables
You MUST configure these in the **App Hosting Dashboard** to enable professional routing and transactional emails:

```env
# Production App URL (Removes 'localhost' from invitations)
APP_URL="https://your-deployed-app.com"

# SMTP Configuration (Required for Transactional Emails)
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM_NAME="TaskMaster"
SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Admin SDK (Required for RBAC & Identity Management)
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ...}'
```

## ⚠️ Branding Consistency
If the sender name in emails appears as "TaskMaster" but the layout feels inconsistent:
1. **SMTP Sync**: Verify `SMTP_FROM_NAME` is set correctly in production envs.
2. **Identity Handshake**: Ensure the `APP_URL` matches your custom domain exactly to maintain secure cookie and redirect integrity.

---

&copy; 2025 TaskMaster Global | Designed for High-Performance Teams.
