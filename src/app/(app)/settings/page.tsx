import { redirect } from 'next/navigation';

// This page just redirects to the first page in the settings section
export default function SettingsPage() {
  redirect('/settings/profile');
}
