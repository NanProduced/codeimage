import {themeVars} from '@codeimage/ui';
import {createTheme, createVar, style} from '@vanilla-extract/css';

export const [diffEditorTheme, diffEditorVars] = createTheme({
  addedBackground: 'rgba(46, 160, 67, 0.15)',
  addedBorder: 'rgba(46, 160, 67, 0.4)',
  removedBackground: 'rgba(248, 81, 73, 0.15)',
  removedBorder: 'rgba(248, 81, 73, 0.4)',
  modifiedBackground: 'rgba(255, 188, 0, 0.15)',
  modifiedBorder: 'rgba(255, 188, 0, 0.4)',
  unchangedBackground: 'transparent',
  gutterWidth: '60px',
  lineNumberColor: themeVars.backgroundColor.gray['400'],
});

export const wrapper = style([
  diffEditorTheme,
  {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
]);

export const column = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflow: 'hidden',
});

export const columnHeader = style({
  padding: themeVars.spacing['2'],
  paddingLeft: themeVars.spacing['4'],
  fontSize: themeVars.fontSize.sm,
  fontWeight: 500,
  borderBottom: `1px solid ${themeVars.backgroundColor.gray['700']}`,
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
});

export const columnDivider = style({
  width: '1px',
  backgroundColor: themeVars.backgroundColor.gray['700'],
  flexShrink: 0,
});

export const codeContainer = style({
  flex: 1,
  overflow: 'auto',
  position: 'relative',
});

export const line = style({
  display: 'flex',
  width: '100%',
  minHeight: '21px',
  lineHeight: '21px',
  fontSize: themeVars.fontSize.base,
  fontFamily: 'monospace',
  whiteSpace: 'pre',
  position: 'relative',
  transition: 'background-color 0.15s ease',
});

export const lineGutter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingRight: themeVars.spacing['3'],
  paddingLeft: themeVars.spacing['2'],
  minWidth: diffEditorVars.gutterWidth,
  color: diffEditorVars.lineNumberColor,
  fontSize: themeVars.fontSize.sm,
  userSelect: 'none',
  flexShrink: 0,
  borderRight: `1px solid ${themeVars.backgroundColor.gray['700']}`,
});

export const lineContent = style({
  flex: 1,
  paddingLeft: themeVars.spacing['2'],
  paddingRight: themeVars.spacing['2'],
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'pre',
});

export const lineAdded = style({
  backgroundColor: diffEditorVars.addedBackground,
  borderLeft: `3px solid ${diffEditorVars.addedBorder}`,
});

export const lineRemoved = style({
  backgroundColor: diffEditorVars.removedBackground,
  borderLeft: `3px solid ${diffEditorVars.removedBorder}`,
});

export const lineModified = style({
  backgroundColor: diffEditorVars.modifiedBackground,
  borderLeft: `3px solid ${diffEditorVars.modifiedBorder}`,
});

export const lineUnchanged = style({
  backgroundColor: diffEditorVars.unchangedBackground,
  borderLeft: '3px solid transparent',
});

export const diffMarker = style({
  position: 'absolute',
  left: '4px',
  width: '4px',
  height: '4px',
  borderRadius: '50%',
});

export const diffMarkerAdded = style([
  diffMarker,
  {
    backgroundColor: diffEditorVars.addedBorder,
  },
]);

export const diffMarkerRemoved = style([
  diffMarker,
  {
    backgroundColor: diffEditorVars.removedBorder,
  },
]);

export const diffMarkerModified = style([
  diffMarker,
  {
    backgroundColor: diffEditorVars.modifiedBorder,
  },
]);

export const editorWrapper = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const editorHeader = style({
  display: 'flex',
  alignItems: 'center',
  padding: themeVars.spacing['2'],
  borderBottom: `1px solid ${themeVars.backgroundColor.gray['700']}`,
  gap: themeVars.spacing['2'],
});

export const editorTabs = style({
  display: 'flex',
  gap: themeVars.spacing['1'],
  flex: 1,
});

export const editorTab = style({
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['2']}`,
  borderRadius: themeVars.borderRadius.sm,
  cursor: 'pointer',
  fontSize: themeVars.fontSize.sm,
  transition: 'background-color 0.15s ease',
  selectors: {
    '&:hover': {
      backgroundColor: themeVars.backgroundColor.gray['700'],
    },
  },
});

export const editorTabActive = style({
  backgroundColor: themeVars.backgroundColor.gray['700'],
  fontWeight: 500,
});

export const modeSelector = style({
  display: 'flex',
  gap: themeVars.spacing['1'],
  backgroundColor: themeVars.backgroundColor.gray['800'],
  padding: themeVars.spacing['1'],
  borderRadius: themeVars.borderRadius.md,
});

export const modeButton = style({
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['3']}`,
  borderRadius: themeVars.borderRadius.sm,
  fontSize: themeVars.fontSize.sm,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  border: 'none',
  outline: 'none',
  selectors: {
    '&:hover': {
      backgroundColor: themeVars.backgroundColor.gray['700'],
    },
  },
});

export const modeButtonActive = style({
  backgroundColor: themeVars.backgroundColor.gray['600'],
  fontWeight: 500,
});

export const diffInputArea = style({
  padding: themeVars.spacing['3'],
  borderBottom: `1px solid ${themeVars.backgroundColor.gray['700']}`,
  backgroundColor: themeVars.backgroundColor.gray['800'],
});

export const diffInput = style({
  width: '100%',
  minHeight: '80px',
  padding: themeVars.spacing['2'],
  backgroundColor: themeVars.backgroundColor.gray['900'],
  border: `1px solid ${themeVars.backgroundColor.gray['700']}`,
  borderRadius: themeVars.borderRadius.md,
  color: themeVars.dynamicColors.baseText,
  fontFamily: 'monospace',
  fontSize: themeVars.fontSize.sm,
  resize: 'vertical',
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: themeVars.backgroundColor.gray['500'],
    },
  },
});

export const diffInputLabel = style({
  display: 'block',
  fontSize: themeVars.fontSize.sm,
  marginBottom: themeVars.spacing['2'],
  color: themeVars.dynamicColors.descriptionTextColor,
});

export const parseButton = style({
  marginTop: themeVars.spacing['2'],
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['4']}`,
  backgroundColor: themeVars.dynamicColors.button.primary.backgroundColor,
  color: themeVars.dynamicColors.button.primary.textColor,
  border: 'none',
  borderRadius: themeVars.borderRadius.md,
  fontSize: themeVars.fontSize.sm,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  selectors: {
    '&:hover': {
      backgroundColor: themeVars.backgroundColor.gray['500'],
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
});

export const emptyLine = style({
  height: '21px',
  backgroundColor: themeVars.backgroundColor.gray['900'],
  opacity: 0.3,
});
