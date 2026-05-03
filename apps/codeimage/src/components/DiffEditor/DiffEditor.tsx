import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {EditorView} from '@codemirror/view';
import {createCodeMirror, createEditorReadonly} from 'solid-codemirror';
import type {Extension} from '@codemirror/state';
import {EditorState} from '@codemirror/state';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {bracketMatching, indentOnInput} from '@codemirror/language';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import type {Accessor, VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  Show,
} from 'solid-js';
import clsx from 'clsx';
import * as styles from './DiffEditor.css';
import {computeDiffLines, isGitDiffFormat, parseGitDiff} from '../../utils/diffParser';
import type {DiffLine, DiffLineType, EditorMode} from '@codeimage/store/editor/model';
import {createTabIcon} from '../../hooks/use-tab-icon';

const EDITOR_BASE_SETUP: Extension = [
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  history(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...completionKeymap,
    ...historyKeymap,
    indentWithTab,
  ]),
];

interface DiffEditorProps {
  readOnly: boolean;
  onEditorViewChange?: (view: EditorView | undefined) => void;
}

type DiffTab = 'left' | 'right' | 'diff';

export default function DiffEditor(props: VoidProps<DiffEditorProps>) {
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const {
    state: editorState,
    setState,
    computed: {selectedFont},
  } = getRootEditorStore();

  const [activeTab, setActiveTab] = createSignal<DiffTab>('diff');
  const [diffInput, setDiffInput] = createSignal('');
  const [showDiffInput, setShowDiffInput] = createSignal(false);

  const diffEditorState = createMemo(() => editorState.diffEditor);

  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === diffEditorState().languageId),
  );

  const icon = createTabIcon(
    () => diffEditorState().tabName ?? null,
    () => diffEditorState().languageId ?? '',
    true,
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const [currentExtraLanguage] = createResource(icon, iconDef => {
    return iconDef?.extraLanguage
      ?.extension()
      .then(extension => {
        return {
          extension,
          overrideParent: iconDef.extraLanguage?.overrideParent,
        };
      })
      .catch(() => null);
  });

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === editorState.options.themeId)?.() ??
      themes()[0](),
  );

  const baseTheme = EditorView.theme({
    '&': {
      textAlign: 'left',
      background: 'transparent !important',
    },
    '.cm-content': {
      textAlign: 'left',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-lineNumbers': {
      position: 'sticky',
      flexDirection: 'column',
      flexShrink: 0,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      textAlign: 'right',
      padding: '0 16px 0 8px',
      lineHeight: '21px',
    },
    '.cm-line': {
      padding: '0 2px 0 8px',
    },
    '.cm-cursor': {
      borderLeftWidth: '2px',
      height: '21px',
      transform: 'translateY(-10%)',
    },
  });

  const customFontExtension = (): Extension => {
    const font = selectedFont();
    const fontName = font.name,
      fontWeight = editorState.options.fontWeight,
      enableLigatures = editorState.options.enableLigatures;

    const fontVariantLigatures = !!enableLigatures ? 'normal' : 'none';

    return EditorView.theme({
      '.cm-content *': {
        fontFamily: `${fontName}, monospace`,
        fontWeight: fontWeight,
        fontVariantLigatures,
      },
      '.cm-gutters': {
        fontFamily: `${fontName}, monospace`,
        fontWeight: 400,
        fontVariantLigatures,
      },
    });
  };

  const {
    editorView: leftEditorView,
    ref: setLeftRef,
    createExtension: createLeftExtension,
  } = createCodeMirror({
    value: () => diffEditorState().leftCode,
    onValueChange: value => {
      setState('diffEditor', 'leftCode', value);
    },
  });

  const {
    editorView: rightEditorView,
    ref: setRightRef,
    createExtension: createRightExtension,
  } = createCodeMirror({
    value: () => diffEditorState().rightCode,
    onValueChange: value => {
      setState('diffEditor', 'rightCode', value);
    },
  });

  createEffect(() => {
    props.onEditorViewChange?.(leftEditorView());
  });

  const diffLines = createMemo(() => {
    return computeDiffLines(diffEditorState().leftCode, diffEditorState().rightCode);
  });

  function setupEditorExtensions(
    createExtension: (ext: () => Extension) => void,
    editorView: Accessor<EditorView | undefined>,
  ) {
    createEditorReadonly(editorView, () => props.readOnly);
    createExtension(EditorView.lineWrapping);
    createExtension(() =>
      EditorView.contentAttributes.of({
        'aria-label': 'codeimage-diff-editor',
      }),
    );
    createExtension(() => customFontExtension());
    createExtension(() => {
      const language = currentLanguage();
      const extraLanguage = currentExtraLanguage();
      if (!extraLanguage && !language) {
        return [];
      }
      if (!extraLanguage) {
        return language ?? [];
      }
      if (extraLanguage.overrideParent) {
        return extraLanguage.extension ?? [];
      }
    });

    createExtension(() => {
      const lnStart = diffEditorState().lineNumberStart ?? 1;
      const newLn = (ln: number) => ln + (lnStart - 1);
      return editorState.options.showLineNumbers
        ? lineNumbers({formatNumber: lineNo => String(newLn(lineNo))})
        : [];
    });
    createExtension(() => themeConfiguration()?.editorTheme || []);
    createExtension(baseTheme);
  }

  setupEditorExtensions(createLeftExtension, leftEditorView);
  setupEditorExtensions(createRightExtension, rightEditorView);

  const reconfigureLeftSetup = createLeftExtension(EDITOR_BASE_SETUP);
  const reconfigureRightSetup = createRightExtension(EDITOR_BASE_SETUP);

  createEffect(
    on(
      () => props.readOnly,
      readOnly => {
        const extension = readOnly ? [] : EDITOR_BASE_SETUP;
        reconfigureLeftSetup(extension);
        reconfigureRightSetup(extension);
      },
    ),
  );

  const handleParseDiff = () => {
    const input = diffInput();
    if (!input.trim()) return;

    if (isGitDiffFormat(input)) {
      const parsed = parseGitDiff(input);
      if (parsed.leftCode || parsed.rightCode) {
        setState('diffEditor', 'leftCode', parsed.leftCode);
        setState('diffEditor', 'rightCode', parsed.rightCode);
      }
    } else {
      const lines = input.split('\n');
      const leftLines: string[] = [];
      const rightLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('-')) {
          leftLines.push(line.slice(1));
        } else if (line.startsWith('+')) {
          rightLines.push(line.slice(1));
        } else if (line.startsWith(' ')) {
          const content = line.slice(1);
          leftLines.push(content);
          rightLines.push(content);
        }
      }

      if (leftLines.length > 0 || rightLines.length > 0) {
        setState('diffEditor', 'leftCode', leftLines.join('\n'));
        setState('diffEditor', 'rightCode', rightLines.join('\n'));
      }
    }

    setShowDiffInput(false);
    setDiffInput('');
  };

  const getLineClass = (type: DiffLineType) => {
    switch (type) {
      case 'added':
        return styles.lineAdded;
      case 'removed':
        return styles.lineRemoved;
      case 'modified':
        return styles.lineModified;
      default:
        return styles.lineUnchanged;
    }
  };

  return (
    <div class={styles.wrapper}>
      <Show when={showDiffInput()}>
        <div class={styles.diffInputArea}>
          <label class={styles.diffInputLabel}>
            Paste git diff or unified diff format:
          </label>
          <textarea
            class={styles.diffInput}
            placeholder={`diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n@@ -1,3 +1,3 @@\n-old line\n+new line\n unchanged`}
            value={diffInput()}
            onInput={e => setDiffInput(e.target.value)}
          />
          <button
            class={styles.parseButton}
            onClick={handleParseDiff}
            disabled={!diffInput().trim()}
          >
            Parse Diff
          </button>
        </div>
      </Show>

      <div class={styles.editorHeader}>
        <div class={styles.modeSelector}>
          <button
            class={clsx(
              styles.modeButton,
              activeTab() === 'diff' && styles.modeButtonActive,
            )}
            onClick={() => setActiveTab('diff')}
          >
            Diff View
          </button>
          <button
            class={clsx(
              styles.modeButton,
              activeTab() === 'left' && styles.modeButtonActive,
            )}
            onClick={() => setActiveTab('left')}
          >
            Original
          </button>
          <button
            class={clsx(
              styles.modeButton,
              activeTab() === 'right' && styles.modeButtonActive,
            )}
            onClick={() => setActiveTab('right')}
          >
            Modified
          </button>
        </div>
        <button
          class={styles.parseButton}
          onClick={() => setShowDiffInput(v => !v)}
          style={{marginTop: 0}}
        >
          {showDiffInput() ? 'Hide' : 'Paste Diff'}
        </button>
      </div>

      <Show when={activeTab() === 'diff'}>
        <div class={styles.wrapper}>
          <div class={styles.column}>
            <div class={styles.columnHeader}>Original (Before)</div>
            <div class={styles.codeContainer}>
              {diffLines().map((line, index) => (
                <div
                  class={clsx(styles.line, getLineClass(line.type))}
                  style={{
                    opacity: line.lineNumber.left === null ? 0.3 : 1,
                  }}
                >
                  <div class={styles.lineGutter}>
                    {line.lineNumber.left ?? ''}
                  </div>
                  <div class={styles.lineContent}>
                    {line.lineNumber.left !== null
                      ? escapeHtml(line.content)
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div class={styles.columnDivider} />
          <div class={styles.column}>
            <div class={styles.columnHeader}>Modified (After)</div>
            <div class={styles.codeContainer}>
              {diffLines().map((line, index) => (
                <div
                  class={clsx(styles.line, getLineClass(line.type))}
                  style={{
                    opacity: line.lineNumber.right === null ? 0.3 : 1,
                  }}
                >
                  <div class={styles.lineGutter}>
                    {line.lineNumber.right ?? ''}
                  </div>
                  <div class={styles.lineContent}>
                    {line.lineNumber.right !== null
                      ? escapeHtml(line.content)
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Show>

      <Show when={activeTab() === 'left'}>
        <div class={styles.editorWrapper}>
          <div class={styles.columnHeader}>Original Code</div>
          <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
            <div ref={setLeftRef} />
          </code>
        </div>
      </Show>

      <Show when={activeTab() === 'right'}>
        <div class={styles.editorWrapper}>
          <div class={styles.columnHeader}>Modified Code</div>
          <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
            <div ref={setRightRef} />
          </code>
        </div>
      </Show>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
