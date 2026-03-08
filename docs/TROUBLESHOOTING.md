# KAIWAI - トラブルシューティング

デプロイ・開発時に発生した問題と解決策の記録。再発防止のためのリファレンス。

---

## 1. Vercel デプロイ時に Supabase クライアントエラー (500)

**症状:**
```
Error: Your project's URL and Key are required to create a Supabase client!
```

**原因:** Vercel に環境変数が設定されていない

**解決策:**
Vercel ダッシュボード → Settings → Environment Variables に以下を追加:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

設定後に Redeploy が必要。

**予防策:** デプロイ前に `.env.example` と Vercel の環境変数を照合確認する。

---

## 2. Signup 時に 401 エラー

**症状:**
```
czjdhvtbejywzhprwlbn.supabase.co/auth/v1/signup → 401
```

**原因:** Supabase の anon key が不一致（legacy key を使用していた）

**解決策:**
- Supabase ダッシュボード → Settings → API → **anon public**（legacy ではない方）のキーを使用
- `.env.local` と Vercel 環境変数の両方を更新

**予防策:** anon key は必ず「anon public」を使う。「anon key (legacy)」は使わない。

---

## 3. ログイン時に「Email not confirmed」(400)

**症状:**
```
czjdhvtbejywzhprwlbn.supabase.co/auth/v1/token?grant_type=password → 400
Email not confirmed
```

**原因:** Supabase Auth の確認メールが正しくリダイレクトされない

**解決策:**
1. Supabase ダッシュボード → Authentication → URL Configuration:
   - **Site URL**: デプロイ先の URL（例: `https://kaiwai-ten.vercel.app`）
   - **Redirect URLs**: `/auth/callback` のパスを含める
2. 開発中は Authentication → Providers → Email → 「Confirm email」をオフにすると楽

**予防策:** デプロイ先ドメインが変わったら Site URL と Redirect URLs も更新する。

---

## 4. RLS ポリシーの自己参照による 500 エラー

**症状:**
```
/rest/v1/channels?select=* → 500
/rest/v1/channel_members?select=... → 500
/rest/v1/dm_participants?select=... → 500
```
全テーブルへのクエリが 500 を返す。

**原因:** `channel_members` と `dm_participants` の SELECT ポリシーが自分自身のテーブルを参照し、無限再帰が発生。

```sql
-- 問題のあるポリシー（自己参照で無限ループ）
CREATE POLICY "channel_members_select" ON channel_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid())
  );
```

**解決策:**
```sql
-- 修正: 認証済みユーザーは全メンバー情報を閲覧可能にする
-- (チャンネル/DM自体の RLS で保護されているため安全)
DROP POLICY IF EXISTS "channel_members_select" ON channel_members;
CREATE POLICY "channel_members_select" ON channel_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "dm_participants_select" ON dm_participants;
CREATE POLICY "dm_participants_select" ON dm_participants FOR SELECT
  TO authenticated USING (true);
```

**注意:** `user_id = auth.uid()` だけにすると他メンバーの情報が見えなくなり、
メンバー一覧やメッセージの著者表示が壊れる。中間テーブルは `true` にして、
親テーブル（channels, dm_conversations）の RLS で保護するのが正しいパターン。

**予防策:**
- RLS ポリシーで同じテーブルを参照する SELECT を絶対に書かない（無限再帰になる）
- 中間テーブル（members, participants 等）は `true` にし、親テーブルの RLS で保護する
- 他テーブルの RLS を経由する参照も間接的に再帰する可能性があるため注意

---

---

## 5. upsert 時に UPDATE ポリシーが無くて 403 エラー

**症状:**
```
/rest/v1/channel_members → 403
```
`joinChannel` の `upsert` 実行時に発生。

**原因:** `upsert` は INSERT + UPDATE の両方の権限が必要だが、`channel_members` に UPDATE ポリシーがなかった。

**解決策:**
```sql
CREATE POLICY "channel_members_update" ON channel_members FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**予防策:** `upsert` を使うテーブルには必ず INSERT と UPDATE の両方の RLS ポリシーを設定する。

---

---

## 6. メッセージ送信後に画面に反映されない

**症状:** メッセージは DB に保存されるが、画面にリアルタイム表示されない。リロードすると表示される。

**原因:** Supabase Realtime の publication にテーブルが登録されていなかった。

**解決策:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

**予防策:** schema.sql に `REPLICA IDENTITY FULL` を書いただけでは Realtime は有効にならない。
`supabase_realtime` publication にテーブルを追加する必要がある。

---

## RLS ポリシー設計ガイドライン

以下のパターンは **禁止**:
```sql
-- NG: 自己参照（無限再帰）
CREATE POLICY "x_select" ON table_a FOR SELECT
  USING (EXISTS (SELECT 1 FROM table_a WHERE ...));
```

---

## 7. iOS で検索バー（ヘッダー）が消える

**症状:** iOS Safari / PWA スタンドアロンモードで DashboardHeader（検索ボタン＋通知ベル）が表示されない

**原因:**
- `body` に `padding-top: env(safe-area-inset-top)` を設定 + ダッシュボードコンテナが `h-dvh`（100dvh）
- 合計高さ = safe-area-inset-top + 100dvh > ビューポート → `overflow-hidden` でヘッダーがクリップ

**解決策:**
- body から `padding-top` を削除
- ダッシュボードコンテナに `safe-top` CSS クラスを追加（コンテナ内部で safe area を処理）

**予防策:** `h-dvh` + `overflow-hidden` レイアウトでは safe area padding を必ずコンテナ「内部」で処理する。body に付けると高さがビューポートを超過する。

---

## 8. React インラインスタイルで `env()` が効かない

**症状:** `style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}` が適用されない

**原因:** CSS 関数 `env()` は React の JS インラインスタイルでは評価されない場合がある

**解決策:** CSS クラスを使う（例: `.safe-top { padding-top: env(safe-area-inset-top, 0px); }`）

**予防策:** `env()`, `var()` 等の CSS 関数はインラインスタイルではなく CSS クラスで定義する。

---

## 9. PWA スタンドアロンモードが動作しない（iOS）

**症状:** Safari の「ホーム画面に追加」でインストールしてもブラウザモードで開かれる

**原因（複合的）:**
1. **Next.js 16 のバグ**: `appleWebApp.capable: true` が `apple-mobile-web-app-capable` ではなく `mobile-web-app-capable` を生成する（`apple-` プレフィックスが欠落）。iOS Safari はこのタグを認識しない
2. `manifest.json` の `start_url` が認証必須ページ（`/dashboard`）→ リダイレクトでスタンドアロンが壊れる
3. Service Worker が iOS PWA を妨害する可能性（WMS は SW なしで動作）
4. ミドルウェアが `manifest.json` への GET リクエストにマッチし、認証チェックを実行していた

**解決策:**
1. 手動で `<meta name="apple-mobile-web-app-capable" content="yes" />` を `<head>` に追加（Next.js バグのワークアラウンド）
2. `start_url` を `/` に変更
3. Service Worker の登録スクリプトを削除（WMS と同じ構成に）
4. ミドルウェアの matcher に `manifest.json` と `sw.js` の除外を追加

**予防策:**
- Next.js metadata API の `appleWebApp.capable` は iOS では動作しない（v16.1.6 時点）→ 手動メタタグが必要
- PWA の `start_url` は認証不要なページを指定する
- Service Worker は iOS PWA では不要な場合が多い。問題切り分けのため SW なしで先に動作確認する
- ミドルウェアの matcher で静的ファイル（manifest.json, sw.js 等）を除外する
- 修正後は iOS で「ホーム画面に追加」を再実行する必要がある（既存ショートカットは更新されない）
- **重要**: PWA スタンドアロンモードはホーム画面アイコンから直接起動した場合のみ有効。Safari 内のリンク経由で開くとブラウザモードになる

---

安全なパターン:
```sql
-- OK: 直接的な条件
CREATE POLICY "x_select" ON table_a FOR SELECT
  USING (user_id = auth.uid());

-- OK: 他テーブル参照（ただしそのテーブルの RLS が自己参照でないこと）
CREATE POLICY "x_select" ON table_a FOR SELECT
  USING (EXISTS (SELECT 1 FROM table_b WHERE ...));
```
