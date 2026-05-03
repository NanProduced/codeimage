import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type {LineHighlight} from '@codeimage/store/editor/model';
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
import type {Extension} from '@codemirror/state';
import {EditorState} from '@codemirror/state';
import {
  crosshairCursor,
  Decoration,
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import type {DecorationSet} from '@codemirror/view';
import {createCodeMirror, createEditorReadonly} from 'solid-codemirror';
import type {VoidProps} from 'solid-js';
import {createEffect, createMemo, createResource, on} from 'solid-js';
import {createTabIcon} from '../../hooks/use-tab-icon';

function buildLineDecorations(
  highlights: LineHighlight[],
  view: EditorView,
  lineNumberOffset: number,
): DecorationSet {
  const decorations: {from: number; to: number; value: Decoration}[] = [];
  const docLines = view.state.doc.lines;

  for (const {from, to, color} of highlights) {
    const startDisplay = Math.max(1, from);
    const endDisplay = Math.min(to, docLines + lineNumberOffset - 1);

    if (startDisplay > endDisplay) continue;

    for (let displayLine = startDisplay; displayLine <= endDisplay; displayLine++) {
      const internalLine = displayLine - lineNumberOffset + 1;

      if (internalLine < 1 || internalLine > docLines) continue;

      try {
        const line = view.state.doc.line(internalLine);
        decorations.push({
          from: line.from,
          to: line.from,
          value: Decoration.line({
            attributes: {
              style: `background-color: ${color};`,
            },
          }),
        });
      } catch {
        // Line doesn't exist, skip
      }
    }
  }

  return Decoration.set(decorations.sort((a, b) => a.from - b.from));
}

interface LineHighlighterConfig {
  getHighlights: () => LineHighlight[];
  getLineNumberOffset: () => number;
}

function dynamicLineHighlighter(config: LineHighlighterConfig): Extension {
  const {getHighlights, getLineNumberOffset} = config;

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      lastState: string;

      constructor(view: EditorView) {
        const highlights = getHighlights();
        const offset = getLineNumberOffset();
        this.lastState = JSON.stringify({highlights, offset});
        this.decorations = buildLineDecorations(highlights, view, offset);
      }

      update(update: ViewUpdate) {
        const highlights = getHighlights();
        const offset = getLineNumberOffset();
        const currentState = JSON.stringify({highlights, offset});

        if (
          update.docChanged ||
          update.viewportChanged ||
          currentState !== this.lastState
        ) {
          this.lastState = currentState;
          this.decorations = buildLineDecorations(
            highlights,
            update.view,
            offset,
          );
        }
      }
    },
    {
      decorations: v => v.decorations,
    },
  );
}

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

interface CustomEditorProps {
  readOnly: boolean;
  onEditorViewChange?: (view: EditorView | undefined) => void;
  onValueChange?: (value: string) => void;
}

export default function CustomEditor(props: VoidProps<CustomEditorProps>) {
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const {
    state: editorState,
    canvasEditorEvents,
    computed: {selectedFont},
  } = getRootEditorStore();
  const {editor} = getActiveEditorStore();
  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === editor()?.languageId),
  );

  const {
    editorView,
    ref: setRef,
    createExtension,
  } = createCodeMirror({
    value: editor()?.code,
    onTransactionDispatched: tr => canvasEditorEvents.emit(tr),
    onValueChange: props.onValueChange,
  });

  createEffect(() => props.onEditorViewChange?.(editorView()));

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const icon = createTabIcon(
    () => editor()?.tab.tabName ?? null,
    () => editor()?.languageId ?? '',
    true,
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

  createEditorReadonly(editorView, () => props.readOnly);
  createExtension(EditorView.lineWrapping);
  createExtension(() =>
    EditorView.contentAttributes.of({
      'aria-label': 'codeimage-editor',
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

  const lineNumberStart = createMemo(() => editor()?.lineNumberStart ?? 1);
  const highlightedLines = createMemo(() => editor()?.highlightedLines ?? []);

  const getHighlights = (): LineHighlight[] => highlightedLines();
  const getLineNumberOffset = (): number => lineNumberStart();

  createExtension(() => {
    const lnStart = lineNumberStart();
    const newLn = (ln: number) => ln + (lnStart - 1);
    return editorState.options.showLineNumbers
      ? lineNumbers({formatNumber: lineNo => String(newLn(lineNo))})
      : [];
  });
  createExtension(() => themeConfiguration()?.editorTheme || []);
  createExtension(baseTheme);

  createExtension(
    dynamicLineHighlighter({
      getHighlights,
      getLineNumberOffset,
    }),
  );

  createEffect(
    on(
      [highlightedLines, lineNumberStart],
      () => {
        const view = editorView();
        if (view) {
          view.dispatch({});
        }
      },
      {defer: true},
    ),
  );

  const reconfigureBaseSetup = createExtension(EDITOR_BASE_SETUP);

  createEffect(
    on(
      () => props.readOnly,
      readOnly => {
        const extension = readOnly ? [] : EDITOR_BASE_SETUP;
        reconfigureBaseSetup(extension);
      },
    ),
  );

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <div ref={setRef} />
    </code>
  );
}
