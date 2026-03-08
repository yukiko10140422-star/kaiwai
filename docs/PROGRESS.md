# KAIWAI - 進捗ログ

## 現在のフェーズ
Phase 5: ポリッシュ（継続中）

## 全体進捗

### Phase 1: 基盤構築 ✓
- [x] 要件定義書作成 (REQUIREMENTS.md)
- [x] プロジェクト概要ドキュメント (docs/PROJECT.md)
- [x] 機能要件ドキュメント (docs/FEATURES.md)
- [x] デザインガイドライン (docs/DESIGN.md)
- [x] CLAUDE.md 作成
- [x] Next.js プロジェクトセットアップ
- [x] Supabase クライアント設定 (client/server/middleware)
- [x] グローバルCSS（デザインシステムのカラーパレット適用）
- [x] 認証ページ（ログイン/新規登録/コールバック）
- [x] ダッシュボードレイアウト（サイドバー付き）
- [x] .env.local に Supabase anon key 設定済み
- [x] DB スキーマ設計 (docs/schema.sql)
- [x] Supabase にスキーマ適用（全19テーブル作成完了）
- [x] Storage バケット作成（avatars: public, attachments: private）
- [x] Storage RLS ポリシー設定
- [x] TypeScript 型定義 (src/types/database.ts)
- [x] プロフィール設定ページ
- [x] 認証フロー通しテスト（サインアップ→プロフィール自動作成→サインイン→サインアウト）
- [x] 共通UIコンポーネント (src/components/ui/)
- [x] チャットUIコンポーネント (src/components/chat/)
- [x] タスクボードUIコンポーネント (src/components/tasks/)
- [x] 進捗ダッシュボードUIコンポーネント (src/components/dashboard/)
- [x] タスク機能 Supabase接続 (src/lib/tasks.ts)

### Phase 2: チャット機能 ✓
- [x] チャット機能 Supabase接続（チャンネルCRUD、リアルタイムメッセージ）
- [x] 通知機能（NotificationBell、NotificationList、Realtime購読）
- [x] 通知ベルのダッシュボードレイアウト統合
- [x] ダイレクトメッセージ
- [x] ファイル共有
- [x] メッセージ検索
- [x] メンション機能（@候補表示、メンションハイライト、通知送信）
- [x] 未読管理・バッジ表示（チャンネル・DM未読数、Realtime更新）
- [x] チャンネル内ファイル一覧（右パネル、カテゴリフィルタ、signed URL）
- [x] リアクション機能（絵文字トグル、ピッカー、楽観的UI更新）
- [x] スレッド返信UI（右パネル、Realtime購読）

### Phase 3: タスク・ダッシュボード ✓
- [x] タスク機能 Supabase接続（CRUD、Realtime、楽観的UI更新）
- [x] 進捗ダッシュボード Supabase接続
- [x] タスク編集機能（詳細モーダルから全フィールド編集可能）
- [x] タスクに時間指定・場所フィールド追加（DB: due_time, location カラム）
- [x] 場所入力時の Google Maps プレビュー連携

### Phase 4: チャット拡張 ✓
- [x] メッセージ取り消し（削除）機能
- [x] メッセージ編集機能
- [x] LINE風コンテキストメニュー（長押し/右クリック）
- [x] YouTubeリンクプレビュー
- [x] チャットLINE風レイアウト（自分=右、相手=左）

### Phase 5: ポリッシュ（継続中）
- [x] 招待機能
- [x] デプロイ準備（next.config.ts画像ドメイン設定、.env.example、ビルド成功確認）
- [x] 設定ページ整備（テーマ切替、招待リンク、パスワード変更）
- [x] iOS PWA スタンドアロンモード修正
- [x] パフォーマンス最適化（framer-motion 除去、バンドルサイズ削減）
- [x] 議事録ファイル添付機能
- [x] アップデート通知（WhatsNewModal）
- [x] 使い方ガイド（設定画面内）

## セッションログ

### 2026-03-08 セッション1
**実施内容:**
- REQUIREMENTS.md および docs/ 配下のドキュメントを確認
- CLAUDE.md を作成
- Supabase MCP サーバーの設定修正（パッケージ名修正）
- 進捗ログ作成

### 2026-03-08 セッション2
**実施内容:**
- Next.js プロジェクトセットアップ
- Supabase クライアント設定・認証ページ・ダッシュボード作成
- DB スキーマ設計・TypeScript型定義・プロフィール設定ページ

**エラー:** create-next-app 競合 → /tmp 経由で解決、node_modules タイムアウト → npm install で解決

### 2026-03-08 セッション3
**実施内容:**
- Supabase にスキーマ適用（pg クライアント経由で全19テーブル作成）
- Storage バケット作成（avatars: public, attachments: private）+ RLS ポリシー設定
- 認証フロー通しテスト（Admin API でユーザー作成→サインイン→プロフィール読み取り→サインアウト、全て成功）
- PARALLEL_TASKS.md ワークフロールール整備
- プロジェクト名を KAIWAI に変更

**エラー・問題点:**
- Supabase MCP 未接続 → pg クライアント（npm pg）で直接DB接続して解決
- handle_new_user トリガーが初回エラー → search_path を明示 + EXCEPTION ハンドリング追加で解決
- Management API の認証失敗 → service_role key + Admin API で解決

### 2026-03-08 セッション4
**実施内容:**
- Task H/J の完了確認（サブエージェント作成済みファイル確認）
- 通知ベルをダッシュボードレイアウトに統合（DashboardHeader.tsx 新規作成）
- Task M: メッセージ検索機能（search.ts, SearchBar.tsx, SearchResults.tsx）
- Task K: 進捗ダッシュボード Supabase接続（dashboard.ts, progress/page.tsx 更新）
- DM機能実装（dm.ts, DmList.tsx, dm/[conversationId]/page.tsx）
- Avatar コンポーネントに xs サイズ追加
- サイドバーに DmList 統合
- PARALLEL_TASKS.md 全面更新（Task H/J/K/M を完了に移動）

**エラー:**
- サブエージェント（Task K/M）がWrite/Bashツール権限不足で完了できず → メインエージェントが直接実施
- dashboard.ts の Supabase join 結果の型キャスト問題 → `unknown` 経由で解決

- ファイル共有機能: AttachmentPreview にsigned URL対応、DMファイル送信対応
- Task L: 招待機能（invitations.ts、招待管理ページ、招待受諾ページ）

**次回やること:**
- ブラウザでの動作確認（チャット、DM、通知、ダッシュボード、招待）
- サイドバーに招待ページへのリンク追加検討
- アニメーション・UIポリッシュ（Phase 5）

### 2026-03-08 セッション5（サブエージェント）
**実施内容:**
- Task C: TypeScript型定義 更新 - Profile に email/status追加、nullable修正、ActivityAction型追加、Label に project_id追加、TaskLabelAssignment・ChannelReadStatus追加、Database型（supabase gen types互換）追加
- Task G: 進捗ダッシュボードUI - ProgressCircle（SVG円グラフ）、ProgressBar（グラデーション進捗バー）、StatCard（統計サマリーカード）、CalendarView（月カレンダー）、MemberProgress（メンバー別進捗）、進捗ダッシュボードページ作成
- Task J: 通知機能 - notifications.ts（取得・既読・Realtime購読・相対時刻）、NotificationBell（ベルアイコン+未読バッジ+ドロップダウン）、NotificationList（通知一覧パネル）
- Task P: リアクション機能 - reactions.ts（トグル・取得・一括取得・グループ化）、ReactionBar（表示バー）、ReactionPicker（絵文字選択ポップオーバー）、MessageItem/MessageList更新（currentUserId伝播、楽観的UI更新）

**エラー・問題点:**
- database.ts が別プロセスで同時作成されており Write 競合 → Read後に Edit で解決
- MessageItem への currentUserId 追加に伴い、チャンネル/DMページの MessageList 呼び出し箇所も更新が必要だった
- Linter が自動的にメンション機能（parseMessageSegments、MentionSuggest）を MessageItem に統合していた

**次回やること:**
- ブラウザでの動作確認
- 残タスクの確認（PARALLEL_TASKS.md の「現在振れるタスク」参照）

### 2026-03-08 セッション6（サブエージェント2）
**実施内容:**
- Task A: DB スキーマ設計（docs/schema.sql - 全19テーブル、ENUM型、RLSポリシー、インデックス、トリガー）
- Task D: ダッシュボードレイアウト（Sidebar.tsx - Framer Motionアニメーション、モバイルナビ、layout.tsx - 認証チェック）
- Task F: タスクボードUI（KanbanBoard.tsx - HTML5 D&D、TaskCard.tsx、TaskDetailModal.tsx、TaskFilters.tsx）
- Task H: チャット機能 Supabase接続（chat.ts - チャンネルCRUD、Realtimeメッセージ送受信、ChannelList.tsx）
- コードレビュー実施 → docs/CODE_REVIEW.md（19件の問題を4段階で分類）
- Task N: 未読管理・バッジ表示（unread.ts - チャンネル/DM未読カウント、Realtime購読、ChannelList/DmList にバッジ統合）
- Task S: チャンネル内ファイル一覧（files.ts - signed URL取得、FileListPanel.tsx - カテゴリフィルタ、右パネルUI）

**エラー・問題点:**
- MessageItem に currentUserId が必須propとして追加されていたが、MessageList からの受け渡しが欠落 → MessageList/ChannelPage/DmPage を修正
- メインエージェントとの並行作業でファイル競合多発（Sidebar.tsx、PARALLEL_TASKS.md、PROGRESS.md）→ 都度 Read して最新状態を確認してから Edit
- dev server が既にポート3000で起動中のため npm run dev が失敗

**次回やること:**
- CODE_REVIEW.md の Critical 問題の修正（型定義とDBスキーマの不整合、設定ページ未実装）
- Task R: 設定ページ整備（テーマ切替、パスワード変更）
- ブラウザでの統合動作確認

### 2026-03-08 セッション7
**実施内容: モバイル・iOS対応**

**モバイル表示修正:**
- `FileListPanel` の width アニメーション修正（340px固定 → スライドイン方式、モバイルで全画面表示）
- `MessageItem` リアクションボタンをモバイルで常時表示（`group-hover` → 常時表示 + sm:group-hover）
- `MessageInput` ファイル削除ボタンをモバイルで常時表示・タップターゲット拡大
- `TaskDetailModal` メタグリッドを `grid-cols-1 sm:grid-cols-3` に変更
- `ProfilePage` の `min-h-screen` → `min-h-full` に修正（ダッシュボードレイアウトとの衝突解消）

**iOS PWA対応:**
- `viewport` を Next.js `Viewport` エクスポートに統一（`maximumScale: 1, userScalable: false, viewportFit: cover`）
- 手動 `<meta>` タグの重複を解消（metadata API に統一）
- `apple-touch-icon` 追加、ダーク/ライト別 `themeColor` 設定
- `safe-bottom/safe-top` CSS ユーティリティクラス追加
- `body` に `padding-top: env(safe-area-inset-top)` でステータスバー対応
- `overscroll-behavior: none` でiOSバウンススクロール防止
- `fixed bottom-0` 要素に自動 safe-area padding

**iOS Safari ビューポート修正:**
- `h-screen` → `h-dvh` に変更（dashboard layout, Sidebar）
- `min-h-screen` → `min-h-dvh` に変更（login, signup）
- `html` に `height: 100dvh` 設定
- iOS Safari のアドレスバーによるはみ出し問題を解消

**入力ズーム防止:**
- グローバルCSS でモバイル時の input/textarea/select を `font-size: 16px` に強制
- viewport に `maximumScale: 1, userScalable: false` 設定

**InstallPrompt:**
- モバイルではボトムナブの上に表示（`bottom-20 md:bottom-4`）
- safe-bottom 対応

**ダッシュボードレイアウト:**
- main の `pb-16` → `pb-20` に拡大（ボトムナブ + safe area 考慮）

**変更ファイル一覧:**
- `src/app/layout.tsx` - Viewport エクスポート追加、メタタグ整理
- `src/app/globals.css` - iOS対応CSS追加（safe area, dvh, font-size, overscroll）
- `src/app/dashboard/layout.tsx` - `h-dvh`, `pb-20`
- `src/components/layout/Sidebar.tsx` - `h-dvh`
- `src/app/auth/login/page.tsx` - `min-h-dvh`
- `src/app/auth/signup/page.tsx` - `min-h-dvh`
- `src/components/chat/FileListPanel.tsx` - スライドインアニメーション
- `src/components/chat/MessageItem.tsx` - モバイルリアクションボタン
- `src/components/chat/MessageInput.tsx` - モバイルファイル削除ボタン
- `src/components/tasks/TaskDetailModal.tsx` - レスポンシブグリッド
- `src/app/dashboard/profile/page.tsx` - `min-h-full`
- `src/components/pwa/InstallPrompt.tsx` - モバイル位置調整

**エラー・問題点:**
- Next.js では `viewport` を `metadata` 内に書くと警告が出て無視される → 別の `export const viewport: Viewport` が必要
- iOS Safari で `100vh` はアドレスバーを含む固定値のため、表示領域からはみ出す → `100dvh` で解決
- メタタグの重複（metadata API + 手動 `<head>`）が iOS PWA 認識を阻害していた可能性

**次回やること:**
- Vercel にデプロイして iOS 実機でスタンドアロンモード確認
- Safari からホーム画面に再追加してアドレスバー非表示を検証
- 要件定義の再整理（ユーザーからの要望あり）

### 2026-03-08 セッション8
**実施内容: iOS PWA修正（検索バー消失・スタンドアロンモード）**

**問題:** iOSで検索バー（DashboardHeader）が消える＋PWAスタンドアロンモードが正常に動作しない

**原因分析（WMS v3との比較）:**
1. **body padding + h-dvh の衝突**: `body` に `padding-top: env(safe-area-inset-top)` を設定しつつ、ダッシュボードコンテナが `h-dvh`（100dvh）で高さ固定 → 合計が viewport を超過し `overflow-hidden` でコンテンツがクリップされる
2. **React インラインスタイルで `env()` は無効**: `style={{ paddingTop: 'env(safe-area-inset-top)' }}` は CSS 関数のため JS 経由では評価されない → CSS クラスを使う必要がある
3. **メタタグ重複**: Next.js metadata API の `appleWebApp.capable: true` と手動 `<meta name="apple-mobile-web-app-capable">` が両方存在 → iOS が混乱
4. **manifest.json の `start_url: "/dashboard"`**: 認証必須ページを指定 → PWA 起動時にリダイレクトが発生しスタンドアロンモードが壊れる
5. **Service Worker が認証ページをキャッシュ**: APP_SHELL に `/dashboard` を含めていたが、キャッシュ時にリダイレクトされ不正なレスポンスがキャッシュされる

**修正内容:**
- `globals.css`: body から `padding-top: env(safe-area-inset-top)` を削除
- `dashboard/layout.tsx`: コンテナに `safe-top` CSS クラスを追加（コンテナ内で safe area 処理）
- `DashboardHeader.tsx`: 検索ボタンをアイコンのみから入力欄風の横長バーに変更（モバイル視認性向上）、背景を `bg-sidebar/80`（半透明）→ `bg-sidebar`（不透明）に変更
- `layout.tsx`: 手動 `<meta name="apple-mobile-web-app-capable">` を削除（metadata API と重複）
- `manifest.json`: `start_url` を `/dashboard` → `/` に変更
- `sw.js`: APP_SHELL から認証必須ページを除外、キャッシュバージョンを v2 に更新

**変更ファイル一覧:**
- `src/app/globals.css`
- `src/app/dashboard/layout.tsx`
- `src/components/layout/DashboardHeader.tsx`
- `src/app/layout.tsx`
- `public/manifest.json`
- `public/sw.js`

**追加修正（セッション8 続き）:**
- `layout.tsx`: 手動 `<meta name="apple-mobile-web-app-capable" content="yes" />` を再追加（Next.js 16.1.6 のバグ: `appleWebApp.capable: true` が `mobile-web-app-capable` を生成し、iOS 必須の `apple-` プレフィックスが欠落）
- `layout.tsx`: Service Worker 登録スクリプトを削除（WMS は SW なしで動作しており、SW が iOS PWA を妨害していた）
- `layout.tsx`: InstallPrompt コンポーネントを削除（iOS は Safari のネイティブ「ホーム画面に追加」を使用）
- `middleware.ts`: matcher に `manifest.json` と `sw.js` の除外を追加（認証チェックがこれらの静的ファイルをブロックしていた）

**最終的な原因:**
- Next.js 16.1.6 が `apple-mobile-web-app-capable` メタタグを正しく生成しなかった（バグ）
- Safari 内のリンク経由で開くとブラウザモードになる（ホーム画面アイコンから直接起動が必須）

**教訓（再発防止）:**
- `h-dvh` + `overflow-hidden` レイアウトでは safe area padding をコンテナ「内部」で処理すること（body に付けると高さが viewport を超過する）
- React インラインスタイルでは CSS 関数（`env()`, `var()`）が動かない場合がある → CSS クラスを使う
- PWA の `start_url` は認証不要なページ（`/`）を指定し、ミドルウェアでリダイレクトさせる
- Service Worker の APP_SHELL に認証必須ページを入れない
- **Next.js 16 の `appleWebApp.capable` は iOS では動作しない** → 手動で `<meta name="apple-mobile-web-app-capable" content="yes" />` を追加する必要がある
- **PWA スタンドアロンモードはホーム画面アイコンから直接起動した場合のみ有効**。Safari 内のリンク経由では通常のブラウザモードになる
- ミドルウェアの matcher で `manifest.json` 等の PWA 静的ファイルを除外すること

**次回やること:**
- 要件定義の再整理（ユーザーからの要望あり）

### 2026-03-08 セッション9
**実施内容: 機能追加・UX改善**

**1. パフォーマンス最適化（セッション8の続き）:**
- framer-motion を30+コンポーネントから完全削除（バンドル -95KB）
- `next/dynamic` で重いモーダルを遅延読み込み
- `optimizePackageImports` で lucide-react をツリーシェイク
- モバイル CSS: backdrop-filter 軽減、animation/transition 短縮

**2. チャット LINE 風レイアウト:**
- 自分のメッセージ: 右寄せ・青背景・白文字
- 相手のメッセージ: 左寄せ・カード背景・アバター付き

**3. チャット機能拡張:**
- YouTube リンクのプレビュー表示（iframe 埋め込み）
- URL プレビューコンポーネント新規作成（UrlPreview.tsx, url-preview.ts）

**4. 議事録ファイル添付:**
- Supabase Storage（note-attachments バケット）を利用
- アップロード、一覧表示、ダウンロード、削除に対応

**5. タスク機能拡張:**
- DB に `due_time TIME` / `location TEXT` カラム追加
- タスク作成モーダルに時間・場所入力欄追加
- タスク詳細に Google Maps iframe 埋め込み + リンク
- LocationInput コンポーネント: 入力中に地図プレビューを自動表示（800ms デバウンス）

**6. メッセージ取り消し・編集:**
- `deleteMessage` / `editMessage` は既に lib/chat.ts に実装済みだったため、UI を追加
- 初期実装: `...` ボタン常時表示 → ユーザーフィードバックで **LINE 風長押しメニュー** に変更
- モバイル: 500ms 長押しでコンテキストメニュー表示
- PC: 右クリックでコンテキストメニュー表示
- メニュー内容: リアクション絵文字一覧 + スレッド返信 + 編集 + 取り消し
- 常時表示のニコちゃんボタン・`...` ボタンを全削除しすっきりした UI に
- Realtime UPDATE イベントも購読（他端末での編集がリアルタイム反映）

**7. タスク編集機能:**
- TaskDetailModal に編集モード追加（タイトル、説明、優先度、期限、時間、場所）
- KanbanBoard → TaskDetailModal → tasks/page.tsx の `onUpdate` コールバックチェーン
- `updateTask` 関数で Supabase に保存、一覧を再取得

**8. アップデート通知:**
- WhatsNewModal: ログイン時に最新アップデート情報をモーダル表示
- sessionStorage で同セッション中の再表示を抑制（毎ログイン時には表示）
- × ボタンなし、OK ボタンのみで閉じるクリーンな UI
- 過去のアップデート履歴も展開表示可能
- 非エンジニア向けの平易な日本語で記述

**9. 使い方ガイド:**
- 設定ページ内にアコーディオン形式の使い方ガイドを追加
- チャット、DM、タスク、議事録、通知、検索、スマホの使い方をカバー

**変更ファイル一覧（主要）:**
- `src/components/chat/MessageItem.tsx` - LINE 風長押しメニュー、編集モード
- `src/components/chat/MessageList.tsx` - onDelete/onEdit props パススルー
- `src/app/dashboard/chat/[channelId]/page.tsx` - メッセージ削除/編集ハンドラ、Realtime UPDATE
- `src/app/dashboard/dm/[conversationId]/page.tsx` - メッセージ削除/編集ハンドラ
- `src/lib/chat.ts` - subscribeToChannel に UPDATE イベント追加
- `src/components/tasks/TaskDetailModal.tsx` - 編集モード追加
- `src/components/tasks/TaskCreateModal.tsx` - LocationInput 統合
- `src/components/tasks/LocationInput.tsx` - 新規（Google Maps プレビュー付き入力）
- `src/components/tasks/KanbanBoard.tsx` - onUpdate prop パススルー
- `src/app/dashboard/tasks/page.tsx` - handleUpdateTask 追加
- `src/components/ui/WhatsNewModal.tsx` - 新規（アップデート通知モーダル）
- `src/components/settings/UsageGuide.tsx` - 新規（使い方ガイド）
- `src/app/dashboard/settings/page.tsx` - 使い方ガイド統合
- `src/app/dashboard/layout.tsx` - WhatsNewModal 統合

**次回やること:**
- ブラウザ/モバイル実機で長押しメニューの動作確認
- バッチ2の実装

### 2026-03-08 セッション10
**実施内容: バッチ1実装（3タスク並行）**

**Task U: タスク担当者変更UI:**
- TaskDetailModal 編集モードに担当者マルチセレクト追加
- TaskCreateModal と同じトグルボタンUI
- 保存時に `setTaskAssignees` でDB更新
- members prop: tasks/page.tsx → KanbanBoard → TaskDetailModal

**Task W: タスクコメントUI:**
- TaskDetailModal ビューモードにコメントセクション追加
- `fetchTaskComments` / `createTaskComment` API使用
- アバター、相対時刻表示、Ctrl+Enter送信対応
- 空状態メッセージ、最大高さスクロール

**Task X: ダークモード配色調整:**
- `--card`: `rgba(255,255,255,0.05)` → `0.08`（カード視認性向上）
- `--muted`: `#64748b` → `#94a3b8`（テキストコントラスト改善）
- `--border`: `#334155` → `#3b4a5e`（区切り線視認性向上）
- ダーク用 `.glass` box-shadow 追加
- コンテキストメニューのホバー色修正

**変更ファイル:**
- `src/components/tasks/TaskDetailModal.tsx` - 担当者選択 + コメントUI
- `src/components/tasks/KanbanBoard.tsx` - members prop パススルー
- `src/app/dashboard/tasks/page.tsx` - members を KanbanBoard に渡す
- `src/app/globals.css` - ダークモード変数調整
- `src/components/chat/MessageItem.tsx` - コンテキストメニューホバー修正

### 2026-03-08 セッション10（続き）
**実施内容: バッチ2実装（4タスク並行）**

**Task Y: タスク期限通知:**
- `task-due-check.ts`: 期限切れ/本日/明日のタスクを自動チェック
- `TaskDueChecker.tsx`: ダッシュボードロード時に1日1回チェック（sessionStorage管理）
- 担当者（assignee_id + task_assignees）のみに通知、重複防止

**Task Z: ピン留めメッセージ:**
- `pinMessage`/`unpinMessage`/`getPinnedMessages` をchat.tsに追加
- コンテキストメニューに「ピン留め」ボタン追加（全ユーザー操作可能）
- `PinnedMessages.tsx`: チャンネルヘッダーにピンアイコン → ドロップダウンで一覧表示
- ChannelHeader にピンボタン追加
- 注意: DB に `ALTER TABLE messages ADD COLUMN is_pinned BOOLEAN DEFAULT false;` が必要

**Task AA: メッセージ既読表示:**
- `getChannelReadStatuses`/`getDmReadStatuses` 関数追加
- MessageItem に `readCount` prop追加、自分のメッセージに「既読 N」表示
- チャンネル/DMページで10秒ごとに既読状態を更新

**Task AB: アクティビティログUI:**
- `activity.ts`: fetchActivityLogs, logActivity, getActionLabel
- `ActivityTimeline.tsx`: タイムライン表示（アバター、アクション、相対時刻）
- 進捗ダッシュボードに統合

**変更ファイル:**
- `src/lib/task-due-check.ts` - 新規
- `src/components/notifications/TaskDueChecker.tsx` - 新規
- `src/lib/chat.ts` - ピン留め関数追加
- `src/components/chat/PinnedMessages.tsx` - 新規
- `src/components/chat/ChannelHeader.tsx` - ピンボタン追加
- `src/components/chat/MessageItem.tsx` - ピン留め + 既読表示
- `src/components/chat/MessageList.tsx` - onPin + readStatuses props
- `src/app/dashboard/chat/[channelId]/page.tsx` - ピン + 既読統合
- `src/app/dashboard/dm/[conversationId]/page.tsx` - 既読統合
- `src/lib/dm.ts` - getDmReadStatuses追加
- `src/lib/activity.ts` - 新規
- `src/components/dashboard/ActivityTimeline.tsx` - 新規
- `src/app/dashboard/progress/page.tsx` - アクティビティ統合
- `src/types/database.ts` - is_pinned追加

**次回やること:**
- DB: `ALTER TABLE messages ADD COLUMN is_pinned BOOLEAN DEFAULT false;`
- バッチ3の実装
