// Role permission levels for the system
// Uses personel_role (custom Strapi API) instead of built-in Strapi roles
//
// Approvers: Dean, Librarian, DSA, Physical Plant, Admin, Authenticated
// Reviewers: Program Head, Area Coordinator
// Uploaders: Faculty, Admin Staff, Library Staff, Public (everyone can upload)

const APPROVER_ROLES = [
  'dean',
  'librarian',
  'dsa',
  'physical plant',
  'admin',
];

const REVIEWER_ROLES = [
  'program head',
  'area coordinator',
];

const UPLOADER_ROLES = [
  'faculty',
  'admin staff',
  'library staff',
];

// Full management access (sidebar: Area Management, Academic Year/Program, Consolidate, Users, Roles)
const MANAGEMENT_ROLES = [
  'dean',
  'admin',
];

export function normalizeRole(role: string): string {
  return (role || '').toLowerCase().trim();
}

export function isApprover(role: string): boolean {
  const r = normalizeRole(role);
  return APPROVER_ROLES.includes(r);
}

export function isReviewer(role: string): boolean {
  const r = normalizeRole(role);
  return REVIEWER_ROLES.includes(r) || APPROVER_ROLES.includes(r); // Approvers can also review
}

export function isUploader(_role: string): boolean {
  // Everyone can upload
  return true;
}

export function canApprove(role: string): boolean {
  return isApprover(role);
}

export function canReview(role: string): boolean {
  return isReviewer(role);
}

export function canDelete(role: string): boolean {
  return isApprover(role);
}

export function hasManagementAccess(role: string): boolean {
  const r = normalizeRole(role);
  return MANAGEMENT_ROLES.includes(r);
}

// Get available status options based on role
export function getAvailableStatuses(role: string): string[] {
  if (isApprover(role)) {
    return ['On-going Review', 'Reviewed', 'Approved'];
  }
  if (isReviewer(role)) {
    return ['On-going Review', 'Reviewed'];
  }
  return [];
}

// Extract the personel_role name from user data
// Falls back to Strapi built-in role if no personel_role assigned
export function getUserPersonelRole(user: any): string {
  // Check personel_role first (custom role system)
  const personelRole = user?.personel_role?.role;
  if (personelRole) return personelRole;

  // Fallback to Strapi built-in role
  const builtInRole = user?.role?.name || user?.role?.type || '';
  return builtInRole;
}
