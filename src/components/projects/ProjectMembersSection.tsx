"use client";

import { useState } from "react";
import { Avatar, Button, Modal } from "@/components/ui";
import { roleRingMap } from "@/components/ui/Avatar";
import type { ProjectMemberWithProfile } from "@/lib/projects";
import type { Profile } from "@/types/database";
import {
  addProjectMember,
  updateProjectMemberRoles,
  removeProjectMember,
} from "@/lib/projects";

/** Preset roles for quick selection */
const PRESET_ROLES = [
  "リーダー",
  "エンジニア",
  "デザイナー",
  "ディレクター",
  "PM",
  "マーケター",
  "QA",
];

const roleBadgeColor: Record<string, string> = {
  "リーダー": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "エンジニア": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "デザイナー": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "ディレクター": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "PM": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "マーケター": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "QA": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function getRoleBadgeClass(role: string): string {
  return roleBadgeColor[role] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

interface Props {
  projectId: string;
  members: ProjectMemberWithProfile[];
  allUsers: Pick<Profile, "id" | "display_name" | "avatar_url">[];
  onUpdate: () => void;
}

export default function ProjectMembersSection({
  projectId,
  members,
  allUsers,
  onUpdate,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState<ProjectMemberWithProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  // --- Add member ---
  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setSubmitting(true);
    try {
      await addProjectMember(projectId, selectedUserId, selectedRoles);
      setShowAddModal(false);
      setSelectedUserId("");
      setSelectedRoles([]);
      setCustomRole("");
      onUpdate();
    } catch (e) {
      console.error("Failed to add member:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Edit roles ---
  const openRoleModal = (member: ProjectMemberWithProfile) => {
    setShowRoleModal(member);
    setSelectedRoles([...member.roles]);
    setCustomRole("");
  };

  const handleSaveRoles = async () => {
    if (!showRoleModal) return;
    setSubmitting(true);
    try {
      await updateProjectMemberRoles(showRoleModal.id, selectedRoles);
      setShowRoleModal(null);
      onUpdate();
    } catch (e) {
      console.error("Failed to update roles:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Remove member ---
  const handleRemove = async (memberId: string) => {
    try {
      await removeProjectMember(memberId);
      onUpdate();
    } catch (e) {
      console.error("Failed to remove member:", e);
    }
  };

  // --- Role toggle ---
  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const addCustomRole = () => {
    const trimmed = customRole.trim();
    if (trimmed && !selectedRoles.includes(trimmed)) {
      setSelectedRoles((prev) => [...prev, trimmed]);
      setCustomRole("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg">メンバー</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)}>
          + メンバー追加
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">メンバーがいません</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-accent hover:underline mt-2"
          >
            メンバーを追加する
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-border">
          {members.map((member) => {
            const primaryRole = member.roles[0] || null;
            const ringColor = primaryRole
              ? roleRingMap[primaryRole] || undefined
              : undefined;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-card/50 transition-colors"
              >
                <Avatar
                  src={member.profile.avatar_url}
                  name={member.profile.display_name}
                  size="md"
                  roleBadge={primaryRole}
                  ringColor={ringColor}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.profile.display_name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {member.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded border ${getRoleBadgeClass(role)}`}
                      >
                        {role}
                      </span>
                    ))}
                    {member.roles.length === 0 && (
                      <span className="text-[10px] text-muted">役職未設定</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openRoleModal(member)}
                    className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-card transition-colors"
                    title="役職を編集"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-muted hover:text-status-overdue p-1.5 rounded-lg hover:bg-card transition-colors"
                    title="メンバーを外す"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedUserId(""); setSelectedRoles([]); setCustomRole(""); }}
        title="メンバーを追加"
        className="max-w-md"
      >
        <div className="space-y-4">
          {/* User select */}
          <div>
            <label className="block text-xs text-muted mb-1">ユーザーを選択 *</label>
            {availableUsers.length === 0 ? (
              <p className="text-sm text-muted">追加できるユーザーがいません</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id === selectedUserId ? "" : user.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      selectedUserId === user.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <Avatar src={user.avatar_url} name={user.display_name} size="xs" />
                    <span>{user.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role selection */}
          <RoleSelector
            selectedRoles={selectedRoles}
            onToggle={toggleRole}
            customRole={customRole}
            onCustomRoleChange={setCustomRole}
            onAddCustomRole={addCustomRole}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleAddMember} disabled={!selectedUserId || submitting}>
              {submitting ? "追加中..." : "追加"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Roles Modal */}
      <Modal
        open={!!showRoleModal}
        onClose={() => setShowRoleModal(null)}
        title={showRoleModal ? `${showRoleModal.profile.display_name} の役職` : ""}
        className="max-w-md"
      >
        <div className="space-y-4">
          <RoleSelector
            selectedRoles={selectedRoles}
            onToggle={toggleRole}
            customRole={customRole}
            onCustomRoleChange={setCustomRole}
            onAddCustomRole={addCustomRole}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRoleModal(null)}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSaveRoles} disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Reusable role selector with presets + custom input */
function RoleSelector({
  selectedRoles,
  onToggle,
  customRole,
  onCustomRoleChange,
  onAddCustomRole,
}: {
  selectedRoles: string[];
  onToggle: (role: string) => void;
  customRole: string;
  onCustomRoleChange: (v: string) => void;
  onAddCustomRole: () => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">
        役職（複数選択可）
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {PRESET_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => onToggle(role)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              selectedRoles.includes(role)
                ? `${getRoleBadgeClass(role)} border-current`
                : "border-border text-muted hover:border-accent/50"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Custom roles already added */}
      {selectedRoles
        .filter((r) => !PRESET_ROLES.includes(r))
        .map((role) => (
          <span
            key={role}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border text-xs mr-1 mb-1"
          >
            {role}
            <button onClick={() => onToggle(role)} className="text-muted hover:text-foreground">
              &times;
            </button>
          </span>
        ))}

      {/* Custom role input */}
      <div className="flex gap-2 mt-2">
        <input
          value={customRole}
          onChange={(e) => onCustomRoleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddCustomRole())}
          placeholder="カスタム役職を入力..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus-glow"
        />
        <Button variant="secondary" size="sm" onClick={onAddCustomRole} disabled={!customRole.trim()}>
          追加
        </Button>
      </div>
    </div>
  );
}
