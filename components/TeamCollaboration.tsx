"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
    Team,
    TeamMember,
    getRoleDisplayName,
    getRoleBadgeColor,
    validateTeamMemberEmail,
} from "@/lib/collaboration/team-management";

interface TeamCollaborationProps {
    team: Team | null;
    currentUserId: string;
    onCreateTeam: (name: string, description: string) => Promise<void>;
    onInviteMember: (email: string, role: TeamMember["role"]) => Promise<void>;
    onRemoveMember: (memberId: string) => Promise<void>;
    onUpdateMemberRole: (memberId: string, role: TeamMember["role"]) => Promise<void>;
    className?: string;
}

export default function TeamCollaboration({
    team,
    currentUserId,
    onCreateTeam,
    onInviteMember,
    onRemoveMember,
    onUpdateMemberRole,
    className = "",
}: TeamCollaborationProps) {
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showInviteMember, setShowInviteMember] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [teamDescription, setTeamDescription] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("member");
    const [loading, setLoading] = useState(false);

    const currentMember = team?.members.find((m) => m.id === currentUserId);
    const canManageMembers = currentMember?.permissions.canManageMembers || false;

    const handleCreateTeam = async () => {
        if (!teamName.trim()) return;
        
        setLoading(true);
        try {
            await onCreateTeam(teamName, teamDescription);
            setTeamName("");
            setTeamDescription("");
            setShowCreateTeam(false);
        } catch (error) {
            console.error("Error creating team:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMember = async () => {
        if (!validateTeamMemberEmail(inviteEmail)) {
            alert("Please enter a valid email address");
            return;
        }

        setLoading(true);
        try {
            await onInviteMember(inviteEmail, inviteRole);
            setInviteEmail("");
            setInviteRole("member");
            setShowInviteMember(false);
        } catch (error) {
            console.error("Error inviting member:", error);
        } finally {
            setLoading(false);
        }
    };

    // No team - show create team UI
    if (!team) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="card p-8 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h2 className="text-2xl font-bold mb-2">Team Collaboration</h2>
                    <p className="text-gray-600 mb-6">
                        Create a team to collaborate with other recruiters
                    </p>

                    {!showCreateTeam ? (
                        <Button onClick={() => setShowCreateTeam(true)} size="lg">
                            ➕ Create Team
                        </Button>
                    ) : (
                        <div className="max-w-md mx-auto space-y-4">
                            <input
                                type="text"
                                placeholder="Team Name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                            <textarea
                                placeholder="Team Description (optional)"
                                value={teamDescription}
                                onChange={(e) => setTeamDescription(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCreateTeam}
                                    disabled={loading || !teamName.trim()}
                                    className="flex-1"
                                >
                                    {loading ? "Creating..." : "Create Team"}
                                </Button>
                                <Button
                                    onClick={() => setShowCreateTeam(false)}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Has team - show team management UI
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Team Header */}
            <div className="card p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{team.name}</h2>
                        {team.description && (
                            <p className="text-gray-600">{team.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            Created {new Date(team.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    {canManageMembers && (
                        <Button onClick={() => setShowInviteMember(true)}>
                            ➕ Invite Member
                        </Button>
                    )}
                </div>
            </div>

            {/* Invite Member Modal */}
            {showInviteMember && (
                <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 animate-fadeIn">
                    <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) =>
                                    setInviteRole(e.target.value as TeamMember["role"])
                                }
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {inviteRole === "admin"
                                    ? "Can manage members and all interviews"
                                    : "Can create interviews and view team interviews"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleInviteMember}
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? "Inviting..." : "Send Invitation"}
                            </Button>
                            <Button
                                onClick={() => setShowInviteMember(false)}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Team Members ({team.members.length})
                </h3>
                <div className="space-y-3">
                    {team.members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{member.name}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(
                                                member.role
                                            )}`}
                                        >
                                            {getRoleDisplayName(member.role)}
                                        </span>
                                        {member.id === currentUserId && (
                                            <span className="text-xs text-gray-500">(You)</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{member.email}</p>
                                    <p className="text-xs text-gray-500">
                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {canManageMembers && member.id !== currentUserId && (
                                <div className="flex gap-2">
                                    {member.role !== "owner" && (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={(e) =>
                                                    onUpdateMemberRole(
                                                        member.id,
                                                        e.target.value as TeamMember["role"]
                                                    )
                                                }
                                                className="px-2 py-1 border rounded text-sm"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <Button
                                                onClick={() => onRemoveMember(member.id)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Remove
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Permissions Overview */}
            {currentMember && (
                <div className="card p-6 bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Your Permissions</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(currentMember.permissions).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className={value ? "text-green-500" : "text-gray-400"}>
                                    {value ? "✓" : "✗"}
                                </span>
                                <span className="capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
