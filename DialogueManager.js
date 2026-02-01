/*:
 * @target MZ
 * @plugindesc [v0.1.0] Dialogue Framework - Manager Module
 * @author ABC事件開発チーム
 * @base DialogueFramework
 * @orderAfter DialogueFramework
 * 
 * @help
 * DialogueFramework のコアマネージャーモジュールです。
 * DialogueFramework.js の後に読み込んでください。
 */

(() => {
    'use strict';

    const Params = window.DialogueFramework.Params;

    //=============================================================================
    // DialogueManager
    //=============================================================================
    // 会話の進行・スタック・ログ・入力状態を管理するコアクラス
    //=============================================================================

    class DialogueManager_Class {
        constructor() {
            this.initialize();
        }

        initialize() {
            // 状態管理
            this._active = false;
            this._busy = false;
            this._choiceBusy = false;
            this._itemChoiceBusy = false;
            this._logOpen = false;
            this._interruptButtonVisible = null;
            this._fadeBusy = false;
            
            // セッションスタック
            this._sessionStack = [];
            this._currentSession = null;
            
            // ログ
            this._log = [];
            
            // 入力モード
            this._autoMode = false;
            this._skipMode = false;
            this._suppressAdvanceThisFrame = false;

            // 割り込み停止
            this._interruptPaused = false;
            this._fadeInOnNextLine = false;
            this._interruptInputSuppressed = false;
            this._stepAnimeBackup = null;
            
            // 表示設定
            this._currentDisplayType = null;
            this._blockPlayer = true;
            
            // 現在の発話情報
            this._currentLine = null;
            this._lastLine = null;
            this._pendingChoice = null;
            this._pendingItemChoice = null;

            // 並列コモンイベント実行用
            this._parallelCommonEventInterpreter = null;
            
            // コールバック
            this._onLineComplete = null;
            this._onChoiceComplete = null;
        }

        // 強制リセット（タイトル戻り/ロード時の保険）
        forceReset() {
            this._active = false;
            this._busy = false;
            this._choiceBusy = false;
            this._itemChoiceBusy = false;
            this._logOpen = false;
            this._fadeBusy = false;
            this._interruptPaused = false;
            this._fadeInOnNextLine = false;
            this._interruptInputSuppressed = false;
            this._currentDisplayType = null;
            this._blockPlayer = true;
            this._currentLine = null;
            this._lastLine = null;
            this._pendingChoice = null;
            this._pendingItemChoice = null;
            this._sessionStack = [];
            this._currentSession = null;
            this._autoMode = false;
            this._skipMode = false;
            this._suppressAdvanceThisFrame = false;
            this._parallelCommonEventInterpreter = null;
            this._onLineComplete = null;
            this._onChoiceComplete = null;
            this._restoreStepAnimeAfterDialogue();

            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.onDialogueEnd({ fadeOut: false });
            }
            if (typeof $gamePlayer !== 'undefined' && $gamePlayer) {
                $gamePlayer._dialogueMovementBlocked = false;
            }
        }

        //-----------------------------------------------------------------------------
        // 状態チェック
        //-----------------------------------------------------------------------------

        isActive() {
            return this._active;
        }

        isBusy() {
            return this._busy;
        }

        isChoiceBusy() {
            return this._choiceBusy;
        }

        isItemChoiceBusy() {
            return this._itemChoiceBusy;
        }

        isLogOpen() {
            return this._logOpen;
        }

        isFadeBusy() {
            return this._fadeBusy;
        }

        isAutoMode() {
            return this._autoMode;
        }

        isSkipMode() {
            return this._skipMode;
        }

        isInterruptPaused() {
            return this._interruptPaused;
        }

        getCurrentDisplayType() {
            return this._currentDisplayType || Params.defaultDisplayType;
        }

        getCurrentLine() {
            return this._currentLine;
        }

        //-----------------------------------------------------------------------------
        // 更新処理
        //-----------------------------------------------------------------------------

        update() {
            this._updateParallelCommonEvent();
        }

        //-----------------------------------------------------------------------------
        // 会話開始/終了
        //-----------------------------------------------------------------------------

        start(options = {}) {
            if (this._active) {
                console.warn('DialogueManager: Already active');
                return;
            }

            this._active = true;
            this._blockPlayer = options.blockPlayer !== false;
            this._currentDisplayType = options.displayType || Params.defaultDisplayType;
            this._applyStepAnimeDuringDialogue();
            
            // 新しいセッション開始
            this._currentSession = new DialogueSession({
                displayType: this._currentDisplayType
            });
            
            // レンダラーに開始を通知
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.onDialogueStart({
                    fadeIn: options.fadeIn !== false,
                    displayType: this._currentDisplayType
                });
            }

            // プレイヤー移動禁止
            if (this._blockPlayer) {
                $gamePlayer._dialogueMovementBlocked = true;
            }
        }

        end(options = {}) {
            if (!this._active) {
                return;
            }

            // 立ち絵のクリア
            if (!options.keepPortraits && typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.clearPortraits({
                    fadeOut: options.fadeOut !== false
                });
            }

            // レンダラーに終了を通知
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.onDialogueEnd({
                    fadeOut: options.fadeOut !== false
                });
            }

            // プレイヤー移動再開
            if (this._blockPlayer) {
                $gamePlayer._dialogueMovementBlocked = false;
            }

            this._restoreStepAnimeAfterDialogue();

            // 状態リセット
            this._active = false;
            this._busy = false;
            this._fadeBusy = false;
            this._choiceBusy = false;
            this._itemChoiceBusy = false;
            this._logOpen = false;
            this._suppressAdvanceThisFrame = false;
            this._interruptPaused = false;
            this._fadeInOnNextLine = false;
            this._interruptInputSuppressed = false;
            this._currentSession = null;
            this._sessionStack = [];
            this._autoMode = false;
            this._skipMode = false;
            this._currentLine = null;
            this._lastLine = null;
            this._pendingChoice = null;
            this._pendingItemChoice = null;
            this._parallelCommonEventInterpreter = null;
            this._onLineComplete = null;
            this._onChoiceComplete = null;
        }

        _applyStepAnimeDuringDialogue() {
            if (!Params.keepMapStepAnimeDuringDialogue) return;
            if (this._stepAnimeBackup) return;

            this._stepAnimeBackup = [];

            const backup = (character) => {
                if (!character || typeof character.hasStepAnime !== 'function') return;
                this._stepAnimeBackup.push([character, character.hasStepAnime()]);
                if (typeof character.setStepAnime === 'function') {
                    character.setStepAnime(true);
                }
            };

            if (typeof $gamePlayer !== 'undefined' && $gamePlayer) {
                backup($gamePlayer);
                if ($gamePlayer.followers && typeof $gamePlayer.followers === 'function') {
                    const followers = $gamePlayer.followers().data();
                    followers.forEach(follower => backup(follower));
                }
            }

            if (typeof $gameMap !== 'undefined' && $gameMap) {
                const events = $gameMap.events();
                events.forEach(event => backup(event));
                if (typeof $gameMap.vehicles === 'function') {
                    const vehicles = $gameMap.vehicles();
                    vehicles.forEach(vehicle => backup(vehicle));
                }
            }
        }

        _refreshStepAnimeDuringDialogue() {
            if (!Params.keepMapStepAnimeDuringDialogue) return;

            const apply = (character) => {
                if (!character || typeof character.setStepAnime !== 'function') return;
                character.setStepAnime(true);
            };

            if (typeof $gamePlayer !== 'undefined' && $gamePlayer) {
                apply($gamePlayer);
                if ($gamePlayer.followers && typeof $gamePlayer.followers === 'function') {
                    const followers = $gamePlayer.followers().data();
                    followers.forEach(follower => apply(follower));
                }
            }

            if (typeof $gameMap !== 'undefined' && $gameMap) {
                const events = $gameMap.events();
                events.forEach(event => apply(event));
                if (typeof $gameMap.vehicles === 'function') {
                    const vehicles = $gameMap.vehicles();
                    vehicles.forEach(vehicle => apply(vehicle));
                }
            }
        }

        _restoreStepAnimeAfterDialogue() {
            if (!this._stepAnimeBackup) return;
            for (const entry of this._stepAnimeBackup) {
                const character = entry[0];
                const prev = entry[1];
                if (character && typeof character.setStepAnime === 'function') {
                    character.setStepAnime(!!prev);
                }
            }
            this._stepAnimeBackup = null;
        }

        //-----------------------------------------------------------------------------
        // 遮るボタンのコモンイベント（並列）
        //-----------------------------------------------------------------------------

        startInterruptCommonEvent(commonEventId) {
            const id = Number(commonEventId) || 0;
            if (id <= 0) return;

            const commonEvent = $dataCommonEvents && $dataCommonEvents[id];
            if (!commonEvent || !commonEvent.list) return;

            if (!this._parallelCommonEventInterpreter) {
                this._parallelCommonEventInterpreter = new Game_Interpreter();
            }

            this._parallelCommonEventInterpreter.setup(commonEvent.list, 0);
            this._parallelCommonEventInterpreter._isDialogueInterruptParallel = true;
        }

        _updateParallelCommonEvent() {
            const interpreter = this._parallelCommonEventInterpreter;
            if (!interpreter) return;

            if (interpreter.isRunning()) {
                interpreter.update();
            } else {
                this._parallelCommonEventInterpreter = null;
            }
        }

        //-----------------------------------------------------------------------------
        // フェード
        //-----------------------------------------------------------------------------

        fade(options = {}) {
            if (!this._active) {
                console.warn('DialogueManager: Not active. Call start() first.');
                return;
            }

            if (typeof DialogueRenderer === 'undefined') {
                return;
            }

            const mode = options.mode || 'outIn';
            const duration = Number(options.duration);
            this._fadeBusy = true;

            const finish = () => {
                this._fadeBusy = false;
            };

            if (mode === 'out') {
                DialogueRenderer.fadeTo(0, finish, duration);
            } else if (mode === 'in') {
                DialogueRenderer.fadeTo(1, finish, duration);
            } else {
                DialogueRenderer.fadeTo(0, () => {
                    DialogueRenderer.fadeTo(1, finish, duration);
                }, duration);
            }
        }

        //-----------------------------------------------------------------------------
        // 発話
        //-----------------------------------------------------------------------------

        say(options) {
            if (!this._active) {
                console.warn('DialogueManager: Not active. Call start() first.');
                return;
            }

            const characterId = options.characterId || 0;
            const character = CharacterDatabase.getCharacter(characterId);
            
            // 状態の取得
            let stateKey = options.stateKey;
            if (!stateKey && characterId > 0) {
                stateKey = CharacterDatabase.getCharacterState(characterId);
            }
            stateKey = stateKey || 'normal';

            // 表示タイプの決定
            const displayType = options.displayType || 
                (character ? character.displayTypeDefault : null) ||
                this._currentDisplayType ||
                Params.defaultDisplayType;

            // 発話行の作成
            const line = {
                characterId: characterId,
                name: character ? character.name : '',
                text: options.text || '',
                displayType: displayType,
                stateKey: stateKey,
                slot: options.slot || (character && character.portrait ? character.portrait.defaultSlot : 'C'),
                face: null,
                portrait: null,
                meta: options.meta || {}
            };

            // Face情報の取得
            if (character && character.face && displayType === 'face') {
                line.face = {
                    faceName: character.face.faceName,
                    faceIndex: character.face.faceIndexByState[stateKey] || 0
                };
            }

            // Portrait情報の取得
            if (character && character.portrait && displayType === 'portrait') {
                const portraitFile = character.portrait.byState[stateKey] || character.portrait.base;
                line.portrait = {
                    filename: portraitFile,
                    anchor: character.portrait.anchor || 'bottom'
                };
            }

            // 状態の永続更新
            if (options.updateState && characterId > 0) {
                CharacterDatabase.setCharacterState(characterId, stateKey);
            }

            // ログに追加
            const shouldLog = options.forceLog || options.addToLog !== false;
            if (shouldLog) {
                this.addToLog(line);
            }

            // 発話を実行
            this._executeLine(line);
        }

        customSay(options) {
            if (!this._active) {
                console.warn('DialogueManager: Not active. Call start() first.');
                return;
            }

            const displayType = options.displayType || 
                this._currentDisplayType ||
                Params.defaultDisplayType;

            const line = {
                characterId: -1, // カスタム
                name: options.nameOverride || '',
                text: options.text || '',
                displayType: displayType,
                stateKey: null,
                slot: options.slot || 'C',
                face: options.faceOverride || null,
                portrait: options.portraitOverride ? {
                    filename: options.portraitOverride,
                    anchor: 'bottom'
                } : null,
                meta: {}
            };

            // ログに追加
            const shouldLog = options.forceLog || options.addToLog !== false;
            if (shouldLog) {
                this.addToLog(line);
            }

            this._executeLine(line);
        }

        systemSay(options) {
            if (!this._active) {
                console.warn('DialogueManager: Not active. Call start() first.');
                return;
            }

            const line = {
                characterId: 0,
                name: '',
                text: options.text || '',
                displayType: this._currentDisplayType || Params.defaultDisplayType,
                stateKey: null,
                slot: null,
                face: null,
                portrait: null,
                isSystem: true,
                meta: {}
            };

            // ログに追加
            if (options.addToLog !== false && Params.logIncludeSystem) {
                this.addToLog(line);
            }

            this._executeLine(line);
        }

        _executeLine(line) {
            this._currentLine = line;
            this._lastLine = line;
            this._busy = true;

            // レンダラーに表示を依頼
            if (typeof DialogueRenderer !== 'undefined') {
                if (DialogueRenderer.ensureVisible) {
                    DialogueRenderer.ensureVisible();
                }
                if (this._currentSession && this._currentSession.isInterrupt) {
                    this._interruptInputSuppressed = false;
                }
                if (this._fadeInOnNextLine || this._interruptPaused) {
                    DialogueRenderer.fadeTo(1);
                    this._fadeInOnNextLine = false;
                }
                DialogueRenderer.showLine(line, () => {
                    this._onLineDisplayed();
                });
            } else {
                // レンダラーがない場合は即座に完了
                this._busy = false;
            }
        }

        _onLineDisplayed() {
            this._busy = false;
            this._currentLine = null;
            
            if (this._onLineComplete) {
                this._onLineComplete();
                this._onLineComplete = null;
            }
        }

        onRendererReady() {
            if (!this._active || typeof DialogueRenderer === 'undefined') return;

            this._applyStepAnimeDuringDialogue();
            this._refreshStepAnimeDuringDialogue();

            DialogueRenderer.onDialogueStart({
                fadeIn: false,
                displayType: this.getCurrentDisplayType()
            });

            if (this._logOpen) {
                DialogueRenderer.openLogWindow(this._log, () => {
                    this._logOpen = false;
                });
                return;
            }

            if (this._choiceBusy && this._pendingChoice) {
                DialogueRenderer.showChoice(this._pendingChoice, (index) => {
                    this._onChoiceSelected(index);
                });
                return;
            }

            if (this._itemChoiceBusy && this._pendingItemChoice) {
                DialogueRenderer.showItemChoice(this._pendingItemChoice, (item) => {
                    this._onItemChoiceSelected(item);
                }, () => {
                    this._onItemChoiceCanceled();
                });
                return;
            }

            if (this._busy) {
                const line = this._currentLine || this._lastLine;
                if (line) {
                    DialogueRenderer.showLine(line, () => {
                        this._onLineDisplayed();
                    });
                }
            }
        }

        //-----------------------------------------------------------------------------
        // 選択肢
        //-----------------------------------------------------------------------------

        showChoice(options) {
            if (!this._active) {
                console.warn('DialogueManager: Not active. Call start() first.');
                return;
            }

            this._pendingChoice = {
                choices: options.choices || [],
                resultVariableId: options.resultVariableId || 1,
                cancelIndex: options.cancelIndex !== undefined ? options.cancelIndex : -1,
                addToLog: options.addToLog !== false
            };

            this._choiceBusy = true;

            // レンダラーに選択肢表示を依頼
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.showChoice(this._pendingChoice, (index) => {
                    this._onChoiceSelected(index);
                });
            }
        }

        _onChoiceSelected(index) {
            if (!this._pendingChoice) return;

            const choice = this._pendingChoice;
            
            // 変数に結果を格納
            $gameVariables.setValue(choice.resultVariableId, index);

            // ログに追加
            if (choice.addToLog && Params.logIncludeChoice) {
                this.addToLog({
                    characterId: 0,
                    name: '',
                    text: `【選択】${choice.choices[index] || ''}`,
                    displayType: 'choice',
                    isChoice: true,
                    choiceIndex: index,
                    meta: {}
                });
            }

            this._pendingChoice = null;
            this._choiceBusy = false;

            if (this._onChoiceComplete) {
                this._onChoiceComplete(index);
                this._onChoiceComplete = null;
            }
        }

        //-----------------------------------------------------------------------------
        // アイテム選択
        //-----------------------------------------------------------------------------

        showItemChoice(options) {
            if (!this._active) {
                console.warn('DialogueManager: Not active. Call start() first.');
                return;
            }

            this._pendingItemChoice = {
                itemTypes: options.itemTypes || 'both',
                excludeItemIds: options.excludeItemIds || '',
                resultVariableId: options.resultVariableId || 1,
                cancelValue: options.cancelValue !== undefined ? options.cancelValue : -1,
                rows: options.rows || 4,
                cols: options.cols || 2,
                addToLog: options.addToLog !== false
            };

            this._itemChoiceBusy = true;

            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.showItemChoice(this._pendingItemChoice, (item) => {
                    this._onItemChoiceSelected(item);
                }, () => {
                    this._onItemChoiceCanceled();
                });
            }
        }

        _onItemChoiceSelected(item) {
            if (!this._pendingItemChoice) return;

            const choice = this._pendingItemChoice;
            const itemId = item && item.id ? Number(item.id) : 0;

            $gameVariables.setValue(choice.resultVariableId, itemId);

            if (choice.addToLog && Params.logIncludeChoice) {
                const name = item ? item.name : '';
                this.addToLog({
                    characterId: 0,
                    name: '',
                    text: `【アイテム】${name}`,
                    displayType: 'choice',
                    isChoice: true,
                    choiceIndex: itemId,
                    meta: {
                        itemId: itemId
                    }
                });
            }

            this._pendingItemChoice = null;
            this._itemChoiceBusy = false;
        }

        _onItemChoiceCanceled() {
            if (!this._pendingItemChoice) return;

            const choice = this._pendingItemChoice;
            const cancelValue = Number(choice.cancelValue);
            $gameVariables.setValue(choice.resultVariableId, cancelValue);

            this._pendingItemChoice = null;
            this._itemChoiceBusy = false;
        }

        //-----------------------------------------------------------------------------
        // 割り込み
        //-----------------------------------------------------------------------------

        interruptPush(options) {
            if (!this._active) {
                console.warn('DialogueManager: Not active.');
                return;
            }

            const mode = options.mode || 'return';
            const pauseBase = options.pauseBase !== false;

            if (pauseBase) {
                this._interruptPaused = true;
                this._fadeInOnNextLine = true;
                this._interruptInputSuppressed = true;
                if (typeof DialogueRenderer !== 'undefined') {
                    DialogueRenderer.fadeTo(0);
                }
            }

            // 現在のセッションをスタックに退避
            if (this._currentSession) {
                this._currentSession.interruptMode = mode;
                this._currentSession.paused = pauseBase;
                this._sessionStack.push(this._currentSession);
            }

            // 新しいセッション開始
            this._currentSession = new DialogueSession({
                displayType: this._currentDisplayType,
                isInterrupt: true,
                parentMode: mode
            });

            // レンダラーに割り込み開始を通知
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.onInterruptStart({
                    mode: mode
                });
            }
        }

        interruptResolve(options) {
            if (!this._active) return;

            const resolution = options.resolution || 'return';

            this._interruptPaused = false;
            this._interruptInputSuppressed = false;
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.fadeTo(1);
            }

            if (resolution === 'return') {
                // 前のセッションに復帰
                if (this._sessionStack.length > 0) {
                    this._currentSession = this._sessionStack.pop();
                    this._currentSession.paused = false;
                    
                    // レンダラーに復帰を通知
                    if (typeof DialogueRenderer !== 'undefined') {
                        DialogueRenderer.onInterruptReturn();
                    }
                }
            } else if (resolution === 'continue') {
                // 前のセッションを破棄して続行
                this._sessionStack = [];
                
                // レンダラーに続行を通知
                if (typeof DialogueRenderer !== 'undefined') {
                    DialogueRenderer.onInterruptContinue();
                }
            }
        }

        getInterruptDepth() {
            return this._sessionStack.length;
        }

        canReturn() {
            return this._sessionStack.length > 0;
        }

        //-----------------------------------------------------------------------------
        // ログ
        //-----------------------------------------------------------------------------

        addToLog(line) {
            const entry = {
                timestamp: Date.now(),
                speakerName: line.name || '',
                text: line.text || '',
                displayType: line.displayType,
                characterId: line.characterId,
                meta: line.meta || {}
            };

            this._log.push(entry);

            // 最大件数を超えたら古いものを削除
            while (this._log.length > Params.maxLogEntries) {
                this._log.shift();
            }
        }

        getLog() {
            return this._log.slice();
        }

        openLog() {
            this._logOpen = true;
            
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.openLogWindow(this._log, () => {
                    this._logOpen = false;
                });
            }
        }

        closeLog() {
            this._logOpen = false;
            this._suppressAdvanceThisFrame = true;
            
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.closeLogWindow();
            }
        }

        clearLog(scope = 'current') {
            if (scope === 'all') {
                this._log = [];
            } else {
                // 現在のセッションのログのみクリア（将来拡張用）
                this._log = [];
            }
        }

        //-----------------------------------------------------------------------------
        // 入力モード
        //-----------------------------------------------------------------------------

        toggleAutoMode() {
            this._autoMode = !this._autoMode;
            if (this._autoMode) {
                this._skipMode = false;
            }
            
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.updateModeIndicator();
            }
        }

        setAutoMode(value) {
            this._autoMode = value;
            if (this._autoMode) {
                this._skipMode = false;
            }
        }

        toggleSkipMode() {
            this._skipMode = !this._skipMode;
            if (this._skipMode) {
                this._autoMode = false;
            }
            
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.updateModeIndicator();
            }
        }

        setSkipMode(value) {
            this._skipMode = value;
            if (this._skipMode) {
                this._autoMode = false;
            }
        }

        setInterruptButtonVisible(value) {
            this._interruptButtonVisible = !!value;
        }

        isInterruptButtonVisible() {
            if (this._interruptButtonVisible === null) {
                return Params.showInterruptButton;
            }
            return this._interruptButtonVisible;
        }

        suppressAdvanceThisFrame() {
            this._suppressAdvanceThisFrame = true;
        }

        //-----------------------------------------------------------------------------
        // 入力処理
        //-----------------------------------------------------------------------------

        processInput() {
            if (!this._active) return;

            if (this._interruptInputSuppressed) {
                return;
            }

            if (this._suppressAdvanceThisFrame) {
                this._suppressAdvanceThisFrame = false;
                return;
            }

            // ログが開いている場合
            if (this._logOpen) {
                if (Input.isTriggered(Params.inputCancel) || 
                    Input.isTriggered('cancel') ||
                    Input.isTriggered(Params.inputNext) ||
                    TouchInput.isCancelled()) {
                    this.closeLog();
                }
                return;
            }

            // 選択肢表示中は入力をパス
            if (this._choiceBusy || this._itemChoiceBusy) return;

            // ログを開く
            if (Input.isTriggered(Params.inputLog) || 
                Input.isTriggered('pageup')) {
                this.openLog();
                return;
            }

            // オートモードトグル
            if (Input.isTriggered(Params.inputAuto)) {
                this.toggleAutoMode();
            }

            // スキップモード
            if (Input.isPressed(Params.inputSkip)) {
                this._skipMode = true;
            } else {
                this._skipMode = false;
            }

            // 次へ（決定 or クリック/タップ）
            if (Input.isTriggered(Params.inputNext) || TouchInput.isTriggered()) {
                if (typeof DialogueRenderer !== 'undefined') {
                    DialogueRenderer.advanceText();
                }
            }
        }

        //-----------------------------------------------------------------------------
        // セーブ/ロード
        //-----------------------------------------------------------------------------

        makeSaveContents() {
            return {
                log: Params.logSaveMode === 'perSave' ? this._log : [],
                characterStates: CharacterDatabase.getAllStates()
            };
        }

        extractSaveContents(contents) {
            if (contents) {
                if (Params.logSaveMode === 'perSave' && contents.log) {
                    this._log = contents.log;
                }
                if (contents.characterStates) {
                    CharacterDatabase.restoreStates(contents.characterStates);
                }
            }
        }
    }

    //=============================================================================
    // Export
    //=============================================================================
    
    window.DialogueManager = new DialogueManager_Class();
    window.DialogueFramework.DialogueManager = window.DialogueManager;

    //=============================================================================
    // Game_Player - Movement Block Extension
    //=============================================================================

    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (this._dialogueMovementBlocked) {
            return false;
        }
        return _Game_Player_canMove.call(this);
    };

})();
