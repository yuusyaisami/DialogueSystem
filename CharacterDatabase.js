/*:
 * @target MZ
 * @plugindesc [v0.1.0] Dialogue Framework - Character Database Module
 * @author ABC事件開発チーム
 * @base DialogueFramework
 * @orderAfter DialogueRenderer
 * 
 * @help
 * DialogueFramework のキャラクターデータベースモジュールです。
 * DialogueRenderer.js の後に読み込んでください。
 * 
 * キャラクター定義はデータソース設定により：
 * - json: data/DialogueCharacters.json から読み込み
 * - parameter: プラグインパラメータで定義
 * - both: 両方を読み込み（パラメータ優先でマージ）
 */

(() => {
    'use strict';

    const Params = window.DialogueFramework.Params;

    //=============================================================================
    // CharacterDatabase
    //=============================================================================
    // キャラ定義（名前・顔・立ち絵・状態・表示位置など）を提供するクラス
    //=============================================================================

    class CharacterDatabase_Class {
        constructor() {
            this.initialize();
        }

        initialize() {
            // キャラクターデータ
            this._characters = {};
            
            // キャラクター状態ストア
            this._characterStates = {};
            
            // 読み込み状態
            this._loaded = false;
            this._loading = false;
        }

        //-----------------------------------------------------------------------------
        // データ読み込み
        //-----------------------------------------------------------------------------

        load() {
            if (this._loaded || this._loading) return;
            
            this._loading = true;
            
            const dataSource = Params.characterDataSource || 'parameter';
            
            if (dataSource === 'parameter') {
                // プラグインパラメータからのみ読み込み
                this._loadFromParameter();
                this._finishLoading();
            } else if (dataSource === 'json') {
                // JSONからのみ読み込み
                this._loadFromJson(() => {
                    this._finishLoading();
                });
            } else if (dataSource === 'both') {
                // 両方読み込み（JSON先、パラメータで上書き）
                this._loadFromJson(() => {
                    this._loadFromParameter(); // パラメータで上書き
                    this._finishLoading();
                });
            } else {
                this._loadFromParameter();
                this._finishLoading();
            }
        }
        
        _loadFromParameter() {
            const characterList = Params.characterList;
            if (!Array.isArray(characterList)) {
                console.warn('CharacterDatabase: characterList is not an array', characterList);
                return;
            }
            characterList.forEach(char => {
                if (char && typeof char === 'object' && char.id !== undefined) {
                    this._characters[char.id] = this._normalizeCharacter(char);
                }
            });
        }
        
        _loadFromJson(callback) {
            const path = Params.characterDatabasePath;
            
            const xhr = new XMLHttpRequest();
            xhr.open('GET', path);
            xhr.overrideMimeType('application/json');
            xhr.onload = () => {
                if (xhr.status < 400) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        this._processJsonData(data);
                    } catch (e) {
                        console.error('CharacterDatabase: Failed to parse JSON', e);
                    }
                } else {
                    console.warn('CharacterDatabase: JSON file not found');
                }
                if (callback) callback();
            };
            xhr.onerror = () => {
                console.warn('CharacterDatabase: Error loading JSON file');
                if (callback) callback();
            };
            xhr.send();
        }
        
        _processJsonData(data) {
            if (Array.isArray(data.characters)) {
                data.characters.forEach(char => {
                    this._characters[char.id] = this._normalizeCharacter(char);
                });
            } else if (Array.isArray(data)) {
                data.forEach(char => {
                    this._characters[char.id] = this._normalizeCharacter(char);
                });
            }
        }
        
        _finishLoading() {
            // システムキャラクター（ID=0）がなければ作成
            if (!this._characters[0]) {
                this._characters[0] = {
                    id: 0,
                    name: '',
                    displayTypeDefault: 'face',
                    face: null,
                    portrait: null,
                    states: ['normal'],
                    meta: { isSystem: true }
                };
            }
            
            // 初期状態の設定
            Object.keys(this._characters).forEach(id => {
                if (!this._characterStates[id]) {
                    this._characterStates[id] = {
                        currentStateKey: 'normal',
                        moodVars: {}
                    };
                }
            });
            
            this._loaded = true;
            this._loading = false;
            
            console.log('CharacterDatabase: Loaded', Object.keys(this._characters).length, 'characters from', Params.characterDataSource);
        }

        _normalizeCharacter(char) {
            return {
                id: char.id || 0,
                name: char.name || '',
                displayTypeDefault: char.displayTypeDefault || 'face',
                face: char.face ? {
                    faceName: char.face.faceName || '',
                    faceIndexByState: char.face.faceIndexByState || { normal: 0 }
                } : null,
                portrait: char.portrait ? {
                    base: char.portrait.base || '',
                    byState: char.portrait.byState || {},
                    defaultSlot: char.portrait.defaultSlot || 'C',
                    anchor: char.portrait.anchor || 'bottom'
                } : null,
                states: Array.isArray(char.states) ? char.states : ['normal'],
                meta: char.meta || {}
            };
        }

        //-----------------------------------------------------------------------------
        // キャラクター取得
        //-----------------------------------------------------------------------------

        getCharacter(id) {
            // IDが0の場合はシステムキャラクター
            if (id === 0) {
                return this._characters[0] || {
                    id: 0,
                    name: '',
                    displayTypeDefault: 'face',
                    face: null,
                    portrait: null,
                    states: ['normal'],
                    meta: { isSystem: true }
                };
            }
            
            return this._characters[id] || null;
        }

        getCharacterByName(name) {
            for (const id in this._characters) {
                if (this._characters[id].name === name) {
                    return this._characters[id];
                }
            }
            return null;
        }

        getAllCharacters() {
            return Object.values(this._characters);
        }

        hasCharacter(id) {
            return !!this._characters[id];
        }

        //-----------------------------------------------------------------------------
        // キャラクター登録（ランタイム）
        //-----------------------------------------------------------------------------

        registerCharacter(character) {
            const normalized = this._normalizeCharacter(character);
            this._characters[normalized.id] = normalized;
            
            // 初期状態設定
            if (!this._characterStates[normalized.id]) {
                this._characterStates[normalized.id] = {
                    currentStateKey: 'normal',
                    moodVars: {}
                };
            }
            
            return normalized;
        }

        unregisterCharacter(id) {
            if (this._characters[id]) {
                delete this._characters[id];
                delete this._characterStates[id];
                return true;
            }
            return false;
        }

        //-----------------------------------------------------------------------------
        // キャラクター状態
        //-----------------------------------------------------------------------------

        getCharacterState(id) {
            const state = this._characterStates[id];
            return state ? state.currentStateKey : 'normal';
        }

        setCharacterState(id, stateKey) {
            if (!this._characterStates[id]) {
                this._characterStates[id] = {
                    currentStateKey: stateKey,
                    moodVars: {}
                };
            } else {
                this._characterStates[id].currentStateKey = stateKey;
            }
        }

        getMoodVar(id, varName) {
            const state = this._characterStates[id];
            if (state && state.moodVars) {
                return state.moodVars[varName];
            }
            return undefined;
        }

        setMoodVar(id, varName, value) {
            if (!this._characterStates[id]) {
                this._characterStates[id] = {
                    currentStateKey: 'normal',
                    moodVars: {}
                };
            }
            this._characterStates[id].moodVars[varName] = value;
        }

        //-----------------------------------------------------------------------------
        // 顔グラフィック取得
        //-----------------------------------------------------------------------------

        getFaceForState(id, stateKey) {
            const char = this.getCharacter(id);
            if (!char || !char.face) return null;
            
            stateKey = stateKey || this.getCharacterState(id) || 'normal';
            
            return {
                faceName: char.face.faceName,
                faceIndex: char.face.faceIndexByState[stateKey] || 0
            };
        }

        //-----------------------------------------------------------------------------
        // 立ち絵取得
        //-----------------------------------------------------------------------------

        getPortraitForState(id, stateKey) {
            const char = this.getCharacter(id);
            if (!char || !char.portrait) return null;
            
            stateKey = stateKey || this.getCharacterState(id) || 'normal';
            
            let filename = char.portrait.base;
            if (char.portrait.byState && char.portrait.byState[stateKey]) {
                filename = char.portrait.byState[stateKey];
            }
            
            return {
                filename: filename,
                slot: char.portrait.defaultSlot,
                anchor: char.portrait.anchor
            };
        }

        //-----------------------------------------------------------------------------
        // 状態の保存/復元
        //-----------------------------------------------------------------------------

        getAllStates() {
            return JSON.parse(JSON.stringify(this._characterStates));
        }

        restoreStates(states) {
            this._characterStates = JSON.parse(JSON.stringify(states));
        }

        resetAllStates() {
            Object.keys(this._characterStates).forEach(id => {
                this._characterStates[id] = {
                    currentStateKey: 'normal',
                    moodVars: {}
                };
            });
        }

        //-----------------------------------------------------------------------------
        // 画像プリロード
        //-----------------------------------------------------------------------------

        preloadCharacterAssets(id) {
            const char = this.getCharacter(id);
            if (!char) return;
            
            // 顔グラのプリロード
            if (char.face && char.face.faceName) {
                ImageManager.loadFace(char.face.faceName);
            }
            
            // 立ち絵のプリロード
            if (char.portrait) {
                if (char.portrait.base) {
                    ImageManager.loadPicture(char.portrait.base);
                }
                if (char.portrait.byState) {
                    Object.values(char.portrait.byState).forEach(filename => {
                        ImageManager.loadPicture(filename);
                    });
                }
            }
        }

        preloadAllAssets() {
            Object.keys(this._characters).forEach(id => {
                this.preloadCharacterAssets(parseInt(id));
            });
        }

        //-----------------------------------------------------------------------------
        // ユーティリティ
        //-----------------------------------------------------------------------------

        isLoaded() {
            return this._loaded;
        }

        reload() {
            this._loaded = false;
            this._loading = false;
            this._characters = {};
            this.load();
        }
    }

    //=============================================================================
    // Export
    //=============================================================================
    
    window.CharacterDatabase = new CharacterDatabase_Class();
    window.DialogueFramework.CharacterDatabase = window.CharacterDatabase;

    //=============================================================================
    // Scene_Boot Extension - Load Character Database
    //=============================================================================

    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function() {
        _Scene_Boot_loadGameFonts.call(this);
        CharacterDatabase.load();
    };

})();
