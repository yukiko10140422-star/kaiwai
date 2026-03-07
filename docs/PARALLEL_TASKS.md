# 並行作業タスク一覧

メインエージェントの作業と並行してサブエージェントに振れるタスクの一覧。

---

## ワークフロールール

### サブエージェント（作業完了時の義務）
1. 作業完了後、このファイルの「完了済みタスク」セクションに以下を追記する：
   - タスクID（例: Task A）
   - 作成・変更したファイル一覧
   - 実施内容の簡潔なサマリー
   - 発生した問題点・注意事項
   - 完了日時
2. 該当タスクを「現在振れるタスク」から「完了済みタスク」に移動する
3. `docs/PROGRESS.md` の該当チェックボックスも更新する

### メインエージェント（タスク管理の義務）
1. セッション開始時にこのファイルを読み、完了済みタスクの成果物をレビューする
2. 問題があればサブエージェントに修正指示を出す
3. 完了状況に応じて「待機中タスク」から「現在振れるタスク」に昇格させる
4. 新しいタスクが必要になったら追加する

### タスクの振り方
サブエージェントに振る際は以下を伝える：
```
「docs/PARALLEL_TASKS.md の Task X を実施してください。
参照ファイル・成果物・注意点はドキュメントに記載されています。」
```

---

## 現在振れるタスク

### Task O: メンション機能 - **完了**
**内容:** チャットで @ユーザー名 を入力してメンバーに通知を送る機能
**参照ファイル:**
- `src/components/chat/MessageInput.tsx` - メッセージ入力欄（ここに@候補表示を追加）
- `src/components/chat/MessageItem.tsx` - メッセージ表示（メンションのハイライト）
- `src/lib/notifications.ts` - 通知関数（参考）
- `src/types/database.ts` - `NotificationType` に `mention` あり
**成果物:**
- `src/components/chat/MentionSuggest.tsx` - @入力時のメンバー候補ドロップダウン
- `src/components/chat/MessageInput.tsx` 更新 - @入力検知 → MentionSuggest 表示 → 選択で挿入
- `src/components/chat/MessageItem.tsx` 更新 - メッセージ内の `@ユーザー名` をハイライト表示（アクセントカラー）
- `src/lib/mentions.ts` - メンション解析、通知送信（notifications テーブルに INSERT）
**依存:** なし
**注意点:**
- `@` を入力した時点で候補を表示、入力に応じてフィルタリング
- 候補はチャンネル/DMの参加メンバーから取得
- メッセージ送信時にメンションを解析し、該当ユーザーに notification を INSERT
- メッセージ表示時は正規表現で `@表示名` を検出してハイライト

### Task Q: スレッド返信UI - **完了**
**内容:** メッセージへのスレッド形式返信のUIを実装（右パネル表示）
**参照ファイル:**
- `src/lib/chat.ts` - `getThreadReplies`, `sendThreadReply` 関数（既に実装済み）
- `src/components/chat/MessageItem.tsx` - `onThreadClick` prop, `reply_count` 表示（既にあり）
- `src/app/dashboard/chat/[channelId]/page.tsx` - チャンネルページ（右パネル追加先）
**成果物:**
- `src/components/chat/ThreadPanel.tsx` - 右パネルのスレッド表示（親メッセージ + 返信一覧 + 入力欄）
- `src/app/dashboard/chat/[channelId]/page.tsx` 更新 - スレッドパネルの開閉状態管理、MessageItem の onThreadClick ハンドラ
**依存:** なし
**注意点:**
- 右パネルはチャットエリアの右側にスライドイン（framer-motion AnimatePresence）
- パネル幅は 360px 程度、閉じるボタン付き
- 親メッセージを上部に表示し、その下に返信一覧
- 返信にも Realtime 購読（`parent_id` でフィルタ）
- スレッド内のメッセージもMessageItemコンポーネントを再利用
- `getThreadReplies` / `sendThreadReply` は既に `src/lib/chat.ts` に実装済みなのでそのまま使う

### Task R: 設定ページ整備 - **完了**
**内容:** ダッシュボード設定ページを整備（テーマ切替、招待リンク、パスワード変更）
**参照ファイル:**
- `src/app/dashboard/settings/` - 既存設定ページ
- `src/app/dashboard/profile/page.tsx` - プロフィール設定（参考）
- `src/app/globals.css` - テーマCSS変数（ダーク/ライト）
- `src/components/ui/` - 共通UIコンポーネント
**成果物:**
- `src/app/dashboard/settings/page.tsx` - 設定トップページ（セクション分けのナビゲーション）
- `src/components/settings/ThemeToggle.tsx` - ダークモード/ライトモード切替スイッチ
- `src/lib/theme.ts` - テーマ管理（localStorage保存、html属性切替）
- 設定ページ内に「招待管理」「プロフィール」「テーマ」「パスワード変更」へのリンク
**依存:** なし
**注意点:**
- テーマ切替は `<html>` タグの `data-theme` 属性（`dark` / `light`）で制御
- `globals.css` に既に `:root`（ライト）と `.dark`/`[data-theme="dark"]` 用のCSS変数がある前提
- localStorage にテーマ設定を保存し、初回ロード時に復元
- パスワード変更は `supabase.auth.updateUser({ password })` を使用

### Task T: デプロイ準備 - **完了**
**内容:** Vercel へのデプロイ設定とビルド確認
**参照ファイル:**
- `package.json` - ビルドスクリプト
- `.env.local` - 環境変数（Supabase URL, ANON_KEY）
- `next.config.ts` - Next.js 設定
**成果物:**
- `.env.example` - 環境変数のテンプレート（値なし）
- `next.config.ts` 更新 - 画像ドメイン許可（Supabase Storage）、その他本番設定
- `npm run build` が成功することを確認
- ビルドエラーがあれば修正
**依存:** なし（ただし他タスクと並行可能）
**注意点:**
- `.env.local` はコミットしない（.gitignoreに入っているか確認）
- `next.config.ts` に `images.remotePatterns` で Supabase Storage ドメインを許可
- ビルド時の型エラー・lint エラーを全て解消する
- `npm run build` → `npm run start` でローカル本番動作確認

---

## 待機中タスク（依存関係未解消）

（なし - 全タスク着手可能）

---

## 完了済みタスク

### Task A: Supabase DBスキーマ設計 - 完了
**完了日:** 2026-03-08
**成果物:** `docs/schema.sql`
**内容:** 全テーブル（profiles, channels, messages, tasks, notifications 等19テーブル）のCREATE TABLE、RLSポリシー、インデックス、トリガー
**備考:** ENUMカスタム型使用、DMは別テーブル（dm_conversations）で管理

### Task B: 共通UIコンポーネント作成 - 完了
**完了日:** 2026-03-08
**成果物:** `src/components/ui/` (Button, Input, Avatar, Badge, Card, Modal, Toast, index.ts)
**内容:** Tailwind CSS + Framer Motion で再利用可能なUIコンポーネント

### Task C: TypeScript型定義 - 完了
**完了日:** 2026-03-08
**成果物:** `src/types/database.ts`
**内容:** 全テーブル対応のインターフェース定義
**備考:** Profile に email/status追加、ActivityAction型追加、Label に project_id追加

### Task D: ダッシュボードレイアウト - 完了
**完了日:** 2026-03-08
**成果物:** `src/app/dashboard/layout.tsx`, `src/components/layout/Sidebar.tsx`
**内容:** サイドバー付きメインレイアウト（折りたたみ・アニメーション対応）

### Task E: チャットUI - 完了
**完了日:** 2026-03-08
**成果物:** `src/components/chat/` (MessageList, MessageInput, MessageItem, ChannelHeader, index.ts)
**内容:** メッセージ一覧・入力欄・チャンネルヘッダーのUIコンポーネント

### Task F: タスクボードUI - 完了
**完了日:** 2026-03-08
**成果物:** `src/components/tasks/` (KanbanBoard, TaskCard, TaskDetailModal, TaskFilters), `src/app/dashboard/tasks/page.tsx`
**内容:** カンバンボード・タスクカード・詳細モーダル・フィルターUI

### Task G: 進捗ダッシュボードUI - 完了
**完了日:** 2026-03-08
**成果物:** `src/components/dashboard/` (ProgressCircle, ProgressBar, StatCard, MemberProgress, CalendarView, index.ts), `src/app/dashboard/progress/page.tsx`
**内容:** 進捗グラフ・統計カード・メンバー別進捗・カレンダービュー

### Task H: チャット機能 Supabase接続 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/chat.ts`, `src/components/layout/ChannelList.tsx`, `src/app/dashboard/chat/[channelId]/page.tsx`
**内容:**
- `src/lib/chat.ts`: チャンネルCRUD、メッセージ送受信、スレッド返信、ファイル添付、既読管理、Realtime購読
- `src/components/layout/ChannelList.tsx`: サイドバーにチャンネル一覧を統合（作成フォーム付き）
- `src/app/dashboard/chat/[channelId]/page.tsx`: チャンネル別チャットページ（リアルタイムメッセージ、メッセージ送信）
**備考:** Sidebar.tsx に ChannelList を組み込み済み

### Task J: 通知機能 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/notifications.ts`, `src/components/notifications/NotificationBell.tsx`, `src/components/notifications/NotificationList.tsx`, `src/components/notifications/index.ts`
**内容:**
- `src/lib/notifications.ts`: 通知取得・未読件数・既読更新・全既読・Realtime購読・相対時刻フォーマット
- `src/components/notifications/NotificationBell.tsx`: 通知ベルアイコン（未読バッジ、ドロップダウン、リアルタイム受信）
- `src/components/notifications/NotificationList.tsx`: 通知一覧ドロップダウン
**備考:** ダッシュボードレイアウトへの統合が未完了（次のメインタスク）

### Task I: タスク機能 Supabase接続 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/tasks.ts`, `src/app/dashboard/tasks/page.tsx`（更新）
**内容:**
- `src/lib/tasks.ts`: タスクCRUD（create/update/delete）、ステータス変更、サブタスク操作、ラベル管理、タスクコメント、プロジェクト一覧、メンバー一覧、Realtime購読
- `src/app/dashboard/tasks/page.tsx`: モックデータ削除→Supabase実データ取得、楽観的UI更新、Realtimeリスナー、ローディング/エラー状態、タスク追加ボタン
**備考:** fetchTasksでassignee・labels・subtasksをjoin取得。ドラッグ&ドロップ時はoptimistic updateで即座にUI反映し、失敗時にリバート

### Task M: メッセージ検索 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/search.ts`, `src/components/chat/SearchBar.tsx`, `src/components/chat/SearchResults.tsx`, `src/components/chat/index.ts`（更新）
**内容:**
- `src/lib/search.ts`: メッセージキーワード検索（ilike部分一致、チャンネル名・送信者joinあり）
- `src/components/chat/SearchBar.tsx`: 検索入力UI（300msデバウンス、Escクリア）
- `src/components/chat/SearchResults.tsx`: 検索結果リスト（キーワードハイライト、チャンネルリンク、framer-motionアニメーション）
**備考:** サブエージェントのツール権限不足によりメインエージェントが実施

### Task L: 招待機能 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/invitations.ts`, `src/app/dashboard/settings/invite/page.tsx`, `src/app/auth/invite/[token]/page.tsx`
**内容:**
- `src/lib/invitations.ts`: 招待CRUD（作成・一覧・検証・受諾・削除）、トークン生成（crypto.randomUUID）、7日有効期限
- `src/app/dashboard/settings/invite/page.tsx`: 招待管理ページ（メール入力、送信済み一覧、リンクコピー、削除）
- `src/app/auth/invite/[token]/page.tsx`: 招待受諾ページ（トークン検証、新規登録フォーム、自動受諾）
**備考:** サブエージェントのツール権限不足によりメインエージェントが実施

### Task K: 進捗ダッシュボード Supabase接続 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/dashboard.ts`（新規）, `src/app/dashboard/progress/page.tsx`（更新）
**内容:**
- `src/lib/dashboard.ts`: タスク統計サマリー、メンバー別進捗集計、プロジェクト別進捗率、カレンダー用タスク取得
- `src/app/dashboard/progress/page.tsx`: モックデータ→Supabase実データ、Promise.all並行取得、ローディング/エラー状態
**備考:** サブエージェントのツール権限不足によりメインエージェントが実施

### Task O: メンション機能 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/mentions.ts`, `src/components/chat/MentionSuggest.tsx`, `src/components/chat/MessageInput.tsx`（更新）, `src/components/chat/MessageItem.tsx`（更新）, `src/components/chat/index.ts`（更新）
**内容:**
- `src/lib/mentions.ts`: メンション解析（parseMentions）、通知送信（sendMentionNotifications）、メッセージセグメント分割（parseMessageSegments）
- `src/components/chat/MentionSuggest.tsx`: @入力時のメンバー候補ドロップダウン（フィルタリング、キーボード操作、Avatar付き）
- `src/components/chat/MessageInput.tsx` 更新: @検知、ArrowUp/Down/Enter/Tab/Esc操作、members prop、MentionSuggest統合
- `src/components/chat/MessageItem.tsx` 更新: memberNames prop、メンションをアクセントカラーでハイライト
**備考:** 送信側でparseMentions→sendMentionNotificationsで通知INSERT。表示側はparseMessageSegmentsでハイライト

### Task P: リアクション機能 - 完了
**完了日:** 2026-03-08
**成果物:**
- `src/lib/reactions.ts`（新規）- リアクショントグル・取得・一括取得・グループ化
- `src/components/chat/ReactionBar.tsx`（新規）- リアクション表示バー（絵文字+カウント、自分のハイライト）
- `src/components/chat/ReactionPicker.tsx`（新規）- 絵文字選択ポップオーバー（👍❤️😂🎉👀🙏🔥✅）
- `src/components/chat/MessageItem.tsx`（更新）- ReactionBar統合、ホバー時追加ボタン、楽観的UI更新
- `src/components/chat/MessageList.tsx`（更新）- `currentUserId` prop追加
- `src/app/dashboard/chat/[channelId]/page.tsx`（更新）- `currentUserId` 伝播
- `src/app/dashboard/dm/[conversationId]/page.tsx`（更新）- `currentUserId` 伝播
**備考:** MessageWithAuthor に reactions フィールド追加。楽観的UI更新でトグル即座反映、エラー時リバート。

### Task N: 未読管理・バッジ表示 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/unread.ts`（新規）, `src/components/layout/ChannelList.tsx`（更新）, `src/components/layout/DmList.tsx`（更新）
**内容:**
- `src/lib/unread.ts`: チャンネル別・DM別の未読数取得（last_read_at と messages.created_at を比較）、Realtime購読
- `src/components/layout/ChannelList.tsx`: 未読バッジ表示（bg-accent 丸バッジ、99+対応、開いているチャンネルは自動クリア）
- `src/components/layout/DmList.tsx`: 同様の未読バッジ表示
**備考:** MessageItemにcurrentUserIdが必須propとして既に追加されていたため、MessageList経由の受け渡しも確認・修正済み

### Task T: デプロイ準備 - 完了
**完了日:** 2026-03-08
**成果物:** `.env.example`（新規）, `next.config.ts`（更新）
**内容:**
- `next.config.ts`: `images.remotePatterns` で `*.supabase.co/storage/v1/object/**` を許可
- `.env.example`: 環境変数テンプレート（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）
- `.gitignore` に `.env*` が含まれていることを確認済み（`.env.local` はコミットされない）
- `.env.local.example` が既に存在していたことを確認
- `npm run build` 成功（全12ルート、TypeScriptエラー・ビルドエラーなし）
**備考:** Next.js 16.1.6 Turbopack使用。middlewareの非推奨警告あり（proxy移行は別途検討）

### Task S: チャンネル内ファイル一覧 - 完了
**完了日:** 2026-03-08
**成果物:** `src/lib/files.ts`（新規）, `src/components/chat/FileListPanel.tsx`（新規）, `src/app/dashboard/chat/[channelId]/page.tsx`（更新）
**内容:**
- `src/lib/files.ts`: チャンネル/DM内の添付ファイル一覧取得（message_attachments → messages → profiles join）、signed URL取得、ファイルサイズフォーマット、カテゴリ分類
- `src/components/chat/FileListPanel.tsx`: 右パネルのファイル一覧（画像サムネイル・動画プレビュー・ファイル情報・送信者表示）、カテゴリフィルタ（全て/画像/動画/ドキュメント/その他）
- `src/app/dashboard/chat/[channelId]/page.tsx`: ChannelHeader の onFilesClick でパネル開閉、AnimatePresence でスライドイン
**備考:** DM用の getDmFiles も実装済み（DmPage への統合は必要に応じて実施）
