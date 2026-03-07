# コードレビュー結果

レビュー実施日: 2026-03-08
対象: src/ 配下の全ソースコード

---

## Critical (即修正が必要)

### 1. 型定義とDBスキーマの不一致

**ファイル:** `src/types/database.ts`

| 問題 | 行 | 詳細 |
|------|-----|------|
| `Profile.email` が DB に存在しない | 16 | schema.sql の profiles テーブルに email カラムがない。email は auth.users から取得する必要がある |
| `Profile.status` が DB に存在しない | 20 | UserStatus 型も含め、DB側に対応カラムなし |
| `Label.project_id` が DB に存在しない | 119 | schema.sql の labels テーブルに project_id カラムがない |
| `task_label_assignments` テーブル名が不正 | 255 | schema.sql では `task_labels` だが、型定義では `task_label_assignments` |
| `dm_read_status` が Database 型に未定義 | - | schema.sql にテーブル定義あるが、TypeScript型が欠落 |

### 2. /dashboard/settings ページが存在しない

**ファイル:** `src/components/layout/Sidebar.tsx` (行24)

サイドバーの「設定」リンク先 `/dashboard/settings` に対応するページがない。ユーザープロフィール欄からも同じリンクに飛ぶ。404になる。

### 3. プロフィールページでメールアドレスの代わりにUUIDを表示

**ファイル:** `src/app/dashboard/profile/page.tsx` (行178)

`{profile?.id}` を「メールアドレス」として表示している。Profile型にemailフィールドがないことが原因。auth.users から email を取得して表示する必要がある。

---

## High (早期修正推奨)

### 4. Supabaseクライアントのインスタンス化パターンが不統一

| ファイル | パターン |
|---------|---------|
| `src/lib/chat.ts` (行6) | モジュールレベルで1回生成（グローバル） |
| `src/lib/tasks.ts` | 関数内で毎回生成 |

`chat.ts` はモジュールトップで `createClient()` を呼んでいる。複数タブやセッション更新時に問題が起きる可能性あり。関数内で生成するパターンに統一すべき。

### 5. chat.ts の updateReadStatus でエラーハンドリング欠如

**ファイル:** `src/lib/chat.ts` (行273-283)

`upsert` の結果を確認しておらず、エラーが黙殺される。

### 6. notifications.ts でユーザーIDフィルタが欠如

**ファイル:** `src/lib/notifications.ts`

| 関数 | 行 | 問題 |
|------|-----|------|
| `fetchNotifications` | 7-16 | `.eq("user_id", ...)` なし。RLS頼み |
| `fetchUnreadCount` | 22-30 | 同上 |
| `markAllAsRead` | 49-56 | 全ユーザーの通知を更新してしまう可能性（RLSで防がれるが明示的でない） |

### 7. TaskCard.tsx の unsafe な型キャスト

**ファイル:** `src/components/tasks/TaskCard.tsx` (行50-51)

```tsx
const ev = e as unknown as React.DragEvent;
```

Framer Motion の `onDragStart` イベントと HTML5 Drag API の型が合わない。`draggable` 属性は付けているが、`onDragStart` は Framer Motion のハンドラなので `dataTransfer` が存在しない場合がある。

### 8. sign-out-button.tsx が未使用

**ファイル:** `src/app/dashboard/sign-out-button.tsx`

以前 dashboard/page.tsx で使用されていたが、レイアウト変更後に参照がなくなった。サイドバーにサインアウト機能がないため、ユーザーがログアウトできない状態。

---

## Medium (品質改善)

### 9. MessageInput.tsx で配列インデックスを React key に使用

**ファイル:** `src/components/chat/MessageInput.tsx` (行115)

ファイルプレビューリストで `key={i}` を使用。ファイル削除時に不正な再レンダリングが起きる。

### 10. MessageInput.tsx のドラッグオーバーレイが正しく位置しない

**ファイル:** `src/components/chat/MessageInput.tsx` (行194)

`absolute inset-0` でオーバーレイを表示しているが、親要素に `relative` が設定されていない。

### 11. TaskDetailModal.tsx のグリッドレイアウト

**ファイル:** `src/components/tasks/TaskDetailModal.tsx` (行71)

`grid-cols-2` に3項目（優先度・期限・担当者）を配置。担当者が半幅で次行に折り返す。`col-span-2` を付けるか `grid-cols-3` にすべき。

### 12. TaskCard.tsx で !important を使用

**ファイル:** `src/components/tasks/TaskCard.tsx` (行118)

```tsx
className="!w-6 !h-6"
```

Avatar の size prop で対応するか、カスタムサイズを追加すべき。

### 13. ChannelPage でサーバーサイドフェッチすべきデータをクライアントで取得

**ファイル:** `src/app/dashboard/chat/[channelId]/page.tsx`

初期データ（チャンネル情報・メンバー・メッセージ）をすべてクライアントサイドで取得している。Server Component で初期データを取得し、Client Component に渡すパターンの方が表示速度が向上する。

### 14. ダッシュボードレイアウトにローディングUIがない

**ファイル:** `src/app/dashboard/layout.tsx`

async で認証チェックしている間、ユーザーには白い画面が表示される。`loading.tsx` を追加すべき。

### 15. Sidebar の MobileOverlay が no-op

**ファイル:** `src/components/layout/Sidebar.tsx` (行153-162)

`MobileOverlay` コンポーネントが `return null` のみ。呼び出し側も含めて削除すべき。

---

## Low (改善検討)

### 16. ハードコードされた日本語テキスト

複数ファイルにわたって日本語文字列がハードコードされている。将来の多言語対応を見据え、定数ファイルまたはi18nライブラリへの移行を検討。

### 17. chat.ts / tasks.ts の型キャスト

`as unknown as Message` や `as unknown as TaskCardData` のような二重キャスト。Supabase の join レスポンス用にきちんとした型定義を用意すべき。

### 18. ダッシュボードページに metadata がない

`src/app/dashboard/` 配下の各ページに `export const metadata` がない。SEOには影響しないが（認証後ページのため）、ブラウザタブのタイトルが改善される。

### 19. SVG 内での CSS 変数使用

**ファイル:** `src/components/dashboard/ProgressCircle.tsx` (行38, 47)

`stroke="var(--border)"` のような CSS 変数を SVG 属性に直接使用。一部ブラウザでレンダリングされない可能性あり。

---

## 修正優先順位まとめ

| 優先度 | 件数 | 主な対応 |
|--------|------|---------|
| Critical | 3件 | 型定義修正、settings ページ作成、プロフィールページ修正 |
| High | 5件 | Supabase クライアント統一、エラーハンドリング追加、サインアウト復活 |
| Medium | 7件 | UI/UX 修正、loading.tsx 追加、サーバーサイドフェッチ化 |
| Low | 4件 | i18n 準備、型安全性向上、metadata 追加 |
