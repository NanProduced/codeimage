import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {EditorView} from '@codemirror/view';
import {createCodeMirror, createEditorReadonly} from 'solid-codemirror';
import type {Extension, RangeSet} from '@codemirror/state';
import {EditorState, RangeSetBuilder} from '@codemirror/state';
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
  Decoration,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import type {Accessor, VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
  Show,
} from 'solid-js';
import * as styles from './DiffEditor.css';
import {computeDiffLines, isGitDiffFormat, parseGitDiff} from '../../utils/diffParser';
import type {DiffLineType} from '@codeimage/store/editor/model';
import {createTabIcon} from '../../hooks/use-tab-icon';

type DecorationSet = RangeSet<Decoration>;

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

const addedLineDeco = Decoration.line({class: styles.lineAdded});
const removedLineDeco = Decoration.line({class: styles.lineRemoved});
const unchangedLineDeco = Decoration.line({class: styles.lineUnchanged});

function createDiffHighlightPlugin(
  getDiffLines: () => {type: DiffLineType; isLeft: boolean; lineNumber: number}[],
): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const diffLines = getDiffLines();

        for (const {from, to} of view.visibleRanges) {
          for (let pos = from; pos <= to; ) {
            const line = view.state.doc.lineAt(pos);
            const lineIndex = line.number - 1;

            const matchingLine = diffLines.find(
              d => d.lineNumber === lineIndex + 1,
            );

            if (matchingLine) {
              let deco = unchangedLineDeco;
              if (matchingLine.type === 'added' && !matchingLine.isLeft) {
                deco = addedLineDeco;
              } else if (
                matchingLine.type === 'removed' &&
                matchingLine.isLeft
              ) {
                deco = removedLineDeco;
              }
              builder.add(line.from, line.from, deco);
            } else {
              builder.add(line.from, line.from, unchangedLineDeco);
            }

            pos = line.to + 1;
          }
        }

        return builder.finish();
      }
    },
    {decorations: v => v.decorations},
  );
}

function setupScrollSync(
  leftView: Accessor<EditorView | undefined>,
  rightView: Accessor<EditorView | undefined>,
) {
  let leftScrollListener: EventListener | null = null;
  let rightScrollListener: EventListener | null = null;
  let isSyncing = false;

  function syncScroll(
    source: HTMLElement,
    target: HTMLElement,
  ) {
    if (isSyncing) return;
    isSyncing = true;
    try {
      target.scrollTop = source.scrollTop;
      target.scrollLeft = source.scrollLeft;
    } finally {
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    }
  }

  createEffect(() => {
    const left = leftView();
    const right = rightView();

    if (left && right && left.scrollDOM && right.scrollDOM) {
      leftScrollListener = () => syncScroll(left.scrollDOM!, right.scrollDOM!);
      rightScrollListener = () => syncScroll(right.scrollDOM!, left.scrollDOM!);

      left.scrollDOM.addEventListener('scroll', leftScrollListener, {
        passive: true,
      });
      right.scrollDOM.addEventListener('scroll', rightScrollListener, {
        passive: true,
      });

      onCleanup(() => {
        if (left.scrollDOM && leftScrollListener) {
          left.scrollDOM.removeEventListener('scroll', leftScrollListener);
        }
        if (right.scrollDOM && rightScrollListener) {
          right.scrollDOM.removeEventListener('scroll', rightScrollListener);
        }
        leftScrollListener = null;
        rightScrollListener = null;
      });
    }
  });
}

export default function DiffEditor(props: VoidProps<DiffEditorProps>) {
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const {
    state: editorState,
    setState,
    computed: {selectedFont},
  } = getRootEditorStore();

  const [diffInput, setDiffInput] = createSignal('');
  const [showDiffInput, setShowDiffInput] = createSignal(false);

  const diffEditorState = createMemo(() => editorState.diffEditor);

  const leftCode = createMemo(() => diffEditorState().leftCode);
  const rightCode = createMemo(() => diffEditorState().rightCode);

  const diffLines = createMemo(() => {
    return computeDiffLines(leftCode(), rightCode());
  });

  const leftDiffLines = createMemo(() => {
    return diffLines()
      .filter(line => line.lineNumber.left !== null)
      .map(line => ({
        type: line.type,
        isLeft: true,
        lineNumber: line.lineNumber.left!,
      }));
  });

  const rightDiffLines = createMemo(() => {
    return diffLines()
      .filter(line => line.lineNumber.right !== null)
      .map(line => ({
        type: line.type,
        isLeft: false,
        lineNumber: line.lineNumber.right!,
      }));
  });

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
      borderLeftWidth: '3px',
      borderLeftStyle: 'solid',
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
    value: leftCode(),
    onValueChange: value => {
      setState('diffEditor', 'leftCode', value);
    },
  });

  const {
    editorView: rightEditorView,
    ref: setRightRef,
    createExtension: createRightExtension,
  } = createCodeMirror({
    value: rightCode(),
    onValueChange: value => {
      setState('diffEditor', 'rightCode', value);
    },
  });

  createEffect(() => {
    props.onEditorViewChange?.(leftEditorView());
  });

  setupScrollSync(leftEditorView, rightEditorView);

  function setupEditorExtensions(
    createExtension: (ext: Extension | (() => Extension)) => (ext: Extension) => void,
    editorView: Accessor<EditorView | undefined>,
    getDiffLineData: () => {type: DiffLineType; isLeft: boolean; lineNumber: number}[],
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
      return [];
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
    createExtension(() => createDiffHighlightPlugin(getDiffLineData));
  }

  setupEditorExtensions(createLeftExtension, leftEditorView, leftDiffLines);
  setupEditorExtensions(createRightExtension, rightEditorView, rightDiffLines);

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

  return (
    <div class={styles.wrapper}>
      <Show when={showDiffInput()}>
        <div class={styles.diffInputArea}>
          <label class={styles.diffInputLabel}>
            Paste git diff or unified diff format:
          </label>
          <textarea
            class={styles.diffInput}
            placeholder={`diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
-old line
+new line
 unchanged`}
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

      <div class={styles.toolsBar}>
        <div class={styles.toolsLeft}>
          <button
            class={styles.toolButton}
            onClick={() => setShowDiffInput(v => !v)}
          >
            {showDiffInput() ? 'Hide Paste' : 'Paste Diff'}
          </button>
        </div>
        <div class={styles.toolsRight} />
      </div>

      <div class={styles.editorContainer}>
        <div class={styles.column}>
          <div class={styles.columnHeader}>Original (Before)</div>
          <div class={styles.editorWrapper}>
            <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
              <div ref={setLeftRef} />
            </code>
          </div>
        </div>
        <div class={styles.columnDivider} />
        <div class={styles.column}>
          <div class={styles.columnHeader}>Modified (After)</div>
          <div class={styles.editorWrapper}>
            <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
              <div ref={setRightRef} />
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
