import type {Extension} from '@codemirror/state';
import {RangeSetBuilder, StateEffect, StateField} from '@codemirror/state';
import {Decoration, EditorView} from '@codemirror/view';

export interface HighlightLineSpec {
  startLine: number;
  endLine: number;
  color: string;
}

export const setHighlightLinesEffect = StateEffect.define<HighlightLineSpec[]>();

export const highlightLinesField = StateField.define<HighlightLineSpec[]>({
  create() {
    return [];
  },
  update(lines, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightLinesEffect)) {
        return effect.value;
      }
    }
    return lines;
  },
  provide: field =>
    EditorView.decorations.from(field, (specs, view) => {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc;

      for (const spec of specs) {
        const lineDeco = Decoration.line({
          attributes: {
            style: `background-color: ${spec.color};`,
          },
        });

        for (let lineNum = spec.startLine; lineNum <= spec.endLine; lineNum++) {
          try {
            const line = doc.line(lineNum);
            builder.add(line.from, line.from, lineDeco);
          } catch (e) {
            // 行号超出范围，跳过
          }
        }
      }

      return builder.finish();
    }),
});

export function setHighlightLines(view: EditorView, highlightLines: HighlightLineSpec[]) {
  view.dispatch({
    effects: setHighlightLinesEffect.of(highlightLines),
  });
}

export function clearHighlightLines(view: EditorView) {
  view.dispatch({
    effects: setHighlightLinesEffect.of([]),
  });
}

export function highlightLines(initialLines: HighlightLineSpec[] = []): Extension {
  return [
    highlightLinesField.init(() => initialLines),
  ];
}
