
/**
 * @fileoverview Authoritative Server Actions for User Profile Management.
 */
'use server';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// =================================================================================
// FIREBASE ADMIN SDK INITIALIZATION (SERVER-ONLY)
// =================================================================================
function initializeServerApp(): App | null {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountEnv || serviceAccountEnv.trim() === '') {
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (e) {
    console.error(
      '[Admin SDK] Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize app.',
      e
    );
    return null;
  }
}

/**
 * Handles saving profile data (name, avatar) to Firestore and Firebase Auth.
 * @param formData - The FormData object containing user details.
 * @returns An object with the new avatar data URI.
 */
export async function updateUserProfile(
  formData: FormData
): Promise<{ avatarUrl: string | null }> {
  const userId = formData.get('userId') as string;
  const organizationId = formData.get('organizationId') as string;
  const dataUri = formData.get('dataUri') as string | null;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  if (!userId || !organizationId) {
    throw new Error('Missing userId or organizationId in form data.');
  }

  const serverApp = initializeServerApp();
  if (!serverApp) {
    throw new Error(
      'Cannot update profile: Firebase Admin SDK is not configured.'
    );
  }

  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);
  
  // Use a batch to update multiple documents atomically
  const batch = firestore.batch();

  // 1. Prepare data for the primary user document in /users
  const userDocRef = firestore.doc(`users/${userId}`);
  const userUpdateData: { [key: string]: any } = {};
  if (firstName) userUpdateData.firstName = firstName;
  if (lastName) userUpdateData.lastName = lastName;
  if (dataUri) userUpdateData.avatarUrl = dataUri;
  
  if (Object.keys(userUpdateData).length > 0) {
    batch.update(userDocRef, userUpdateData);
  }

  // 2. Prepare data for the user's document in the organization's members subcollection
  const memberDocRef = firestore.doc(`organizations/${organizationId}/members/${userId}`);
  const memberUpdateData: { [key: string]: any } = {};
    if (firstName) memberUpdateData.firstName = firstName;
    if (lastName) memberUpdateData.lastName = lastName;
    if (dataUri) memberUpdateData.avatarUrl = dataUri;

  if (Object.keys(memberUpdateData).length > 0) {
    batch.update(memberDocRef, memberUpdateData);
  }
  
  // Commit the batch
  await batch.commit();

  // 3. Prepare data for Firebase Authentication user profile
  const authUpdateData: { [key: string]: any } = {};
  
  // Firebase Auth photoURL must be a valid http/https URL. 
  // data URIs (base64) are rejected by the SDK validation. 
  if (dataUri && (dataUri.startsWith('http://') || dataUri.startsWith('https://'))) {
    authUpdateData.photoURL = dataUri;
  }
  
  if (firstName && lastName) {
    authUpdateData.displayName = `${firstName} ${lastName}`;
  }

  if (Object.keys(authUpdateData).length > 0) {
     await auth.updateUser(userId, authUpdateData);
  }

  return {
    avatarUrl: dataUri,
  };
}
