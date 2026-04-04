# Prompt Graph

Prompt Graph は、ローカル LLM ワークフローをグラフとして構築するためのデスクトップアプリです。  
UI には Electron + React + React Flow、プロジェクト保存には SQLite、生成実行にはローカルの `llama.cpp` OpenAI 互換サーバーを使っています。

## 現在の機能

- プロジェクト一覧と手動保存
- `text` / `context` / `instruction` ノードによるグラフ編集
- 左右サイドバーのリサイズ
- 上流ノードをたどるコンテキスト収集
- ローカル `llama.cpp` を使ったストリーミング生成
- SQLite によるプロジェクト永続化
- JSON による UI 設定の保存

## 動作要件

- Windows
- Node.js 24.x
- npm 11.x
- `models/` 配下に配置した GGUF モデル
- `bin/llama-server/` 配下に配置した `llama.cpp` サーバーファイル

## ローカルモデルの配置

このプロジェクトでは、以下のランタイム資産はリポジトリに含めず、ローカルに配置する前提です。

- `models/`
  - 例: `models/Qwen3.5-27B-GGUF/Qwen3.5-27B-Q6_K.gguf`
- `bin/llama-server/llama-b8648-bin-win-cuda-13.1-x64/`
  - `llama-server.exe` と関連 DLL を含めてください

アプリ起動後、`models/` 配下の GGUF ファイルを自動スキャンし、ヘッダーのモデルセレクターから選択できます。

## インストール

```powershell
npm install
npm run rebuild:electron
```

## 起動

推奨:

```powershell
.\start.bat
```

手動で開発起動する場合:

```powershell
npm run rebuild:electron
npm run dev
```

本番ビルド:

```powershell
npm run build
```

## 使い方

1. アプリを起動します。
2. キャンバスのコンテキストメニューからノードを追加します。
3. 上流ノードを、対象となる `text` ノードへ接続します。
4. 対象の `text` ノードを選択して `Generate` を実行します。
5. 現在の状態を保存したいときは、左サイドバーの `Save` を押します。

## ノード種類

### text ノード

**本文の生成・編集を行うノードです。** グラフの中心的な存在で、`Generate` を実行できるのは `text` ノードだけです。

- 書きかけの原稿、章の下書き、アイデアメモなど、生成結果そのものを格納します。
- T ハンドルで上流の `text` ノードと繋ぐと、その内容を「素材」として参照しながら生成できます。複数の `text` ノードを数珠つなぎにすることで、前の章を踏まえて次の章を書く、といったチェーン構成が作れます。
- C / I ハンドルで `context` / `instruction` ノードを受け取り、生成の参照情報や指示を注入できます。
- 出力ハンドルを下流の `text` ノードの T ハンドルへ繋ぐと、自身の内容が下流の生成素材になります。

左辺に 3 種類の入力ハンドルがあります：

| ハンドル | ラベル | 接続できるノード |
|----------|--------|-----------------|
| T        | Text   | text ノード     |
| C        | Context | context ノード |
| I        | Instruction | instruction ノード |

右辺には 1 つの出力ハンドルがあり、下流の `text` ノードへ接続できます。

### context ノード

**生成時に参照させる背景情報や資料を保持するノードです。** LLM へのユーザーメッセージ（コンテキスト部分）として渡されます。

- 設定資料、キャラクター説明、過去のやり取りの要約、外部から貼り付けた参考文など、生成の「材料」となる情報を入れます。
- `text` ノードの C ハンドルへ接続することで、その `text` の生成時に参照されます。
- **Global / Local** の 2 つのスコープがあります（後述）。

### instruction ノード

**生成時の振る舞いをモデルに指示するノードです。** LLM のシステムプロンプトとして渡されます。

- 文体・トーン・出力形式・禁止事項など、「どう書くか」を制御したいときに使います。
- `context` が「何を書くか」の材料であるのに対し、`instruction` は「どのように書くか」のルールです。
- `text` ノードの I ハンドルへ接続することで、その `text` の生成時にシステムプロンプトへ組み込まれます。
- **Global / Local** の 2 つのスコープがあります（後述）。

---

## 上流ノードのたどり方

`text` ノードで生成を実行すると、アプリは以下の順序でコンテキストを収集します。

```
生成対象 (target)
  ├── T ハンドル: 直接の親 text ノード群 (directTextParents)
  │     └── T ハンドル: さらに上流の text ノード群 (upstreamTexts, 再帰的)
  ├── C ハンドル: 直接の context ノード群 (directContextParents)
  └── I ハンドル: 直接の instruction ノード群 (directInstructionParents)
```

さらに、**upstreamTexts に含まれる各 text ノード**に対しても、そのノードに接続されている `context` / `instruction` ノードを遡って収集します。ただし、収集対象は **Global スコープのノードのみ**です（Local スコープは伝播しません）。

### プロンプトの組み立て順序

| 役割 | 収集元 |
|------|--------|
| システムプロンプト | Global instruction（直接 + 上流） → Local instruction（直接のみ） |
| ユーザーコンテキスト | 直接の親 text → 上流 text → context（直接 + 上流 Global） → ターゲット情報 |

---

## Global / Local スコープ

`context` ノードと `instruction` ノードには **Global**（デフォルト）と **Local** の 2 種類のスコープがあります。インスペクターパネルの「Scope」ドロップダウンで切り替えられます。

### Global（デフォルト）

グラフ全体を通じて伝播するスコープです。

- 直接接続された `text` ノードだけでなく、その下流にある `text` ノードが生成を実行した場合も参照されます。
- 例：`intro (text)` → `body (text)` という構成で `intro` に Global instruction を接続すると、`body` を生成するときにもその instruction が使われます。

```
[Global Instruction: "文体は丁寧に"]
        │ I
   [intro: text] ─── T ──▶ [body: text] ← Generate
```

`body` の生成時に `intro` の内容（upstream text）と「文体は丁寧に」（upstream global instruction）が両方参照されます。

### Local

直接接続した `text` ノードの生成にのみ適用されるスコープです。

- 下流の `text` ノードへは**伝播しません**。
- 「このノードだけ特別な指示で生成したい」「下流に漏らしたくない参照情報がある」といった用途に使います。

```
[Local Instruction: "箇条書きで書く"]
        │ I
   [draft: text] ─── T ──▶ [summary: text] ← Generate
```

`summary` の生成時に「箇条書きで書く」は参照されません。`draft` を生成するときだけ使われます。

### スコープの使い分け

| ユースケース | 推奨スコープ |
|-------------|-------------|
| プロジェクト全体の文体・トーン統一 | Global instruction |
| 特定ノードだけの出力形式指定 | Local instruction |
| 全体で共通の参考資料 | Global context |
| あるノード専用の補足資料 | Local context |

---

## 生成の挙動まとめ

- 生成対象は常に `text` ノードです。
- 上流の `text` ノードは T ハンドル経由で再帰的にたどられ、本文素材として使われます。
- 上流の `context` ノード（Global）は上流 text チェーン全体から収集されます。
- 上流の `context` ノード（Local）は直接接続された text のみに適用されます。
- 上流の `instruction` ノード（Global）はシステムプロンプトに集約されます。
- 上流の `instruction` ノード（Local）は直接接続された text の生成時のみシステムプロンプトに含まれます。
- 未保存の編集内容も、`Save` 前であっても生成に反映されます。

---

## 保存

- グラフ編集内容は、`Save` を押すまでローカルの作業状態として保持されます。
- 未保存の変更がある場合は、ダーティーインジケーターが表示されます。
- 未保存のままプロジェクト切り替えやアプリ終了を行うと、警告が表示されます。
- サイドバー状態、ミニマップ表示、コンテキスト長などの UI 設定は、Electron の `userData` 配下の JSON ファイルに保存されます。

## キーボードショートカット

- `Delete`: 選択中のノードまたはエッジを削除
- `Ctrl + C` / `Cmd + C`: 選択中ノードをコピー
- `Ctrl + V` / `Cmd + V`: 現在のビューポート中央付近にノードを貼り付け

貼り付けられた `text` ノードは、再利用しやすいように内容を空にした状態で作成されます。

## 重要なファイル

- `docs/GRAPH_CHAT_SPEC.md`: 機能仕様メモ
- `src/main/index.ts`: Electron メインプロセスと IPC
- `src/main/database.ts`: SQLite リポジトリ
- `src/main/llamaServer.ts`: ローカル `llama.cpp` サーバー管理
- `src/preload/index.ts`: renderer ブリッジ
- `src/renderer/src/App.tsx`: メイン UI
- `src/renderer/src/index.css`: renderer 共通スタイル
- `start.bat`: Windows 用起動ヘルパー

## 補足

- `node_modules/`, `out/`, `bin/`, `models/` はローカル専用で、コミットしない想定です。
- SQLite データベースはリポジトリ内ではなく、Electron の `userData` 配下に保存されます。
- `better-sqlite3` は Electron ランタイム向けの再ビルドが必要なため、`npm run rebuild:electron` を含めています。
