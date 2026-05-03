import type {AnsiColorPalette, TerminalEditorOptions} from '@codeimage/store/editor/model';
import {
  getAnsiColor,
  getAnsiTheme,
  hasAnsiCodes,
  parseAnsi,
  stripAnsi,
} from '@core/ansi';
import type {AnsiStyle, AnsiToken} from '@core/ansi/ansi-parser';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import type {Component, ParentComponent, Ref} from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  splitProps,
} from 'solid-js';
import * as styles from './TerminalEditor.css';

export interface TerminalEditorProps {
  value: string;
  onChange?: (value: string) => void;
  options?: TerminalEditorOptions;
  readOnly?: boolean;
  ref?: Ref<HTMLDivElement>;
  onPaste?: (event: ClipboardEvent, hasAnsi: boolean) => void;
}

function buildInlineStyles(
  style: AnsiStyle,
  palette: AnsiColorPalette,
): Record<string, string> {
  const inlineStyles: Record<string, string> = {};

  if (style.foregroundColor) {
    inlineStyles.color = style.foregroundColor;
  } else if (style.foreground !== null) {
    inlineStyles.color = getAnsiColor(palette, style.foreground);
  }

  if (style.backgroundColor) {
    inlineStyles.backgroundColor = style.backgroundColor;
  } else if (style.background !== null) {
    inlineStyles.backgroundColor = getAnsiColor(palette, style.background);
  }

  return inlineStyles;
}

function getStyleClasses(style: AnsiStyle): string[] {
  const classes: string[] = [];
  if (style.bold) classes.push(styles.ansiBold);
  if (style.dim) classes.push(styles.ansiDim);
  if (style.italic) classes.push(styles.ansiItalic);
  if (style.underline) classes.push(styles.ansiUnderline);
  if (style.blink) classes.push(styles.ansiBlink);
  if (style.inverse) classes.push(styles.ansiInverse);
  if (style.hidden) classes.push(styles.ansiHidden);
  if (style.strikethrough) classes.push(styles.ansiStrikethrough);
  return classes;
}

function splitTokensByLines(tokens: AnsiToken[]): AnsiToken[][] {
  const lines: AnsiToken[][] = [];
  let currentLine: AnsiToken[] = [];

  for (const token of tokens) {
    const parts = token.text.split(/(\r?\n)/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part === '\n' || part === '\r\n') {
        lines.push([...currentLine]);
        currentLine = [];
      } else if (part.length > 0) {
        currentLine.push({
          text: part,
          style: token.style,
        });
      }
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  if (tokens.length > 0 && tokens[tokens.length - 1].text.endsWith('\n')) {
    lines.push([]);
  }

  return lines;
}

function renderPrompt(options: TerminalEditorOptions) {
  const {prompt} = options;

  if (!prompt.showPrompt) {
    return null;
  }

  switch (prompt.promptStyle) {
    case 'minimal':
      return (
        <span class={styles.terminalEditorMinimalPrompt}>
          $
        </span>
      );

    case 'full':
      return (
        <span class={styles.terminalEditorFullPrompt}>
          <span class={styles.terminalEditorPromptUser}>{prompt.username}</span>
          <span class={styles.terminalEditorPromptSeparator}>@</span>
          <span class={styles.terminalEditorPromptHost}>{prompt.hostname}</span>
          <span class={styles.terminalEditorPromptSeparator}>:</span>
          <span class={styles.terminalEditorPromptPath}>{prompt.directory}</span>
          <span class={styles.terminalEditorPromptSymbol}>$</span>
        </span>
      );

    case 'default':
    default:
      return (
        <>
          <span class={styles.terminalEditorPromptUser}>{prompt.username}</span>
          <span class={styles.terminalEditorPromptSeparator}>@</span>
          <span class={styles.terminalEditorPromptHost}>{prompt.hostname}</span>
          <span class={styles.terminalEditorPromptSeparator}>:</span>
          <span class={styles.terminalEditorPromptPath}>{prompt.directory}</span>
          <span class={styles.terminalEditorPromptSymbol}>$</span>
        </>
      );
  }
}

interface AnsiSpanProps {
  token: AnsiToken;
  palette: AnsiColorPalette;
}

const AnsiSpan: Component<AnsiSpanProps> = props => {
  const inlineStyles = createMemo(() =>
    buildInlineStyles(props.token.style, props.palette),
  );
  const classes = createMemo(() => getStyleClasses(props.token.style));

  return (
    <span
      class={clsx(styles.ansiSpan, ...classes())}
      style={inlineStyles()}
    >
      {props.token.text}
    </span>
  );
};

interface TerminalLineProps {
  tokens: AnsiToken[];
  palette: AnsiColorPalette;
  isLastLine: boolean;
  showPrompt: boolean;
  options: TerminalEditorOptions;
  cursorPosition?: {line: number; column: number};
}

const TerminalLine: Component<TerminalLineProps> = props => {
  const [local, rest] = splitProps(props, ['tokens', 'palette', 'isLastLine', 'showPrompt', 'options', 'cursorPosition']);

  const hasCursor = () => {
    if (!local.cursorPosition) return false;
    return local.cursorPosition.line === -1 && local.isLastLine;
  };

  const cursorColumn = () => {
    if (!local.cursorPosition) return 0;
    return local.cursorPosition.column;
  };

  return (
    <div class={styles.terminalEditorLine} {...rest}>
      <Show when={local.showPrompt}>
        <span class={styles.terminalEditorPrompt}>
          {renderPrompt(local.options)}
        </span>
      </Show>
      <For each={local.tokens}>
        {token => <AnsiSpan token={token} palette={local.palette} />}
      </For>
      <Show when={local.tokens.length === 0}>
        <span>&nbsp;</span>
      </Show>
    </div>
  );
};

export const TerminalEditor: Component<TerminalEditorProps> = props => {
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'options',
    'readOnly',
    'ref',
    'onPaste',
  ]);

  const options = createMemo(() => local.options ?? {
    ansiThemeId: 'default',
    prompt: {
      username: 'user',
      hostname: 'localhost',
      directory: '~',
      showPrompt: true,
      promptStyle: 'default' as const,
    },
    showCursor: true,
    cursorBlink: false,
  });

  const theme = createMemo(() => getAnsiTheme(options().ansiThemeId));
  const parsed = createMemo(() => parseAnsi(local.value ?? ''));
  const lines = createMemo(() => splitTokensByLines(parsed().tokens));
  const plainText = createMemo(() => stripAnsi(local.value ?? ''));

  const [textAreaRef, setTextAreaRef] = createSignal<HTMLTextAreaElement>();
  const [cursorPosition, setCursorPosition] = createSignal<{line: number; column: number} | undefined>();

  const handleInput = (event: InputEvent) => {
    const target = event.target as HTMLTextAreaElement;
    if (local.onChange) {
      local.onChange(target.value);
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text/plain');
    const hasAnsi = hasAnsiCodes(pastedText);

    if (local.onPaste) {
      local.onPaste(event, hasAnsi);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = target.value.substring(0, start) + '  ' + target.value.substring(end);

      if (local.onChange) {
        local.onChange(newValue);
      }

      setTimeout(() => {
        if (textAreaRef()) {
          textAreaRef()!.selectionStart = start + 2;
          textAreaRef()!.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  createEffect(() => {
    const textArea = textAreaRef();
    if (textArea && local.value !== undefined) {
      if (textArea.value !== local.value) {
        const selectionStart = textArea.selectionStart;
        const selectionEnd = textArea.selectionEnd;
        textArea.value = local.value;
        textArea.selectionStart = selectionStart;
        textArea.selectionEnd = selectionEnd;
      }
    }
  });

  const inlineStyles = createMemo(() =>
    assignInlineVars({
      [styles.terminalEditorVars.backgroundColor]: theme().palette.background,
      [styles.terminalEditorVars.foregroundColor]: theme().palette.foreground,
      [styles.terminalEditorVars.cursorColor]: theme().palette.cursor,
      [styles.terminalEditorVars.selectionColor]: theme().palette.selection,
    }),
  );

  return (
    <div
      class={styles.terminalEditorWrapper}
      style={inlineStyles()}
      ref={local.ref}
      {...rest}
    >
      <textarea
        ref={setTextAreaRef}
        class={styles.terminalEditorTextArea}
        value={local.value}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        readOnly={local.readOnly}
        spellcheck={false}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />
      <div class={styles.terminalEditorContent}>
        <div class={styles.terminalEditorDisplay}>
          <For each={lines()}>
            {(lineTokens, index) => (
              <TerminalLine
                tokens={lineTokens}
                palette={theme().palette}
                isLastLine={index() === lines().length - 1}
                showPrompt={index() === lines().length - 1}
                options={options()}
                cursorPosition={cursorPosition()}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default TerminalEditor;
