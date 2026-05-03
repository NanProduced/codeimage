import {themeVars} from '@codeimage/ui';
import {createTheme, createVar, keyframes, style} from '@vanilla-extract/css';

export const [terminalEditorTheme, terminalEditorVars] = createTheme({
  backgroundColor: '#1e1e1e',
  foregroundColor: '#cccccc',
  cursorColor: '#ffffff',
  selectionColor: '#264f78',
  lineHeight: '21px',
  fontSize: '14px',
});

const cursorBlink = keyframes({
  '0%': {opacity: 1},
  '50%': {opacity: 0},
  '100%': {opacity: 0},
});

const selectionBlink = keyframes({
  '0%': {opacity: 1},
  '50%': {opacity: 0.7},
  '100%': {opacity: 1},
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
  position: 'relative',
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
  zIndex: 2,
  resize: 'none',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'transparent',
  caretColor: 'transparent',
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
  zIndex: 1,
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
  position: 'relative',
});

export const terminalCursor = style({
  display: 'inline-block',
  width: '0.5em',
  height: '1em',
  backgroundColor: terminalEditorVars.cursorColor,
  verticalAlign: 'text-top',
  animation: `${cursorBlink} 1s step-end infinite`,
});

export const terminalCursorStatic = style({
  display: 'inline-block',
  width: '0.5em',
  height: '1em',
  backgroundColor: terminalEditorVars.cursorColor,
  verticalAlign: 'text-top',
});

export const terminalCursorLine = style({
  display: 'inline-block',
  width: '2px',
  height: '1em',
  backgroundColor: terminalEditorVars.cursorColor,
  verticalAlign: 'text-top',
  animation: `${cursorBlink} 1s step-end infinite`,
});

export const terminalCursorLineStatic = style({
  display: 'inline-block',
  width: '2px',
  height: '1em',
  backgroundColor: terminalEditorVars.cursorColor,
  verticalAlign: 'text-top',
});

export const terminalSelection = style({
  backgroundColor: terminalEditorVars.selectionColor,
});

export const terminalEditorMinimalPrompt = style({
  color: '#6a9955',
  fontWeight: 'bold',
});

export const terminalEditorFullPrompt = style({
  display: 'inline',
});
