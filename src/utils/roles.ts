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

// Check if a user can upload to a specific criteria within an area
// Returns true if: no allowedCriteria set (empty = all), or criteriaCode is in the list
export function canUploadToCriteria(user: any, areaName: string, criteriaCode: string): boolean {
  const role = getUserPersonelRole(user);
  const r = normalizeRole(role);

  // Management roles can upload to everything
  if (MANAGEMENT_ROLES.includes(r)) return true;

  const coveredAreas = user?.personel_role?.coveredAreas || [];
  const matchingArea = coveredAreas.find(
    (a: any) => (a.area_with_permission || '').toLowerCase().trim() === areaName.toLowerCase().trim()
  );

  // If user doesn't have this area at all, they can't upload
  if (!matchingArea) return false;

  // If allowedCriteria is empty/null, user can upload to ALL criteria in this area
  const allowed = matchingArea.allowedCriteria;
  if (!allowed || allowed.trim() === '') return true;

  // Check if the criteria code is in the allowed list
  const allowedCodes = allowed.split(',').map((c: string) => c.trim().toLowerCase());
  return allowedCodes.includes(criteriaCode.toLowerCase().trim());
}

// Get allowed criteria codes for a user in a specific area
// Returns empty array if all criteria are allowed
export function getAllowedCriteria(user: any, areaName: string): string[] {
  const coveredAreas = user?.personel_role?.coveredAreas || [];
  const matchingArea = coveredAreas.find(
    (a: any) => (a.area_with_permission || '').toLowerCase().trim() === areaName.toLowerCase().trim()
  );
  if (!matchingArea || !matchingArea.allowedCriteria || matchingArea.allowedCriteria.trim() === '') return [];
  return matchingArea.allowedCriteria.split(',').map((c: string) => c.trim()).filter(Boolean);
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
