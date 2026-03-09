-- ファイルライブラリ テーブル作成
-- 実行: Supabase SQL Editor

-- 1. library_folders
CREATE TABLE IF NOT EXISTS library_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES library_folders(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. library_files
CREATE TABLE IF NOT EXISTS library_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES library_folders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT '',
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  parent_file_id UUID REFERENCES library_files(id) ON DELETE SET NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. library_file_comments
CREATE TABLE IF NOT EXISTS library_file_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES library_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_library_folders_parent ON library_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_library_folders_project ON library_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_library_files_folder ON library_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_library_files_project ON library_files(project_id);
CREATE INDEX IF NOT EXISTS idx_library_files_parent_file ON library_files(parent_file_id);
CREATE INDEX IF NOT EXISTS idx_library_file_comments_file ON library_file_comments(file_id);

-- RLS
ALTER TABLE library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_file_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "library_folders_select" ON library_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "library_files_select" ON library_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "library_file_comments_select" ON library_file_comments FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert
CREATE POLICY "library_folders_insert" ON library_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "library_files_insert" ON library_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "library_file_comments_insert" ON library_file_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Creator can update/delete
CREATE POLICY "library_folders_update" ON library_folders FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "library_folders_delete" ON library_folders FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "library_files_update" ON library_files FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "library_files_delete" ON library_files FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "library_file_comments_delete" ON library_file_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
