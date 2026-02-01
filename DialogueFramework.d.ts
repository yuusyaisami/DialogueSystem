/**
 * Dialogue Framework MZ - TypeScript Type Definitions
 * 型定義ファイル（開発支援用）
 */

//=============================================================================
// コマンド引数型
//=============================================================================

/**
 * 表示タイプ
 */
type DisplayType = 'face' | 'portrait';

/**
 * 立ち絵スロット
 */
type PortraitSlot = 'L' | 'C' | 'R';

/**
 * 割り込みモード
 */
type InterruptMode = 'return' | 'replace' | 'branch';

/**
 * 割り込み解決方法
 */
type InterruptResolution = 'return' | 'continue';

/**
 * ログ保存モード
 */
type LogSaveMode = 'perSave' | 'global';

/**
 * ログクリア範囲
 */
type LogClearScope = 'current' | 'all';

/**
 * ダイアログフェード種別
 */
type DialogueFadeMode = 'out' | 'in' | 'outIn';

/**
 * アイテム種別
 */
type DialogueItemType = 'normal' | 'key' | 'both';

/**
 * テキスト配置
 */
type TextAlignment = 'left' | 'center' | 'right';

//=============================================================================
// コマンドオプション型
//=============================================================================

/**
 * DialogueStart コマンドオプション
 */
interface DialogueStartOptions {
    /** プレイヤー移動禁止（デフォルト: true） */
    blockPlayer?: boolean;
    /** フェードイン（デフォルト: true） */
    fadeIn?: boolean;
    /** 表示タイプ（デフォルト: プラグイン設定） */
    displayType?: DisplayType;
}

/**
 * DialogueEnd コマンドオプション
 */
interface DialogueEndOptions {
    /** フェードアウト（デフォルト: true） */
    fadeOut?: boolean;
    /** 立ち絵維持（デフォルト: false） */
    keepPortraits?: boolean;
}

/**
 * DialogueFade コマンドオプション
 */
interface DialogueFadeOptions {
    /** フェード種別（デフォルト: outIn） */
    mode?: DialogueFadeMode;
    /** フェード時間（0でデフォルト速度） */
    duration?: number;
}

/**
 * Say コマンドオプション
 */
interface SayOptions {
    /** キャラクターID（0=システム） */
    characterId: number;
    /** 発話テキスト */
    text: string;
    /** 状態キー（表情など） */
    stateKey?: string;
    /** 表示タイプ */
    displayType?: DisplayType;
    /** 立ち絵スロット */
    slot?: PortraitSlot;
    /** 状態を永続更新 */
    updateState?: boolean;
    /** ログに追加（デフォルト: true） */
    addToLog?: boolean;
    /** メタ情報 */
    meta?: {
        /** 矛盾指摘用ID */
        claimId?: string;
        /** タグ配列 */
        tags?: string[];
    };
}

/**
 * CustomSay コマンドオプション
 */
interface CustomSayOptions {
    /** 発話テキスト */
    text: string;
    /** 名前上書き */
    nameOverride?: string;
    /** 顔グラ上書き */
    faceOverride?: {
        faceName: string;
        faceIndex: number;
    };
    /** 立ち絵上書き */
    portraitOverride?: string;
    /** 表示タイプ */
    displayType?: DisplayType;
    /** 立ち絵スロット */
    slot?: PortraitSlot;
    /** ログに追加（デフォルト: true） */
    addToLog?: boolean;
}

/**
 * SystemSay コマンドオプション
 */
interface SystemSayOptions {
    /** 発話テキスト */
    text: string;
    /** ログに追加（デフォルト: true） */
    addToLog?: boolean;
}

/**
 * Choice コマンドオプション
 */
interface ChoiceOptions {
    /** 選択肢テキスト配列 */
    choices: string[];
    /** 結果格納変数ID */
    resultVariableId: number;
    /** キャンセル時選択インデックス（-1で無効） */
    cancelIndex?: number;
    /** ログに追加（デフォルト: true） */
    addToLog?: boolean;
}

/**
 * ItemChoice コマンドオプション
 */
interface ItemChoiceOptions {
    /** 表示アイテム種別 */
    itemTypes?: DialogueItemType;
    /** 除外アイテムID（カンマ区切り文字列） */
    excludeItemIds?: string;
    /** 結果格納変数ID */
    resultVariableId: number;
    /** キャンセル時の値 */
    cancelValue?: number;
    /** 表示行数 */
    rows?: number;
    /** 表示列数 */
    cols?: number;
    /** ログに追加（デフォルト: true） */
    addToLog?: boolean;
}

/**
 * InterruptPush コマンドオプション
 */
interface InterruptPushOptions {
    /** 割り込みモード */
    mode: InterruptMode;
    /** 元会話停止（デフォルト: true） */
    pauseBase?: boolean;
}

/**
 * InterruptResolve コマンドオプション
 */
interface InterruptResolveOptions {
    /** 解決方法 */
    resolution: InterruptResolution;
}

/**
 * ShowPortrait コマンドオプション
 */
interface ShowPortraitOptions {
    /** キャラクターID */
    characterId: number;
    /** スロット */
    slot: PortraitSlot;
    /** 状態キー */
    stateKey?: string;
    /** フェードイン（デフォルト: true） */
    fadeIn?: boolean;
}

/**
 * HidePortrait コマンドオプション
 */
interface HidePortraitOptions {
    /** スロット */
    slot: PortraitSlot;
    /** フェードアウト（デフォルト: true） */
    fadeOut?: boolean;
}

/**
 * ClearPortraits コマンドオプション
 */
interface ClearPortraitsOptions {
    /** フェードアウト（デフォルト: true） */
    fadeOut?: boolean;
}

//=============================================================================
// データ構造型
//=============================================================================

/**
 * キャラクター定義
 */
interface CharacterDefinition {
    /** キャラクターID（0=システム） */
    id: number;
    /** 表示名 */
    name: string;
    /** デフォルト表示タイプ */
    displayTypeDefault: DisplayType;
    /** 顔グラ設定 */
    face: FaceConfig | null;
    /** 立ち絵設定 */
    portrait: PortraitConfig | null;
    /** 使用する状態キー一覧 */
    states: string[];
    /** メタ情報 */
    meta: CharacterMeta;
}

/**
 * 顔グラ設定
 */
interface FaceConfig {
    /** 顔グラファイル名（img/faces/） */
    faceName: string;
    /** 状態→顔インデックスマッピング */
    faceIndexByState: { [stateKey: string]: number };
}

/**
 * 立ち絵設定
 */
interface PortraitConfig {
    /** ベース画像ファイル名 */
    base: string;
    /** 状態→画像ファイル名マッピング */
    byState: { [stateKey: string]: string };
    /** デフォルトスロット */
    defaultSlot: PortraitSlot;
    /** アンカーポイント */
    anchor: 'bottom' | 'center';
}

/**
 * キャラクターメタ情報
 */
interface CharacterMeta {
    /** ボイスファイルプレフィックス */
    voicePrefix?: string;
    /** テーマカラー */
    themeColor?: string;
    /** システムキャラフラグ */
    isSystem?: boolean;
    /** 匿名フラグ */
    isAnonymous?: boolean;
    /** 説明 */
    description?: string;
    /** その他任意プロパティ */
    [key: string]: any;
}

/**
 * キャラクター状態ストア
 */
interface CharacterStateStore {
    /** 現在の状態キー */
    currentStateKey: string;
    /** ムード変数（好感度、緊張度など） */
    moodVars: { [varName: string]: number | string | boolean };
}

/**
 * ログエントリ
 */
interface LogEntry {
    /** タイムスタンプ */
    timestamp: number;
    /** 発話者名 */
    speakerName: string;
    /** テキスト */
    text: string;
    /** 表示タイプ */
    displayType: DisplayType | 'choice';
    /** キャラクターID */
    characterId: number;
    /** メタ情報 */
    meta: {
        claimId?: string;
        tags?: string[];
        [key: string]: any;
    };
}

/**
 * 発話行
 */
interface DialogueLine {
    /** キャラクターID */
    characterId: number;
    /** 名前 */
    name: string;
    /** テキスト */
    text: string;
    /** 表示タイプ */
    displayType: DisplayType;
    /** 状態キー */
    stateKey: string | null;
    /** スロット */
    slot: PortraitSlot | null;
    /** 顔グラ情報 */
    face: { faceName: string; faceIndex: number } | null;
    /** 立ち絵情報 */
    portrait: { filename: string; anchor: string } | null;
    /** システムメッセージフラグ */
    isSystem?: boolean;
    /** メタ情報 */
    meta: {
        claimId?: string;
        tags?: string[];
        [key: string]: any;
    };
}

//=============================================================================
// グローバル宣言
//=============================================================================

declare class DialogueManager {
    static isActive(): boolean;
    static isBusy(): boolean;
    static isChoiceBusy(): boolean;
    static isLogOpen(): boolean;
    static isFadeBusy(): boolean;
    static isAutoMode(): boolean;
    static isSkipMode(): boolean;
    static isInterruptPaused(): boolean;
    static getCurrentDisplayType(): DisplayType;
    static getCurrentLine(): DialogueLine | null;
    
    static start(options?: DialogueStartOptions): void;
    static end(options?: DialogueEndOptions): void;
    static fade(options?: DialogueFadeOptions): void;
    static update(): void;
    static startInterruptCommonEvent(commonEventId: number): void;
    static say(options: SayOptions): void;
    static customSay(options: CustomSayOptions): void;
    static systemSay(options: SystemSayOptions): void;
    static showChoice(options: ChoiceOptions): void;
    static showItemChoice(options: ItemChoiceOptions): void;
    static interruptPush(options: InterruptPushOptions): void;
    static interruptResolve(options: InterruptResolveOptions): void;
    static openLog(): void;
    static clearLog(scope?: LogClearScope): void;
    static getLog(): LogEntry[];
    static toggleAutoMode(): void;
    static toggleSkipMode(): void;
}

declare class DialogueRenderer {
    static showLine(line: DialogueLine, callback: () => void): void;
    static showChoice(options: ChoiceOptions, callback: (index: number) => void): void;
    static showPortrait(options: ShowPortraitOptions): void;
    static hidePortrait(options: HidePortraitOptions): void;
    static clearPortraits(options: ClearPortraitsOptions): void;
    static fadeTo(target: number, callback?: () => void, duration?: number): void;
    static openLogWindow(log: LogEntry[], callback: () => void): void;
    static closeLogWindow(): void;
    static advanceText(): void;
    static update(): void;
}

declare class CharacterDatabase {
    static load(): void;
    static isLoaded(): boolean;
    static getCharacter(id: number): CharacterDefinition | null;
    static getCharacterByName(name: string): CharacterDefinition | null;
    static getAllCharacters(): CharacterDefinition[];
    static hasCharacter(id: number): boolean;
    static registerCharacter(character: CharacterDefinition): CharacterDefinition;
    static unregisterCharacter(id: number): boolean;
    static getCharacterState(id: number): string;
    static setCharacterState(id: number, stateKey: string): void;
    static getMoodVar(id: number, varName: string): any;
    static setMoodVar(id: number, varName: string, value: any): void;
    static getFaceForState(id: number, stateKey?: string): { faceName: string; faceIndex: number } | null;
    static getPortraitForState(id: number, stateKey?: string): { filename: string; slot: PortraitSlot; anchor: string } | null;
    static getAllStates(): { [id: number]: CharacterStateStore };
    static restoreStates(states: { [id: number]: CharacterStateStore }): void;
    static preloadCharacterAssets(id: number): void;
    static preloadAllAssets(): void;
}

declare class DialogueSession {
    constructor(options?: {
        displayType?: DisplayType;
        isInterrupt?: boolean;
        parentMode?: InterruptMode;
        scriptId?: string;
    });
    
    readonly id: string;
    displayType: DisplayType;
    readonly isInterrupt: boolean;
    readonly parentMode: InterruptMode | null;
    paused: boolean;
    interruptMode: InterruptMode | null;
    readonly lineIndex: number;
    
    addLine(line: DialogueLine): void;
    getLine(index: number): DialogueLine | null;
    getCurrentLine(): DialogueLine | null;
    nextLine(): DialogueLine | null;
    previousLine(): DialogueLine | null;
    goToLine(index: number): DialogueLine | null;
    hasMoreLines(): boolean;
    getLineCount(): number;
    
    setVariable(key: string, value: any): void;
    getVariable(key: string, defaultValue?: any): any;
    setFlag(key: string, value?: boolean): void;
    getFlag(key: string): boolean;
    
    toJSON(): object;
    static fromJSON(json: object): DialogueSession;
    clone(): DialogueSession;
    reset(): void;
}

//=============================================================================
// グローバル名前空間
//=============================================================================

declare namespace DialogueFramework {
    const Params: {
        defaultDisplayType: DisplayType;
        characterDatabasePath: string;
        blockPlayerDuringDialogue: boolean;
        messageWindowWidth: number;
        messageWindowHeight: number;
        typingSpeed: number;
        autoModeDelay: number;
        skipSpeed: number;
        // ... その他パラメータ
    };
    
    const DialogueManager: typeof DialogueManager;
    const DialogueRenderer: typeof DialogueRenderer;
    const DialogueSession: typeof DialogueSession;
    const CharacterDatabase: typeof CharacterDatabase;
    
    namespace Windows {
        const Message: typeof Window_DialogueMessage;
        const Name: typeof Window_DialogueName;
        const Choice: typeof Window_DialogueChoice;
        const Log: typeof Window_DialogueLog;
        const Interrupt: typeof Window_DialogueInterrupt;
        const PortraitLayer: typeof Spriteset_DialoguePortrait;
    }
}

// ウィンドウクラス宣言
declare class Window_DialogueMessage extends Window_Base {}
declare class Window_DialogueName extends Window_Base {}
declare class Window_DialogueChoice extends Window_Command {}
declare class Window_DialogueLog extends Window_Scrollable {}
declare class Window_DialogueInterrupt extends Window_Selectable {}
declare class Spriteset_DialoguePortrait extends Sprite {}
