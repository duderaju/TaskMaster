
/**
 * @fileoverview Authoritative Server Actions for User, Org, and Invite Management.
 */
'use server';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'crypto';
import { sendInvitationEmail } from '@/lib/email';
import { headers } from 'next/headers';

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
    console.error('[Admin SDK] Failed to initialize. Check if FIREBASE_SERVICE_ACCOUNT is valid JSON.', e);
    return null;
  }
}

async function getBaseUrl() {
  // Priority 1: Explicit override from Env
  if (process.env.APP_URL) return process.env.APP_URL;

  // Priority 2: Dynamic discovery from request headers (Standard Production Method)
  const host = (await headers()).get('host');
  const protocol = host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

function generateOrgNameFromEmail(email: string): string {
    if (!email || !email.includes('@')) return "My Workspace";
    const domain = email.split('@')[1];
    const companyName = domain.split('.')[0];
    const capitalizedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    return `${capitalizedName}'s Workspace`;
}

export async function getOrCreateOrganizationAndUser(userData: {
  id: string;
  email: string;
  avatarUrl: string;
  firstName?: string;
  lastName?: string;
}): Promise<string> {
  const serverApp = initializeServerApp();
  if (!serverApp) throw new Error('Admin SDK configuration is missing or invalid.');

  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);
  const userRef = firestore.collection('users').doc(userData.id);

  try {
    const userDoc = await userRef.get();
    if (userDoc.exists && userDoc.data()?.organizationId) {
      const orgId = userDoc.data()?.organizationId;
      const role = userDoc.data()?.role || 'Viewer';
      await auth.setCustomUserClaims(userData.id, { organizationId: orgId, role });
      return orgId;
    }

    const newOrgId = randomUUID();
    const orgRef = firestore.collection('organizations').doc(newOrgId);
    
    await orgRef.set({
      id: newOrgId,
      name: generateOrgNameFromEmail(userData.email),
      status: 'active',
      members: { [userData.id]: 'Admin' },
      leadId: userData.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    const authUser = await auth.getUser(userData.id);
    const displayName = authUser.displayName || '';
    const nameParts = displayName.split(' ');
    
    const fullUserData = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || nameParts[0] || userData.email.split('@')[0],
      lastName: userData.lastName || nameParts.slice(1).join(' ') || 'User',
      role: 'Admin',
      status: 'active',
      organizationId: newOrgId,
      createdAt: FieldValue.serverTimestamp(),
      avatarUrl: userData.avatarUrl,
    };
    await userRef.set(fullUserData);
    await orgRef.collection('members').doc(userData.id).set(fullUserData);
    await auth.setCustomUserClaims(userData.id, { organizationId: newOrgId, role: 'Admin' });

    return newOrgId;
  } catch (error) {
    console.error('Bootstrap failed:', error);
    throw new Error('Failed to bootstrap workspace.');
  }
}

export async function createInvite(params: {
  email: string;
  role: string;
  organizationId: string;
  inviterId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, role, organizationId, inviterId } = params;
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK not configured.' };

  const firestore = getFirestore(serverApp);

  try {
    const orgRef = firestore.collection('organizations').doc(organizationId);
    const orgDoc = await orgRef.get();
    if (!orgDoc.exists) throw new Error('Org not found.');

    const auth = getAuth(serverApp);
    const inviterAuthRecord = await auth.getUser(inviterId);
    const inviterName = inviterAuthRecord.displayName || inviterAuthRecord.email || 'A team member';
    const organizationName = orgDoc.data()?.name || "Your Workspace";

    const inviteId = randomUUID();
    const batch = firestore.batch();
    
    batch.set(orgRef.collection('invites').doc(inviteId), {
      id: inviteId,
      email,
      role,
      organizationId,
      organizationName,
      inviterId,
      inviterName,
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(firestore.collection('invites').doc(inviteId), {
      organizationId,
      email,
      role,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    const baseUrl = await getBaseUrl();

    await sendInvitationEmail({ 
      to: email, 
      organizationName, 
      inviterName, 
      inviteId, 
      appName: 'TaskMaster', 
      role,
      baseUrl: baseUrl
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Invite failed:', error);
    return { success: false, error: error.message };
  }
}

export async function acceptInvite(params: {
  inviteId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string; organizationName?: string; alreadyMember?: boolean; role?: string }> {
  const { inviteId, userId } = params;
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK not configured.' };

  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);

  try {
    const inviteLookupRef = firestore.collection('invites').doc(inviteId);
    const inviteLookupDoc = await inviteLookupRef.get();
    if (!inviteLookupDoc.exists) throw new Error('Invalid or expired invitation.');

    const { organizationId, role: inviteRole } = inviteLookupDoc.data()!;
    const orgRef = firestore.collection('organizations').doc(organizationId);
    const orgDoc = await orgRef.get();
    if (!orgDoc.exists) throw new Error('Organization no longer exists.');

    const orgData = orgDoc.data()!;
    
    if (orgData.members?.[userId]) {
      const existingRole = orgData.members[userId];
      await auth.setCustomUserClaims(userId, { organizationId, role: existingRole });
      return { success: true, organizationName: orgData.name, alreadyMember: true, role: existingRole };
    }

    const userRecord = await auth.getUser(userId);

    await firestore.runTransaction(async (transaction) => {
      const orgInviteRef = orgRef.collection('invites').doc(inviteId);
      const inviteDoc = await transaction.get(orgInviteRef);
      
      if (!inviteDoc.exists) throw new Error('Invitation revoked or already accepted.');

      const { role } = inviteDoc.data()!;
      const fullUserData = {
        id: userId,
        email: userRecord.email,
        firstName: userRecord.displayName?.split(' ')[0] || '',
        lastName: userRecord.displayName?.split(' ').slice(1).join(' ') || '',
        role: role,
        status: 'active',
        organizationId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        avatarUrl: userRecord.photoURL || '',
      };

      transaction.set(orgRef.collection('members').doc(userId), fullUserData);
      transaction.update(orgRef, { [`members.${userId}`]: role });
      transaction.set(firestore.collection('users').doc(userId), { organizationId, role }, { merge: true });
      transaction.delete(orgInviteRef);
      transaction.delete(inviteLookupRef);
    });

    await auth.setCustomUserClaims(userId, { organizationId, role: inviteRole });
    return { success: true, organizationName: orgData.name, alreadyMember: false, role: inviteRole };
  } catch (error: any) {
    console.error('Accept invite failed:', error);
    return { success: false, error: error.message };
  }
}

export async function revokeInvite(params: { organizationId: string; inviteId: string }): Promise<{ success: boolean; error?: string }> {
  const { organizationId, inviteId } = params;
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK not configured.' };
  const firestore = getFirestore(serverApp);

  try {
    const batch = firestore.batch();
    batch.delete(firestore.doc(`organizations/${organizationId}/invites/${inviteId}`));
    batch.delete(firestore.doc(`invites/${inviteId}`));
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeMember(params: { organizationId: string; memberId: string }): Promise<{ success: boolean; error?: string }> {
  const { organizationId, memberId } = params;
  const serverApp = initializeServerApp();
  if (!serverApp) throw new Error('Admin SDK error.');

  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);

  try {
    const orgRef = firestore.collection('organizations').doc(organizationId);
    const orgDoc = await orgRef.get();
    if (orgDoc.data()?.leadId === memberId) throw new Error('Cannot remove the organization lead.');

    const batch = firestore.batch();
    batch.delete(orgRef.collection('members').doc(memberId));
    batch.update(orgRef, { [`members.${memberId}`]: FieldValue.delete() });
    await batch.commit();
    await auth.setCustomUserClaims(memberId, { organizationId: null, role: null });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMemberRole(params: { organizationId: string; memberId: string; newRole: string }): Promise<{ success: boolean; error?: string }> {
  const { organizationId, memberId, newRole } = params;
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK error.' };
  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);
  
  try {
    const orgRef = firestore.collection('organizations').doc(organizationId);
    const batch = firestore.batch();
    batch.update(orgRef.collection('members').doc(memberId), { role: newRole });
    batch.update(orgRef, { [`members.${memberId}`]: newRole });
    batch.update(firestore.collection('users').doc(memberId), { role: newRole });
    await batch.commit();
    
    await auth.setCustomUserClaims(memberId, { organizationId, role: newRole });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resendInvite(params: { organizationId: string; inviteId: string }): Promise<{ success: boolean; error?: string }> {
  const { organizationId, inviteId } = params;
  const serverApp = initializeServerApp();
  if (!serverApp) return { success: false, error: 'Admin SDK error.' };
  const firestore = getFirestore(serverApp);
  
  try {
    const inviteDoc = await firestore.doc(`organizations/${organizationId}/invites/${inviteId}`).get();
    if (!inviteDoc.exists) throw new Error('Invitation not found.');
    const data = inviteDoc.data()!;
    
    const baseUrl = await getBaseUrl();
    
    await sendInvitationEmail({ 
      to: data.email, 
      organizationName: data.organizationName, 
      inviterName: data.inviterName, 
      inviteId: data.id, 
      appName: 'TaskMaster', 
      role: data.role,
      baseUrl: baseUrl
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
