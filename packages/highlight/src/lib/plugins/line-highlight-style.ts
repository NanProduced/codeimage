import {Decoration, EditorView, ViewPlugin, ViewUpdate} from '@codemirror/view';
import type {DecorationSet} from '@codemirror/view';
import type {Extension} from '@codemirror/state';

export interface LineHighlight {
  from: number;
  to: number;
  color: string;
}

function buildLineDecorations(
  highlights: LineHighlight[],
  view: EditorView,
): DecorationSet {
  const decorations: {from: number; to: number; value: Decoration}[] = [];

  for (const {from, to, color} of highlights) {
    for (let lineNum = from; lineNum <= to; lineNum++) {
      try {
        const line = view.state.doc.line(lineNum);
        decorations.push({
          from: line.from,
          to: line.to,
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

export function lineHighlighter(highlights: LineHighlight[]): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      currentHighlights: LineHighlight[];

      constructor(view: EditorView) {
        this.currentHighlights = highlights;
        this.decorations = buildLineDecorations(highlights, view);
      }

      update(update: ViewUpdate) {
        const needsUpdate =
          update.docChanged ||
          update.viewportChanged ||
          JSON.stringify(this.currentHighlights) !== JSON.stringify(highlights);

        if (needsUpdate) {
          this.currentHighlights = [...highlights];
          this.decorations = buildLineDecorations(highlights, update.view);
        }
      }
    },
    {
      decorations: v => v.decorations,
    },
  );
}

export function dynamicLineHighlighter(getHighlights: () => LineHighlight[]): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      lastHighlights: string;

      constructor(view: EditorView) {
        const highlights = getHighlights();
        this.lastHighlights = JSON.stringify(highlights);
        this.decorations = buildLineDecorations(highlights, view);
      }

      update(update: ViewUpdate) {
        const highlights = getHighlights();
        const highlightsStr = JSON.stringify(highlights);

        if (update.docChanged || update.viewportChanged || highlightsStr !== this.lastHighlights) {
          this.lastHighlights = highlightsStr;
          this.decorations = buildLineDecorations(highlights, update.view);
        }
      }
    },
    {
      decorations: v => v.decorations,
    },
  );
}
