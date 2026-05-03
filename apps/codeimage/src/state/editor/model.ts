import type {PersistedFrameState} from '@codeimage/store/frame/model';

export type EditorMode = 'code' | 'terminal';

export interface AnsiColorPalette {
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
  foreground: string;
  background: string;
  cursor: string;
  cursorText: string;
  selection: string;
  selectionText: string;
}

export interface TerminalPromptConfig {
  username: string;
  hostname: string;
  directory: string;
  showPrompt: boolean;
  promptStyle: 'default' | 'minimal' | 'full';
}

export interface TerminalEditorOptions {
  ansiThemeId: string;
  prompt: TerminalPromptConfig;
  showCursor: boolean;
  cursorBlink: boolean;
}

export interface EditorUIOptions {
  fontId: string;
  fontWeight: number;
  showLineNumbers: boolean;
  focused: boolean;
  themeId: string;
}

export interface TabState {
  tabName: string | null;
  tabIcon?: string;
}

export interface EditorState {
  id: string;
  code: string;
  tab: TabState;
  formatter?: string | null;
  languageId: string;
  lineNumberStart: number;
  mode: EditorMode;
  terminalOptions?: TerminalEditorOptions;
}

export interface EditorUIOptions {
  fontId: string;
  fontWeight: number;
  showLineNumbers: boolean;
  focused: boolean;
  themeId: string;
  enableLigatures: boolean;
}

export interface PersistedEditorState {
  readonly options: Omit<EditorUIOptions, 'focused'>;
  readonly editors: {
    id: string;
    code: string;
    tabName: string;
    languageId: string;
    lineNumberStart: number;
    mode: EditorMode;
    terminalOptions?: TerminalEditorOptions;
  }[];
}

export interface TerminalState {
  showHeader: boolean;
  type: string;
  accentVisible: boolean;
  shadow: string | null;
  background: string;
  textColor: string;
  showWatermark: boolean;
  showGlassReflection: boolean;
  opacity: number;
  alternativeTheme: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  borderType: ('glass' | (string & {})) | null;
}

export type PersistedTerminalState = Pick<
  TerminalState,
  | 'showHeader'
  | 'type'
  | 'accentVisible'
  | 'shadow'
  | 'background'
  | 'textColor'
  | 'showWatermark'
  | 'showGlassReflection'
  | 'opacity'
  | 'alternativeTheme'
  | 'borderType'
>;

export interface ProjectEditorPersistedState {
  $snippetId: string | null;
  $version: string;
  frame: PersistedFrameState;
  terminal: PersistedTerminalState;
  editor: PersistedEditorState;
}
