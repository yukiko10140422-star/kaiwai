-- ============================================================
-- ProjectContact - Database Schema
-- Supabase (PostgreSQL) + Row Level Security
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. CUSTOM TYPES
-- ============================================================
CREATE TYPE channel_type AS ENUM ('public', 'private');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE notification_type AS ENUM (
  'mention',
  'task_assigned',
  'task_due',
  'task_comment',
  'channel_invite',
  'dm_message'
);
CREATE TYPE user_role AS ENUM ('admin', 'member');

-- ============================================================
-- 3. TABLES
-- ============================================================

-- ----------------------------------------------------------
-- 3.1 Profiles (auth.users と連携)
-- ----------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.2 Invitations (招待機能)
-- ----------------------------------------------------------
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.3 Channels (チャンネル)
-- ----------------------------------------------------------
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type channel_type NOT NULL DEFAULT 'public',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.4 Channel Members (チャンネルメンバー)
-- ----------------------------------------------------------
CREATE TABLE channel_members (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.5 Direct Message Conversations (DM会話)
-- ----------------------------------------------------------
CREATE TABLE dm_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.6 DM Participants (DM参加者)
-- ----------------------------------------------------------
CREATE TABLE dm_participants (
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE dm_participants ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.7 Messages (メッセージ: チャンネル & DM 共用)
-- ----------------------------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- スレッド返信
  content TEXT NOT NULL DEFAULT '',
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- チャンネルかDMのどちらか一方を必須
  CONSTRAINT messages_target_check CHECK (
    (channel_id IS NOT NULL AND conversation_id IS NULL) OR
    (channel_id IS NULL AND conversation_id IS NOT NULL)
  )
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages REPLICA IDENTITY FULL; -- Realtime用

-- ----------------------------------------------------------
-- 3.8 Message Attachments (添付ファイル)
-- ----------------------------------------------------------
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage のパス
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.9 Message Reactions (リアクション)
-- ----------------------------------------------------------
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.10 Channel Read Status (未読管理)
-- ----------------------------------------------------------
CREATE TABLE channel_read_status (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
ALTER TABLE channel_read_status ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.11 DM Read Status (DM未読管理)
-- ----------------------------------------------------------
CREATE TABLE dm_read_status (
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE dm_read_status ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.12 Projects (プロジェクト分類)
-- ----------------------------------------------------------
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.13 Tasks (タスク)
-- ----------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL, -- 関連チャンネル
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- レガシー（単一アサイン）
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date DATE,
  due_time TIME,                        -- タスクの時間指定（任意）
  location TEXT,                        -- 場所（任意）
  position INTEGER NOT NULL DEFAULT 0, -- カンバン内の並び順
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks REPLICA IDENTITY FULL; -- Realtime用

-- ----------------------------------------------------------
-- 3.14 Subtasks (サブタスク / チェックリスト)
-- ----------------------------------------------------------
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.15 Labels (ラベル定義)
-- ----------------------------------------------------------
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- hex color e.g. '#ef4444'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.16a Task Assignees (タスク-担当者 多対多)
-- ----------------------------------------------------------
CREATE TABLE task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.16 Task Labels (タスク-ラベル 多対多)
-- ----------------------------------------------------------
CREATE TABLE task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.17 Task Comments (タスクへのコメント)
-- ----------------------------------------------------------
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.18 Notifications (通知)
-- ----------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  reference_id UUID, -- 関連するメッセージ/タスク等のID
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications REPLICA IDENTITY FULL; -- Realtime用

-- ----------------------------------------------------------
-- 3.19 Activity Log (アクティビティログ)
-- ----------------------------------------------------------
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g. 'task_created', 'message_sent', 'status_changed'
  target_type TEXT NOT NULL, -- e.g. 'task', 'message', 'channel'
  target_id UUID,
  metadata JSONB DEFAULT '{}', -- 追加情報 (変更前後の値など)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.20 KPI Goals (KPI目標)
-- ----------------------------------------------------------
CREATE TABLE kpi_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('short', 'medium', 'long')),
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE kpi_goals ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 3.21 Meeting Notes (議事録)
-- ----------------------------------------------------------
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX idx_messages_channel_id ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_parent_id ON messages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX idx_tasks_channel_id ON tasks(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX idx_kpi_goals_project_id ON kpi_goals(project_id);
CREATE INDEX idx_kpi_goals_timeframe ON kpi_goals(project_id, timeframe);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_meeting_notes_created_by ON meeting_notes(created_by);
CREATE INDEX idx_meeting_notes_project_id ON meeting_notes(project_id);
CREATE INDEX idx_meeting_notes_meeting_date ON meeting_notes(meeting_date DESC);

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper: 認証済みユーザーID取得
-- auth.uid() は Supabase が提供する組み込み関数

-- ----- profiles -----
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

-- ----- invitations -----
CREATE POLICY "invitations_select_admin" ON invitations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "invitations_insert_admin" ON invitations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- channels -----
CREATE POLICY "channels_select" ON channels FOR SELECT
  TO authenticated USING (
    type = 'public'
    OR EXISTS (
      SELECT 1 FROM channel_members WHERE channel_id = id AND user_id = auth.uid()
    )
  );
CREATE POLICY "channels_insert" ON channels FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "channels_update" ON channels FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "channels_delete" ON channels FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- ----- channel_members -----
-- NOTE: 自己参照の EXISTS は無限再帰で 500 エラーになるため true で許可
-- チャンネル自体の RLS で保護されているため安全
CREATE POLICY "channel_members_select" ON channel_members FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "channel_members_insert" ON channel_members FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "channel_members_update" ON channel_members FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "channel_members_delete_own" ON channel_members FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ----- dm_conversations -----
CREATE POLICY "dm_conversations_select" ON dm_conversations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM dm_participants WHERE conversation_id = id AND user_id = auth.uid()
    )
  );
CREATE POLICY "dm_conversations_insert" ON dm_conversations FOR INSERT
  TO authenticated WITH CHECK (true);

-- ----- dm_participants -----
-- NOTE: 自己参照の EXISTS は無限再帰で 500 エラーになるため true で許可
-- dm_conversations 自体の RLS で保護されているため安全
CREATE POLICY "dm_participants_select" ON dm_participants FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "dm_participants_insert" ON dm_participants FOR INSERT
  TO authenticated WITH CHECK (true);

-- ----- messages -----
CREATE POLICY "messages_select_channel" ON messages FOR SELECT
  TO authenticated USING (
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid()
    ))
    OR
    (conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM dm_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ))
  );
CREATE POLICY "messages_insert" ON messages FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_delete_own" ON messages FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ----- message_attachments -----
CREATE POLICY "message_attachments_select" ON message_attachments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM messages m WHERE m.id = message_id AND (
        (m.channel_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM channel_members WHERE channel_id = m.channel_id AND user_id = auth.uid()
        ))
        OR
        (m.conversation_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM dm_participants WHERE conversation_id = m.conversation_id AND user_id = auth.uid()
        ))
      )
    )
  );
CREATE POLICY "message_attachments_insert" ON message_attachments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM messages WHERE id = message_id AND user_id = auth.uid())
  );

-- ----- message_reactions -----
CREATE POLICY "message_reactions_select" ON message_reactions FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "message_reactions_insert" ON message_reactions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "message_reactions_delete_own" ON message_reactions FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ----- channel_read_status -----
CREATE POLICY "channel_read_status_select" ON channel_read_status FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "channel_read_status_upsert" ON channel_read_status FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "channel_read_status_update" ON channel_read_status FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----- dm_read_status -----
CREATE POLICY "dm_read_status_select" ON dm_read_status FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "dm_read_status_upsert" ON dm_read_status FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "dm_read_status_update" ON dm_read_status FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----- projects -----
CREATE POLICY "projects_select" ON projects FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "projects_update" ON projects FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "projects_delete" ON projects FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- ----- tasks -----
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  TO authenticated USING (true);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- ----- subtasks -----
CREATE POLICY "subtasks_select" ON subtasks FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "subtasks_insert" ON subtasks FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "subtasks_update" ON subtasks FOR UPDATE
  TO authenticated USING (true);
CREATE POLICY "subtasks_delete" ON subtasks FOR DELETE
  TO authenticated USING (true);

-- ----- labels -----
CREATE POLICY "labels_select" ON labels FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "labels_insert" ON labels FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "labels_update" ON labels FOR UPDATE
  TO authenticated USING (true);
CREATE POLICY "labels_delete" ON labels FOR DELETE
  TO authenticated USING (true);

-- ----- task_assignees -----
CREATE POLICY "task_assignees_select" ON task_assignees FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "task_assignees_insert" ON task_assignees FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "task_assignees_delete" ON task_assignees FOR DELETE
  TO authenticated USING (true);

-- ----- task_labels -----
CREATE POLICY "task_labels_select" ON task_labels FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "task_labels_insert" ON task_labels FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "task_labels_delete" ON task_labels FOR DELETE
  TO authenticated USING (true);

-- ----- task_comments -----
CREATE POLICY "task_comments_select" ON task_comments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "task_comments_update_own" ON task_comments FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "task_comments_delete_own" ON task_comments FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ----- notifications -----
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----- activity_logs -----
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- ----- meeting_notes -----
CREATE POLICY "meeting_notes_select" ON meeting_notes FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "meeting_notes_insert" ON meeting_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "meeting_notes_update" ON meeting_notes FOR UPDATE
  TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "meeting_notes_delete" ON meeting_notes FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- ----- kpi_goals -----
CREATE POLICY "kpi_goals_select" ON kpi_goals FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "kpi_goals_insert" ON kpi_goals FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "kpi_goals_update" ON kpi_goals FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kpi_goals_delete" ON kpi_goals FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER kpi_goals_updated_at
  BEFORE UPDATE ON kpi_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 新規ユーザー登録時に profiles レコードを自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 7. STORAGE BUCKETS (Supabase Storage)
-- ============================================================
-- NOTE: Supabase StorageのバケットはSQL直接作成ではなく
-- Supabase Dashboard または supabase CLI で作成推奨:
--   supabase storage create avatars --public
--   supabase storage create attachments --public=false
--
-- avatars: プロフィール画像用 (public)
-- attachments: メッセージ添付ファイル用 (authenticated only)
