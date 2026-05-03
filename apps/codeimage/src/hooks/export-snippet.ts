import type {EditorView} from '@codemirror/view';
import {createAsyncAction} from '@core/hooks/async-action';
import type {Resource} from 'solid-js';
import type {ExportImagePayload} from './use-export-image';
import {exportImage} from './use-export-image';

type ViewState = {printing: boolean};

type InternalEditorView = EditorView & {
  viewState?: ViewState;
  measure?(): void;
};

export let previewEditorView: EditorView | undefined;

export function setPreviewEditorView(editorView: EditorView | undefined) {
  previewEditorView = editorView;
}

export function exportSnippet(options: ExportImagePayload) {
  const editorView = previewEditorView as InternalEditorView | undefined;
  
  if (editorView && editorView.viewState && editorView.measure) {
    editorView.viewState.printing = true;
    editorView.measure();
  }
  
  return exportImage(options).finally(() => {
    if (editorView) {
      if (editorView.viewState) {
        editorView.viewState.printing = false;
      }
      if (editorView.requestMeasure) {
        editorView.requestMeasure();
      }
    }
  });
}

export function useExportSnippet(): [
  Resource<Blob | string | undefined>,
  (data: ExportImagePayload) => void,
] {
  const [data, {notify}] = createAsyncAction(
    async (ref: ExportImagePayload) => {
      return exportSnippet(ref);
    },
  );

  return [data, notify];
}
