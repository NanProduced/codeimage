import {themeVars, withThemeMode} from '@codeimage/ui';
import {createTheme, createVar, style} from '@vanilla-extract/css';

export const diffAddedBackground = createVar();
export const diffAddedBorder = createVar();
export const diffRemovedBackground = createVar();
export const diffRemovedBorder = createVar();

export const [diffEditorTheme, diffEditorVars] = createTheme({
  gutterWidth: '60px',
});

export const wrapper = style([
  diffEditorTheme,
  {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    vars: {
      [diffAddedBackground]: 'rgba(46, 160, 67, 0.15)',
      [diffAddedBorder]: 'rgba(46, 160, 67, 0.5)',
      [diffRemovedBackground]: 'rgba(248, 81, 73, 0.15)',
      [diffRemovedBorder]: 'rgba(248, 81, 73, 0.5)',
    },
    selectors: {
      ...withThemeMode({
        dark: {
          vars: {
            [diffAddedBackground]: 'rgba(46, 160, 67, 0.2)',
            [diffAddedBorder]: 'rgba(46, 160, 67, 0.6)',
            [diffRemovedBackground]: 'rgba(248, 81, 73, 0.2)',
            [diffRemovedBorder]: 'rgba(248, 81, 73, 0.6)',
          },
        },
        light: {
          vars: {
            [diffAddedBackground]: 'rgba(46, 160, 67, 0.12)',
            [diffAddedBorder]: 'rgba(46, 160, 67, 0.4)',
            [diffRemovedBackground]: 'rgba(248, 81, 73, 0.12)',
            [diffRemovedBorder]: 'rgba(248, 81, 73, 0.4)',
          },
        },
      }),
    },
  },
]);

export const editorContainer = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
});

export const column = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflow: 'hidden',
  position: 'relative',
});

export const columnHeader = style({
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['2']}`,
  paddingLeft: themeVars.spacing['4'],
  fontSize: themeVars.fontSize.sm,
  fontWeight: 500,
  borderBottom: `1px solid ${themeVars.backgroundColor.gray['700']}`,
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  flexShrink: 0,
});

export const columnDivider = style({
  width: '1px',
  backgroundColor: themeVars.backgroundColor.gray['700'],
  flexShrink: 0,
  zIndex: 1,
});

export const editorWrapper = style({
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
});

export const toolsBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: themeVars.spacing['2'],
  paddingLeft: themeVars.spacing['3'],
  borderBottom: `1px solid ${themeVars.backgroundColor.gray['700']}`,
  flexShrink: 0,
});

export const toolsLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
});

export const toolsRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
});

export const toolButton = style({
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['2']}`,
  borderRadius: themeVars.borderRadius.sm,
  fontSize: themeVars.fontSize.sm,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'inherit',
  selectors: {
    '&:hover': {
      backgroundColor: themeVars.backgroundColor.gray['700'],
    },
  },
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

export const lineAdded = style({
  backgroundColor: diffAddedBackground,
  borderLeft: `3px solid ${diffAddedBorder}`,
});

export const lineRemoved = style({
  backgroundColor: diffRemovedBackground,
  borderLeft: `3px solid ${diffRemovedBorder}`,
});

export const lineModified = style([
  lineAdded,
  lineRemoved,
]);

export const lineUnchanged = style({
  backgroundColor: 'transparent',
  borderLeft: '3px solid transparent',
});

export const emptyLine = style({
  height: '21px',
  backgroundColor: themeVars.backgroundColor.gray['900'],
  opacity: 0.3,
});
