/*:
 * @target MZ
 * @plugindesc [v0.1.0] Dialogue Framework - Renderer Module
 * @author ABC事件開発チーム
 * @base DialogueFramework
 * @orderAfter DialogueSession
 * 
 * @help
 * DialogueFramework のレンダリングモジュールです。
 * DialogueSession.js の後に読み込んでください。
 */

(() => {
    'use strict';

    const Params = window.DialogueFramework.Params;

    //=============================================================================
    // DialogueRenderer
    //=============================================================================
    // UI表示（ウィンドウ/立ち絵/フェード/タイピング）を担当するクラス
    //=============================================================================

    class DialogueRenderer_Class {
        constructor() {
            this.initialize();
        }

        initialize() {
            // ウィンドウ参照
            this._messageWindow = null;
            this._nameWindow = null;
            this._choiceWindow = null;
            this._logWindow = null;
            
            // 立ち絵スプライト
            this._portraitLayer = null;
            this._portraitSprites = {
                L: null,
                C: null,
                R: null
            };
            this._activeSlot = null;
            
            // 表示状態
            this._visible = false;
            this._fadeProgress = 0;
            this._targetFade = 0;
            this._fadeCallback = null;
            this._fadeSpeed = 0.1;
            
            // タイピング状態
            this._typingText = '';
            this._typingIndex = 0;
            this._typingComplete = false;
            this._typingCallback = null;
            
            // 待機状態
            this._waitingForInput = false;
            this._autoWaitCount = 0;
            
            // 選択肢コールバック
            this._choiceCallback = null;
            
            // ログコールバック
            this._logCloseCallback = null;
        }

        //-----------------------------------------------------------------------------
        // ウィンドウ管理
        //-----------------------------------------------------------------------------

        setWindows(messageWindow, nameWindow, choiceWindow, logWindow, itemChoiceWindow) {
            this._messageWindow = messageWindow;
            this._nameWindow = nameWindow;
            this._choiceWindow = choiceWindow;
            this._logWindow = logWindow;
            this._itemChoiceWindow = itemChoiceWindow;
        }

        setPortraitLayer(layer) {
            this._portraitLayer = layer;
        }

        //-----------------------------------------------------------------------------
        // 会話開始/終了
        //-----------------------------------------------------------------------------

        onDialogueStart(options) {
            this._visible = true;
            
            if (options.fadeIn) {
                this._fadeProgress = 0;
                this._targetFade = 1;
            } else {
                this._fadeProgress = 1;
                this._targetFade = 1;
            }

            // ウィンドウを表示
            if (this._messageWindow) {
                this._messageWindow.open();
            }
            if (this._nameWindow) {
                this._nameWindow.open();
            }
        }

        onDialogueEnd(options) {
            if (options.fadeOut) {
                this._targetFade = 0;
            } else {
                this._fadeProgress = 0;
                this._targetFade = 0;
            }

            // ウィンドウを非表示
            if (this._messageWindow) {
                this._messageWindow.close();
            }
            if (this._nameWindow) {
                this._nameWindow.close();
            }
            if (this._choiceWindow) {
                this._choiceWindow.close();
            }

            this._visible = false;
        }

        //-----------------------------------------------------------------------------
        // 発話表示
        //-----------------------------------------------------------------------------

        needsRecovery() {
            if (!this._messageWindow || !DialogueManager.isActive()) return false;
            return !this._messageWindow.isOpen() || !this._messageWindow.visible;
        }

        ensureVisible() {
            if (this._fadeProgress <= 0 && this._targetFade <= 0) {
                this.fadeTo(1);
            }
        }

        showLine(line, callback) {
            if (!this._messageWindow) {
                if (callback) callback();
                return;
            }

            // 名前表示
            if (this._nameWindow) {
                if (line.name && !line.isSystem) {
                    this._nameWindow.setName(line.name);
                    this._nameWindow.show();
                } else {
                    this._nameWindow.hide();
                }
            }

            // 表示タイプに応じた処理
            if (line.displayType === 'portrait') {
                this._showPortraitLine(line);
            } else {
                this._showFaceLine(line);
            }

            // タイピング開始
            this._startTyping(line.text, callback);
        }

        _showFaceLine(line) {
            if (!this._messageWindow) return;

            // 顔グラフィック設定
            if (line.face && !line.isSystem) {
                this._messageWindow.setFace(line.face.faceName, line.face.faceIndex);
            } else {
                this._messageWindow.setFace('', 0);
            }

            // システムメッセージの場合はレイアウト調整
            this._messageWindow.setSystemMode(line.isSystem || false);
        }

        _showPortraitLine(line) {
            // 立ち絵を表示
            if (line.portrait && line.slot) {
                this._showPortraitInternal(line.slot, line.portrait.filename, true);
            }

            // 話者を強調
            this._highlightSpeaker(line.slot);

            // Faceモードの顔グラは非表示
            if (this._messageWindow) {
                this._messageWindow.setFace('', 0);
                this._messageWindow.setSystemMode(line.isSystem || false);
            }
        }

        //-----------------------------------------------------------------------------
        // タイピング（文字送り）
        //-----------------------------------------------------------------------------

        _startTyping(text, callback) {
            this._typingText = text;
            this._typingIndex = 0;
            this._typingComplete = false;
            this._typingCallback = callback;
            this._waitingForInput = false;
            
            if (this._messageWindow) {
                this._messageWindow.startMessage(text);
            }
        }

        updateTyping() {
            if (!this._messageWindow || this._typingComplete) return;

            // スキップモードの場合は高速化
            const speed = DialogueManager.isSkipMode() ? 
                Params.skipSpeed : Params.typingSpeed;

            // 文字を進める
            this._typingIndex += speed;

            if (this._typingIndex >= this._typingText.length) {
                this._typingIndex = this._typingText.length;
                this._onTypingComplete();
            }

            // ウィンドウに進捗を通知
            this._messageWindow.setTypingProgress(this._typingIndex);
        }

        _onTypingComplete() {
            this._typingComplete = true;
            
            // オートモードの場合は自動待機
            if (DialogueManager.isAutoMode()) {
                this._autoWaitCount = Params.autoModeDelay;
                this._waitingForInput = true;
            } else if (DialogueManager.isSkipMode()) {
                // スキップモードの場合は即次へ
                this._finishLine();
            } else {
                this._waitingForInput = true;
            }

            if (this._messageWindow) {
                this._messageWindow.showContinueIndicator();
            }
        }

        advanceText() {
            if (!this._typingComplete) {
                // タイピング中なら即座に完了
                this._typingIndex = this._typingText.length;
                if (this._messageWindow) {
                    this._messageWindow.setTypingProgress(this._typingIndex);
                }
                this._onTypingComplete();
            } else if (this._waitingForInput) {
                // 入力待ち中なら次へ
                this._finishLine();
            }
        }

        _finishLine() {
            this._waitingForInput = false;
            
            if (this._messageWindow) {
                this._messageWindow.hideContinueIndicator();
            }

            if (this._typingCallback) {
                const callback = this._typingCallback;
                this._typingCallback = null;
                callback();
            }
        }

        //-----------------------------------------------------------------------------
        // 選択肢
        //-----------------------------------------------------------------------------

        showChoice(options, callback) {
            if (!this._choiceWindow) {
                if (callback) callback(0);
                return;
            }

            this._choiceCallback = callback;
            this._choiceWindow.setup(options.choices, options.cancelIndex);
            this._choiceWindow.open();
            this._choiceWindow.activate();
        }

        onChoiceOk(index) {
            if (this._choiceWindow) {
                this._choiceWindow.close();
                this._choiceWindow.deactivate();
            }

            if (this._choiceCallback) {
                const callback = this._choiceCallback;
                this._choiceCallback = null;
                callback(index);
            }
        }

        onChoiceCancel(cancelIndex) {
            if (cancelIndex >= 0) {
                this.onChoiceOk(cancelIndex);
            }
        }

        //-----------------------------------------------------------------------------
        // アイテム選択
        //-----------------------------------------------------------------------------

        showItemChoice(options, okCallback, cancelCallback) {
            if (!this._itemChoiceWindow) {
                if (cancelCallback) cancelCallback();
                return;
            }

            this._itemChoiceOkCallback = okCallback || null;
            this._itemChoiceCancelCallback = cancelCallback || null;

            this._itemChoiceWindow.setup(options);
            this._itemChoiceWindow.open();
            this._itemChoiceWindow.activate();
            this._itemChoiceWindow.select(0);
        }

        onItemChoiceOk(item) {
            if (this._itemChoiceWindow) {
                this._itemChoiceWindow.close();
                this._itemChoiceWindow.deactivate();
            }

            if (this._itemChoiceOkCallback) {
                const callback = this._itemChoiceOkCallback;
                this._itemChoiceOkCallback = null;
                this._itemChoiceCancelCallback = null;
                callback(item);
            }
        }

        onItemChoiceCancel() {
            if (this._itemChoiceWindow) {
                this._itemChoiceWindow.close();
                this._itemChoiceWindow.deactivate();
            }

            if (this._itemChoiceCancelCallback) {
                const callback = this._itemChoiceCancelCallback;
                this._itemChoiceOkCallback = null;
                this._itemChoiceCancelCallback = null;
                callback();
            }
        }

        //-----------------------------------------------------------------------------
        // 立ち絵
        //-----------------------------------------------------------------------------

        showPortrait(options) {
            const character = CharacterDatabase.getCharacter(options.characterId);
            if (!character || !character.portrait) return;

            let filename = character.portrait.base;
            if (options.stateKey && character.portrait.byState[options.stateKey]) {
                filename = character.portrait.byState[options.stateKey];
            }

            this._showPortraitInternal(options.slot, filename, options.fadeIn);
        }

        _showPortraitInternal(slot, filename, fadeIn) {
            if (!this._portraitLayer) return;

            const sprite = this._getOrCreatePortraitSprite(slot);
            if (!sprite) return;

            // 画像読み込み
            const bitmap = ImageManager.loadPicture(filename);
            sprite.bitmap = bitmap;

            // 位置設定
            sprite.x = this._getSlotX(slot);
            sprite.y = Params.portraitBaseY;
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 1.0;
            sprite.scale.x = Params.portraitScale;
            sprite.scale.y = Params.portraitScale;

            // フェードイン
            if (fadeIn) {
                sprite.opacity = 0;
                sprite._targetOpacity = 255;
            } else {
                sprite.opacity = 255;
            }

            sprite.visible = true;
        }

        hidePortrait(options) {
            const slot = options.slot;
            const sprite = this._portraitSprites[slot];
            
            if (sprite) {
                if (options.fadeOut) {
                    sprite._targetOpacity = 0;
                } else {
                    sprite.visible = false;
                    sprite.opacity = 0;
                }
            }
        }

        clearPortraits(options) {
            ['L', 'C', 'R'].forEach(slot => {
                this.hidePortrait({
                    slot: slot,
                    fadeOut: options.fadeOut
                });
            });
            this._activeSlot = null;
        }

        _getOrCreatePortraitSprite(slot) {
            if (!this._portraitSprites[slot]) {
                const sprite = new Sprite();
                sprite.visible = false;
                sprite.opacity = 0;
                sprite._targetOpacity = 0;
                this._portraitSprites[slot] = sprite;
                
                if (this._portraitLayer) {
                    this._portraitLayer.addChild(sprite);
                }
            }
            return this._portraitSprites[slot];
        }

        _getSlotX(slot) {
            switch (slot) {
                case 'L': return Params.portraitSlotL;
                case 'C': return Params.portraitSlotC;
                case 'R': return Params.portraitSlotR;
                default: return Params.portraitSlotC;
            }
        }

        _highlightSpeaker(activeSlot) {
            this._activeSlot = activeSlot;
            
            ['L', 'C', 'R'].forEach(slot => {
                const sprite = this._portraitSprites[slot];
                if (sprite && sprite.visible) {
                    if (slot === activeSlot) {
                        sprite._targetBrightness = 255;
                    } else {
                        sprite._targetBrightness = Params.inactiveDim;
                    }
                }
            });
        }

        //-----------------------------------------------------------------------------
        // ログ
        //-----------------------------------------------------------------------------

        openLogWindow(log, callback) {
            if (!this._logWindow) {
                if (callback) callback();
                return;
            }

            this._logCloseCallback = callback;
            this._logWindow.setLog(log);
            this._logWindow.open();
            this._logWindow.activate();

            // メッセージウィンドウを一時非表示
            if (this._messageWindow) {
                this._messageWindow.hide();
            }
        }

        closeLogWindow() {
            if (this._logWindow) {
                this._logWindow.close();
                this._logWindow.deactivate();
            }

            // メッセージウィンドウを再表示
            if (this._messageWindow && DialogueManager.isActive()) {
                this._messageWindow.show();
            }

            if (this._logCloseCallback) {
                const callback = this._logCloseCallback;
                this._logCloseCallback = null;
                callback();
            }
        }

        //-----------------------------------------------------------------------------
        // 割り込み
        //-----------------------------------------------------------------------------

        onInterruptStart(options) {
            // 割り込み開始時の演出（必要に応じて）
        }

        onInterruptReturn() {
            // 割り込み復帰時の演出（必要に応じて）
        }

        onInterruptContinue() {
            // 割り込み続行時の演出（必要に応じて）
        }

        //-----------------------------------------------------------------------------
        // フェード制御
        //-----------------------------------------------------------------------------

        fadeTo(target, callback, duration) {
            const clamped = Math.max(0, Math.min(1, Number(target) || 0));
            const durationFrames = Number.isFinite(duration) ? Number(duration) : 0;

            if (durationFrames > 0) {
                const distance = Math.abs(clamped - this._fadeProgress);
                this._fadeSpeed = distance / durationFrames;
            } else if (durationFrames === 0) {
                this._fadeSpeed = 0.1;
            }

            this._targetFade = clamped;
            this._fadeCallback = callback || null;

            if (durationFrames < 0) {
                this._fadeProgress = this._targetFade;
            }

            if (this._fadeProgress === this._targetFade && this._fadeCallback) {
                const cb = this._fadeCallback;
                this._fadeCallback = null;
                cb();
            }
        }

        //-----------------------------------------------------------------------------
        // モードインジケーター
        //-----------------------------------------------------------------------------

        updateModeIndicator() {
            if (this._messageWindow) {
                this._messageWindow.updateModeIndicator({
                    auto: DialogueManager.isAutoMode(),
                    skip: DialogueManager.isSkipMode()
                });
            }
        }

        //-----------------------------------------------------------------------------
        // 更新処理
        //-----------------------------------------------------------------------------

        update() {
            // フェード更新
            this._updateFade();
            this._applyFade();
            
            // タイピング更新
            this.updateTyping();
            
            // オート待機更新
            this._updateAutoWait();
            
            // 立ち絵更新
            this._updatePortraits();
        }

        _updateFade() {
            const step = this._fadeSpeed || 0.1;

            if (this._fadeProgress < this._targetFade) {
                this._fadeProgress = Math.min(this._fadeProgress + step, this._targetFade);
            } else if (this._fadeProgress > this._targetFade) {
                this._fadeProgress = Math.max(this._fadeProgress - step, this._targetFade);
            }

            if (this._fadeProgress === this._targetFade && this._fadeCallback) {
                const callback = this._fadeCallback;
                this._fadeCallback = null;
                callback();
            }
        }

        _applyFade() {
            const alpha = Math.max(0, Math.min(1, this._fadeProgress));
            const opacity = Math.round(255 * alpha);

            const applyWindow = (window) => {
                if (!window) return;
                window.opacity = opacity;
                window.contentsOpacity = opacity;
                window.backOpacity = opacity;
            };

            applyWindow(this._messageWindow);
            applyWindow(this._nameWindow);
            applyWindow(this._choiceWindow);
            applyWindow(this._logWindow);

            if (this._portraitLayer) {
                this._portraitLayer.alpha = alpha;
            }
        }

        _updateAutoWait() {
            if (this._waitingForInput && DialogueManager.isAutoMode()) {
                this._autoWaitCount--;
                if (this._autoWaitCount <= 0) {
                    this._finishLine();
                }
            }
        }

        _updatePortraits() {
            ['L', 'C', 'R'].forEach(slot => {
                const sprite = this._portraitSprites[slot];
                if (sprite) {
                    // フェード
                    if (sprite._targetOpacity !== undefined) {
                        const diff = sprite._targetOpacity - sprite.opacity;
                        const step = 255 / Params.portraitFadeDuration;
                        if (Math.abs(diff) > step) {
                            sprite.opacity += diff > 0 ? step : -step;
                        } else {
                            sprite.opacity = sprite._targetOpacity;
                            if (sprite.opacity === 0) {
                                sprite.visible = false;
                            }
                        }
                    }
                    
                    // 明るさ調整
                    if (sprite._targetBrightness !== undefined && sprite.visible) {
                        // ColorFilterを使用（将来拡張）
                    }
                }
            });
        }

        //-----------------------------------------------------------------------------
        // ユーティリティ
        //-----------------------------------------------------------------------------

        isVisible() {
            return this._visible;
        }

        isTyping() {
            return !this._typingComplete;
        }

        isWaitingForInput() {
            return this._waitingForInput;
        }
    }

    //=============================================================================
    // Export
    //=============================================================================
    
    window.DialogueRenderer = new DialogueRenderer_Class();
    window.DialogueFramework.DialogueRenderer = window.DialogueRenderer;

})();
