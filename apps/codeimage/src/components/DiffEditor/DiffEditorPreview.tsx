import {getRootEditorStore} from '@codeimage/store/editor';
import type {DiffLine} from '@codeimage/store/editor/model';
import {computeDiffLines} from '../../utils/diffParser';
import * as styles from '../DiffEditor/DiffEditor.css';
import clsx from 'clsx';
import type {VoidProps} from 'solid-js';
import {createMemo, Show} from 'solid-js';

interface DiffEditorPreviewProps {
  leftCode: string;
  rightCode: string;
  languageId: string;
  themeId: string;
  lineNumberStart: number;
  showLineNumbers: boolean;
}

function getLineClass(type: DiffLine['type']) {
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
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function DiffEditorPreview(
  props: VoidProps<DiffEditorPreviewProps>,
) {
  const editor = getRootEditorStore();

  const diffLines = createMemo(() => {
    return computeDiffLines(props.leftCode, props.rightCode);
  });

  return (
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
              <Show when={props.showLineNumbers}>
                <div class={styles.lineGutter}>
                  {line.lineNumber.left !== null
                    ? line.lineNumber.left + props.lineNumberStart - 1
                    : ''}
                </div>
              </Show>
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
              <Show when={props.showLineNumbers}>
                <div class={styles.lineGutter}>
                  {line.lineNumber.right !== null
                    ? line.lineNumber.right + props.lineNumberStart - 1
                    : ''}
                </div>
              </Show>
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
  );
}
