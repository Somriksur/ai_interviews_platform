/**
 * Team Collaboration System
 * Manage teams, members, and shared interviews
 */

export interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
    permissions: TeamPermissions;
}

export interface TeamPermissions {
    canCreateInterviews: boolean;
    canEditInterviews: boolean;
    canDeleteInterviews: boolean;
    canViewAllInterviews: boolean;
    canManageMembers: boolean;
    canManageTeam: boolean;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    members: TeamMember[];
    createdAt: Date;
    updatedAt: Date;
}

export interface SharedInterview {
    interviewId: string;
    teamId: string;
    sharedBy: string;
    sharedAt: Date;
    permissions: {
        canView: string[]; // User IDs
        canEdit: string[];
        canDelete: string[];
    };
}

/**
 * Default permissions for different roles
 */
export const DEFAULT_PERMISSIONS: Record<TeamMember["role"], TeamPermissions> = {
    owner: {
        canCreateInterviews: true,
        canEditInterviews: true,
        canDeleteInterviews: true,
        canViewAllInterviews: true,
        canManageMembers: true,
        canManageTeam: true,
    },
    admin: {
        canCreateInterviews: true,
        canEditInterviews: true,
        canDeleteInterviews: true,
        canViewAllInterviews: true,
        canManageMembers: true,
        canManageTeam: false,
    },
    member: {
        canCreateInterviews: true,
        canEditInterviews: false,
        canDeleteInterviews: false,
        canViewAllInterviews: true,
        canManageMembers: false,
        canManageTeam: false,
    },
};

/**
 * Check if user has permission
 */
export function hasPermission(
    member: TeamMember,
    permission: keyof TeamPermissions
): boolean {
    return member.permissions[permission];
}

/**
 * Get team member by user ID
 */
export function getTeamMember(team: Team, userId: string): TeamMember | undefined {
    return team.members.find((m) => m.id === userId);
}

/**
 * Check if user can perform action on interview
 */
export function canAccessInterview(
    userId: string,
    sharedInterview: SharedInterview,
    action: "view" | "edit" | "delete"
): boolean {
    const permissionMap = {
        view: sharedInterview.permissions.canView,
        edit: sharedInterview.permissions.canEdit,
        delete: sharedInterview.permissions.canDelete,
    };

    return permissionMap[action].includes(userId);
}

/**
 * Validate team member email
 */
export function validateTeamMemberEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TeamMember["role"]): string {
    const roleNames = {
        owner: "Owner",
        admin: "Admin",
        member: "Member",
    };
    return roleNames[role];
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: TeamMember["role"]): string {
    const colors = {
        owner: "bg-purple-500 text-white",
        admin: "bg-blue-500 text-white",
        member: "bg-gray-500 text-white",
    };
    return colors[role];
}
