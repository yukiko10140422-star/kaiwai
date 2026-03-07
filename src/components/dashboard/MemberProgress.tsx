"use client";

import Avatar from "@/components/ui/Avatar";
import ProgressBar from "./ProgressBar";

interface MemberStat {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalTasks: number;
  completedTasks: number;
}

interface MemberProgressProps {
  members: MemberStat[];
  className?: string;
}

export default function MemberProgress({ members, className = "" }: MemberProgressProps) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <h3 className="font-semibold mb-4">メンバー別進捗</h3>
      <div className="space-y-4">
        {members.map((member) => {
          const progress =
            member.totalTasks > 0
              ? (member.completedTasks / member.totalTasks) * 100
              : 0;

          return (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar
                src={member.avatarUrl}
                name={member.displayName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <ProgressBar
                  value={progress}
                  label={member.displayName}
                  height={6}
                />
              </div>
              <span className="text-xs text-muted whitespace-nowrap">
                {member.completedTasks}/{member.totalTasks}
              </span>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-muted text-center py-4">
            メンバーデータがありません
          </p>
        )}
      </div>
    </div>
  );
}
