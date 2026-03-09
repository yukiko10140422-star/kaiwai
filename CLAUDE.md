# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KAIWAI is a lightweight team collaboration web app combining Slack-style chat with Notion-style task management. Designed for small teams (up to 10 members) with invite-only access.

## Tech Stack

- **Frontend**: Next.js (React) + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Backend/DB**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Hosting**: Vercel

## MCP Servers

- **Supabase MCP** (`@supabase/mcp-server-supabase`): Configured for direct DB access (project ID: `czjdhvtbejywzhprwlbn`)
- **GitHub MCP**: Via `gh mcp-server`

## Architecture (Planned)

The app has four main domains:

1. **Auth & Users** - Supabase Auth (email+password), profiles with avatars, invite system
2. **Chat** - Channels, DMs, real-time messaging (Supabase Realtime), file attachments, threads, mentions
3. **Tasks** - Kanban board with drag-and-drop, assignees, due dates, subtasks, labels, priority levels
4. **Dashboard** - Progress charts, member stats, deadline calendar, activity log

## Design System

- Dark/light mode with glassmorphism (backdrop-blur + translucent backgrounds)
- Dark accent: `#3b82f6` (blue-500), background: `#0f172a` (slate-900)
- Light accent: `#2563eb` (blue-600), background: `#f8fafc` (slate-50)
- Status colors: todo=slate-400, in-progress=blue-500, review=amber-500, done=green-500, overdue=red-500
- PC-first responsive layout

## Session Workflow (IMPORTANT)

Every session must follow this flow:
1. **開始時**: `docs/PROGRESS.md` と `docs/PARALLEL_TASKS.md` を読み取り、進捗・完了タスク・前回の問題点を確認する
2. **作業中**: 変更点・エラー・判断事項があれば随時 `docs/PROGRESS.md` に記録する
3. **終了時**: セッションログを追記し、次回やることを更新する

## Sub-Agent Workflow (IMPORTANT)

`docs/PARALLEL_TASKS.md` に従ってサブエージェントとの協業を管理する:
- **メインエージェント**: 完了タスクをレビューし、依存解消済みのタスクを「現在振れるタスク」に昇格させ、サブエージェントに割り当てる
- **サブエージェント**: 作業完了時に `docs/PARALLEL_TASKS.md` の「完了済みタスク」に結果を追記し、`docs/PROGRESS.md` も更新する

## Key Documentation

- `REQUIREMENTS.md` - Full requirements specification
- `docs/PROJECT.md` - Project overview and tech stack
- `docs/FEATURES.md` - Detailed feature requirements with priorities
- `docs/DESIGN.md` - UI design guidelines, color palette, screen layout
- `docs/PROGRESS.md` - Progress log (session history, errors, next steps)
- `docs/PARALLEL_TASKS.md` - Parallelizable tasks for sub-agents

## Release Workflow (IMPORTANT)

機能追加・変更を行った際は必ず以下を実施すること:
1. **WhatsNewModal 更新**: `src/components/ui/WhatsNewModal.tsx` の `CURRENT_VERSION` をインクリメントし、changelog に新しいエントリを追加する
2. **docs/PROGRESS.md 更新**: セッションログに変更内容を追記する
3. **ビルド確認**: `npx next build` でエラーがないことを確認する

WhatsNewModal は `localStorage` ベースで、バージョンが変わったときのみユーザーに表示される。

4. **GitHub Release 作成**: `gh release create vX.X.X --title "タイトル" --notes "変更内容"` でリリースを作成する

## Development Phases

1. Foundation (Auth, profiles, project setup)
2. Chat (Channels, DMs, real-time, file sharing)
3. Tasks (CRUD, Kanban, assignments, subtasks)
4. Dashboard (Charts, calendar, activity log)
5. Polish (Notifications, search, animations, deploy)
