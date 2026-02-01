/*:
 * @target MZ
 * @plugindesc [v0.1.0] ビジュアルノベル級会話基盤プラグイン - Dialogue Framework MZ
 * @author ABC事件開発チーム
 * @url https://github.com/your-repo/dialogue-framework-mz
 *
 * @help
 * ============================================================================
 * Dialogue Framework MZ
 * ============================================================================
 * 
 * RPGツクールMZ向けの高機能会話システムプラグインです。
 * 
 * ■ 主な機能
 * - Face（MZ風）とPortrait（VN風）の2つの表示タイプ
 * - キャラクターデータベースによる一元管理
 * - 会話スタックによる割り込み・復帰機能
 * - バックログ（会話ログ）機能
 * - 選択肢システム
 * 
 * ■ 使用方法
 * 1. キャラクターデータソースを選択（JSON or プラグインパラメータ）
 * 2. キャラクター定義を作成
 * 3. プラグインコマンドで会話を制御
 * 
 * ■ キャラクターデータソース
 * - json: data/DialogueCharacters.json から読み込み
 * - parameter: プラグインパラメータで直接定義
 * - both: 両方を読み込み（パラメータ優先でマージ）
 * 
 * ============================================================================
 * プラグインコマンド一覧
 * ============================================================================
 * 
 * ● DialogueStart - 会話開始
 * ● DialogueEnd - 会話終了
 * ● Say - 発話（キャラDB参照）
 * ● SimpleSay - 簡易発話（キャラID/テキスト/状態のみ）
 * ● DialogueFade - ダイアログフェード（見た目のみ）
 * ● CustomSay - 発話（カスタム設定）
 * ● SystemSay - システムメッセージ
 * ● Choice - 選択肢表示
 * ● ItemChoice - アイテム選択
 * ● InterruptPush - 割り込み会話開始
 * ● InterruptResolve - 割り込み解決
 * ● OpenLog - ログ表示
 * ● ClearLog - ログクリア
 * ● SetCharState - キャラ状態変更
 * ● ShowPortrait - 立ち絵表示
 * ● HidePortrait - 立ち絵非表示
 * ● ClearPortraits - 全立ち絵クリア
 * 
 * ============================================================================
 * @param General
 * @text 一般設定
 * 
 * @param defaultDisplayType
 * @parent General
 * @text デフォルト表示タイプ
 * @type select
 * @option face
 * @option portrait
 * @default face
 * @desc 会話のデフォルト表示タイプ
 * 
 * @param CharacterDatabase
 * @text キャラクターDB設定
 * 
 * @param characterDataSource
 * @parent CharacterDatabase
 * @text データソース
 * @type select
 * @option json
 * @option parameter
 * @option both
 * @default parameter
 * @desc キャラクターデータの取得元（json=外部JSON, parameter=プラグイン設定, both=両方マージ）
 * 
 * @param characterDatabasePath
 * @parent CharacterDatabase
 * @text JSONファイルパス
 * @type string
 * @default data/DialogueCharacters.json
 * @desc キャラクターデータベースのJSONファイルパス（json/both選択時）
 * 
 * @param characterList
 * @parent CharacterDatabase
 * @text キャラクター定義
 * @type struct<Character>[]
 * @default ["{\"id\":\"0\",\"name\":\"\",\"displayTypeDefault\":\"face\",\"faceName\":\"\",\"faceIndexNormal\":\"0\",\"faceIndexHappy\":\"0\",\"faceIndexSad\":\"0\",\"faceIndexAngry\":\"0\",\"faceIndexSurprised\":\"0\",\"faceIndexThinking\":\"0\",\"faceIndexNervous\":\"0\",\"faceIndexSerious\":\"0\",\"faceIndexConfident\":\"0\",\"faceIndexCustom1\":\"0\",\"faceIndexCustom2\":\"0\",\"faceIndexCustom3\":\"0\",\"portraitBase\":\"\",\"portraitNormal\":\"\",\"portraitHappy\":\"\",\"portraitSad\":\"\",\"portraitAngry\":\"\",\"portraitSurprised\":\"\",\"portraitThinking\":\"\",\"portraitNervous\":\"\",\"portraitSerious\":\"\",\"portraitConfident\":\"\",\"portraitCustom1\":\"\",\"portraitCustom2\":\"\",\"portraitCustom3\":\"\",\"defaultSlot\":\"C\",\"states\":\"normal\",\"voicePrefix\":\"\",\"themeColor\":\"\",\"description\":\"システムメッセージ用\",\"isSystem\":\"true\",\"isAnonymous\":\"false\"}","{\"id\":\"1\",\"name\":\"主人公\",\"displayTypeDefault\":\"face\",\"faceName\":\"Actor1\",\"faceIndexNormal\":\"0\",\"faceIndexHappy\":\"1\",\"faceIndexSad\":\"2\",\"faceIndexAngry\":\"3\",\"faceIndexSurprised\":\"4\",\"faceIndexThinking\":\"5\",\"faceIndexNervous\":\"6\",\"faceIndexSerious\":\"7\",\"faceIndexConfident\":\"0\",\"faceIndexCustom1\":\"0\",\"faceIndexCustom2\":\"0\",\"faceIndexCustom3\":\"0\",\"portraitBase\":\"\",\"portraitNormal\":\"\",\"portraitHappy\":\"\",\"portraitSad\":\"\",\"portraitAngry\":\"\",\"portraitSurprised\":\"\",\"portraitThinking\":\"\",\"portraitNervous\":\"\",\"portraitSerious\":\"\",\"portraitConfident\":\"\",\"portraitCustom1\":\"\",\"portraitCustom2\":\"\",\"portraitCustom3\":\"\",\"defaultSlot\":\"L\",\"states\":\"normal,happy,sad,angry,surprised,thinking\",\"voicePrefix\":\"\",\"themeColor\":\"#4488FF\",\"description\":\"主人公キャラクター\",\"isSystem\":\"false\",\"isAnonymous\":\"false\"}"]
 * @desc キャラクター定義リスト（parameter/both選択時）。MZエディタで編集可能。
 * 
 * @param blockPlayerDuringDialogue
 * @parent General
 * @text 会話中プレイヤー移動禁止
 * @type boolean
 * @default true
 * @desc 会話中にプレイヤーの移動を禁止するか
 * 
 * @param keepMapStepAnimeDuringDialogue
 * @parent General
 * @text 会話中も足踏みアニメ
 * @type boolean
 * @default false
 * @desc 会話中もマップキャラクターの足踏みアニメを継続する
 * 
 * @param MessageWindow
 * @text メッセージウィンドウ設定
 * 
 * @param messageWindowWidth
 * @parent MessageWindow
 * @text ウィンドウ幅
 * @type number
 * @default 816
 * @desc メッセージウィンドウの幅
 * 
 * @param messageWindowHeight
 * @parent MessageWindow
 * @text ウィンドウ高さ
 * @type number
 * @default 160
 * @desc メッセージウィンドウの高さ
 * 
 * @param messageWindowX
 * @parent MessageWindow
 * @text ウィンドウX位置
 * @type string
 * @default 0
 * @desc メッセージウィンドウのX座標（-1で中央）
 * 
 * @param messageWindowY
 * @parent MessageWindow
 * @text ウィンドウY位置
 * @type string
 * @default -1
 * @desc メッセージウィンドウのY座標（-1で下部）
 * 
 * @param messageWindowPadding
 * @parent MessageWindow
 * @text ウィンドウパディング
 * @type number
 * @default 12
 * @desc メッセージウィンドウの内側余白
 * 
 * @param TypeWriter
 * @text 文字送り設定
 * 
 * @param typingSpeed
 * @parent TypeWriter
 * @text 文字送り速度
 * @type number
 * @min 1
 * @max 100
 * @default 2
 * @desc 1フレームあたりの表示文字数
 * 
 * @param autoModeDelay
 * @parent TypeWriter
 * @text オート送り待機時間
 * @type number
 * @default 60
 * @desc オートモード時の待機フレーム数
 * 
 * @param skipSpeed
 * @parent TypeWriter
 * @text スキップ速度
 * @type number
 * @default 10
 * @desc スキップ時の文字送り速度
 * 
 * @param NameBox
 * @text 名前ボックス設定
 * 
 * @param showNameBox
 * @parent NameBox
 * @text 名前ボックス表示
 * @type boolean
 * @default true
 * @desc 名前ボックスを表示するか
 * 
 * @param nameBoxWidth
 * @parent NameBox
 * @text 名前ボックス幅
 * @type number
 * @default 200
 * @desc 名前ボックスの幅
 * 
 * @param nameBoxOffsetX
 * @parent NameBox
 * @text 名前ボックスXオフセット
 * @type string
 * @default 0
 * @desc メッセージウィンドウからのXオフセット
 * 
 * @param nameBoxOffsetY
 * @parent NameBox
 * @text 名前ボックスYオフセット
 * @type string
 * @default -48
 * @desc メッセージウィンドウからのYオフセット
 * 
 * @param FaceMode
 * @text Faceモード設定
 * 
 * @param faceWidth
 * @parent FaceMode
 * @text 顔グラ幅
 * @type number
 * @default 144
 * @desc 顔グラフィックの表示幅
 * 
 * @param faceHeight
 * @parent FaceMode
 * @text 顔グラ高さ
 * @type number
 * @default 144
 * @desc 顔グラフィックの表示高さ
 * 
 * @param faceOffsetX
 * @parent FaceMode
 * @text 顔グラXオフセット
 * @type number
 * @default 4
 * @desc 顔グラフィックのXオフセット
 * 
 * @param faceOffsetY
 * @parent FaceMode
 * @text 顔グラYオフセット
 * @type number
 * @default 4
 * @desc 顔グラフィックのYオフセット
 * 
 * @param PortraitMode
 * @text Portraitモード設定
 * 
 * @param portraitFolder
 * @parent PortraitMode
 * @text 立ち絵フォルダ
 * @type string
 * @default img/portraits/
 * @desc 立ち絵画像のフォルダパス
 * 
 * @param portraitSlotL
 * @parent PortraitMode
 * @text スロットL位置X
 * @type number
 * @default 150
 * @desc 左スロットのX座標
 * 
 * @param portraitSlotC
 * @parent PortraitMode
 * @text スロットC位置X
 * @type number
 * @default 408
 * @desc 中央スロットのX座標
 * 
 * @param portraitSlotR
 * @parent PortraitMode
 * @text スロットR位置X
 * @type number
 * @default 666
 * @desc 右スロットのX座標
 * 
 * @param portraitBaseY
 * @parent PortraitMode
 * @text 立ち絵基準Y
 * @type number
 * @default 624
 * @desc 立ち絵のY座標基準（下端）
 * 
 * @param portraitScale
 * @parent PortraitMode
 * @text 立ち絵スケール
 * @type number
 * @decimals 2
 * @default 1.00
 * @desc 立ち絵の表示倍率
 * 
 * @param inactiveDim
 * @parent PortraitMode
 * @text 非話者の暗さ
 * @type number
 * @min 0
 * @max 255
 * @default 128
 * @desc 話者以外の立ち絵の暗さ（0-255）
 * 
 * @param portraitFadeDuration
 * @parent PortraitMode
 * @text フェード時間
 * @type number
 * @default 15
 * @desc 立ち絵の表示/非表示フェードフレーム数
 * 
 * @param Log
 * @text ログ設定
 * 
 * @param maxLogEntries
 * @parent Log
 * @text 最大ログ件数
 * @type number
 * @default 100
 * @desc 保存する最大ログ件数
 * 
 * @param logIncludeSystem
 * @parent Log
 * @text システムメッセージをログ
 * @type boolean
 * @default true
 * @desc システムメッセージをログに含めるか
 * 
 * @param logIncludeChoice
 * @parent Log
 * @text 選択肢をログ
 * @type boolean
 * @default true
 * @desc 選択肢をログに含めるか
 * 
 * @param logSaveMode
 * @parent Log
 * @text ログ保存モード
 * @type select
 * @option perSave
 * @option global
 * @default perSave
 * @desc ログの保存モード（セーブごと/グローバル）
 * 
 * @param Input
 * @text 入力設定
 * 
 * @param inputNext
 * @parent Input
 * @text 次へボタン
 * @type string
 * @default ok
 * @desc 次へ進むボタン
 * 
 * @param inputCancel
 * @parent Input
 * @text キャンセルボタン
 * @type string
 * @default cancel
 * @desc キャンセルボタン（ログ開く）
 * 
 * @param inputSkip
 * @parent Input
 * @text スキップボタン
 * @type string
 * @default control
 * @desc スキップボタン
 * 
 * @param inputAuto
 * @parent Input
 * @text オートボタン
 * @type string
 * @default shift
 * @desc オートモードトグルボタン
 * 
 * @param inputLog
 * @parent Input
 * @text ログボタン
 * @type string
 * @default pageup
 * @desc ログ表示ボタン
 * 
 * @param Choice
 * @text 選択肢設定
 * 
 * @param choiceWindowWidth
 * @parent Choice
 * @text 選択肢ウィンドウ幅
 * @type number
 * @default 400
 * @desc 選択肢ウィンドウの幅
 * 
 * @param choiceWindowX
 * @parent Choice
 * @text 選択肢ウィンドウX
 * @type string
 * @default -1
 * @desc 選択肢ウィンドウのX座標（-1で中央）
 * 
 * @param choiceWindowY
 * @parent Choice
 * @text 選択肢ウィンドウY
 * @type string
 * @default 200
 * @desc 選択肢ウィンドウのY座標
 * 
 * @param choiceAlignment
 * @parent Choice
 * @text 選択肢テキスト配置
 * @type select
 * @option left
 * @option center
 * @option right
 * @default center
 * @desc 選択肢テキストの配置
 *
 * @param itemChoiceRows
 * @parent Choice
 * @text アイテム選択行数
 * @type number
 * @min 1
 * @default 1
 * @desc アイテム選択の表示行数
 * 
 * @param itemChoiceCols
 * @parent Choice
 * @text アイテム選択列数
 * @type number
 * @min 1
 * @default 2
 * @desc アイテム選択の表示列数
 * 
 * @param Interrupt
 * @text 割り込み設定
 * 
 * @param showInterruptButton
 * @parent Interrupt
 * @text 遮るボタン表示
 * @type boolean
 * @default false
 * @desc 会話中に遮るボタンを表示するか
 * 
 * @param interruptButtonText
 * @parent Interrupt
 * @text 遮るボタンテキスト
 * @type string
 * @default 遮る
 * @desc 遮るボタンの表示テキスト
 * 
 * @param interruptSwitchId
 * @parent Interrupt
 * @text 遮るボタン表示スイッチ
 * @type switch
 * @default 0
 * @desc このスイッチがONの時のみ遮るボタンを表示（0で常時）
 * 
 * @param interruptButtonBackgroundType
 * @parent Interrupt
 * @text 遮るボタン背景タイプ
 * @type select
 * @option window
 * @option dim
 * @option transparent
 * @default window
 * @desc 遮るボタンの背景タイプ
 * 
 * @param interruptButtonWindowskin
 * @parent Interrupt
 * @text 遮るボタンウィンドウスキン
 * @type file
 * @dir img/system
 * @default 
 * @desc 遮るボタン専用のウィンドウスキン（空欄でデフォルト）
 * 
 * @param interruptButtonPicture
 * @parent Interrupt
 * @text 遮るボタンピクチャー
 * @type file
 * @dir img/pictures
 * @default 
 * @desc 遮るボタン背景に使うピクチャー（systemが未設定の場合に使用）
 *
 * @param interruptButtonWidth
 * @parent Interrupt
 * @text 遮るボタン幅
 * @type number
 * @default 120
 * @desc 遮るボタンウィンドウの幅
 *
 * @param interruptButtonHeight
 * @parent Interrupt
 * @text 遮るボタン高さ
 * @type number
 * @default 36
 * @desc 遮るボタンウィンドウの高さ
 *
 * @param interruptButtonOffsetX
 * @parent Interrupt
 * @text 遮るボタンXオフセット
 * @type number
 * @default -8
 * @desc メッセージウィンドウ右端からのXオフセット
 *
 * @param interruptButtonOffsetY
 * @parent Interrupt
 * @text 遮るボタンYオフセット
 * @type number
 * @default -4
 * @desc メッセージウィンドウ上端からのYオフセット
 *
 * @param interruptButtonPictureOffsetX
 * @parent Interrupt
 * @text 遮るピクチャーXオフセット
 * @type number
 * @default 0
 * @desc 遮るボタンピクチャーのXオフセット
 *
 * @param interruptButtonPictureOffsetY
 * @parent Interrupt
 * @text 遮るピクチャーYオフセット
 * @type number
 * @default 0
 * @desc 遮るボタンピクチャーのYオフセット
 * 
 * @param interruptButtonCommonEventId
 * @parent Interrupt
 * @text 遮るボタンコモンイベント
 * @type common_event
 * @default 0
 * @desc 遮るボタンを押した時に呼び出すコモンイベント（0で無効）
 * 
 * @command InterruptButtonVisible
 * @text 遮るボタン表示切替
 * @desc 遮るボタンの表示/非表示を切り替えます
 * 
 * @arg visible
 * @text 表示する
 * @type boolean
 * @default true
 * 
 * @command DialogueStart
 * @text 会話開始
 * @desc 会話モードを開始します
 * 
 * @arg blockPlayer
 * @text プレイヤー移動禁止
 * @type boolean
 * @default true
 * 
 * @arg fadeIn
 * @text フェードイン
 * @type boolean
 * @default true
 * 
 * @arg displayType
 * @text 表示タイプ
 * @type select
 * @option default
 * @option face
 * @option portrait
 * @default default
 * 
 * @command DialogueEnd
 * @text 会話終了
 * @desc 会話モードを終了します
 * 
 * @arg fadeOut
 * @text フェードアウト
 * @type boolean
 * @default true
 * 
 * @arg keepPortraits
 * @text 立ち絵維持
 * @type boolean
 * @default false
 * 
 * @command Say
 * @text 発話
 * @desc キャラクターに発話させます
 * 
 * @arg characterId
 * @text キャラクターID
 * @type number
 * @min 0
 * @default 1
 * @desc 発話するキャラクターのID（0=システム）
 * 
 * @arg text
 * @text テキスト
 * @type multiline_string
 * @desc 発話テキスト。InlineFX: \SE[name] \SHAKE[px,duration,face] \SHAKE[-1] \WAVE[amp,len,speed] \BOUNCE[h,s] \FLOAT[a,s] \SWAY[a,s] \FADE[min,max,s] \RAINBOW[s] \FXRESET
 * 
 * @arg stateKey
 * @text 状態キー
 * @type string
 * @desc 表情/状態（normal, angry, sad など）
 * 
 * @arg displayType
 * @text 表示タイプ
 * @type select
 * @option default
 * @option face
 * @option portrait
 * @default default
 * 
 * @arg slot
 * @text 立ち絵スロット
 * @type select
 * @option default
 * @option L
 * @option C
 * @option R
 * @default default
 * 
 * @arg updateState
 * @text 状態を永続更新
 * @type boolean
 * @default false
 * @desc 発話後もキャラ状態を維持するか
 * 
 * @arg addToLog
 * @text ログに追加
 * @type boolean
 * @default true
 * 
 * @arg claimId
 * @text クレームID
 * @type string
 * @desc 矛盾指摘用のID（将来拡張用）
 * 
 * @arg tags
 * @text タグ
 * @type string
 * @desc カンマ区切りのタグ（将来拡張用）

 * @command SimpleSay
 * @text 簡易発言
 * @desc キャラクターID/テキスト/状態キーのみ指定して発話します（その他はデフォルト）
 *
 * @arg characterId
 * @text キャラクターID
 * @type number
 * @min 0
 * @default 1
 * @desc 発話するキャラクターのID（0=システム）
 *
 * @arg text
 * @text テキスト
 * @type multiline_string
 * @desc 発話テキスト。InlineFX: \SE[name] \SHAKE[px,duration,face] \SHAKE[-1] \WAVE[amp,len,speed] \BOUNCE[h,s] \FLOAT[a,s] \SWAY[a,s] \FADE[min,max,s] \RAINBOW[s] \FXRESET
 *
 * @arg stateKey
 * @text 状態キー
 * @type string
 * @desc 表情/状態（normal, angry, sad など）

 * @command DialogueFade
 * @text ダイアログフェード
 * @desc 会話の内部状態は保持したまま、見た目だけフェードアウト/フェードインします
 *
 * @arg mode
 * @text フェード種別
 * @type select
 * @option out
 * @option in
 * @option outIn
 * @default outIn
 *
 * @arg duration
 * @text フェード時間
 * @type number
 * @min 0
 * @default 0
 * @desc フェードにかけるフレーム数（0でデフォルト速度）
 * 
 * @command CustomSay
 * @text カスタム発話
 * @desc カスタム設定で発話させます
 * 
 * @arg text
 * @text テキスト
 * @type multiline_string
 * @desc 発話テキスト。InlineFX: \SE[name] \SHAKE[px,duration,face] \SHAKE[-1] \WAVE[amp,len,speed] \BOUNCE[h,s] \FLOAT[a,s] \SWAY[a,s] \FADE[min,max,s] \RAINBOW[s] \FXRESET
 * 
 * @arg nameOverride
 * @text 名前上書き
 * @type string
 * @desc 表示する名前（空欄で名前なし）
 * 
 * @arg faceNameOverride
 * @text 顔ファイル上書き
 * @type file
 * @dir img/faces
 * @desc 顔グラフィックファイル
 * 
 * @arg faceIndexOverride
 * @text 顔インデックス上書き
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * 
 * @arg portraitOverride
 * @text 立ち絵上書き
 * @type file
 * @dir img/portraits
 * @desc 立ち絵ファイル
 * 
 * @arg displayType
 * @text 表示タイプ
 * @type select
 * @option default
 * @option face
 * @option portrait
 * @default default
 * 
 * @arg slot
 * @text 立ち絵スロット
 * @type select
 * @option default
 * @option L
 * @option C
 * @option R
 * @default default
 * 
 * @arg addToLog
 * @text ログに追加
 * @type boolean
 * @default true
 * 
 * @command SystemSay
 * @text システムメッセージ
 * @desc システムメッセージを表示します（顔/立ち絵なし）
 * 
 * @arg text
 * @text テキスト
 * @type multiline_string
 * @desc 表示テキスト。InlineFX: \SE[name] \SHAKE[px,duration,face] \SHAKE[-1] \WAVE[amp,len,speed] \BOUNCE[h,s] \FLOAT[a,s] \SWAY[a,s] \FADE[min,max,s] \RAINBOW[s] \FXRESET
 * 
 * @arg addToLog
 * @text ログに追加
 * @type boolean
 * @default true
 * 
 * @command Choice
 * @text 選択肢
 * @desc 選択肢を表示します
 * 
 * @arg choices
 * @text 選択肢リスト
 * @type string[]
 * @desc 選択肢のテキスト
 * 
 * @arg resultVariableId
 * @text 結果変数ID
 * @type variable
 * @default 1
 * @desc 選択結果を格納する変数
 * 
 * @arg cancelIndex
 * @text キャンセル時選択
 * @type number
 * @min -1
 * @default -1
 * @desc キャンセル時に選択するインデックス（-1で無効）
 * 
 * @arg addToLog
 * @text ログに追加
 * @type boolean
 * @default true
 * 
 * @command ItemChoice
 * @text アイテム選択
 * @desc 所持アイテムから選択します
 *
 * @arg itemTypes
 * @text 表示アイテム種別
 * @type select
 * @option normal
 * @option key
 * @option both
 * @default both
 * @desc normal=基本, key=大事, both=両方
 *
 * @arg excludeItemIds
 * @text 除外アイテムID
 * @type string
 * @default
 * @desc 除外するアイテムID（カンマ区切り）
 *
 * @arg resultVariableId
 * @text 結果変数ID
 * @type variable
 * @default 1
 * @desc 選択したアイテムIDを格納する変数
 *
 * @arg cancelValue
 * @text キャンセル時の値
 * @type number
 * @default -1
 * @desc キャンセル時に変数へ入れる値
 *
 * @arg rows
 * @text 表示行数
 * @type number
 * @min 1
 * @default 4
 * @desc 表示する行数
 *
 * @arg cols
 * @text 表示列数
 * @type number
 * @min 1
 * @default 2
 * @desc 表示する列数
 *
 * @arg addToLog
 * @text ログに追加
 * @type boolean
 * @default true
 * 
 * @command InterruptPush
 * @text 割り込み開始
 * @desc 会話に割り込みます
 * 
 * @arg mode
 * @text 割り込みモード
 * @type select
 * @option return
 * @option replace
 * @option branch
 * @default return
 * @desc return=復帰, replace=置換, branch=選択可能
 * 
 * @arg pauseBase
 * @text 元会話停止
 * @type boolean
 * @default true
 * 
 * @command InterruptResolve
 * @text 割り込み解決
 * @desc 割り込み会話を解決します
 * 
 * @arg resolution
 * @text 解決方法
 * @type select
 * @option return
 * @option continue
 * @default return
 * @desc return=元会話に復帰, continue=このまま続行
 * 
 * @command OpenLog
 * @text ログ表示
 * @desc 会話ログを表示します
 * 
 * @command ClearLog
 * @text ログクリア
 * @desc 会話ログをクリアします
 * 
 * @arg scope
 * @text クリア範囲
 * @type select
 * @option current
 * @option all
 * @default current
 * 
 * @command SetCharState
 * @text キャラ状態変更
 * @desc キャラクターの状態を変更します
 * 
 * @arg characterId
 * @text キャラクターID
 * @type number
 * @min 1
 * @default 1
 * 
 * @arg stateKey
 * @text 状態キー
 * @type string
 * @default normal
 * 
 * @command ShowPortrait
 * @text 立ち絵表示
 * @desc 立ち絵を表示します
 * 
 * @arg characterId
 * @text キャラクターID
 * @type number
 * @min 1
 * @default 1
 * 
 * @arg slot
 * @text スロット
 * @type select
 * @option L
 * @option C
 * @option R
 * @default C
 * 
 * @arg stateKey
 * @text 状態キー
 * @type string
 * 
 * @arg fadeIn
 * @text フェードイン
 * @type boolean
 * @default true
 * 
 * @command HidePortrait
 * @text 立ち絵非表示
 * @desc 立ち絵を非表示にします
 * 
 * @arg slot
 * @text スロット
 * @type select
 * @option L
 * @option C
 * @option R
 * @default C
 * 
 * @arg fadeOut
 * @text フェードアウト
 * @type boolean
 * @default true
 * 
 * @command ClearPortraits
 * @text 全立ち絵クリア
 * @desc すべての立ち絵を非表示にします
 * 
 * @arg fadeOut
 * @text フェードアウト
 * @type boolean
 * @default true
 */

(() => {
    'use strict';

    const PLUGIN_NAME = 'DialogueFramework';
    
    //=============================================================================
    // Plugin Parameters
    //=============================================================================
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    
    // キャラクターリストのパース関数
    function parseCharacterList(paramData) {
        if (!paramData) return [];
        
        let arr = [];
        
        // PluginManager.parameters() で既にパースされている場合
        if (Array.isArray(paramData)) {
            arr = paramData;
        } else if (typeof paramData === 'string') {
            // 文字列の場合はJSON.parse
            try {
                arr = JSON.parse(paramData);
            } catch (e) {
                console.error('DialogueFramework: Failed to parse character list', e);
                return [];
            }
        } else {
            return [];
        }
        
        // 各要素をオブジェクトに変換（文字列の場合はパース）
        return arr.map(charData => {
            let char = charData;
            if (typeof charData === 'string') {
                try {
                    char = JSON.parse(charData);
                } catch (e) {
                    console.error('DialogueFramework: Failed to parse character', e);
                    return null;
                }
            }
            return convertParameterCharacter(char);
        }).filter(c => c !== null);
    }
    
    // プラグインパラメータ形式からDB形式へ変換
    function convertParameterCharacter(p) {
        const faceIndexByState = {};
        const portraitByState = {};
        const states = (p.states || 'normal').split(',').map(s => s.trim());
        
        // 顔インデックスマッピング
        const faceStateMap = {
            'normal': Number(p.faceIndexNormal) || 0,
            'happy': Number(p.faceIndexHappy) || 0,
            'sad': Number(p.faceIndexSad) || 0,
            'angry': Number(p.faceIndexAngry) || 0,
            'surprised': Number(p.faceIndexSurprised) || 0,
            'thinking': Number(p.faceIndexThinking) || 0,
            'nervous': Number(p.faceIndexNervous) || 0,
            'serious': Number(p.faceIndexSerious) || 0,
            'confident': Number(p.faceIndexConfident) || 0,
            'custom1': Number(p.faceIndexCustom1) || 0,
            'custom2': Number(p.faceIndexCustom2) || 0,
            'custom3': Number(p.faceIndexCustom3) || 0
        };
        
        // 立ち絵マッピング
        const portraitStateMap = {
            'normal': p.portraitNormal || '',
            'happy': p.portraitHappy || '',
            'sad': p.portraitSad || '',
            'angry': p.portraitAngry || '',
            'surprised': p.portraitSurprised || '',
            'thinking': p.portraitThinking || '',
            'nervous': p.portraitNervous || '',
            'serious': p.portraitSerious || '',
            'confident': p.portraitConfident || '',
            'custom1': p.portraitCustom1 || '',
            'custom2': p.portraitCustom2 || '',
            'custom3': p.portraitCustom3 || ''
        };
        
        // 状態ごとのマッピングを構築
        states.forEach(state => {
            if (faceStateMap.hasOwnProperty(state)) {
                faceIndexByState[state] = faceStateMap[state];
            }
            if (portraitStateMap.hasOwnProperty(state) && portraitStateMap[state]) {
                portraitByState[state] = portraitStateMap[state];
            }
        });
        
        // 顔グラ設定
        const face = p.faceName ? {
            faceName: p.faceName,
            faceIndexByState: faceIndexByState
        } : null;
        
        // 立ち絵設定
        const portrait = p.portraitBase ? {
            base: p.portraitBase,
            byState: portraitByState,
            defaultSlot: p.defaultSlot || 'C',
            anchor: 'bottom'
        } : null;
        
        return {
            id: Number(p.id) || 0,
            name: p.name || '',
            displayTypeDefault: p.displayTypeDefault || 'face',
            face: face,
            portrait: portrait,
            states: states,
            meta: {
                voicePrefix: p.voicePrefix || '',
                themeColor: p.themeColor || '',
                description: p.description || '',
                isSystem: p.isSystem === 'true',
                isAnonymous: p.isAnonymous === 'true'
            }
        };
    }
    
    const Params = {
        // General
        defaultDisplayType: parameters['defaultDisplayType'] || 'face',
        blockPlayerDuringDialogue: parameters['blockPlayerDuringDialogue'] === 'true',
        keepMapStepAnimeDuringDialogue: parameters['keepMapStepAnimeDuringDialogue'] === 'true',
        
        // Character Database
        characterDataSource: parameters['characterDataSource'] || 'parameter',
        characterDatabasePath: parameters['characterDatabasePath'] || 'data/DialogueCharacters.json',
        characterList: parseCharacterList(parameters['characterList']),
        
        // Message Window
        messageWindowWidth: Number(parameters['messageWindowWidth']) || 816,
        messageWindowHeight: Number(parameters['messageWindowHeight']) || 160,
        messageWindowX: Number(parameters['messageWindowX']) || 0,
        messageWindowY: Number(parameters['messageWindowY']) || -1,
        messageWindowPadding: Number(parameters['messageWindowPadding']) || 12,
        
        // TypeWriter
        typingSpeed: Number(parameters['typingSpeed']) || 2,
        autoModeDelay: Number(parameters['autoModeDelay']) || 60,
        skipSpeed: Number(parameters['skipSpeed']) || 10,
        
        // NameBox
        showNameBox: parameters['showNameBox'] !== 'false',
        nameBoxWidth: Number(parameters['nameBoxWidth']) || 200,
        nameBoxOffsetX: Number(parameters['nameBoxOffsetX']) || 0,
        nameBoxOffsetY: Number(parameters['nameBoxOffsetY']) || -48,
        
        // Face Mode
        faceWidth: Number(parameters['faceWidth']) || 144,
        faceHeight: Number(parameters['faceHeight']) || 144,
        faceOffsetX: Number(parameters['faceOffsetX']) || 4,
        faceOffsetY: Number(parameters['faceOffsetY']) || 4,
        
        // Portrait Mode
        portraitFolder: parameters['portraitFolder'] || 'img/portraits/',
        portraitSlotL: Number(parameters['portraitSlotL']) || 150,
        portraitSlotC: Number(parameters['portraitSlotC']) || 408,
        portraitSlotR: Number(parameters['portraitSlotR']) || 666,
        portraitBaseY: Number(parameters['portraitBaseY']) || 624,
        portraitScale: Number(parameters['portraitScale']) || 1.0,
        inactiveDim: Number(parameters['inactiveDim']) || 128,
        portraitFadeDuration: Number(parameters['portraitFadeDuration']) || 15,
        
        // Log
        maxLogEntries: Number(parameters['maxLogEntries']) || 100,
        logIncludeSystem: parameters['logIncludeSystem'] !== 'false',
        logIncludeChoice: parameters['logIncludeChoice'] !== 'false',
        logSaveMode: parameters['logSaveMode'] || 'perSave',
        
        // Input
        inputNext: parameters['inputNext'] || 'ok',
        inputCancel: parameters['inputCancel'] || 'cancel',
        inputSkip: parameters['inputSkip'] || 'control',
        inputAuto: parameters['inputAuto'] || 'shift',
        inputLog: parameters['inputLog'] || 'pageup',
        
        // Choice
        choiceWindowWidth: Number(parameters['choiceWindowWidth']) || 400,
        choiceWindowX: Number(parameters['choiceWindowX']) || -1,
        choiceWindowY: Number(parameters['choiceWindowY']) || 200,
        choiceAlignment: parameters['choiceAlignment'] || 'center',
        itemChoiceRows: Number(parameters['itemChoiceRows']) || 1,
        itemChoiceCols: Number(parameters['itemChoiceCols']) || 2,
        
        // Interrupt
        showInterruptButton: parameters['showInterruptButton'] === 'true',
        interruptButtonText: parameters['interruptButtonText'] || '遮る',
        interruptSwitchId: Number(parameters['interruptSwitchId']) || 0,
        interruptButtonBackgroundType: parameters['interruptButtonBackgroundType'] || 'window',
        interruptButtonWindowskin: parameters['interruptButtonWindowskin'] || '',
        interruptButtonPicture: parameters['interruptButtonPicture'] || '',
        interruptButtonCommonEventId: Number(parameters['interruptButtonCommonEventId']) || 0,
        interruptButtonWidth: Number(parameters['interruptButtonWidth']) || 120,
        interruptButtonHeight: Number(parameters['interruptButtonHeight']) || 36,
        interruptButtonOffsetX: Number(parameters['interruptButtonOffsetX']) || -8,
        interruptButtonOffsetY: Number(parameters['interruptButtonOffsetY']) || -4,
        interruptButtonPictureOffsetX: Number(parameters['interruptButtonPictureOffsetX']) || 0,
        interruptButtonPictureOffsetY: Number(parameters['interruptButtonPictureOffsetY']) || 0
    };

    //=============================================================================
    // Export to global scope
    //=============================================================================
    window.DialogueFramework = window.DialogueFramework || {};
    window.DialogueFramework.Params = Params;

    //=============================================================================
    // Plugin Commands Registration
    //=============================================================================
    
    PluginManager.registerCommand(PLUGIN_NAME, 'DialogueStart', function(args) {
        const blockPlayer = args.blockPlayer !== 'false';
        const fadeIn = args.fadeIn !== 'false';
        const displayType = args.displayType === 'default' ? null : args.displayType;
        
        DialogueManager.start({
            blockPlayer: blockPlayer,
            fadeIn: fadeIn,
            displayType: displayType
        });
        
        this.setWaitMode('dialogue');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'DialogueEnd', function(args) {
        const fadeOut = args.fadeOut !== 'false';
        const keepPortraits = args.keepPortraits === 'true';
        
        DialogueManager.end({
            fadeOut: fadeOut,
            keepPortraits: keepPortraits
        });
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'Say', function(args) {
        const characterId = Number(args.characterId) || 0;
        const text = args.text || '';
        const stateKey = args.stateKey || null;
        const displayType = args.displayType === 'default' ? null : args.displayType;
        const slot = args.slot === 'default' ? null : args.slot;
        const updateState = args.updateState === 'true';
        const addToLog = args.addToLog !== 'false';
        const claimId = args.claimId || null;
        const tags = args.tags ? args.tags.split(',').map(t => t.trim()) : [];
        
        DialogueManager.say({
            characterId: characterId,
            text: text,
            stateKey: stateKey,
            displayType: displayType,
            slot: slot,
            updateState: updateState,
            addToLog: addToLog,
            meta: {
                claimId: claimId,
                tags: tags
            }
        });
        
        this.setWaitMode('dialogue');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'SimpleSay', function(args) {
        const characterId = Number(args.characterId) || 0;
        const text = args.text || '';
        const stateKey = args.stateKey || null;

        DialogueManager.say({
            characterId: characterId,
            text: text,
            stateKey: stateKey,
            displayType: null,
            slot: null,
            updateState: false,
            forceLog: true,
            meta: {
                claimId: null,
                tags: []
            }
        });

        this.setWaitMode('dialogue');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'DialogueFade', function(args) {
        const mode = args.mode || 'outIn';
        const duration = args.duration !== undefined ? Number(args.duration) : 0;

        DialogueManager.fade({
            mode: mode,
            duration: duration
        });

        this.setWaitMode('dialogueFade');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'CustomSay', function(args) {
        const text = args.text || '';
        const nameOverride = args.nameOverride || null;
        const faceNameOverride = args.faceNameOverride || null;
        const faceIndexOverride = args.faceIndexOverride !== undefined ? Number(args.faceIndexOverride) : null;
        const portraitOverride = args.portraitOverride || null;
        const displayType = args.displayType === 'default' ? null : args.displayType;
        const slot = args.slot === 'default' ? null : args.slot;
        const addToLog = args.addToLog !== 'false';
        
        DialogueManager.customSay({
            text: text,
            nameOverride: nameOverride,
            faceOverride: faceNameOverride ? {
                faceName: faceNameOverride,
                faceIndex: faceIndexOverride || 0
            } : null,
            portraitOverride: portraitOverride,
            displayType: displayType,
            slot: slot,
            addToLog: addToLog
        });
        
        this.setWaitMode('dialogue');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'SystemSay', function(args) {
        const text = args.text || '';
        const addToLog = args.addToLog !== 'false';
        
        DialogueManager.systemSay({
            text: text,
            addToLog: addToLog
        });
        
        this.setWaitMode('dialogue');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'Choice', function(args) {
        const choices = JSON.parse(args.choices || '[]');
        const resultVariableId = Number(args.resultVariableId) || 1;
        const cancelIndex = Number(args.cancelIndex);
        const addToLog = args.addToLog !== 'false';
        
        DialogueManager.showChoice({
            choices: choices,
            resultVariableId: resultVariableId,
            cancelIndex: cancelIndex,
            addToLog: addToLog
        });
        
        this.setWaitMode('dialogueChoice');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'ItemChoice', function(args) {
        const itemTypes = args.itemTypes || 'both';
        const excludeItemIds = args.excludeItemIds || '';
        const resultVariableId = Number(args.resultVariableId) || 1;
        const cancelValue = args.cancelValue !== undefined ? Number(args.cancelValue) : -1;
        const rows = args.rows !== undefined ? Number(args.rows) : 4;
        const cols = args.cols !== undefined ? Number(args.cols) : 2;
        const addToLog = args.addToLog !== 'false';

        DialogueManager.showItemChoice({
            itemTypes: itemTypes,
            excludeItemIds: excludeItemIds,
            resultVariableId: resultVariableId,
            cancelValue: cancelValue,
            rows: rows,
            cols: cols,
            addToLog: addToLog
        });

        this.setWaitMode('dialogueItemChoice');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'InterruptPush', function(args) {
        const mode = args.mode || 'return';
        const pauseBase = args.pauseBase !== 'false';
        
        DialogueManager.interruptPush({
            mode: mode,
            pauseBase: pauseBase
        });

        if (pauseBase && !this._isDialogueInterruptParallel) {
            this.setWaitMode('dialogueInterrupt');
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'InterruptResolve', function(args) {
        const resolution = args.resolution || 'return';
        
        DialogueManager.interruptResolve({
            resolution: resolution
        });
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'InterruptButtonVisible', function(args) {
        const visible = args.visible !== 'false';
        DialogueManager.setInterruptButtonVisible(visible);
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'OpenLog', function(args) {
        DialogueManager.openLog();
        this.setWaitMode('dialogueLog');
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'ClearLog', function(args) {
        const scope = args.scope || 'current';
        DialogueManager.clearLog(scope);
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'SetCharState', function(args) {
        const characterId = Number(args.characterId) || 1;
        const stateKey = args.stateKey || 'normal';
        
        CharacterDatabase.setCharacterState(characterId, stateKey);
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'ShowPortrait', function(args) {
        const characterId = Number(args.characterId) || 1;
        const slot = args.slot || 'C';
        const stateKey = args.stateKey || null;
        const fadeIn = args.fadeIn !== 'false';
        
        DialogueRenderer.showPortrait({
            characterId: characterId,
            slot: slot,
            stateKey: stateKey,
            fadeIn: fadeIn
        });
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'HidePortrait', function(args) {
        const slot = args.slot || 'C';
        const fadeOut = args.fadeOut !== 'false';
        
        DialogueRenderer.hidePortrait({
            slot: slot,
            fadeOut: fadeOut
        });
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'ClearPortraits', function(args) {
        const fadeOut = args.fadeOut !== 'false';
        
        DialogueRenderer.clearPortraits({
            fadeOut: fadeOut
        });
    });

    //=============================================================================
    // Game_Interpreter - Wait Mode Extension
    //=============================================================================
    
    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (DialogueManager.isInterruptPaused && DialogueManager.isInterruptPaused() && !this._isDialogueInterruptParallel) {
            return true;
        }
        if (this._waitMode === 'dialogue') {
            return DialogueManager.isBusy();
        } else if (this._waitMode === 'dialogueChoice') {
            return DialogueManager.isChoiceBusy();
        } else if (this._waitMode === 'dialogueItemChoice') {
            return DialogueManager.isItemChoiceBusy();
        } else if (this._waitMode === 'dialogueLog') {
            return DialogueManager.isLogOpen();
        } else if (this._waitMode === 'dialogueFade') {
            return DialogueManager.isFadeBusy();
        } else if (this._waitMode === 'dialogueInterrupt') {
            return DialogueManager.isInterruptPaused();
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    const _Game_Interpreter_setupChild = Game_Interpreter.prototype.setupChild;
    Game_Interpreter.prototype.setupChild = function(list, eventId) {
        _Game_Interpreter_setupChild.call(this, list, eventId);
        if (this._childInterpreter && this._isDialogueInterruptParallel) {
            this._childInterpreter._isDialogueInterruptParallel = true;
        }
    };

    const _Scene_Title_start = Scene_Title.prototype.start;
    Scene_Title.prototype.start = function() {
        _Scene_Title_start.call(this);
        if (window.DialogueManager && DialogueManager.forceReset) {
            DialogueManager.forceReset();
        }
    };

    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        if (window.DialogueManager && DialogueManager.forceReset) {
            DialogueManager.forceReset();
        }
    };

    const _Scene_Load_onLoadSuccess = Scene_Load.prototype.onLoadSuccess;
    Scene_Load.prototype.onLoadSuccess = function() {
        _Scene_Load_onLoadSuccess.call(this);
        if (window.DialogueManager && DialogueManager.forceReset) {
            DialogueManager.forceReset();
        }
    };

})();

/*~struct~Character:
 * @param id
 * @text キャラクターID
 * @type number
 * @min 0
 * @default 1
 * @desc キャラクターの一意識別ID（0=システムメッセージ）
 * 
 * @param name
 * @text 表示名
 * @type string
 * @default 
 * @desc 会話時に表示される名前
 * 
 * @param displayTypeDefault
 * @text デフォルト表示タイプ
 * @type select
 * @option face
 * @option portrait
 * @default face
 * @desc このキャラのデフォルト表示タイプ
 * 
 * @param FaceSettings
 * @text 顔グラフィック設定
 * 
 * @param faceName
 * @parent FaceSettings
 * @text 顔グラファイル
 * @type file
 * @dir img/faces
 * @default 
 * @desc 顔グラフィックのファイル（img/faces/）
 * 
 * @param faceIndexNormal
 * @parent FaceSettings
 * @text 通常時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc normal状態の顔インデックス（0-7）
 * 
 * @param faceIndexHappy
 * @parent FaceSettings
 * @text 嬉しい時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc happy状態の顔インデックス（0-7）
 * 
 * @param faceIndexSad
 * @parent FaceSettings
 * @text 悲しい時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc sad状態の顔インデックス（0-7）
 * 
 * @param faceIndexAngry
 * @parent FaceSettings
 * @text 怒り時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc angry状態の顔インデックス（0-7）
 * 
 * @param faceIndexSurprised
 * @parent FaceSettings
 * @text 驚き時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc surprised状態の顔インデックス（0-7）
 * 
 * @param faceIndexThinking
 * @parent FaceSettings
 * @text 考え中インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc thinking状態の顔インデックス（0-7）
 * 
 * @param faceIndexNervous
 * @parent FaceSettings
 * @text 緊張時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc nervous状態の顔インデックス（0-7）
 * 
 * @param faceIndexSerious
 * @parent FaceSettings
 * @text 真剣時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc serious状態の顔インデックス（0-7）
 * 
 * @param faceIndexConfident
 * @parent FaceSettings
 * @text 自信時インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc confident状態の顔インデックス（0-7）
 * 
 * @param faceIndexCustom1
 * @parent FaceSettings
 * @text カスタム1インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc custom1状態の顔インデックス（0-7）
 * 
 * @param faceIndexCustom2
 * @parent FaceSettings
 * @text カスタム2インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc custom2状態の顔インデックス（0-7）
 * 
 * @param faceIndexCustom3
 * @parent FaceSettings
 * @text カスタム3インデックス
 * @type number
 * @min 0
 * @max 7
 * @default 0
 * @desc custom3状態の顔インデックス（0-7）
 * 
 * @param PortraitSettings
 * @text 立ち絵設定
 * 
 * @param portraitBase
 * @parent PortraitSettings
 * @text 基本立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc 基本の立ち絵ファイル（img/pictures/）
 * 
 * @param portraitNormal
 * @parent PortraitSettings
 * @text 通常時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc normal状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitHappy
 * @parent PortraitSettings
 * @text 嬉しい時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc happy状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitSad
 * @parent PortraitSettings
 * @text 悲しい時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc sad状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitAngry
 * @parent PortraitSettings
 * @text 怒り時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc angry状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitSurprised
 * @parent PortraitSettings
 * @text 驚き時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc surprised状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitThinking
 * @parent PortraitSettings
 * @text 考え中立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc thinking状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitNervous
 * @parent PortraitSettings
 * @text 緊張時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc nervous状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitSerious
 * @parent PortraitSettings
 * @text 真剣時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc serious状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitConfident
 * @parent PortraitSettings
 * @text 自信時立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc confident状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitCustom1
 * @parent PortraitSettings
 * @text カスタム1立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc custom1状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitCustom2
 * @parent PortraitSettings
 * @text カスタム2立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc custom2状態の立ち絵（空欄で基本を使用）
 * 
 * @param portraitCustom3
 * @parent PortraitSettings
 * @text カスタム3立ち絵
 * @type file
 * @dir img/pictures
 * @default 
 * @desc custom3状態の立ち絵（空欄で基本を使用）
 * 
 * @param defaultSlot
 * @parent PortraitSettings
 * @text デフォルトスロット
 * @type select
 * @option L
 * @option C
 * @option R
 * @default C
 * @desc 立ち絵のデフォルト表示位置
 * 
 * @param MetaSettings
 * @text メタ情報
 * 
 * @param states
 * @parent MetaSettings
 * @text 使用状態キー
 * @type string
 * @default normal,happy,sad,angry,surprised,thinking
 * @desc 使用する状態キー（カンマ区切り）
 * 
 * @param voicePrefix
 * @parent MetaSettings
 * @text ボイスプレフィックス
 * @type string
 * @default 
 * @desc ボイスファイルのプレフィックス（将来拡張用）
 * 
 * @param themeColor
 * @parent MetaSettings
 * @text テーマカラー
 * @type string
 * @default 
 * @desc キャラのテーマカラー（#RRGGBB形式）
 * 
 * @param description
 * @parent MetaSettings
 * @text 説明
 * @type string
 * @default 
 * @desc キャラクターの説明（開発用メモ）
 * 
 * @param isSystem
 * @parent MetaSettings
 * @text システムキャラ
 * @type boolean
 * @default false
 * @desc システムメッセージ用キャラクターか
 * 
 * @param isAnonymous
 * @parent MetaSettings
 * @text 匿名キャラ
 * @type boolean
 * @default false
 * @desc 正体不明のキャラクターか
 */
