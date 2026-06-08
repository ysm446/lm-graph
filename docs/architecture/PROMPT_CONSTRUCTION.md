# Prompt Construction

このドキュメントでは、テキストノードを生成する際にどのようにプロンプトが組み立てられるかを説明します。

## 全体構造

LLMへのリクエストは **system prompt** と **user message** の2層に分かれます。

```
[system prompt]
  ← instruction ノードの内容

[user message]
  ← context ノードの内容
  ← 上流テキストノードの内容（時系列順）
  ← 直接親テキストノードの内容
  ← image ノードのメタ情報（テキスト）
  ← Target Node（生成対象）
  ---
  Write the target text based on the context above.

[multipart — Vision モデルのみ]
  ← image ノードの実画像データ（image_url）
```

---

## ノード種別ごとの扱い

### instruction ノード

- 内容（content）が **system prompt** に組み込まれます。
- **タイトルはプロンプトに含まれません**（LLMには渡されません）。
- 複数ある場合は `\n\n` で結合されます。
- グローバル（非ローカル）→ ローカルの順に並びます。

### context ノード

- 内容（content）が user message の**先頭側**に組み込まれます。
- タイトルがある場合は `# Context 1: タイトル` のように見出しとして含まれます。
- 複数ある場合の並び順：直接接続されたもの → 上流テキストノード経由で収集したもの（接続順）。

### text ノード（上流）

- user message に**時系列順**（上流から手前へ）で組み込まれます。
- タイトルがある場合は `# Upstream Text 1: タイトル` や `# Direct Parent Text 1: タイトル` として含まれます。

### image ノード

- **直接接続した text ノードにのみ**作用します（上流には伝播しません）。
- Global / Local の概念はありません。
- user message にはテキストとしてメタ情報が埋め込まれます：
  ```
  # Image 1: タイトル (file: photo.jpg, 1280 x 720)
  ```
  タイトルがなければ `: タイトル` 部分は省略されます。
- **Vision 対応モデルの場合**：実画像が `image_url` として multipart メッセージに追加されます。
- **Vision 非対応モデルの場合**：メタ情報のテキストのみが送信され、画像データは送られません。
- Vision 対応かどうかは、モデルフォルダ内に `mmproj-*.gguf` が存在するかで判定されます。

### target text ノード（生成対象）

- user message の**末尾**、区切り線（`---`）の直前に配置されます。
- タイトルがある場合は `# Target Node: タイトル` として含まれます。

---

## user message 内の並び順

```
# Context 1: ...          ← context ノード（直接 → 上流経由の順）
# Context 2: ...
# Upstream Text 1: ...    ← 上流テキストノード（遠い祖先から順）
# Upstream Text 2: ...
# Direct Parent Text 1: ... ← 直接親テキストノード
# Image 1: ...            ← image ノードのメタ情報
# Target Node: ...        ← 生成対象ノード（★最後）
---
Write the target text based on the context above.
```

Vision 対応モデルでは、上記テキストに加えて画像データが multipart で末尾に付加されます。

LLMは後半の内容ほど影響を受けやすい傾向があるため、**Target Node が最後に来る**この設計は生成の方向性を明確に伝えます。

---

## 並び順の決定ルール

各ノード種別の並び順は「エッジが追加された順（DBの保存順）」です。キャンバス上のノードの視覚的な位置ではなく、**接続した順番**で決まります。

instruction と context は複数つないでも、矛盾しない限り生成への影響差はわずかです。矛盾する指示がある場合は後に来るものが優先されやすい傾向があります。

---

## target ノードのタイトルの効果

target ノードのタイトルは生成の方向性を強く決定します。

| タイトルの状態 | 挙動 |
|---|---|
| あり（例：「結末」「感想」） | そのテーマに向かって書く |
| なし | 上流のテキスト・contextの流れに沿って自然に続く |

タイトルを空にすると、上流の内容から話の流れを受け継いで書かせることができます。意図的な方向転換をしたい場合はタイトルを明示するのが効果的です。

---

## テキストノードの時系列

チェーン `A → B → C（生成）` の場合、LLMには以下の順で渡されます。

```
# Upstream Text 1     ← A（最も遠い祖先）
# Direct Parent Text  ← B（直接の親）
# Target Node         ← C（生成対象）
```

グラフの接続方向がそのまま時系列に対応するため、会話や文章の連続性が自然にプロンプトに反映されます。

---

## system prompt のフォールバック

instruction ノードが1つも接続されていない、または全て空の場合、system prompt は以下のデフォルト値になります。

```
You are a helpful writing assistant.
```
