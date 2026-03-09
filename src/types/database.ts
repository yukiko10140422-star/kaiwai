export type UserRole = "admin" | "member";
export type ChannelType = "public" | "private";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type NotificationType =
  | "mention"
  | "task_assigned"
  | "task_due"
  | "task_comment"
  | "channel_invite"
  | "dm_message";

export interface Profile {
  id: string; // UUID, auth.users.id と同一
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  type: ChannelType;
  created_by: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelMember {
  channel_id: string;
  user_id: string;
  joined_at: string;
}

export interface DmConversation {
  id: string;
  created_at: string;
}

export interface DmParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  channel_id: string | null;
  conversation_id: string | null;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  channel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  /** Optional time for the task (HH:MM format). DB column: due_time TIME */
  // NOTE: Requires DB migration:
  //   ALTER TABLE tasks ADD COLUMN due_time TIME;
  //   ALTER TABLE tasks ADD COLUMN location TEXT;
  due_time?: string | null;
  /** Optional location/place for the task */
  location?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string; // hex color
  created_at: string;
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
  assigned_at: string;
}

export interface TaskLabelAssignment {
  task_id: string;
  label_id: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// Task Submissions (成果物提出)
// ------------------------------------------------------------

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface TaskSubmission {
  id: string;
  task_id: string;
  submitted_by: string;
  comment: string | null;
  status: SubmissionStatus;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SubmissionFile {
  id: string;
  submission_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_assigned'
  | 'message_sent'
  | 'channel_created'
  | 'member_joined'
  | 'file_uploaded';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: ActivityAction;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type KpiTimeframe = "short" | "medium" | "long";

export interface KpiGoal {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  timeframe: KpiTimeframe;
  target_value: number;
  current_value: number;
  unit: string;
  due_date: string | null;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

// ------------------------------------------------------------
// Meeting Notes (議事録)
// ------------------------------------------------------------

export interface MeetingNote {
  id: string;
  title: string;
  content: string;
  meeting_date: string;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// Read status (未読管理)
// ------------------------------------------------------------

export interface ChannelReadStatus {
  user_id: string;
  channel_id: string;
  last_read_at: string;
}

export interface DmReadStatus {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
}

// ------------------------------------------------------------
// Feature Requests (機能リクエスト)
// ------------------------------------------------------------

export type FeatureRequestStatus = "open" | "planned" | "done" | "rejected";

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  votes: number;
  status: FeatureRequestStatus;
  created_at: string;
}

export interface FeatureRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  created_at: string;
}

// ------------------------------------------------------------
// Library (ファイルライブラリ)
// ------------------------------------------------------------

export type LibraryFileType = "image" | "video" | "audio" | "pdf" | "document" | "spreadsheet" | "presentation" | "archive" | "other";

export interface LibraryFolder {
  id: string;
  name: string;
  parent_id: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryFile {
  id: string;
  folder_id: string | null;
  project_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  description: string | null;
  uploaded_by: string;
  parent_file_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryFileComment {
  id: string;
  file_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// ------------------------------------------------------------
// Supabase Database 型 (supabase gen types 互換構造)
// ------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      channels: {
        Row: Channel;
        Insert: Omit<Channel, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Channel, 'id' | 'created_at'>>;
      };
      channel_members: {
        Row: ChannelMember;
        Insert: ChannelMember;
        Update: Partial<ChannelMember>;
      };
      dm_conversations: {
        Row: DmConversation;
        Insert: Omit<DmConversation, 'id' | 'created_at'>;
        Update: never;
      };
      dm_participants: {
        Row: DmParticipant;
        Insert: Omit<DmParticipant, 'joined_at'>;
        Update: never;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      message_attachments: {
        Row: MessageAttachment;
        Insert: Omit<MessageAttachment, 'id' | 'created_at'>;
        Update: Partial<Omit<MessageAttachment, 'id'>>;
      };
      message_reactions: {
        Row: MessageReaction;
        Insert: Omit<MessageReaction, 'id' | 'created_at'>;
        Update: never;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      subtasks: {
        Row: Subtask;
        Insert: Omit<Subtask, 'id' | 'created_at'>;
        Update: Partial<Omit<Subtask, 'id'>>;
      };
      labels: {
        Row: Label;
        Insert: Omit<Label, 'id' | 'created_at'>;
        Update: Partial<Omit<Label, 'id'>>;
      };
      task_assignees: {
        Row: TaskAssignee;
        Insert: Omit<TaskAssignee, 'assigned_at'>;
        Update: never;
      };
      task_labels: {
        Row: TaskLabelAssignment;
        Insert: TaskLabelAssignment;
        Update: never;
      };
      task_comments: {
        Row: TaskComment;
        Insert: Omit<TaskComment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TaskComment, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      kpi_goals: {
        Row: KpiGoal;
        Insert: Omit<KpiGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KpiGoal, 'id' | 'created_at'>>;
      };
      invitations: {
        Row: Invitation;
        Insert: Omit<Invitation, 'id' | 'created_at'>;
        Update: Partial<Omit<Invitation, 'id'>>;
      };
      channel_read_status: {
        Row: ChannelReadStatus;
        Insert: ChannelReadStatus;
        Update: Partial<ChannelReadStatus>;
      };
      dm_read_status: {
        Row: DmReadStatus;
        Insert: DmReadStatus;
        Update: Partial<DmReadStatus>;
      };
      meeting_notes: {
        Row: MeetingNote;
        Insert: Omit<MeetingNote, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MeetingNote, 'id' | 'created_at'>>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, 'id' | 'created_at'>;
        Update: never;
      };
      project_members: {
        Row: ProjectMember;
        Insert: Omit<ProjectMember, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProjectMember, 'id' | 'created_at'>>;
      };
      feature_requests: {
        Row: FeatureRequest;
        Insert: Omit<FeatureRequest, 'id' | 'created_at'>;
        Update: Partial<Omit<FeatureRequest, 'id' | 'created_at'>>;
      };
      feature_request_votes: {
        Row: FeatureRequestVote;
        Insert: Omit<FeatureRequestVote, 'id' | 'created_at'>;
        Update: never;
      };
      library_folders: {
        Row: LibraryFolder;
        Insert: Omit<LibraryFolder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LibraryFolder, 'id' | 'created_at'>>;
      };
      library_files: {
        Row: LibraryFile;
        Insert: Omit<LibraryFile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LibraryFile, 'id' | 'created_at'>>;
      };
      library_file_comments: {
        Row: LibraryFileComment;
        Insert: Omit<LibraryFileComment, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}
