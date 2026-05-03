import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type {DiffLineType} from '@codeimage/store/editor/model';
import {computeDiffLines} from '../../utils/diffParser';
import type {Extension, RangeSet} from '@codemirror/state';
import {EditorState, RangeSetBuilder} from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  Decoration,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorReadonly,
} from 'solid-codemirror';
import type {Accessor, VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  on,
  onMount,
} from 'solid-js';
import * as styles from '../DiffEditor/DiffEditor.css';

type DecorationSet = RangeSet<Decoration>;

interface DiffEditorPreviewProps {
  leftCode: string;
  rightCode: string;
  languageId: string;
  themeId: string;
  lineNumberStart: number;
  showLineNumbers: boolean;
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

export default function DiffEditorPreview(
  props: VoidProps<DiffEditorPreviewProps>,
) {
  let leftEditorEl!: HTMLDivElement;
  let rightEditorEl!: HTMLDivElement;

  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;

  const diffLines = createMemo(() => {
    return computeDiffLines(props.leftCode, props.rightCode);
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
    languages.find(language => language.id === props.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === props.themeId)?.() ??
      themes()[0]?.(),
  );

  const currentTheme = () => themeConfiguration()?.editorTheme || [];

  const previewEditorBaseTheme = () =>
    EditorView.theme({
      '&': {
        textAlign: 'left',
        fontSize: '11px',
        background: 'transparent',
        userSelect: 'none',
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
      },
      '.cm-line': {
        padding: '0 2px 0 8px',
        borderLeftWidth: '3px',
        borderLeftStyle: 'solid',
      },
      '.cm-content *': {
        fontFamily: `${fonts[0].name}, monospace`,
        fontWeight: 400,
        fontVariantLigatures: 'normal',
      },
    });

  function createExtensions(
    getDiffLineData: () => {type: DiffLineType; isLeft: boolean; lineNumber: number}[],
  ): Extension {
    const lnStart = props.lineNumberStart ?? 1;
    const newLn = (ln: number) => ln + (lnStart - 1);

    return [
      previewEditorBaseTheme(),
      EditorView.lineWrapping,
      currentLanguage() || [],
      currentTheme(),
      createDiffHighlightPlugin(getDiffLineData),
      props.showLineNumbers
        ? lineNumbers({formatNumber: lineNo => String(newLn(lineNo))})
        : [],
      EditorView.contentAttributes.of({
        'aria-label': 'codeimage-diff-editor',
      }),
    ];
  }

  const {
    editorView: leftEditorView,
    ref: setLeftEditorRef,
    createExtension: createLeftExtension,
  } = createCodeMirror();

  const {
    editorView: rightEditorView,
    ref: setRightEditorRef,
    createExtension: createRightExtension,
  } = createCodeMirror();

  createEditorControlledValue(leftEditorView, () => props.leftCode);
  createEditorControlledValue(rightEditorView, () => props.rightCode);
  createEditorReadonly(leftEditorView, () => true);
  createEditorReadonly(rightEditorView, () => true);

  // eslint-disable-next-line solid/reactivity
  const leftExtensions = () => createExtensions(leftDiffLines);
  // eslint-disable-next-line solid/reactivity
  const rightExtensions = () => createExtensions(rightDiffLines);

  // eslint-disable-next-line solid/reactivity
  const reconfigureLeft = createLeftExtension(leftExtensions());
  // eslint-disable-next-line solid/reactivity
  const reconfigureRight = createRightExtension(rightExtensions());

  onMount(() => {
    setLeftEditorRef(() => leftEditorEl);
    setRightEditorRef(() => rightEditorEl);
  });

  createEffect(on(leftExtensions, ext => reconfigureLeft(ext)));
  createEffect(on(rightExtensions, ext => reconfigureRight(ext)));

  return (
    <div class={styles.wrapper}>
      <div class={styles.editorContainer}>
        <div class={styles.column}>
          <div class={styles.columnHeader}>Original (Before)</div>
          <div class={styles.editorWrapper}>
            <div aria-readonly={true} ref={leftEditorEl} />
          </div>
        </div>
        <div class={styles.columnDivider} />
        <div class={styles.column}>
          <div class={styles.columnHeader}>Modified (After)</div>
          <div class={styles.editorWrapper}>
            <div aria-readonly={true} ref={rightEditorEl} />
          </div>
        </div>
      </div>
    </div>
  );
}
