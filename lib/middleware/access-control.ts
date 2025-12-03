/**
 * Access Control Middleware
 * Checks user roles and permissions for protected routes
 */

import { getCurrentUser } from '@/lib/actions/auth.action';

export interface AccessControlResult {
  allowed: boolean;
  user: User | null;
  error?: string;
}

/**
 * Check if user has organization role
 */
export async function requireOrganizationRole(): Promise<AccessControlResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Authentication required. Please sign in.',
    };
  }

  if (user.role !== 'organization') {
    return {
      allowed: false,
      user,
      error: 'Access denied. Only organizations can access this feature.',
    };
  }

  return {
    allowed: true,
    user,
  };
}

/**
 * Check if user has college role
 */
export async function requireCollegeRole(): Promise<AccessControlResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Authentication required. Please sign in.',
    };
  }

  if (user.role !== 'college') {
    return {
      allowed: false,
      user,
      error: 'Access denied. Only colleges can access this feature.',
    };
  }

  return {
    allowed: true,
    user,
  };
}

/**
 * Check if user has student role
 */
export async function requireStudentRole(): Promise<AccessControlResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Authentication required. Please sign in.',
    };
  }

  if (user.role !== 'student') {
    return {
      allowed: false,
      user,
      error: 'Access denied. Only students can access this feature.',
    };
  }

  return {
    allowed: true,
    user,
  };
}

/**
 * Check if user has any of the specified roles
 */
export async function requireAnyRole(allowedRoles: Array<'organization' | 'college' | 'student' | 'candidate'>): Promise<AccessControlResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Authentication required. Please sign in.',
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      user,
      error: `Access denied. This feature is only available to: ${allowedRoles.join(', ')}.`,
    };
  }

  return {
    allowed: true,
    user,
  };
}

/**
 * Deny access to specific roles
 */
export async function denyRoles(deniedRoles: Array<'organization' | 'college' | 'student' | 'candidate'>): Promise<AccessControlResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Authentication required. Please sign in.',
    };
  }

  if (deniedRoles.includes(user.role)) {
    return {
      allowed: false,
      user,
      error: `Access denied. This feature is not available to ${user.role} accounts.`,
    };
  }

  return {
    allowed: true,
    user,
  };
}
