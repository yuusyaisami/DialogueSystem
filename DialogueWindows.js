/*:
 * @target MZ
 * @plugindesc [v0.1.0] Dialogue Framework - UI Windows Module
 * @author ABC事件開発チーム
 * @base DialogueFramework
 * @orderAfter CharacterDatabase
 * 
 * @help
 * DialogueFramework のUIウィンドウモジュールです。
 * CharacterDatabase.js の後に読み込んでください。
 * 
 * 以下のウィンドウクラスを提供します：
 * - Window_DialogueMessage: メッセージウィンドウ
 * - Window_DialogueName: 名前ウィンドウ
 * - Window_DialogueChoice: 選択肢ウィンドウ
 * - Window_DialogueItemChoice: アイテム選択ウィンドウ
 * - Window_DialogueLog: ログウィンドウ
 */

(() => {
    'use strict';

    const Params = window.DialogueFramework.Params;

    //=============================================================================
    // Inline Message FX helpers (DialogueSystem)
    //=============================================================================
    // 対応コマンド（テキスト内で使用）:
    //  \SE[name,vol,pitch,pan]
    //  \SHAKE[px,duration,face] / \SHAKE[-1]  (duration=-1で無限, face=1で顔も揺らす)
    //  \WAVE[amp,len,speed]
    //  \BOUNCE[height,speed]
    //  \FLOAT[amp,speed]
    //  \SWAY[amp,speed]
    //  \FADE[min,max,speed]
    //  \RAINBOW[speed]
    //  \FXRESET  (全FX解除)

    function imfxObtainBracketText(textState) {
        const text = textState.text.slice(textState.index);
        const match = /^\[([^\]]*)\]/.exec(text);
        if (match) {
            textState.index += match[0].length;
            return match[1];
        }
        return '';
    }

    function imfxToNumber(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function imfxSplitArgs(argText) {
        if (!argText) return [];
        return String(argText)
            .split(',')
            .map(part => part.trim());
    }

    function imfxNoise(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function imfxLerp(a, b, t) {
        return a + (b - a) * t;
    }

    function imfxHueToRgb(h) {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const q = 1 - f;
        let r = 0;
        let g = 0;
        let b = 0;
        switch (i % 6) {
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
    }

    function imfxCreateState() {
        return {
            shake: { strength: 0, duration: -1, startFrame: 0, face: false },
            wave: { amplitude: 0, length: 12, speed: 0.12 },
            bounce: { height: 0, speed: 0.18 },
            float: { amplitude: 0, speed: 0.04 },
            sway: { amplitude: 0, speed: 0.08 },
            fade: { min: 255, max: 255, speed: 0.08, enabled: false },
            rainbow: { speed: 0.06, enabled: false }
        };
    }

    function applyInlineFx(windowClass) {
        const proto = windowClass.prototype;
        const _createTextState = proto.createTextState;
        const _processNewLine = proto.processNewLine;
        const _flushTextState = proto.flushTextState;

        proto._imfxInit = function() {
            this._imfx_state = imfxCreateState();
            this._imfx_hasAnimation = false;
            this._imfx_forceAnimation = false;
            this._imfx_silentRedraw = false;
            this._imfx_seMuted = false;
            this._imfx_disableAnimation = false;
            this._imfx_contentsBaseX = null;
            this._imfx_contentsBaseY = null;
            this._imfx_typeSpeedMul = 1;
            this._imfx_playedSe = new Set();
            this._imfx_effectStarts = new Map();
        };

        proto._imfxResetMessageState = function() {
            this._imfx_playedSe = new Set();
            this._imfx_effectStarts = new Map();
        };

        proto._imfxResetDrawState = function() {
            this._imfx_state = imfxCreateState();
        };

        proto._imfxPrepareStateForText = function(text) {
            this._imfxResetDrawState();
            if (!text) {
                this._imfx_hasAnimation = false;
                return;
            }
            this._imfx_hasAnimation = /(?:\\|\x1b)(shake|wave|bounce|float|sway|fade|rainbow|fxreset)/i.test(text);
        };

        proto._imfxGetEffectStart = function(code, textState) {
            const key = `${code}:${textState.index}`;
            if (this._imfx_effectStarts.has(key)) {
                return this._imfx_effectStarts.get(key);
            }
            const frame = Graphics.frameCount || 0;
            if (!this._imfx_silentRedraw) {
                this._imfx_effectStarts.set(key, frame);
            }
            return frame;
        };

        proto._imfxComputeOffsets = function(textState) {
            if (this._imfx_disableAnimation) {
                return { x: 0, y: 0, opacity: 255, color: null, animated: false };
            }

            const frame = Graphics.frameCount || 0;
            const charIndex = textState._imfx_charIndex || 0;
            let x = 0;
            let y = 0;
            let opacity = 255;
            let color = null;
            let animated = false;

            const shake = this._imfx_state.shake;
            const shakeActive = shake.strength > 0 &&
                (shake.duration < 0 || (frame - shake.startFrame) <= shake.duration);
            if (shakeActive && !shake.face) {
                const seedX = frame * 12.9898 + charIndex * 78.233 + 0.5;
                const seedY = frame * 93.9898 + charIndex * 67.345 + 1.1;
                const nX = imfxNoise(seedX) * 2 - 1;
                const nY = imfxNoise(seedY) * 2 - 1;
                x += nX * shake.strength;
                y += nY * shake.strength;
                animated = true;
            }

            const wave = this._imfx_state.wave;
            if (wave.amplitude > 0) {
                const phase = (charIndex / Math.max(1, wave.length)) * Math.PI * 2 + frame * wave.speed;
                y += Math.sin(phase) * wave.amplitude;
                animated = true;
            }

            const bounce = this._imfx_state.bounce;
            if (bounce.height > 0) {
                const phase = charIndex * 0.35 + frame * bounce.speed;
                y -= Math.abs(Math.sin(phase)) * bounce.height;
                animated = true;
            }

            const sway = this._imfx_state.sway;
            if (sway.amplitude > 0) {
                const phase = frame * sway.speed + charIndex * 0.2;
                x += Math.sin(phase) * sway.amplitude;
                animated = true;
            }

            const floatFx = this._imfx_state.float;
            if (floatFx.amplitude > 0) {
                const phase = frame * floatFx.speed + charIndex * 0.05;
                y += Math.sin(phase) * floatFx.amplitude;
                animated = true;
            }

            const fade = this._imfx_state.fade;
            if (fade.enabled) {
                const phase = frame * fade.speed + charIndex * 0.1;
                const t = (Math.sin(phase) + 1) * 0.5;
                opacity = Math.round(imfxLerp(fade.min, fade.max, t));
                animated = true;
            }

            const rainbow = this._imfx_state.rainbow;
            if (rainbow.enabled) {
                const hue = (frame * rainbow.speed + charIndex * 0.02) % 1;
                color = imfxHueToRgb(hue);
                animated = true;
            }

            return { x, y, opacity, color, animated };
        };

        proto.createTextState = function(text, x, y, width) {
            const textState = _createTextState.call(this, text, x, y, width);
            textState._imfx_charIndex = 0;
            return textState;
        };

        proto.processNewLine = function(textState) {
            _processNewLine.call(this, textState);
            textState._imfx_charIndex = 0;
        };

        proto.processEscapeCharacter = function(code, textState) {
            const upper = String(code).toUpperCase();
            switch (upper) {
                case 'SE': {
                    const arg = imfxObtainBracketText(textState);
                    if (this._imfx_seMuted || this._imfx_silentRedraw) break;

                    const parts = imfxSplitArgs(arg);
                    const name = parts[0] || '';
                    if (!name) break;

                    const volume = imfxToNumber(parts[1], 90);
                    const pitch = imfxToNumber(parts[2], 100);
                    const pan = imfxToNumber(parts[3], 0);
                    const seKey = `${textState.index}:${name}`;

                    if (!this._imfx_playedSe.has(seKey)) {
                        this._imfx_playedSe.add(seKey);
                        AudioManager.playSe({
                            name,
                            volume: Number.isFinite(volume) ? volume : 90,
                            pitch: Number.isFinite(pitch) ? pitch : 100,
                            pan: Number.isFinite(pan) ? pan : 0
                        });
                    }
                    break;
                }
                case 'SHAKE': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const strength = imfxToNumber(parts[0], 8);
                    if (strength <= 0) {
                        this._imfx_state.shake.strength = 0;
                        this._imfx_state.shake.duration = -1;
                        this._imfx_state.shake.face = false;
                        break;
                    }
                    const duration = imfxToNumber(parts[1], -1);
                    const faceFlag = imfxToNumber(parts[2], 0);
                    this._imfx_state.shake.strength = Math.max(0, Math.floor(strength));
                    this._imfx_state.shake.duration = Number.isFinite(duration) ? Math.floor(duration) : -1;
                    this._imfx_state.shake.startFrame = this._imfxGetEffectStart('SHAKE', textState);
                    this._imfx_state.shake.face = faceFlag === 1;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'WAVE': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const amplitude = imfxToNumber(parts[0], 6);
                    if (amplitude <= 0) {
                        this._imfx_state.wave.amplitude = 0;
                        break;
                    }
                    const length = imfxToNumber(parts[1], 12);
                    let speed = imfxToNumber(parts[2], 0.12);
                    if (speed >= 1) {
                        speed = (Math.PI * 2) / Math.max(1, speed);
                    }
                    this._imfx_state.wave.amplitude = Math.max(0, Math.floor(amplitude));
                    this._imfx_state.wave.length = Math.max(1, length);
                    this._imfx_state.wave.speed = speed;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'BOUNCE': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const height = imfxToNumber(parts[0], 8);
                    if (height <= 0) {
                        this._imfx_state.bounce.height = 0;
                        break;
                    }
                    const speed = imfxToNumber(parts[1], 0.18);
                    this._imfx_state.bounce.height = Math.max(0, Math.floor(height));
                    this._imfx_state.bounce.speed = speed;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'FLOAT': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const amplitude = imfxToNumber(parts[0], 4);
                    if (amplitude <= 0) {
                        this._imfx_state.float.amplitude = 0;
                        break;
                    }
                    const speed = imfxToNumber(parts[1], 0.04);
                    this._imfx_state.float.amplitude = Math.max(0, Math.floor(amplitude));
                    this._imfx_state.float.speed = speed;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'SWAY': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const amplitude = imfxToNumber(parts[0], 4);
                    if (amplitude <= 0) {
                        this._imfx_state.sway.amplitude = 0;
                        break;
                    }
                    const speed = imfxToNumber(parts[1], 0.08);
                    this._imfx_state.sway.amplitude = Math.max(0, Math.floor(amplitude));
                    this._imfx_state.sway.speed = speed;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'FADE': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const min = imfxToNumber(parts[0], 80);
                    if (min <= 0) {
                        this._imfx_state.fade.enabled = false;
                        break;
                    }
                    const max = imfxToNumber(parts[1], 255);
                    const speed = imfxToNumber(parts[2], 0.08);
                    this._imfx_state.fade.min = Math.max(0, Math.floor(min));
                    this._imfx_state.fade.max = Math.max(this._imfx_state.fade.min, Math.floor(max));
                    this._imfx_state.fade.speed = speed;
                    this._imfx_state.fade.enabled = true;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'RAINBOW': {
                    const arg = imfxObtainBracketText(textState);
                    const parts = imfxSplitArgs(arg);
                    const speed = imfxToNumber(parts[0], 0.06);
                    if (speed <= 0) {
                        this._imfx_state.rainbow.enabled = false;
                        break;
                    }
                    this._imfx_state.rainbow.speed = speed;
                    this._imfx_state.rainbow.enabled = true;
                    this._imfx_hasAnimation = true;
                    break;
                }
                case 'TYPESPEED': {
                    const arg = imfxObtainBracketText(textState);
                    const n = imfxToNumber(arg, 1);
                    this._imfx_typeSpeedMul = Math.max(1, Math.floor(n));
                    break;
                }
                case 'FXRESET': {
                    this._imfx_state = imfxCreateState();
                    break;
                }
                default:
                    Window_Base.prototype.processEscapeCharacter.call(this, code, textState);
                    break;
            }
        };

        proto.flushTextState = function(textState) {
            if (this._imfx_disableAnimation || !textState.drawing) {
                _flushTextState.call(this, textState);
                return;
            }

            const text = textState.buffer;
            if (!text) {
                _flushTextState.call(this, textState);
                return;
            }

            const rtl = textState.rtl;
            const totalWidth = this.textWidth(text);
            const startX = textState.x;
            const y = textState.y;
            const height = textState.height;
            let x = rtl ? startX - totalWidth : startX;
            let charIndex = textState._imfx_charIndex || 0;

            for (let i = 0; i < text.length; i++) {
                const c = text[i];
                const w = this.textWidth(c);
                textState._imfx_charIndex = charIndex;
                const fx = this._imfxComputeOffsets(textState);
                const prevOpacity = this.contents.paintOpacity;
                const prevColor = this.contents.textColor;

                if (fx.animated) {
                    this._imfx_hasAnimation = true;
                }

                this.contents.paintOpacity = fx.opacity;
                if (fx.color) {
                    this.contents.textColor = fx.color;
                }
                this.contents.drawText(c, x + fx.x, y + fx.y, w * 2, height);
                this.contents.paintOpacity = prevOpacity;
                this.contents.textColor = prevColor;

                x += w;
                charIndex += 1;
            }

            textState.x = rtl ? startX - totalWidth : startX + totalWidth;
            textState.outputWidth = Math.max(textState.outputWidth, Math.abs(textState.x - textState.startX));
            textState.outputHeight = Math.max(textState.outputHeight, y - textState.startY + height);
            textState.buffer = this.createTextBuffer(rtl);
            textState._imfx_charIndex = charIndex;
        };
    }

    //=============================================================================
    // Window_DialogueMessage
    //=============================================================================
    // メッセージ表示ウィンドウ
    //=============================================================================

    class Window_DialogueMessage extends Window_Base {
        constructor(rect) {
            super(rect);
            this.initialize(rect);
        }

        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this._text = '';
            this._typingIndex = 0;
            this._showContinue = false;
            this._continueSprite = null;
            this._systemMode = false;
            this._faceName = '';
            this._faceIndex = 0;
            this._autoMode = false;
            this._skipMode = false;
            this._textState = null;
            this._allTextHeight = 0;
            this._lineSpacing = 0;
            this._faceRequestId = 0;
            this._imfxInit();
            
            this._createContinueSprite();
        }

        _createContinueSprite() {
            this._continueSprite = new Sprite();
            this._continueSprite.bitmap = new Bitmap(24, 24);
            this._continueSprite.bitmap.fontSize = 24;
            this._continueSprite.bitmap.drawText('▼', 0, 0, 24, 24, 'center');
            this._continueSprite.anchor.x = 0.5;
            this._continueSprite.anchor.y = 0.5;
            this._continueSprite.visible = false;
            this.addChild(this._continueSprite);
        }

        update() {
            super.update();
            this._updateContinueSprite();
            if ((this._imfx_hasAnimation || this._imfx_forceAnimation) && this._text) {
                this._imfx_silentRedraw = true;
                this._drawPartialText();
                this._imfx_silentRedraw = false;
            }
            this._imfxUpdateContentsShake();
        }

        _imfxUpdateContentsShake() {
            const sprite = this._windowContentsSprite || this._contentsSprite;
            if (!sprite) return;

            if (this._imfx_contentsBaseX === null || this._imfx_contentsBaseY === null) {
                this._imfx_contentsBaseX = sprite.x;
                this._imfx_contentsBaseY = sprite.y;
            }

            const frame = Graphics.frameCount || 0;
            const shake = this._imfx_state?.shake;
            if (shake && shake.face && shake.strength > 0 &&
                (shake.duration < 0 || (frame - shake.startFrame) <= shake.duration)) {
                const range = shake.strength;
                const offsetX = Math.random() * range * 2 - range;
                const offsetY = Math.random() * range * 2 - range;
                sprite.x = this._imfx_contentsBaseX + offsetX;
                sprite.y = this._imfx_contentsBaseY + offsetY;
            } else {
                sprite.x = this._imfx_contentsBaseX;
                sprite.y = this._imfx_contentsBaseY;
            }
        }

        _updateContinueSprite() {
            if (this._continueSprite && this._showContinue) {
                this._continueSprite.x = this.contentsWidth() - 16;
                this._continueSprite.y = this.contentsHeight() - 8;
                this._continueSprite.opacity = 128 + Math.sin(Graphics.frameCount * 0.1) * 64;
            }
        }

        startMessage(text) {
            this._text = text;
            this._typingIndex = 0;
            this._showContinue = false;
            this.contents.clear();
            this._imfxResetMessageState();
            this._imfx_forceAnimation = /(?:\\|\x1b)(shake|wave|bounce|float|sway|fade|rainbow|fxreset)/i.test(text || '');
            this._imfx_typeSpeedMul = 1;
            
            if (!this._systemMode && this._faceName) {
                this._drawFace();
            }
            
            // テキストの描画準備
            this._textState = this.createTextState(text, this._getTextX(), 0, this._getTextWidth());
            this._allTextHeight = this._textState.outputHeight || 0;
        }

        _getTextX() {
            if (this._systemMode || !this._faceName) {
                return 0;
            }
            return Params.faceWidth + Params.faceOffsetX + 12;
        }

        _getTextWidth() {
            const baseWidth = this.contentsWidth();
            if (this._systemMode || !this._faceName) {
                return baseWidth;
            }
            return baseWidth - Params.faceWidth - Params.faceOffsetX - 12;
        }

        setTypingProgress(index) {
            this._typingIndex = index;
            this._drawPartialText();
        }

        _drawPartialText() {
            const textX = this._getTextX();
            const textWidth = this._getTextWidth();
            
            // テキストエリアのみクリア
            this.contents.clearRect(textX, 0, textWidth, this.contentsHeight());
            
            // 部分テキストを描画
            const partialText = this._text.substring(0, this._typingIndex);
            this._imfxPrepareStateForText(partialText);
            const hadRubyTemp = Object.prototype.hasOwnProperty.call(this, "_rubyTempOff") ? this._rubyTempOff : null;
            if (hadRubyTemp !== null) this._rubyTempOff = true;
            this.drawTextEx(partialText, textX, 0, textWidth);
            if (hadRubyTemp !== null) this._rubyTempOff = hadRubyTemp;
        }

        setFace(faceName, faceIndex) {
            this._faceName = faceName;
            this._faceIndex = faceIndex;
        }

        _drawFace() {
            if (this._faceName) {
                const x = Params.faceOffsetX;
                const y = Params.faceOffsetY;
                const width = Params.faceWidth;
                const height = Params.faceHeight;
                const faceName = this._faceName;
                const faceIndex = this._faceIndex;
                const requestId = ++this._faceRequestId;
                const bitmap = ImageManager.loadFace(faceName);
                const draw = () => {
                    if (this._faceRequestId !== requestId) return;
                    if (this._systemMode) return;
                    if (this._faceName !== faceName || this._faceIndex !== faceIndex) return;
                    this.contents.clearRect(x, y, width, height);
                    this.drawFace(faceName, faceIndex, x, y, width, height);
                };
                if (bitmap.isReady()) {
                    draw();
                } else {
                    bitmap.addLoadListener(draw);
                }
            }
        }

        setSystemMode(enabled) {
            this._systemMode = enabled;
        }

        showContinueIndicator() {
            this._showContinue = true;
            if (this._continueSprite) {
                this._continueSprite.visible = true;
            }
        }

        hideContinueIndicator() {
            this._showContinue = false;
            if (this._continueSprite) {
                this._continueSprite.visible = false;
            }
        }

        updateModeIndicator(modes) {
            this._autoMode = modes.auto;
            this._skipMode = modes.skip;
            // 将来的にはモードインジケーターを描画
        }

        clear() {
            this._text = '';
            this._typingIndex = 0;
            this._showContinue = false;
            this._faceName = '';
            this._faceIndex = 0;
            this._imfx_hasAnimation = false;
            this._imfx_forceAnimation = false;
            this._imfx_typeSpeedMul = 1;
            this.contents.clear();
        }
    }

    //=============================================================================
    // Window_DialogueName
    //=============================================================================
    // 名前表示ウィンドウ
    //=============================================================================

    class Window_DialogueName extends Window_Base {
        constructor(rect) {
            super(rect);
            this.initialize(rect);
        }

        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this._name = '';
            this.padding = 8;
        }

        setName(name) {
            this._name = name;
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            if (this._name) {
                const width = this.contentsWidth();
                this.drawText(this._name, 0, 0, width, 'center');
            }
        }

        open() {
            super.open();
            this.refresh();
        }
    }

    //=============================================================================
    // Window_DialogueChoice
    //=============================================================================
    // 選択肢ウィンドウ
    //=============================================================================

    class Window_DialogueChoice extends Window_Command {
        constructor(rect) {
            super(rect);
            this.initialize(rect);
        }

        initialize(rect) {
            this._choices = [];
            this._cancelIndex = -1;
            super.initialize(rect);
            this.openness = 0;
            this.deactivate();
        }

        setup(choices, cancelIndex) {
            this._choices = choices || [];
            this._cancelIndex = cancelIndex;
            this.refresh();
            this.select(0);
        }

        makeCommandList() {
            for (let i = 0; i < this._choices.length; i++) {
                this.addCommand(this._choices[i], 'choice' + i, true);
            }
        }

        itemTextAlign() {
            return Params.choiceAlignment;
        }

        isCancelEnabled() {
            return this._cancelIndex >= 0;
        }

        callOkHandler() {
            const index = this.index();
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.onChoiceOk(index);
            }
        }

        callCancelHandler() {
            if (this._cancelIndex >= 0) {
                if (typeof DialogueRenderer !== 'undefined') {
                    DialogueRenderer.onChoiceCancel(this._cancelIndex);
                }
            }
        }

        processOk() {
            this.playOkSound();
            this.callOkHandler();
        }

        processCancel() {
            if (this.isCancelEnabled()) {
                this.playCancelSound();
                this.callCancelHandler();
            }
        }
    }

    //=============================================================================
    // Window_DialogueItemChoice
    //=============================================================================
    // アイテム選択ウィンドウ
    //=============================================================================

    class Window_DialogueItemChoice extends Window_ItemList {
        constructor(rect) {
            super(rect);
            this.initialize(rect);
        }

        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this.deactivate();
            this._baseRect = new Rectangle(rect.x, rect.y, rect.width, rect.height);
            this._rows = Params.itemChoiceRows || 1;
            this._cols = Params.itemChoiceCols || 2;
            this._itemTypes = 'both';
            this._excludeItemIds = [];
        }

        setup(options) {
            this._itemTypes = options.itemTypes || 'both';
            this._excludeItemIds = this._parseIdList(options.excludeItemIds);
            const defaultRows = Params.itemChoiceRows || 1;
            const rows = options.rows !== undefined ? Number(options.rows) : defaultRows;
            this._rows = Math.max(1, rows || defaultRows);
            const defaultCols = Params.itemChoiceCols || 2;
            const cols = options.cols !== undefined ? Number(options.cols) : defaultCols;
            this._cols = Math.max(1, cols || defaultCols);
            this._applyRows();
            this.refresh();
            this.select(0);
            this.setTopRow(0);
        }

        maxCols() {
            return this._cols || 1;
        }

        _applyRows() {
            const height = this.fittingHeight(this._rows);
            this.move(this._baseRect.x, this._baseRect.y, this._baseRect.width, height);
            this.createContents();
        }

        _parseIdList(text) {
            if (!text) return [];
            return String(text)
                .split(',')
                .map(t => Number(t.trim()))
                .filter(n => Number.isFinite(n) && n > 0);
        }

        makeItemList() {
            const items = $gameParty ? $gameParty.items() : [];
            this._data = items.filter(item => this._isItemIncluded(item));
        }

        _isItemIncluded(item) {
            if (!item) return false;

            if (this._excludeItemIds.includes(Number(item.id))) return false;

            const type = this._itemTypes;
            const itypeId = Number(item.itypeId) || 0;

            if (type === 'normal') {
                return itypeId === 1;
            }
            if (type === 'key') {
                return itypeId === 2;
            }
            return itypeId === 1 || itypeId === 2;
        }

        isEnabled(item) {
            return true;
        }

        isCurrentItemEnabled() {
            return true;
        }

        isOkEnabled() {
            return true;
        }

        isTouchOkEnabled() {
            return true;
        }

        isCancelEnabled() {
            return true;
        }

        processOk() {
            if (this.isCurrentItemEnabled()) {
                SoundManager.playOk();
                this.updateInputData();
                this.deactivate();
                const item = this.item();
                if (typeof DialogueRenderer !== 'undefined') {
                    DialogueRenderer.onItemChoiceOk(item);
                }
            } else {
                SoundManager.playBuzzer();
            }
        }

        processCancel() {
            SoundManager.playCancel();
            this.updateInputData();
            this.deactivate();
            if (typeof DialogueRenderer !== 'undefined') {
                DialogueRenderer.onItemChoiceCancel();
            }
        }
    }

    //=============================================================================
    // Window_DialogueLog
    //=============================================================================
    // バックログウィンドウ
    //=============================================================================

    class Window_DialogueLog extends Window_Scrollable {
        constructor(rect) {
            super(rect);
            this.initialize(rect);
        }

        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this._log = [];
            this._allTextHeight = 0;
            this._imfxInit();
        }

        setLog(log) {
            this._log = log.slice().reverse(); // 新しいものを上に
            this.refresh();
            this.clearScrollStatus();
            this._scrollX = 0;
            this._scrollY = 0;
            this._scrollBaseX = 0;
            this._scrollBaseY = 0;
            this.updateOrigin();
        }

        refresh() {
            this.contents.clear();
            this._allTextHeight = this._calculateTotalHeight();
            this.createContents();
            this._drawLogEntries();
        }

        _measureTextHeight(text, width) {
            this.resetFontSettings();
            const textState = this.createTextState(text, 0, 0, width);
            textState.drawing = false;
            this.processAllText(textState);
            const output = Number.isFinite(textState.outputHeight) ? textState.outputHeight : 0;
            return Math.max(output, this.lineHeight());
        }

        _calculateTotalHeight() {
            let height = 0;
            const lineHeight = this.lineHeight();
            const entrySpacing = 8;
            const textWidth = Math.max(1, this.contentsWidth() - 16);
            
            for (const entry of this._log) {
                if (entry.speakerName) {
                    height += lineHeight; // 名前行
                }
                // テキスト高さを計測
                height += this._measureTextHeight(entry.text, textWidth);
                height += entrySpacing;
            }
            
            return Math.max(height, this.innerHeight);
        }

        _drawLogEntries() {
            let y = 0;
            const lineHeight = this.lineHeight();
            const entrySpacing = 8;
            
            for (const entry of this._log) {
                // 名前
                if (entry.speakerName) {
                    this.changeTextColor(ColorManager.systemColor());
                    this.drawText(entry.speakerName, 0, y, this.contentsWidth());
                    this.resetTextColor();
                    y += lineHeight;
                }
                
                // テキスト
                const textWidth = Math.max(1, this.contentsWidth() - 16);
                const textHeight = this._measureTextHeight(entry.text, textWidth);
                this._imfx_seMuted = true;
                this._imfx_disableAnimation = true;
                this._imfx_silentRedraw = true;
                this._imfxResetDrawState();
                this.drawTextEx(entry.text, 16, y, textWidth);
                this._imfx_seMuted = false;
                this._imfx_disableAnimation = false;
                this._imfx_silentRedraw = false;
                y += textHeight;
                y += entrySpacing;
            }
        }

        contentsHeight() {
            return this._allTextHeight;
        }

        overallHeight() {
            return Number.isFinite(this._allTextHeight) ? this._allTextHeight : this.innerHeight;
        }

        processTouch() {
            super.processTouch();
            if (TouchInput.isCancelled()) {
                this.processCancel();
            }
        }

        processCancel() {
            SoundManager.playCancel();
            if (typeof DialogueManager !== 'undefined') {
                DialogueManager.closeLog();
            }
        }

        update() {
            super.update();
            
            // キー入力でスクロール
            if (Input.isRepeated('up')) {
                this.smoothScrollBy(-this.lineHeight());
            }
            if (Input.isRepeated('down')) {
                this.smoothScrollBy(this.lineHeight());
            }
            if (Input.isRepeated('pageup')) {
                this.smoothScrollBy(-this.innerHeight);
            }
            if (Input.isRepeated('pagedown')) {
                this.smoothScrollBy(this.innerHeight);
            }
            
            // キャンセルで閉じる
            if (Input.isTriggered('cancel') || Input.isTriggered('ok') || TouchInput.isCancelled()) {
                this.processCancel();
            }
        }

        scrollBlockWidth() {
            return this.contentsWidth() || 1;
        }

        scrollBlockHeight() {
            return this.contentsHeight() || 1;
        }
    }

    //=============================================================================
    // Window_DialogueInterrupt
    //=============================================================================
    // 遮るボタンウィンドウ
    //=============================================================================

    class Window_DialogueInterrupt extends Window_Selectable {
        constructor(rect) {
            super(rect);
            this.initialize(rect);
        }

        initialize(rect) {
            super.initialize(rect);
            this.openness = 0;
            this._visible = false;
            this._bgSprite = null;
            this._applyInterruptSkin();
            this._applyPictureBackground();
            this._applyBackgroundType();
        }

        _applyInterruptSkin() {
            if (Params.interruptButtonWindowskin) {
                this.windowskin = ImageManager.loadSystem(Params.interruptButtonWindowskin);
            }
        }

        _applyPictureBackground() {
            if (!Params.interruptButtonPicture) {
                return;
            }

            const bitmap = ImageManager.loadPicture(Params.interruptButtonPicture);
            if (!this._bgSprite) {
                this._bgSprite = new Sprite();
                this.addChildToBack(this._bgSprite);
            }
            this._bgSprite.bitmap = bitmap;
            this._bgSprite.x = Params.interruptButtonPictureOffsetX || 0;
            this._bgSprite.y = Params.interruptButtonPictureOffsetY || 0;

            bitmap.addLoadListener(() => {
                const bw = bitmap.width || 1;
                const bh = bitmap.height || 1;
                this._bgSprite.scale.x = this.width / bw;
                this._bgSprite.scale.y = this.height / bh;
            });
        }

        _applyBackgroundType() {
            const type = (Params.interruptButtonBackgroundType || 'window').toLowerCase();
            if (type === 'transparent') {
                this.setBackgroundType(2);
            } else if (type === 'dim') {
                this.setBackgroundType(1);
            } else {
                this.setBackgroundType(0);
            }
        }

        maxItems() {
            return 1;
        }

        drawItem(index) {
            // テキストは表示しない
        }

        isEnabled() {
            if (Params.interruptSwitchId > 0) {
                return $gameSwitches.value(Params.interruptSwitchId);
            }
            return true;
        }

        processOk() {
            if (this.isEnabled()) {
                SoundManager.playOk();
                DialogueManager.suppressAdvanceThisFrame();
                if (Params.interruptButtonCommonEventId > 0) {
                    const commonEventId = Params.interruptButtonCommonEventId;
                    if (DialogueManager.startInterruptCommonEvent) {
                        DialogueManager.startInterruptCommonEvent(commonEventId);
                    } else {
                        $gameTemp.reserveCommonEvent(commonEventId);
                    }
                }
                this.callOkHandler();
            } else {
                SoundManager.playBuzzer();
            }
        }

        callOkHandler() {
            // プラグインコマンドまたはコモンイベントで処理
            if (this._handler && this._handler['ok']) {
                this._handler['ok']();
            }
        }

        refresh() {
            super.refresh();
            this.drawAllItems();
        }

        updateVisibility() {
            const shouldShow = DialogueManager.isInterruptButtonVisible() && 
                DialogueManager.isActive() && 
                !DialogueManager.isChoiceBusy() &&
                !DialogueManager.isLogOpen() &&
                this.isEnabled();
            
            if (shouldShow && !this._visible) {
                this.show();
                this.open();
                this._visible = true;
            } else if (!shouldShow && this._visible) {
                this.hide();
                this.close();
                this._visible = false;
            }
        }
    }

    //=============================================================================
    // Spriteset_DialoguePortrait
    //=============================================================================
    // 立ち絵レイヤー
    //=============================================================================

    class Spriteset_DialoguePortrait extends Sprite {
        constructor() {
            super();
            this.initialize();
        }

        initialize() {
            super.initialize();
            this._portraits = {};
            this.createPortraitSprites();
        }

        createPortraitSprites() {
            ['L', 'C', 'R'].forEach(slot => {
                const sprite = new Sprite();
                sprite.anchor.x = 0.5;
                sprite.anchor.y = 1.0;
                sprite.visible = false;
                sprite._targetOpacity = 0;
                sprite._targetScale = 1.0;
                sprite._targetBrightness = 255;
                this._portraits[slot] = sprite;
                this.addChild(sprite);
            });
        }

        getPortraitSprite(slot) {
            return this._portraits[slot] || null;
        }

        update() {
            super.update();
            this.updatePortraits();
        }

        updatePortraits() {
            ['L', 'C', 'R'].forEach(slot => {
                const sprite = this._portraits[slot];
                if (sprite) {
                    this._updatePortraitSprite(sprite);
                }
            });
        }

        _updatePortraitSprite(sprite) {
            // フェード
            if (sprite._targetOpacity !== undefined) {
                const diff = sprite._targetOpacity - sprite.opacity;
                const step = 255 / Params.portraitFadeDuration;
                if (Math.abs(diff) > step) {
                    sprite.opacity += diff > 0 ? step : -step;
                } else {
                    sprite.opacity = sprite._targetOpacity;
                    if (sprite.opacity <= 0) {
                        sprite.visible = false;
                    }
                }
            }
        }
    }

    //=============================================================================
    // Scene_Map Extension
    //=============================================================================

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createDialogueWindows();
    };

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (DialogueManager && DialogueManager.onRendererReady) {
            DialogueManager.onRendererReady();
        }
    };

    Scene_Map.prototype.createDialogueWindows = function() {
        // 立ち絵レイヤー
        this._dialoguePortraitLayer = new Spriteset_DialoguePortrait();
        this.addChild(this._dialoguePortraitLayer);
        
        // メッセージウィンドウ
        const msgRect = this.dialogueMessageWindowRect();
        this._dialogueMessageWindow = new Window_DialogueMessage(msgRect);
        this.addWindow(this._dialogueMessageWindow);
        
        // 名前ウィンドウ
        const nameRect = this.dialogueNameWindowRect();
        this._dialogueNameWindow = new Window_DialogueName(nameRect);
        this.addWindow(this._dialogueNameWindow);
        
        // 選択肢ウィンドウ
        const choiceRect = this.dialogueChoiceWindowRect();
        this._dialogueChoiceWindow = new Window_DialogueChoice(choiceRect);
        this.addWindow(this._dialogueChoiceWindow);

        // アイテム選択ウィンドウ
        const itemChoiceRect = this.dialogueItemChoiceWindowRect();
        this._dialogueItemChoiceWindow = new Window_DialogueItemChoice(itemChoiceRect);
        this.addWindow(this._dialogueItemChoiceWindow);
        
        // ログウィンドウ
        const logRect = this.dialogueLogWindowRect();
        this._dialogueLogWindow = new Window_DialogueLog(logRect);
        this.addWindow(this._dialogueLogWindow);
        
        // 遮るボタンウィンドウ
        if (Params.showInterruptButton) {
            const interruptRect = this.dialogueInterruptWindowRect();
            this._dialogueInterruptWindow = new Window_DialogueInterrupt(interruptRect);
            this.addWindow(this._dialogueInterruptWindow);
        }
        
        // レンダラーにウィンドウを登録
        DialogueRenderer.setWindows(
            this._dialogueMessageWindow,
            this._dialogueNameWindow,
            this._dialogueChoiceWindow,
            this._dialogueLogWindow,
            this._dialogueItemChoiceWindow
        );
        DialogueRenderer.setPortraitLayer(this._dialoguePortraitLayer);

        if (DialogueManager && DialogueManager.onRendererReady) {
            DialogueManager.onRendererReady();
        }
    };

    Scene_Map.prototype.dialogueMessageWindowRect = function() {
        const ww = Params.messageWindowWidth;
        const wh = Params.messageWindowHeight;
        const wx = Params.messageWindowX === -1 ? 
            (Graphics.boxWidth - ww) / 2 : Params.messageWindowX;
        const wy = Params.messageWindowY === -1 ? 
            Graphics.boxHeight - wh - 8 : Params.messageWindowY;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Map.prototype.dialogueNameWindowRect = function() {
        const msgRect = this.dialogueMessageWindowRect();
        const ww = Params.nameBoxWidth;
        const wh = this.calcWindowHeight(1, false);
        const wx = msgRect.x + Params.nameBoxOffsetX;
        const wy = msgRect.y + Params.nameBoxOffsetY;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Map.prototype.dialogueChoiceWindowRect = function() {
        const ww = Params.choiceWindowWidth;
        const wh = this.calcWindowHeight(6, true); // 最大6選択肢
        const wx = Params.choiceWindowX === -1 ? 
            (Graphics.boxWidth - ww) / 2 : Params.choiceWindowX;
        const wy = Params.choiceWindowY;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Map.prototype.dialogueItemChoiceWindowRect = function() {
        const ww = Params.choiceWindowWidth;
        const wh = this.calcWindowHeight(4, true);
        const wx = Params.choiceWindowX === -1 ? 
            (Graphics.boxWidth - ww) / 2 : Params.choiceWindowX;
        const wy = Params.choiceWindowY;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Map.prototype.dialogueLogWindowRect = function() {
        const ww = Graphics.boxWidth - 100;
        const wh = Graphics.boxHeight - 100;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Map.prototype.dialogueInterruptWindowRect = function() {
        const msgRect = this.dialogueMessageWindowRect();
        const ww = Params.interruptButtonWidth || 120;
        const wh = Params.interruptButtonHeight || this.calcWindowHeight(1, true);
        const wx = msgRect.x + msgRect.width - ww + (Params.interruptButtonOffsetX || 0);
        const wy = msgRect.y - wh + (Params.interruptButtonOffsetY || 0);
        return new Rectangle(wx, wy, ww, wh);
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updateDialogueSystem();
    };

    Scene_Map.prototype.updateDialogueSystem = function() {
        if (this._dialogueInterruptWindow) {
            this._dialogueInterruptWindow.updateVisibility();
        }

        if (DialogueManager.isLogOpen()) {
            if (Input.isTriggered(Params.inputCancel) ||
                Input.isTriggered('cancel') ||
                Input.isTriggered(Params.inputLog) ||
                Input.isTriggered('pageup') ||
                TouchInput.isCancelled()) {
                DialogueManager.closeLog();
            }
            return;
        }

        if (DialogueManager.isActive()) {
            if (DialogueRenderer.needsRecovery && DialogueRenderer.needsRecovery()) {
                DialogueManager.onRendererReady();
            }
            DialogueManager.update();
            if (this._dialogueInterruptWindow) {
                if (TouchInput.isTriggered() &&
                    this._dialogueInterruptWindow.isOpen() &&
                    this._dialogueInterruptWindow.isTouchedInsideFrame()) {
                    this._dialogueInterruptWindow.processOk();
                    return;
                }
            }

            DialogueManager.processInput();
            DialogueRenderer.update();
        }
    };

    //=============================================================================
    // Inline FX mixin
    //=============================================================================

    applyInlineFx(Window_DialogueMessage);
    applyInlineFx(Window_DialogueLog);

    //=============================================================================
    // DataManager Extension - Save/Load
    //=============================================================================

    const _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        const contents = _DataManager_makeSaveContents.call(this);
        contents.dialogueFramework = DialogueManager.makeSaveContents();
        return contents;
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        DialogueManager.extractSaveContents(contents.dialogueFramework);
    };

    //=============================================================================
    // Export
    //=============================================================================
    
    window.Window_DialogueMessage = Window_DialogueMessage;
    window.Window_DialogueName = Window_DialogueName;
    window.Window_DialogueChoice = Window_DialogueChoice;
    window.Window_DialogueItemChoice = Window_DialogueItemChoice;
    window.Window_DialogueLog = Window_DialogueLog;
    window.Window_DialogueInterrupt = Window_DialogueInterrupt;
    window.Spriteset_DialoguePortrait = Spriteset_DialoguePortrait;
    
    window.DialogueFramework.Windows = {
        Message: Window_DialogueMessage,
        Name: Window_DialogueName,
        Choice: Window_DialogueChoice,
        ItemChoice: Window_DialogueItemChoice,
        Log: Window_DialogueLog,
        Interrupt: Window_DialogueInterrupt,
        PortraitLayer: Spriteset_DialoguePortrait
    };

})();
