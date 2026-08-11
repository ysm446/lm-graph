# UI スタイルガイド

作成日時: 2026-08-11 18:53
更新日時: 2026-08-11 18:53

このファイルは LM Graph の UI に関する唯一の基準です。色、タイポグラフィ、余白、角丸、部品、状態表現、モーション、アイコンのルールをまとめています。
**UI を変更するときは、必ずこのファイルを先に読み、ここに書かれた値とパターンに合わせること。** ここに無い値を新しく発明しない。

関連ドキュメント:

- `docs/architecture/GRAPH_CHAT_SPEC.md` — 画面構成と機能仕様（何があるか）
- 本ファイル — 見た目のルール（どう見せるか）

実装上の一次情報:

- `src/renderer/src/index.css` — CSS 変数、React Flow の上書き、スクロールバー、スライダー、生成中アニメーション
- `src/renderer/src/constants.ts` — サイドバー幅、グリッド、既定フォントサイズ、テキストスタイルプリセット
- `src/renderer/src/flowEdges.tsx` — エッジの色と太さ
- `src/renderer/src/graphUtils.ts` — MiniMap のノード色

---

## 1. 基本原則

1. **ダークテーマ固定**。`color-scheme: dark` 前提で、明色テーマは考慮しない。
2. **色は必ず CSS 変数（デザイントークン）を使う**。ノード種別色など後述の例外を除き、`#xxxxxx` を新規に直書きしない。
3. **落ち着いた無彩色の面 + 紫のアクセント**。アクセント色は「選択中」「有効」「変更あり」「生成中」を示すためだけに使い、装飾に使わない。
4. **情報の階層を色ではなく文字色の 3 段階（`--text` / `--text-dim` / `--text-faint`）で表現する**。
5. **キャンバス（ノードグラフ）とクロム（サイドバー・パネル）を視覚的に分ける**。クロムは小さく淡く、キャンバスのノードは大きくはっきりと。
6. **日本語と英語が混在する**。UI ラベルは英語主体、ユーザー向けの説明やメッセージは日本語も可。既存画面の言語に合わせる（例: 校正パネルは日本語）。

---

## 2. カラー

### 2.1 トークン（`index.css` の `:root`）

| トークン | 値 | 用途 |
| --- | --- | --- |
| `--bg` | `#0d0f14` | アプリ最下層の背景 |
| `--bg-sidebar` | `#111318` | 左サイドバー、右パネルの地 |
| `--bg-canvas` | `#181b23` | React Flow キャンバス、MiniMap の地 |
| `--bg-chat` | `#13161e` | 読み取り/チャット系ビューの地 |
| `--bg-input` | `#1a1d27` | 入力欄、select の地 |
| `--bg-card` | `#1c1f2b` | ノードカード、ポップオーバー、メニューの地 |
| `--bg-elevated` | `rgba(32,35,48,0.5)` | 半透明の浮いた面 |
| `--border` | `#252830` | 通常の区切り線（パネル間、セクション間） |
| `--border-strong` | `#2e3140` | 部品の輪郭（ボタン、入力、ポップオーバー） |
| `--text` | `#e2e4ef` | 主テキスト、値、選択中ラベル |
| `--text-dim` | `#9499b0` | 副テキスト、行ラベル、非選択の操作 |
| `--text-faint` | `#5c6078` | 補助説明、キャプション、無効状態 |
| `--accent` | `#7c5af7` | アクセント（選択・有効・進行中） |
| `--accent-hover` | `#6d4de6` | アクセントの hover / トグル ON の地 |
| `--accent-soft` | `rgba(124,90,247,0.12)` | アクセントの淡い塗り |
| `--accent-border` | `rgba(124,90,247,0.35)` | アクセントの輪郭、選択リング |
| `--danger` | `#ef4444` | 破壊的操作、エラー |

Tailwind からは `text-[var(--text-dim)]`、`bg-[var(--bg-card)]`、`border-[var(--border)]` の形で参照する。

### 2.2 半透明の慣用値

トークンで表せない「面の上に薄く重ねる」表現は、次の値だけを使う。

- hover の明るくする overlay: `hover:bg-white/5`（強めが必要な場合のみ `hover:bg-white/10`）
- 押し込み・区切りの暗い面: `rgba(0,0,0,0.12)` / `rgba(0,0,0,0.08)`（プロンプトログの `pre` など）
- ノード上のボタン地: `rgba(28,31,43,0.92)`、入力地: `rgba(28,31,43,0.88)`
- フローティングパネル地: `rgba(17,19,24,0.94)` 〜 `rgba(17,19,24,0.98)`
- モーダルのオーバーレイ: `bg-black/72` + `backdrop-blur-sm`
- OFF 状態のトグル地: `rgba(255,255,255,0.1)`、そのノブ: `rgba(255,255,255,0.35)`

### 2.3 ノード種別カラー（唯一の直書き許容領域）

ノード種別の識別色は意味を持つため、トークン化せず定数として `App.tsx` / `flowEdges.tsx` / `graphUtils.ts` にリテラルで置く。**新しい種別を追加する場合も、以下の色相体系（text=グレー / context=青紫 / instruction=マゼンタ / image=水色）を必ず守る。**

| 種別 | ノード枠線 | ハンドル（塗り） | ピンラベル | エッジ通常 | エッジ選択 | MiniMap |
| --- | --- | --- | --- | --- | --- | --- |
| `text` | `#6b7280` | `var(--text)` / 枠 `var(--text-faint)` | `TXT` `var(--text-dim)` | `#6a728f` 幅 4 | `#8b95b8` 幅 4.5 | `#3f4150` |
| `context` | `rgb(90,100,210)` | `rgb(111,126,255)` | `CTX` `rgb(162,170,255)` | `#6170d8` 幅 2.6 | `#7b89f0` 幅 3.5 | `#1e3a6b`（Local は `#2e4f82`） |
| `instruction` | `rgb(156,76,196)` | `rgb(201,108,210)` | `INS` `rgb(221,156,221)` | `#a267c8` 幅 2.6 | `#bf79df` 幅 3.5 | `#5b2d5d`（Local は `#6c3d63`） |
| `image` | `#4a8fcb` | `#669fe0` | `Img` `#8db6e8` | `#4a8fcb` 幅 2.8 | `#79afe8` 幅 3.8 | `#4a8fcb` |
| `textSwitch` | `#687083` | `text` と同じ | 入力番号 `var(--text-dim)` | 親系統に準ずる | 同左 | `#4b5563` |
| `contextSwitch` | `rgb(74,91,190)` | `context` と同じ | 入力番号 `rgb(162,170,255)` | 親系統に準ずる | 同左 | `#263d78` |
| `instructionSwitch` | `rgb(136,70,160)` | `instruction` と同じ | 入力番号 `rgb(221,156,221)` | 親系統に準ずる | 同左 | `#63336b` |

エッジの補足:

- 非選択/無効化されたエッジは `opacity: 0.38`、選択中の系統は `opacity: 0.72〜1`。
- switch ノードの非選択入力は破線。`text` 系は `10 9`、それ以外は `8 7`。破線パターンをこれ以外に増やさない。

---

## 3. タイポグラフィ

### 3.1 フォント

- UI 全体: `"Inter", "Segoe UI", "Noto Sans JP", system-ui, sans-serif`（`:root` で指定）。個別に `font-family` を上書きしない。
- 等幅が必要な箇所（プロンプトログなど）のみ `font-mono`。
- ノードのタイトル/本文だけは例外で、ユーザー設定のプリセットを CSS 変数経由で適用する（3.3）。

### 3.2 UI のサイズスケール

`text-[Npx]` の任意指定は次の 6 段階だけを使う。中間値（`text-[13.5px]` など）を作らない。

| サイズ | 用途 |
| --- | --- |
| `text-[10px]` | オーバーラインラベル、目盛り、パス表示、バッジ |
| `text-[11px]` | 補助説明、キャプション、セクション見出しラベル |
| `text-[12px]` | 密度の高い本文、入力値、パネルヘッダー |
| `text-[13px]` | 標準の行ラベル、メニュー項目、リスト項目、セクションタイトル |
| `text-[14px]` | 設定行のラベル（やや強調） |
| `text-[18px]` | ノードタイトルの既定値（`DEFAULT_TITLE_FONT_SIZE`） |

Tailwind の `text-xs` / `text-sm` / `text-lg` も既存箇所に残るが、**新規追加では `text-[Npx]` の上記スケールに統一する**。

ウェイトは `font-medium`（既定の強調）と `font-semibold`（見出し・バッジ）の 2 段階のみ。`font-bold` は使わない。

### 3.3 ノードのタイトル / 本文

ノード内テキストはユーザーがプリセットとサイズを変更できる。**直接 `text-[14px]` などを当てず、必ず CSS 変数を使う。**

```tsx
style={{
  fontFamily: 'var(--node-content-font-family)',
  fontSize: 'var(--node-content-font-size)',
  fontWeight: 'var(--node-content-font-weight)',
  lineHeight: 'var(--node-content-line-height)',
  letterSpacing: 'var(--node-content-letter-spacing)'
}}
```

- タイトル系: `--node-title-font-family` / `-font-size` / `-font-weight` / `-letter-spacing`
- 本文系: 上記 4 つ + `--node-content-line-height`
- 既定値: タイトル 18px、本文 14px。プリセットは `TEXT_STYLE_PRESETS`（`standard` / `business` / `reading` / `dense`）。
- ノード本文を表示する新しい場所（インスペクタ、リーダーなど）を追加する場合も、同じ変数を適用して見た目を一致させる。

### 3.4 オーバーライン（小見出し）

セクション内の小見出しは全て同じ形にする。

```tsx
<div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Title</div>
```

- `tracking` は `0.18em` を基準に、`0.12em`〜`0.3em` の範囲で既存の近い用例に合わせる。
- ノード種別ラベル（NODE の上のラベル）は `text-xs uppercase tracking-[0.24em] text-[var(--text-dim)]`。
- ピンラベル（TXT / CTX / INS / Img）は `text-[10px] font-medium uppercase tracking-[0.2em]` + 種別色。

### 3.5 数値

数値が並ぶ箇所（トークン数、時間、目盛り、switch の入力番号）は必ず `tabular-nums` を付ける。

---

## 4. 余白とレイアウト

### 4.1 スペーシングスケール

Tailwind の既定スケール（4px 基準）から次のみ使う。

- `gap`: `gap-1` / `gap-1.5` / `gap-2` / `gap-3` / `gap-4`
- 横パディング: `px-1` / `px-2` / `px-2.5` / `px-3` / `px-4`（ノード内部のみ `px-9`）
- 縦パディング: `py-0.5` / `py-1` / `py-1.5` / `py-2` / `py-2.5` / `py-3`（ノード内部のみ `py-6`）
- 縦方向の連続項目は `mt-3`、ブロック間の区切りは `mt-4` + `border-t border-[var(--border)] pt-3`

### 4.2 定番の余白

| 箇所 | 値 |
| --- | --- |
| パネル/セクションのヘッダー行 | `px-4 py-3` |
| サイドバーのリスト領域 | `px-3 py-3`、項目は `px-3 py-2` |
| インスペクタのスクロール領域 | `px-4 py-2` |
| ポップオーバー本体 | `p-1.5`、項目 `px-2.5 py-1.5` |
| モーダルのヘッダー | `px-5 py-3`、本文 `p-5` |
| ノードカード | `px-9 py-6`（ハンドルラベル用に左右を広く取る） |

### 4.3 レイアウト定数（`constants.ts`）

| 定数 | 値 |
| --- | --- |
| `DEFAULT_LEFT_SIDEBAR_WIDTH` | 288（範囲 220–520） |
| `DEFAULT_RIGHT_INSPECTOR_WIDTH` | 520（範囲 380–840） |
| `DEFAULT_SETTINGS_PANEL_WIDTH` | 340 |
| `GRID_SIZE` | 20 |

ノードの最小サイズは幅 220 / 高さ 140（`NodeResizeControl`）。

### 4.4 重なり順（z-index）

| レイヤー | z |
| --- | --- |
| React Flow のエッジ | 0（`index.css` で固定） |
| React Flow のノード | 1 |
| サイドバー / パネル | 20 |
| コンテキストメニュー、その背後のクリック捕捉 | 30 |
| ドロップダウン本体 | 40 |
| モーダル、フローティングパネル（校正、画像プレビュー） | 50 |

新しい浮遊 UI はこの体系に収める。任意の大きな z 値を使わない。

### 4.5 スクロール領域

- インスペクタ/パネル: `className="inspector-scrollbar"`
- ノード内部: `className="node-scrollbar"`

この 2 つ以外のカスタムスクロールバーを追加しない。

---

## 5. 角丸・境界線・影

### 5.1 角丸

用途ごとに固定する。迷ったら「小さい部品ほど小さい角丸」。

| 値 | 用途 |
| --- | --- |
| `rounded-full` | トグル、ドット、ピル型バッジ、ハンドル |
| `rounded-[6px]` / `rounded-[7px]` | 極小バッジ、リサイズハンドル |
| `rounded-md` (6px) | テキストリンク的なボタン、インライン入力 |
| `rounded-[8px]` | select、小ボタン、数値表示、MiniMap |
| `rounded-[9px]` | 数値入力 |
| `rounded-[10px]` | 標準ボタン、IconButton、リスト項目 |
| `rounded-lg` (8px) | メニュー項目 |
| `rounded-xl` (12px) | ポップオーバー、ドロップダウン |
| `rounded-2xl` (16px) | フローティングパネル |
| `rounded-[20px]` | モーダルダイアログ |
| `rounded-3xl` (24px) | ノードカード |

### 5.2 境界線

- パネル間・セクション間の区切り: `border-[var(--border)]`
- 部品の輪郭: `border-[var(--border-strong)]`
- アクティブ/変更あり: `border-[var(--accent-border)]` または `border-[var(--accent)]`
- ノードカードのみ `border-2`。スコープが Local の `context` / `instruction` / switch 系は `border-dashed`、それ以外は `border-solid`。

### 5.3 影

- ノードカード: `shadow-lg shadow-black/30`
- ポップオーバー / ドロップダウン / モーダル: `shadow-2xl`
- 小さな浮遊要素: `shadow-xl` / `shadow-sm`
- これ以外のカスタム `box-shadow` は、生成中グロー（`node-generating-border`）と switch の選択リング（`0 0 0 4px rgba(255,255,255,0.18)`）のみ。

---

## 6. 部品

### 6.1 ボタン

**アクセント（主操作）**

```
rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--accent-hover)]
```

**中立（副操作）**

```
rounded-md border border-[var(--border-strong)] bg-[rgba(28,31,43,0.92)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:bg-white/5
```

**ゴースト（3 番目）**

```
rounded-md px-2.5 py-1.5 text-[13px] text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--text)]
```

小型（パネル内・ノード内）は `px-3 py-1.5` + `text-[12px]`/`text-sm`、角丸 `rounded-[8px]` / `rounded-[10px]`。

**破壊的操作**は `--danger` を文字色に使い、地を赤で塗らない。実行前に確認を挟む。

### 6.2 アイコンボタン（`IconButton`）

30×30 / `rounded-[10px]` / `hover:bg-white/5`。既定は `text-[var(--text-faint)]`、hover で `text-[var(--text-dim)]`、`active` 時は `text-[var(--accent)]`。無効時は `opacity-40` かつ hover 効果なし。`aria-label` と `title` を必ず付ける。

### 6.3 トグルスイッチ

```tsx
<button type="button" role="switch" aria-checked={on}
  className={`relative h-[16px] w-[28px] rounded-full transition ${on ? 'bg-[var(--accent-hover)]' : 'bg-[rgba(255,255,255,0.1)]'}`}>
  <span className={`absolute top-[2px] h-[12px] w-[12px] rounded-full transition ${on ? 'left-[14px] bg-white' : 'left-[2px] bg-[rgba(255,255,255,0.35)]'}`} />
</button>
```

チェックボックスではなくこの形を使う。ラベルは左、スイッチは右で `flex items-center justify-between gap-3`。

### 6.4 select

```
rounded-[8px] border bg-[var(--bg-input)] px-2 py-1.5 text-[12px] text-[var(--text)] outline-none
```

既定値以外が選ばれているときだけ枠線を `border-[var(--accent-border)]` に変える（既定は `border-[var(--border-strong)]`）。

### 6.5 数値入力・値表示

```
h-7 w-[94px] rounded-[9px] border border-[var(--border-strong)] bg-[rgba(28,31,43,0.88)] px-2.5 py-1 text-right text-[12px] text-[var(--text)] outline-none
```

読み取り専用の値バッジは同じ寸法で `inline-flex items-center justify-center` + `tabular-nums`、変更ありなら枠 `--accent-border` かつ文字 `--text`。

### 6.6 スライダー

`<input type="range" className="graph-slider ...">` を使う。既定値から変更されている間だけ `graph-slider-active` を足してつまみをアクセント色にする。トラック 5px / つまみ 12px は `index.css` 側で定義済みなので、個別に上書きしない。

必要なら下に `text-[10px] tabular-nums text-[var(--text-faint)]` の目盛り行を置く。

### 6.7 設定行のパターン

```
[ラベル text-[13px] text-[var(--text-dim)]]        [リセット IconButton] [コントロール]
[説明 text-[11px] leading-5 text-[var(--text-faint)]]
```

- 既定値から変更されている行にだけリセットボタン（`TrashIcon` 3.5）を出す。
- 説明文は `mt-2` / `mt-3` で下に置く。

### 6.8 折りたたみセクション（`InspectorSection`）

見出しは `text-[13px] font-medium text-[var(--text)]` + 15px のアイコン（`text-[var(--text-dim)]`）。右端に `ChevronDownIcon`（3.5）を置き、開いているとき `rotate-180`。セクションは `border-b border-[var(--border)] pb-4 mb-4 last:border-b-0`。開閉状態は `UiPreferences` に保存する。

### 6.9 メニュー / ポップオーバー

```
rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-1.5 shadow-2xl
```

項目は `block w-full text-left rounded-lg px-2.5 py-1.5 text-[13px] font-medium hover:bg-white/5`。区切りは `my-1 border-t border-[var(--border)]`。メニュー外クリックで閉じるため `fixed inset-0` の透明レイヤーを裏に敷く。

### 6.10 モーダル

オーバーレイ `absolute inset-0 z-50 flex items-center justify-center bg-black/72 p-6 backdrop-blur-sm`、本体 `rounded-[20px] border border-[var(--border-strong)] bg-[rgba(17,19,24,0.96)] shadow-2xl`。ヘッダーは `border-b border-[var(--border)] px-5 py-3`、右端に Close ボタン。オーバーレイのクリックで閉じ、本体側は `stopPropagation`。

### 6.11 バッジ

- 情報バッジ: `rounded-[7px] bg-white/6 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-dim)]`
- アクセントバッジ: `rounded-[6px] border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]`

### 6.12 ノードカード

```
relative h-full w-full rounded-3xl border-2 px-9 py-6 shadow-lg shadow-black/30 transition
```

- 地は常に `bg-[var(--bg-card)]`、枠線色だけ種別で変える（2.3）。
- 選択中は `ring-4 ring-[var(--accent-border)]`。生成中は ring を出さず `node-generating-border` のグローに任せる。
- ハンドルは 20×20（`!h-5 !w-5 !border-2`）、種別色で塗る。
- 入力ハンドルの縦位置は text ノードで 18% / 32% / 52% / 72%、出力は種別に応じて 18%・28%・50%。
- ラベルはハンドルの左外側（`-left-8`、switch の番号は `-left-10`）。
- リサイズハンドルは選択中のみ表示（非選択は `opacity-0 pointer-events-none`）。

### 6.13 空状態・読み込み中

- 空リスト: 中央寄せ `text-[13px] text-[var(--text-faint)]`（例: `No models found`）。
- 読み込み中: `SpinnerIcon` + `animate-spin`、必要なら親を `animate-pulse`。
- 警告文: `text-[12px] text-amber-300`。

---

## 7. 状態表現

同じ状態は必ず同じ表現にする。

| 状態 | 表現 |
| --- | --- |
| hover | `hover:bg-white/5` と、文字色を 1 段明るく（`--text-faint` → `--text-dim` → `--text`） |
| 選択中（リスト） | 地 `rgba(124,90,247,0.18)`、文字 `--text` |
| 選択中（ノード） | `ring-4 ring-[var(--accent-border)]` |
| 有効 / ON | アクセント枠 + `--accent-soft` の地、またはトグル ON |
| 既定値から変更あり | 枠を `--accent-border` に、リセットボタンを表示 |
| 進行中（生成） | `node-generating-border` のパルスグロー、ボタンは `animate-pulse` |
| 無効 | `disabled:opacity-40 disabled:cursor-default` + hover 効果を消す |
| 未保存 | `h-1.5 w-1.5 rounded-full bg-[var(--accent)]` のドット |

---

## 8. モーション

- 状態変化は Tailwind の `transition`（150ms 相当）のみ。`duration-*` を個別指定しない。
- 大きな移動やスケールのアニメーションは使わない。色・不透明度・小さな位置移動に限る。
- 継続アニメーションは 3 つだけ: `node-glow`（生成中 1.6s）、`animate-spin`（読み込み）、`animate-pulse`（モデルロード中）。新しいキーフレームを増やす前に既存で表現できないか検討する。
- ノードタイトルの外側表示は zoom 0.65→0.5 でフェードイン。ズーム連動の表示は `useViewport()` を使い、フォントサイズは `値 / zoom` で逆スケールする。

---

## 9. アイコン

- すべてインライン SVG。アイコンライブラリを追加しない。
- 規格: `viewBox="0 0 24 24"` / `fill="none"` / `stroke="currentColor"` / `strokeWidth={1.8}` / `strokeLinecap="round"` / `strokeLinejoin="round"`。
- サイズは `className` で指定。セクション見出し `h-[15px] w-[15px]`、標準 `h-4 w-4`、小 `h-3.5 w-3.5`、極小 `h-3 w-3`。
- 色は親から `currentColor` で継承させ、SVG 内で色を固定しない。
- 新しいアイコンは `App.tsx` 末尾のアイコン群に、同じ形式の関数コンポーネントとして追加する。

---

## 10. 文言

- ボタン・ラベル・設定名は英語、Title Case ではなく先頭大文字（`Show MiniMap`、`Snap to Grid`、`Reset`）。
- ユーザーへの説明・確認・エラーは日本語でよい。既存の同種 UI に合わせる。
- 日本語は文字化けさせない。ファイルは UTF-8（BOM なし）で保存する。
- 未設定値のプレースホルダは `—`（em dash）、不明な数値は `--`。
- 省略が必要なテキストは `truncate` + `title` 属性で全文を出す。

---

## 11. アクセシビリティ

- アイコンのみのボタンは `aria-label` と `title` を必ず付ける。
- トグルは `role="switch"` + `aria-checked`。
- 装飾用の SVG は `aria-hidden="true"`。
- フォーカスを消す `outline-none` を使う場合は、枠線やリングで選択状態が分かるようにする。
- 文字色は `--text-faint` より暗い色を本文に使わない。

---

## 12. UI 変更時のチェックリスト

UI を触ったら、コミット前に次を確認する。

1. 新しい色を直書きしていないか（ノード種別色以外はトークンを使う）。
2. フォントサイズが 3.2 のスケールに収まっているか。
3. 角丸が 5.1 の表のどれかと一致しているか。
4. 余白が 4.1 のスケールに収まっているか。
5. 同じ役割の既存部品（ボタン、トグル、select、セクション）をコピーして使ったか。新しい見た目を発明していないか。
6. hover / 選択 / 無効 / 変更あり の表現が 7 章と一致しているか。
7. アイコンを追加した場合、9 章の SVG 規格に従っているか。
8. `aria-label` / `role` / `title` を付けたか。
9. 日本語が文字化けしていないか。
10. `npm run build` が通るか。
11. このガイドに無いパターンを新しく作った場合は、**このファイルに追記して 更新日時 を更新したか**。
