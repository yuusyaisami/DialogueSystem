/*:
 * @target MZ
 * @plugindesc [v0.1.0] Dialogue Framework - Session Module
 * @author ABC事件開発チーム
 * @base DialogueFramework
 * @orderAfter DialogueManager
 * 
 * @help
 * DialogueFramework の会話セッションモジュールです。
 * DialogueManager.js の後に読み込んでください。
 */

(() => {
    'use strict';

    //=============================================================================
    // DialogueSession
    //=============================================================================
    // 1つの会話セッション（通常会話 / 割り込み会話）を表すクラス
    //=============================================================================

    class DialogueSession {
        constructor(options = {}) {
            this.initialize(options);
        }

        initialize(options) {
            // セッション識別
            this._id = DialogueSession._generateId();
            this._createdAt = Date.now();
            
            // セッション設定
            this._displayType = options.displayType || 'face';
            this._isInterrupt = options.isInterrupt || false;
            this._parentMode = options.parentMode || null; // 'return', 'replace', 'branch'
            
            // 状態
            this._paused = false;
            this._interruptMode = null;
            
            // 会話進行状態
            this._lineIndex = 0;
            this._lines = [];
            
            // スクリプト実行状態（将来用）
            this._scriptId = options.scriptId || null;
            this._scriptPosition = 0;
            
            // メタ情報
            this._variables = {};
            this._flags = {};
        }

        //-----------------------------------------------------------------------------
        // プロパティ
        //-----------------------------------------------------------------------------

        get id() {
            return this._id;
        }

        get displayType() {
            return this._displayType;
        }

        set displayType(value) {
            this._displayType = value;
        }

        get isInterrupt() {
            return this._isInterrupt;
        }

        get parentMode() {
            return this._parentMode;
        }

        get paused() {
            return this._paused;
        }

        set paused(value) {
            this._paused = value;
        }

        get interruptMode() {
            return this._interruptMode;
        }

        set interruptMode(value) {
            this._interruptMode = value;
        }

        get lineIndex() {
            return this._lineIndex;
        }

        //-----------------------------------------------------------------------------
        // ライン管理
        //-----------------------------------------------------------------------------

        addLine(line) {
            this._lines.push(line);
        }

        getLine(index) {
            return this._lines[index] || null;
        }

        getCurrentLine() {
            return this._lines[this._lineIndex] || null;
        }

        nextLine() {
            this._lineIndex++;
            return this.getCurrentLine();
        }

        previousLine() {
            if (this._lineIndex > 0) {
                this._lineIndex--;
            }
            return this.getCurrentLine();
        }

        goToLine(index) {
            if (index >= 0 && index < this._lines.length) {
                this._lineIndex = index;
            }
            return this.getCurrentLine();
        }

        hasMoreLines() {
            return this._lineIndex < this._lines.length;
        }

        getLineCount() {
            return this._lines.length;
        }

        //-----------------------------------------------------------------------------
        // 変数・フラグ（セッションスコープ）
        //-----------------------------------------------------------------------------

        setVariable(key, value) {
            this._variables[key] = value;
        }

        getVariable(key, defaultValue = null) {
            return this._variables.hasOwnProperty(key) ? this._variables[key] : defaultValue;
        }

        setFlag(key, value = true) {
            this._flags[key] = value;
        }

        getFlag(key) {
            return !!this._flags[key];
        }

        clearFlags() {
            this._flags = {};
        }

        //-----------------------------------------------------------------------------
        // スクリプト関連（将来用）
        //-----------------------------------------------------------------------------

        setScript(scriptId) {
            this._scriptId = scriptId;
            this._scriptPosition = 0;
        }

        getScriptId() {
            return this._scriptId;
        }

        getScriptPosition() {
            return this._scriptPosition;
        }

        setScriptPosition(position) {
            this._scriptPosition = position;
        }

        advanceScriptPosition() {
            this._scriptPosition++;
            return this._scriptPosition;
        }

        //-----------------------------------------------------------------------------
        // シリアライズ（セーブ/ロード用）
        //-----------------------------------------------------------------------------

        toJSON() {
            return {
                id: this._id,
                createdAt: this._createdAt,
                displayType: this._displayType,
                isInterrupt: this._isInterrupt,
                parentMode: this._parentMode,
                paused: this._paused,
                interruptMode: this._interruptMode,
                lineIndex: this._lineIndex,
                lines: this._lines,
                scriptId: this._scriptId,
                scriptPosition: this._scriptPosition,
                variables: this._variables,
                flags: this._flags
            };
        }

        static fromJSON(json) {
            const session = new DialogueSession();
            session._id = json.id;
            session._createdAt = json.createdAt;
            session._displayType = json.displayType;
            session._isInterrupt = json.isInterrupt;
            session._parentMode = json.parentMode;
            session._paused = json.paused;
            session._interruptMode = json.interruptMode;
            session._lineIndex = json.lineIndex;
            session._lines = json.lines || [];
            session._scriptId = json.scriptId;
            session._scriptPosition = json.scriptPosition;
            session._variables = json.variables || {};
            session._flags = json.flags || {};
            return session;
        }

        //-----------------------------------------------------------------------------
        // ユーティリティ
        //-----------------------------------------------------------------------------

        static _idCounter = 0;

        static _generateId() {
            return `session_${Date.now()}_${DialogueSession._idCounter++}`;
        }

        clone() {
            return DialogueSession.fromJSON(this.toJSON());
        }

        reset() {
            this._lineIndex = 0;
            this._paused = false;
            this._scriptPosition = 0;
        }
    }

    //=============================================================================
    // Export
    //=============================================================================
    
    window.DialogueSession = DialogueSession;
    window.DialogueFramework.DialogueSession = DialogueSession;

})();
