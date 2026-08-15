
/**
 * @fileoverview Authoritative Server Actions for OTP and Custom Token Auth.
 */
'use server';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendOTPEmail } from '@/lib/email';

function initializeServerApp(): App | null {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountEnv || serviceAccountEnv.trim() === '') return null;
  if (getApps().length > 0) return getApps()[0];
  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (e) {
    console.error('[Action:initializeServerApp] Parse error:', e);
    return null;
  }
}

/**
 * Generates a 6-digit OTP, stores it in Firestore, and sends it via email.
 */
export async function generateAndSendEmailOTP(email: string): Promise<{ success: boolean; error?: string }> {
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK not configured.' };

  const firestore = getFirestore(serverApp);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Store OTP with expiration (5 minutes)
    await firestore.collection('email_otps').doc(email).set({
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: FieldValue.serverTimestamp(),
    });

    await sendOTPEmail({
      to: email,
      code: otp,
      appName: 'TaskMaster',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Action:generateAndSendEmailOTP] Failed:', error);
    return { success: false, error: 'Failed to send OTP. Please check your email configuration.' };
  }
}

/**
 * Verifies an OTP and returns a Firebase Custom Token for the user.
 */
export async function verifyEmailOTP(email: string, code: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK error.' };

  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);

  try {
    const otpRef = firestore.collection('email_otps').doc(email);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) return { success: false, error: 'No verification code found for this email.' };

    const { code: savedCode, expiresAt } = otpDoc.data()!;

    if (Date.now() > expiresAt) {
      await otpRef.delete();
      return { success: false, error: 'Verification code has expired.' };
    }

    if (savedCode !== code) {
      return { success: false, error: 'Invalid verification code.' };
    }

    // Code is valid, delete it
    await otpRef.delete();

    // Get or Create User
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Create user if they don't exist
        userRecord = await auth.createUser({
          email,
          emailVerified: true,
        });
      } else {
        throw e;
      }
    }

    // Generate custom token
    const customToken = await auth.createCustomToken(userRecord.uid);
    return { success: true, token: customToken };
  } catch (error: any) {
    console.error('[Action:verifyEmailOTP] Failed:', error);
    return { success: false, error: error.message };
  }
}
