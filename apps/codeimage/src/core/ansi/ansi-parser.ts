export interface AnsiStyle {
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  blink: boolean;
  inverse: boolean;
  hidden: boolean;
  strikethrough: boolean;
  foreground: number | null;
  background: number | null;
  foregroundColor: string | null;
  backgroundColor: string | null;
}

export interface AnsiToken {
  text: string;
  style: AnsiStyle;
}

export interface AnsiParsedResult {
  tokens: AnsiToken[];
  rawText: string;
  hasAnsiCodes: boolean;
}

const DEFAULT_STYLE: AnsiStyle = {
  bold: false,
  dim: false,
  italic: false,
  underline: false,
  blink: false,
  inverse: false,
  hidden: false,
  strikethrough: false,
  foreground: null,
  background: null,
  foregroundColor: null,
  backgroundColor: null,
};

const ANSI_REGEX = /\x1b\[([0-9;?]*)([a-zA-Z])/g;

export function cloneStyle(style: AnsiStyle): AnsiStyle {
  return { ...style };
}

export function resetStyle(): AnsiStyle {
  return { ...DEFAULT_STYLE };
}

function applySgrCode(style: AnsiStyle, code: number, params: number[]): AnsiStyle {
  const newStyle = cloneStyle(style);

  switch (code) {
    case 0:
      return resetStyle();
    case 1:
      newStyle.bold = true;
      newStyle.dim = false;
      break;
    case 2:
      newStyle.dim = true;
      newStyle.bold = false;
      break;
    case 3:
      newStyle.italic = true;
      break;
    case 4:
      newStyle.underline = true;
      break;
    case 5:
    case 6:
      newStyle.blink = true;
      break;
    case 7:
      newStyle.inverse = true;
      break;
    case 8:
      newStyle.hidden = true;
      break;
    case 9:
      newStyle.strikethrough = true;
      break;
    case 22:
      newStyle.bold = false;
      newStyle.dim = false;
      break;
    case 23:
      newStyle.italic = false;
      break;
    case 24:
      newStyle.underline = false;
      break;
    case 25:
      newStyle.blink = false;
      break;
    case 27:
      newStyle.inverse = false;
      break;
    case 28:
      newStyle.hidden = false;
      break;
    case 29:
      newStyle.strikethrough = false;
      break;
    case 30:
    case 31:
    case 32:
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
      newStyle.foreground = code - 30;
      newStyle.foregroundColor = null;
      break;
    case 38:
      if (params.length >= 2) {
        if (params[1] === 5 && params.length >= 3) {
          newStyle.foreground = params[2];
          newStyle.foregroundColor = null;
        } else if (params[1] === 2 && params.length >= 5) {
          newStyle.foregroundColor = `rgb(${params[2]},${params[3]},${params[4]})`;
          newStyle.foreground = null;
        }
      }
      break;
    case 39:
      newStyle.foreground = null;
      newStyle.foregroundColor = null;
      break;
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
      newStyle.background = code - 40;
      newStyle.backgroundColor = null;
      break;
    case 48:
      if (params.length >= 2) {
        if (params[1] === 5 && params.length >= 3) {
          newStyle.background = params[2];
          newStyle.backgroundColor = null;
        } else if (params[1] === 2 && params.length >= 5) {
          newStyle.backgroundColor = `rgb(${params[2]},${params[3]},${params[4]})`;
          newStyle.background = null;
        }
      }
      break;
    case 49:
      newStyle.background = null;
      newStyle.backgroundColor = null;
      break;
    case 90:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 97:
      newStyle.foreground = (code - 90) + 8;
      newStyle.foregroundColor = null;
      break;
    case 100:
    case 101:
    case 102:
    case 103:
    case 104:
    case 105:
    case 106:
    case 107:
      newStyle.background = (code - 100) + 8;
      newStyle.backgroundColor = null;
      break;
  }

  return newStyle;
}

export function parseAnsi(text: string): AnsiParsedResult {
  const tokens: AnsiToken[] = [];
  let currentStyle = resetStyle();
  let lastIndex = 0;
  let hasAnsiCodes = false;

  let match: RegExpExecArray | null;
  ANSI_REGEX.lastIndex = 0;

  while ((match = ANSI_REGEX.exec(text)) !== null) {
    hasAnsiCodes = true;
    const fullMatch = match[0];
    const paramsStr = match[1];
    const command = match[2];

    if (match.index > lastIndex) {
      const plainText = text.slice(lastIndex, match.index);
      if (plainText.length > 0) {
        tokens.push({
          text: plainText,
          style: cloneStyle(currentStyle),
        });
      }
    }

    if (command === 'm') {
      const params = paramsStr
        .split(';')
        .filter(p => p !== '')
        .map(p => parseInt(p, 10))
        .filter(n => !isNaN(n));

      if (params.length === 0) {
        currentStyle = resetStyle();
      } else {
        let i = 0;
        while (i < params.length) {
          const code = params[i];
          let consumed = 1;

          if (code === 38 || code === 48) {
            if (params[i + 1] === 5) {
              consumed = 3;
            } else if (params[i + 1] === 2) {
              consumed = 5;
            }
          }

          const sliceParams = params.slice(i, i + consumed);
          currentStyle = applySgrCode(currentStyle, code, sliceParams);
          i += consumed;
        }
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    tokens.push({
      text: remainingText,
      style: cloneStyle(currentStyle),
    });
  }

  if (tokens.length === 0 && text.length > 0) {
    tokens.push({
      text,
      style: resetStyle(),
    });
  }

  return {
    tokens,
    rawText: text,
    hasAnsiCodes,
  };
}

export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

export function hasAnsiCodes(text: string): boolean {
  ANSI_REGEX.lastIndex = 0;
  return ANSI_REGEX.test(text);
}

export function getStyleClasses(style: AnsiStyle): string[] {
  const classes: string[] = [];

  if (style.bold) classes.push('ansi-bold');
  if (style.dim) classes.push('ansi-dim');
  if (style.italic) classes.push('ansi-italic');
  if (style.underline) classes.push('ansi-underline');
  if (style.blink) classes.push('ansi-blink');
  if (style.inverse) classes.push('ansi-inverse');
  if (style.hidden) classes.push('ansi-hidden');
  if (style.strikethrough) classes.push('ansi-strikethrough');

  if (style.foreground !== null) {
    classes.push(`ansi-fg-${style.foreground}`);
  }
  if (style.background !== null) {
    classes.push(`ansi-bg-${style.background}`);
  }

  return classes;
}
