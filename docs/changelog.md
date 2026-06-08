# Changelog

作成日時: 2026-06-07 21:59
更新日時: 2026-06-08 22:36

このファイルは Git のコミット履歴をもとに、主な更新を日付ごとに整理したものです。
日時はコミット時刻の `+0900` 表記に合わせています。

## 未リリース

- `textSwitch` ノードを追加し、複数の本文入力から選択した本文だけを下流の text node に渡せるように変更。複数 edge が同じ switch 入力に接続された場合も、入力数として正しく扱うように調整。
- switch node で現在選択されていない入力 edge は、edge 自体をクリック選択している場合も破線表示を保つように変更。
- text switch node の非選択 edge の破線パターンを context switch node と同じ長さに調整。
- ノード編集中の選択範囲の校正ボタンが現在のモデル状態を参照するようにし、モデル未ロード時は実行できない理由が分かる表示に変更。
- Interface settings に表示領域を `1920 x 1080` へ戻す reset button を追加。
- text node のメタ情報列で、`Prompt log` ボタンを stop reason の横に配置。

## 2026-06-07

- `0a2558f` AGENTS.md のプロジェクトルールを拡充。
- `f956eef` changelog と plan 用ドキュメントを追加。
  - `docs/changelog.md` を追加。
  - `docs/plan/goals.md` / `docs/plan/plan.md` / `docs/plan/progress.md` を追加。

## 2026-04-24

- `08f564e` renderer utilities を整理。

## 2026-04-18

- `ef51106` アプリ名とドキュメント表記を `Prompt Graph` から `LM Graph` に変更。

## 2026-04-17

- `b13a590` モデル一覧とプロジェクト一覧 UI を改善。
- `45040a1` VRAM 解放用 batch script を追加。
- `61b466a` モデル metadata 表示を改善。
- `50e9b39` `llama-server.exe` の自動選択を追加。

## 2026-04-13

- `dfdd26b` system resource monitor のレイアウトを調整。
- `e3661c5` キャンバス上に CPU / RAM / GPU / VRAM の system resource monitor を追加。

## 2026-04-12

- `4e7d31c` React Flow controls を非表示に変更。

## 2026-04-11

- `811d201` detail panel 内のテキスト選択コピーで `Ctrl+C` を使えるように修正。

## 2026-04-10

- `b06963d` image node のドキュメントを追加し、CLAUDE.md と README を更新。
- `b93eb08` prompt construction ドキュメントを追加し、仕様書を日本語化。
- `1d199bb` stale closure により node generate button が settings 不足で失敗する問題を修正。
- `de36933` model selector と node delete action をコンパクト化。
- `d2df65b` project / canvas context menu をコンパクト化。

## 2026-04-09

- `371c7b4` text node の input / output handle 高さを揃えるよう調整。
- `58b379a` text node input label を調整。
- `6b0f909` edit mode の node content scroll と textarea 幅を修正。
- `d1030c6` node content 表示の 260 文字 preview 制限を撤廃。
- `8345146` viewport 依存 rendering を分離し、canvas performance を改善。
- `c764877` bootstrap 完了まで render を遅延し、起動時 flicker を修正。
- `1d091fc` image replace 後に image node position が戻る問題を修正。
- `0d82809` image node の複製と preview を改善。
- `0552a2d` image node の読み込み flow と docs を改善。
- `eee9fd2` model load state と image node behavior を修正。
- `ca17605` image node と vision prompt support を追加。

## 2026-04-08

- `a0fcfab` node type ごとの output handle color を調整。
- `17e4be9` narrative coherence を改善するため prompt context の順序を調整。
- `49e29fc` right sidebar section icon を更新。
- `5fd52ca` right sidebar に Debug section と prompt log toggle を追加。

## 2026-04-07

- `9a4159a` right sidebar select の高さと non-default 時の accent border を改善。
- `ac8c32c` edge selection highlight を復元。
- `58004b8` text node generate menu label を簡素化。
- `664c1a5` local context / instruction node を dashed border 表示に変更。
- `48369aa` node content preview で改行を保持。
- `2340be4` stale closure により Generate Downstream が 2 番目の node を skip する問題を修正。
- `560dc3e` detail editor action を右寄せに調整。
- `c6a16c3` generate 時の auto-load 用に最後に使った model を記憶。
- `8de1870` proofread trigger と detail save UI を改善。
- `cf4dc85` project ごとの camera viewport 保存に対応し、data を `data/` 配下へ移動。
- `6534a35` README を更新。
- `22008eb` generation 完了まで node content update を遅延。
- `d88caf8` details action を title row へ移動。
- `ea49af3` proofread preset と details proofreading を追加。
- `82f5ff1` details content に adaptive fade を追加。
- `c8e2422` details panel で double-click editing を有効化。
- `322a344` details panel action と resize default を簡素化。
- `8b0e502` details panel content height を responsive 化。
- `61ce44f` reading と generation を details panel へ移動。
- `a0e9417` right panel layout と toolbar icon を改善。
- `f95bdf7` 永続化される text style controls を追加。
- `c8f92b0` node editing を改善し、app icon を復元。
- `c8b5931` generation 中の React Flow update loop を削減。
- `1ff0bc2` Electron startup と runtime path を安定化。

## 2026-04-06

- `aed740d` Interface settings に node text size slider を追加。
- `3683be1` text node output handle を `T` input handle に揃えるよう調整。
- `82651d6` Generate Downstream 機能を追加し、text edge を太く調整。
- `c1f8677` minimap の context node color を blue に修正。
- `7ac6d17` legacy local_context / local_instruction migration code を削除。
- `4d3a9b1` model 未ロード時は proofread request を skip。
- `39d9e75` proofread popup から original text を削除。
- `15bc81e` proofread UX を改善。
  - system prompt 編集、popup 位置、edit state 周りを修正。
- `631686f` proofread-on-select と right sidebar の Editing section を追加。
- `fb17452` save button と dirty indicator を project list item へ移動。
- `6d1d059` generation queue と generating node の glowing border animation を追加。
- `0db1ec2` Interface settings に edge style selector を追加。

## 2026-04-05

- `c52debd` zoom out 時に固定サイズの node title を node 上部へ表示。
- `d7ae162` sidebar の new project button と save button の順序を入れ替え。
- `d14a524` project creation、save icon、sidebar、toggle button UI を改善。
- `3129bdc` `llama-server` binary を b8664 build へ更新。
- `424a6c7` text node card に model / date を表示し、README の node description を拡充。
- `eb7085c` README に node と upstream traversal の詳細説明を追加。

## 2026-04-04

- `e6ab15e` stale closure により generate button が no-op になる問題を修正。
- `0513db9` generation 中に model selector button を pulse 表示。
- `317436a` default node title から `Global` prefix を削除。
- `ff05974` inspector の `isLocal` checkbox を Global / Local dropdown に変更。
- `30792e7` node connection の strict handle type enforcement を復元。
- `1b50709` project duplicate、stop icon、global context propagation fix を追加。
- `0135dfb` inspector の model name 横に generation date を表示。
- `64c54a5` upstream text node から global instruction / context を伝播。
- `de1eaa7` keyboard shortcut、inline rename、UX fix を追加。
- `d717a05` node card spacing と text node border を調整。
- `5520cd2` node card interaction と scrolling を改善。
- `823ed29` node card background を統一し、CLAUDE.md を追加。
- `b4fa426` CLAUDE.md を追加。
- `a901081` AGENTS.md を追加。
- `75b7b66` node card UI と inspector toolbar を改善。
- `60c5936` project files を整理し、README を日本語化。
- `e078a9b` node paste 時に upstream wire を保持。
- `a9a0d00` multi-node copy / paste を追加。
- `a16424d` Shift による node multi-select を追加。
- `02124cf` model shutdown を堅牢化し、node spacing を調整。
- `d9d29ef` model loading modal を改善し、meta tag stripping を追加。
- `90fed74` dialog corners を調整し、copy を日本語化。
- `1af03c7` selected edge color を wire type に合わせるよう調整。
- `fa44f71` アプリ名を `Prompt Graph` に変更し、UI を調整。
- `a48d3a6` minimap styling と controls を改善。
- `7f84041` estimated token count に icon を追加。
- `ee86b85` estimated token 表示を追加し、grid snapping を調整。
- `3a5e05a` llama server を更新し、snap-to-grid toggle を追加。
- `40d70ca` settings に temperature control を追加。
- `3894b72` inspector に context usage metrics を追加。
- `9b6a893` local node behavior を toggle と統一。
- `42793cc` typed text node input handle を追加。

## 2026-04-03

- `91c7be2` edge interaction と llama port handling を改善。
- `e3aff1b` manual project save flow を追加。
- `442c712` local instruction node support を追加。
- `7e79ca5` node edit mode を復元し、canvas dots を調整。
- `bdc488e` sidebar を resizable にし、幅を永続化。
- `fbbda71` source icon assets を追加。
- `1013b02` Electron window に asset icon を使用。
- `d9b775d` instruction / context node opacity を調整。
- `a41df78` graph edge を colored node の背面へ移動。
- `6cbadfb` header と minimap toggle icon を改善。
- `824ffce` UI preferences を JSON に永続化。
- `b6dd3b5` inspector sizing と node selection sync を改善。
- `7f80a6e` general inspector settings panel を追加。
- `0004f3f` inspector に generation metadata を表示。
- `407bd86` generation start flow を修正し、canvas UI を改善。
- `de2547e` header と sidebar layout を lm chat に合わせて調整。
- `69744a2` graph chat colors を lm chat に合わせて調整。
- `3726397` header に pane toggle button を追加。
- `01b0650` header model selector layout を改善。
- `bca30f2` graph chat UX と model controls を改善。
- `56d0deb` Graph Chat app の初期実装。
