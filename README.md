# Dialogue Framework MZ v0.1.0

RPGツクールMZ向けの高機能ビジュアルノベル会話基盤プラグインです。

## 概要

このプラグインは、ゲーム内会話のほぼすべてを置き換え可能な会話システムを提供します。

### 主な機能

- **2つの表示タイプ**: Face（MZ風顔グラ）とPortrait（VN風立ち絵）
- **キャラクターDB**: キャラクター定義を一元管理
- **会話スタック**: 割り込み会話→元の会話への復帰
- **バックログ**: 会話履歴の閲覧
- **選択肢**: VN風の選択肢UI

## インストール

### 1. プラグインファイルの配置

以下のファイルを `js/plugins/` フォルダにコピーしてください（順序が重要）：

1. `DialogueFramework.js` - メインプラグイン
2. `DialogueManager.js` - 会話管理
3. `DialogueSession.js` - セッション管理
4. `DialogueRenderer.js` - 描画処理
5. `CharacterDatabase.js` - キャラクターDB
6. `DialogueWindows.js` - UIウィンドウ

### 2. プラグイン有効化

プラグインマネージャーで上記の順序で有効化してください。

### 3. キャラクターDBの配置

`data/DialogueCharacters.json` にキャラクター定義を作成してください。

### 4. 立ち絵フォルダの作成（Portrait使用時）

`img/portraits/` フォルダを作成し、立ち絵画像を配置してください。

## 使用方法

### 基本的な会話

```
◆プラグインコマンド：DialogueStart
◆プラグインコマンド：Say
    ：キャラクターID = 1
    ：テキスト = こんにちは！
    ：状態キー = happy
◆プラグインコマンド：Say
    ：キャラクターID = 2
    ：テキスト = やあ、元気かい？
◆プラグインコマンド：DialogueEnd
```

### インライン演出（テキスト内コマンド）

Say / SimpleSay / CustomSay / SystemSay のテキスト内で以下の演出を使えます。

- `\SE[name,vol,pitch,pan]` : SE再生（vol=90, pitch=100, pan=0）
- `\SHAKE[px,duration,face]` : 文字ごとに揺れ（duration=-1で無限、face=1で顔も揺れる）
- `\SHAKE[-1]` : 揺れを終了
- `\WAVE[amp,len,speed]` : 左から順に上下に波打つ
- `\BOUNCE[height,speed]` : 文字が跳ねる
- `\FLOAT[amp,speed]` : ふわふわ上下
- `\SWAY[amp,speed]` : 左右に揺れる
- `\FADE[min,max,speed]` : 透過度の脈動
- `\RAINBOW[speed]` : 色が変化
- `\FXRESET` : 全エフェクト解除

```
\SHAKE[8,-1]こんにちは\SHAKE[-1]
\SHAKE[8,-1,1]こんにちは\SHAKE[-1]
\WAVE[6,12,0.12]こんにちは\FXRESET
\SE[Decision1]了解です。\BOUNCE[8]!!
```

### VN風表示（立ち絵）

```
◆プラグインコマンド：DialogueStart
    ：表示タイプ = portrait
◆プラグインコマンド：ShowPortrait
    ：キャラクターID = 1
    ：スロット = L
◆プラグインコマンド：ShowPortrait
    ：キャラクターID = 2
    ：スロット = R
◆プラグインコマンド：Say
    ：キャラクターID = 1
    ：テキスト = 証拠を見せてください。
    ：スロット = L
◆プラグインコマンド：DialogueEnd
```

### 選択肢

```
◆プラグインコマンド：Choice
    ：選択肢リスト = ["はい", "いいえ", "考え中..."]
    ：結果変数ID = 10
    ：キャンセル時選択 = 1
```

### 割り込み会話（矛盾指摘など）

```
// 通常会話中に...
◆プラグインコマンド：InterruptPush
    ：割り込みモード = branch

// 割り込み会話
◆プラグインコマンド：Say
    ：キャラクターID = 3
    ：テキスト = 待ってください！それは矛盾しています！

// 選択肢で復帰か続行か選択
◆プラグインコマンド：Choice
    ：選択肢リスト = ["会話に戻る", "追及を続ける"]
    ：結果変数ID = 20

◆条件分岐：変数[20] == 0
    ◆プラグインコマンド：InterruptResolve
        ：解決方法 = return
：それ以外
    ◆プラグインコマンド：InterruptResolve
        ：解決方法 = continue
：分岐終了
```

## プラグインコマンド一覧

### 会話制御

| コマンド | 説明 |
|---------|------|
| DialogueStart | 会話モード開始 |
| DialogueEnd | 会話モード終了 |

### 発話

| コマンド | 説明 |
|---------|------|
| Say | キャラDB参照の発話 |
| CustomSay | カスタム設定の発話 |
| SystemSay | システムメッセージ |

### 選択肢

| コマンド | 説明 |
|---------|------|
| Choice | 選択肢表示 |

### 割り込み

| コマンド | 説明 |
|---------|------|
| InterruptPush | 割り込み開始 |
| InterruptResolve | 割り込み解決 |

### 立ち絵

| コマンド | 説明 |
|---------|------|
| ShowPortrait | 立ち絵表示 |
| HidePortrait | 立ち絵非表示 |
| ClearPortraits | 全立ち絵クリア |

### ログ

| コマンド | 説明 |
|---------|------|
| OpenLog | ログ表示 |
| ClearLog | ログクリア |

### キャラ状態

| コマンド | 説明 |
|---------|------|
| SetCharState | キャラ状態変更 |

## キャラクターDB仕様

### 基本構造

```json
{
    "version": "0.1.0",
    "characters": [
        {
            "id": 1,
            "name": "アリス",
            "displayTypeDefault": "portrait",
            "face": { ... },
            "portrait": { ... },
            "states": ["normal", "happy", "sad"],
            "meta": { ... }
        }
    ]
}
```

### Face設定

```json
"face": {
    "faceName": "Actor1",
    "faceIndexByState": {
        "normal": 0,
        "happy": 1,
        "sad": 2
    }
}
```

### Portrait設定

```json
"portrait": {
    "base": "alice_normal",
    "byState": {
        "normal": "alice_normal",
        "happy": "alice_happy",
        "sad": "alice_sad"
    },
    "defaultSlot": "L",
    "anchor": "bottom"
}
```

## 入力操作

| キー | 動作 |
|-----|------|
| 決定 | 次へ進む |
| キャンセル | ログを開く |
| PageUp | ログを開く |
| Shift | オートモード切替 |
| Ctrl | スキップ（押している間） |

## プラグインパラメータ

詳細はプラグイン設定画面を参照してください。

### 主なパラメータ

- **一般設定**: デフォルト表示タイプ、キャラDBパス
- **メッセージウィンドウ**: サイズ、位置
- **文字送り**: 速度、オート待機時間
- **Portrait設定**: スロット位置、フェード時間
- **ログ**: 最大件数、保存モード

## 注意事項

- このプラグインは `$gameMessage` を使用しません
- 標準の「文章の表示」と併用可能ですが、混在は非推奨です
- 立ち絵画像は `img/portraits/` または `img/pictures/` に配置

## ロードマップ

### v0.2（予定）

- スクリプト形式の会話定義
- ボイス/SE対応
- ルビ（振り仮名）
- UIスキン差し替え

## ライセンス

MIT License

## 変更履歴

### v0.1.0

- 初期リリース
- 基本的な会話システム
- Face/Portraitモード
- 割り込み・復帰機能
- バックログ
