import type {AnsiColorPalette, EditorMode, TerminalEditorOptions} from '@codeimage/store/editor/model';
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
  onCleanup,
} from 'solid-js';
import * as styles from './TerminalEditor.css';

export interface TerminalEditorProps {
  value: string;
  onChange?: (value: string) => void;
  options?: TerminalEditorOptions;
  readOnly?: boolean;
  ref?: Ref<HTMLDivElement>;
  onPaste?: (event: ClipboardEvent, hasAnsi: boolean) => void;
  editorMode?: EditorMode;
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

function mapAnsiPositionToPlain(ansiText: string, ansiPos: number): number {
  if (ansiPos <= 0) return 0;
  const substring = ansiText.substring(0, ansiPos);
  return stripAnsi(substring).length;
}

function getLineAndColumn(text: string, position: number): {line: number; column: number} {
  if (position <= 0) return {line: 0, column: 0};
  
  let line = 0;
  let column = 0;
  
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 0;
    } else if (text[i] !== '\r') {
      column++;
    }
  }
  
  return {line, column};
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
  lineIndex: number;
  cursorLine?: number;
  cursorColumn?: number;
}

const TerminalLine: Component<TerminalLineProps> = props => {
  const [local] = splitProps(props, [
    'tokens', 'palette', 'isLastLine', 'showPrompt', 'options', 
    'lineIndex', 'cursorLine', 'cursorColumn'
  ]);

  const hasCursor = () => local.cursorLine === local.lineIndex;

  return (
    <div class={styles.terminalEditorLine}>
      <Show when={local.showPrompt}>
        <span class={styles.terminalEditorPrompt}>
          {renderPrompt(local.options)}
        </span>
      </Show>
      
      {local.tokens.length === 0 ? (
        <>
          <Show when={hasCursor()}>
            <span class={local.options.cursorBlink ? styles.terminalCursor : styles.terminalCursorStatic} />
          </Show>
          <Show when={!hasCursor()}>
            <span>&nbsp;</span>
          </Show>
        </>
      ) : (
        <For each={local.tokens}>
          {token => (
            <AnsiSpan 
              token={token} 
              palette={local.palette}
            />
          )}
        </For>
      )}
      
      <Show when={hasCursor() && local.tokens.length > 0}>
        <span class={local.options.cursorBlink ? styles.terminalCursor : styles.terminalCursorStatic} />
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
    'editorMode',
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
  
  const [cursorPos, setCursorPos] = createSignal<{line: number; column: number} | undefined>();

  const updateCursor = () => {
    const textArea = textAreaRef();
    if (!textArea) return;
    
    const start = textArea.selectionStart;
    const value = local.value ?? '';
    const plain = plainText();
    
    const plainStart = mapAnsiPositionToPlain(value, start);
    const pos = getLineAndColumn(plain, plainStart);
    
    setCursorPos(pos);
  };

  const handleInput = (event: InputEvent) => {
    const target = event.target as HTMLTextAreaElement;
    if (local.onChange) {
      local.onChange(target.value);
    }
    setTimeout(updateCursor, 0);
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
          updateCursor();
        }
      }, 0);
    }
  };

  const handleSelect = () => {
    updateCursor();
  };

  const handleClick = () => {
    setTimeout(updateCursor, 0);
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
      updateCursor();
    }
  });

  createEffect(() => {
    const textArea = textAreaRef();
    if (!textArea) return;
    
    textArea.addEventListener('select', handleSelect);
    textArea.addEventListener('click', handleClick);
    textArea.addEventListener('keyup', handleSelect);
    
    onCleanup(() => {
      textArea.removeEventListener('select', handleSelect);
      textArea.removeEventListener('click', handleClick);
      textArea.removeEventListener('keyup', handleSelect);
    });
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
        onSelect={handleSelect}
        onClick={handleClick}
        readOnly={local.readOnly}
        spellcheck={false}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />
      <div class={styles.terminalEditorContent}>
        <div class={styles.terminalEditorDisplay}>
          <For each={lines()}>
            {(lineTokens, index) => {
              const lineIdx = index();
              
              return (
                <TerminalLine
                  tokens={lineTokens}
                  palette={theme().palette}
                  isLastLine={lineIdx === lines().length - 1}
                  showPrompt={lineIdx === lines().length - 1}
                  options={options()}
                  lineIndex={lineIdx}
                  cursorLine={cursorPos()?.line}
                  cursorColumn={cursorPos()?.column}
                />
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
};

export default TerminalEditor;
