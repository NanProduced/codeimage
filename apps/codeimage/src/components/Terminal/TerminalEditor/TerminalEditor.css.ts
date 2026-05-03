import {themeVars} from '@codeimage/ui';
import {createTheme, createVar, style} from '@vanilla-extract/css';

export const [terminalEditorTheme, terminalEditorVars] = createTheme({
  backgroundColor: '#1e1e1e',
  foregroundColor: '#cccccc',
  cursorColor: '#ffffff',
  selectionColor: '#264f78',
  lineHeight: '21px',
  fontSize: '14px',
});

export const terminalEditorWrapper = style([
  terminalEditorTheme,
  {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: terminalEditorVars.fontSize,
    lineHeight: terminalEditorVars.lineHeight,
    backgroundColor: terminalEditorVars.backgroundColor,
    color: terminalEditorVars.foregroundColor,
  },
]);

export const terminalEditorContent = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'auto',
  padding: '8px 12px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
});

export const terminalEditorLine = style({
  display: 'flex',
  minHeight: terminalEditorVars.lineHeight,
});

export const terminalEditorPrompt = style({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  userSelect: 'none',
  paddingRight: '8px',
});

export const terminalEditorPromptUser = style({
  color: '#4ec9b0',
  fontWeight: 'bold',
});

export const terminalEditorPromptHost = style({
  color: '#569cd6',
  fontWeight: 'bold',
});

export const terminalEditorPromptSeparator = style({
  color: '#d4d4d4',
});

export const terminalEditorPromptPath = style({
  color: '#dcdcaa',
});

export const terminalEditorPromptSymbol = style({
  color: '#f14c4c',
  fontWeight: 'bold',
  marginLeft: '4px',
});

export const terminalEditorTextArea = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  zIndex: 1,
  resize: 'none',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'transparent',
  caretColor: terminalEditorVars.cursorColor,
  fontFamily: 'monospace',
  fontSize: terminalEditorVars.fontSize,
  lineHeight: terminalEditorVars.lineHeight,
  padding: '8px 12px',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  overflowWrap: 'break-word',
});

export const terminalEditorDisplay = style({
  position: 'relative',
  zIndex: 0,
});

export const ansiBold = style({
  fontWeight: 'bold',
});

export const ansiDim = style({
  opacity: 0.7,
});

export const ansiItalic = style({
  fontStyle: 'italic',
});

export const ansiUnderline = style({
  textDecoration: 'underline',
});

export const ansiBlink = style({
  animation: 'ansiBlink 1s step-end infinite',
});

export const ansiInverse = style({
  filter: 'invert(100%)',
});

export const ansiHidden = style({
  visibility: 'hidden',
});

export const ansiStrikethrough = style({
  textDecoration: 'line-through',
});

export const ansiSpan = style({
  display: 'inline',
});

export const terminalCursor = style({
  display: 'inline-block',
  width: '8px',
  height: '18px',
  backgroundColor: terminalEditorVars.cursorColor,
  animation: 'terminalCursorBlink 1s step-end infinite',
});

export const terminalCursorStatic = style({
  display: 'inline-block',
  width: '8px',
  height: '18px',
  backgroundColor: terminalEditorVars.cursorColor,
});

export const terminalEditorMinimalPrompt = style({
  color: '#6a9955',
  fontWeight: 'bold',
});

export const terminalEditorFullPrompt = style({
  display: 'inline',
});
