
# TaskMaster - Production Deployment Guide

TaskMaster is a high-fidelity, production-grade project management system. Follow these steps to ensure a successful deployment and professional branding.

## 🚀 Deployment Steps

### 1. Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Run the following in your terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/task-master.git
   git push -u origin main
   ```

### 2. Deploy to Firebase App Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Build > App Hosting**.
3. Connect your GitHub repository.
4. Select the `main` branch and follow the prompts.

### 3. Critical Environment Variables
You MUST configure these keys in the **App Hosting Dashboard > Settings** to enable professional routing and email delivery. Without these, the app will fallback to `localhost` links.

```env
# Production App URL (REQUIRED for professional invitation links)
# This removes "localhost" from your invitation emails.
APP_URL="https://your-deployed-app.com"

# SMTP Configuration (REQUIRED for Transactional Emails)
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM_NAME="TaskMaster"
SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Admin SDK (REQUIRED for User Provisioning & Invites)
# Copy the entire JSON from your Firebase Service Account Key file
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ...}'
```

## ⚠️ Branding Troubleshooting
If the sender name in emails still appears as "EnterpriseFlow" or your Gmail account name:
1. **Gmail Override**: Gmail SMTP often overrides the "From" name with the name of the Google Account used to send the email. Ensure your Google Account name is set to "TaskMaster" in your Google Account settings.
2. **ENV Sync**: Verify that `SMTP_FROM_NAME` is explicitly set to `"TaskMaster"` in your production environment variables.

## 🛠 Features
- **Professional Invitation Hub**: Intelligent identity detection and account switching.
- **Dynamic Routing**: Links automatically adjust based on `APP_URL`.
- **MNC-Standard Navigation**: High-fidelity triggers with active state highlights.
- **Real-time Collaboration**: Powered by Firestore `onSnapshot`.
- **Administrative Audit Log**: ISO-compliant monitoring UI.
