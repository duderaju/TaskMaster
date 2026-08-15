/**
 * @fileoverview Application-wide constants for TaskMaster.
 */

export const USER_ROLES = [
  'Admin',
  'Project Manager',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'QA Tester',
  'DevOps Engineer',
  'Viewer',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
