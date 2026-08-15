
/**
 * @fileoverview Nodemailer Email Sending Service (Server-Side Only)
 *
 * This module sends transactional invitation and OTP emails.
 * Designed for Next.js Server Actions or any Node.js backend.
 */

import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';

/**
 * Invitation email payload
 */
interface InviteEmailData {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteId: string;
  appName: string;
  role: string;
  baseUrl: string;
}

/**
 * OTP email payload
 */
interface OTPEmailData {
  to: string;
  code: string;
  appName: string;
}

const styles: { [key: string]: React.CSSProperties } = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif',
    margin: 0,
    padding: 0,
    WebkitTextSizeAdjust: '100%',
  },
  wrapper: {
    width: '100%',
    padding: '40px 0',
  },
  card: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  header: {
    padding: '32px 40px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #f3f4f6',
  },
  content: {
    padding: '40px',
  },
  title: {
    fontSize: '22px',
    lineHeight: '1.4',
    fontWeight: 700,
    marginBottom: '20px',
    color: '#111827',
    textAlign: 'center' as const,
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '24px',
    color: '#4b5563',
    textAlign: 'center' as const,
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  expiryNote: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#9ca3af',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginTop: '12px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '32px 0',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#9ca3af',
    padding: '24px 40px',
  },
  otpContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
    backgroundColor: '#f9fafb',
    padding: '32px',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb',
  },
  otpCode: {
    fontSize: '36px',
    fontWeight: 800,
    letterSpacing: '10px',
    color: '#6366f1',
    margin: 0,
    fontFamily: 'monospace',
  },
};

// Branded Asset URL
const logoPngUrl = 'https://link.monalisa.rebella.studio/TaskMasterLogo.png';

const InviteEmail = ({ data }: { data: InviteEmailData }) => {
  const { organizationName, inviterName, inviteId, appName, role, baseUrl } = data;
  const inviteUrl = `${baseUrl}/invite?token=${inviteId}`;

  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.header}>
              <table width="100%" border={0} cellPadding={0} cellSpacing={0}>
                <tr>
                  <td align="center">
                    <img 
                      src={logoPngUrl} 
                      alt={appName} 
                      width="140" 
                      height="auto"
                      style={{ display: 'block', border: '0', margin: '0 auto' }} 
                    />
                  </td>
                </tr>
              </table>
            </div>
            <div style={styles.content}>
              <h1 style={styles.title}>You’re invited to join {organizationName}</h1>
              <p style={styles.paragraph}>
                <strong>{inviterName}</strong> has invited you to collaborate with the role of <strong>{role}</strong>.
              </p>
              
              <div style={styles.buttonContainer}>
                <a href={inviteUrl} style={styles.button}>Accept Invitation</a>
                <p style={styles.expiryNote}>This invitation will expire in 7 days.</p>
              </div>

              <div style={styles.divider} />
              
              <p style={{ ...styles.paragraph, fontSize: '14px', marginBottom: 0 }}>
                {appName} is the modern project management platform for high-performance teams.
              </p>
            </div>
          </div>
          <div style={styles.footer}>
            &copy; {new Date().getFullYear()} {appName}, Inc. <br />
            Secure Identity Verification Protocol
          </div>
        </div>
      </body>
    </html>
  );
};

const OTPEmail = ({ data }: { data: OTPEmailData }) => (
  <html lang="en">
    <body style={styles.body}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
              <table width="100%" border={0} cellPadding={0} cellSpacing={0}>
                <tr>
                  <td align="center">
                    <img 
                      src={logoPngUrl} 
                      alt={data.appName} 
                      width="140" 
                      height="auto"
                      style={{ display: 'block', border: '0', margin: '0 auto' }} 
                    />
                  </td>
                </tr>
              </table>
          </div>
          <div style={styles.content}>
            <h1 style={styles.title}>Your Verification Code</h1>
            <p style={styles.paragraph}>Use the following code to complete your sign-in to {data.appName}. This code will expire in 5 minutes.</p>
            
            <div style={styles.otpContainer}>
              <p style={styles.otpCode}>{data.code}</p>
            </div>
            
            <p style={{ ...styles.paragraph, fontSize: '14px', color: '#9ca3af' }}>
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        </div>
        <div style={styles.footer}>&copy; {new Date().getFullYear()} {data.appName}, Inc.</div>
      </div>
    </body>
  </html>
);

function getTransporter() {
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) throw new Error('Missing SMTP credentials.');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendInvitationEmail(data: InviteEmailData) {
  const transporter = getTransporter();
  const html = render(<InviteEmail data={data} />);
  const text = `${data.inviterName} invited you to join ${data.organizationName}. Accept here: ${data.baseUrl}/invite?token=${data.inviteId}`;
  
  const fromName = process.env.SMTP_FROM_NAME || "TaskMaster";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: data.to,
    subject: `You’re invited to join ${data.organizationName} on ${data.appName}`,
    text,
    html,
  });
}

export async function sendOTPEmail(data: OTPEmailData) {
  const transporter = getTransporter();
  const html = render(<OTPEmail data={data} />);
  const text = `Your ${data.appName} verification code is: ${data.code}`;
  
  const fromName = process.env.SMTP_FROM_NAME || "TaskMaster";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: data.to,
    subject: `Verification Code: ${data.code} for ${data.appName}`,
    text,
    html,
  });
}
