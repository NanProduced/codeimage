import {hasAnsiCodes} from '@core/ansi';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import type {EditorMode} from '@codeimage/store/editor/model';
import {getUiStore} from '@codeimage/store/ui';
import {HStack, toast} from '@codeimage/ui';
import {EditorView} from '@codemirror/view';
import {Button} from '@codeui/kit';
import {
  createCompartmentExtension,
  createEditorControlledValue,
  createEditorFocus,
} from 'solid-codemirror';
import type {Accessor} from 'solid-js';
import {createEffect, createMemo, createSignal, on, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {SparklesIcon} from '../Icons/SparklesIcon';
import {TerminalEditor} from '../Terminal/TerminalEditor/TerminalEditor';
import CustomEditor from './CustomEditor';

interface CanvasEditorProps {
  readOnly: boolean;
}

export default function CanvasEditor(props: CanvasEditorProps) {
  const [editorView, setEditorView] = createSignal<EditorView>();
  const activeEditorStore = getActiveEditorStore();
  const {
    state: editorState,
    actions: {setFocused},
  } = getRootEditorStore();

  const currentEditor = createMemo(() => activeEditorStore.editor());
  const editorMode = createMemo((): EditorMode => currentEditor()?.mode ?? 'code');

  const {setFocused: editorSetFocused} = createEditorFocus(
    editorView as Accessor<EditorView>,
    focusing => setFocused(focusing),
  );

  createEffect(
    on(
      editorView,
      view => {
        if (!view) return;
        createEffect(
          on(
            () => editorState.options.focused,
            isFocused => {
              if (view && !view.hasFocus && isFocused) {
                editorSetFocused(true);
              }
            },
          ),
        );
      },
      {defer: true},
    ),
  );

  const handleTerminalPaste = (event: ClipboardEvent, hasAnsi: boolean) => {
    if (hasAnsi && editorMode() === 'code') {
      event.preventDefault();
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const pastedText = clipboardData.getData('text/plain');

      activeEditorStore.setMode('terminal');

      const currentCode = currentEditor()?.code ?? '';
      const selectionStart = 0;
      const selectionEnd = currentCode.length;
      const newCode = currentCode.substring(0, selectionStart) + pastedText + currentCode.substring(selectionEnd);
      activeEditorStore.setCode(newCode);

      const [t] = useI18n<AppLocaleEntries>();
      toast.success(
        () => t('canvas.switchedToTerminalMode'),
        {
          position: 'bottom-center',
          theme: getUiStore().invertedThemeMode(),
        },
      );
    }
  };

  createCompartmentExtension(() => {
    let activeToastId: string | null = null;
    return EditorView.domEventHandlers({
      paste(event, view) {
        const clipboardData = event.clipboardData;
        if (clipboardData) {
          const pastedText = clipboardData.getData('text/plain');
          if (hasAnsiCodes(pastedText)) {
            event.preventDefault();
            activeEditorStore.setMode('terminal');

            const currentCode = currentEditor()?.code ?? '';
            const selectionStart = view.state.selection.main.from;
            const selectionEnd = view.state.selection.main.to;
            const newCode = currentCode.substring(0, selectionStart) + pastedText + currentCode.substring(selectionEnd);
            activeEditorStore.setCode(newCode);

            const [t] = useI18n<AppLocaleEntries>();
            toast.success(
              () => t('canvas.switchedToTerminalMode'),
              {
                position: 'bottom-center',
                theme: getUiStore().invertedThemeMode(),
              },
            );
            return;
          }
        }

        if (activeToastId) toast.dismiss(activeToastId);
        setTimeout(() => {
          if (!activeEditorStore.canFormat()) {
            return;
          }
          activeToastId = toast.success(
            activeToast => {
              const [t] = useI18n<AppLocaleEntries>();
              return (
                <div>
                  <HStack
                    spacing={5}
                    display={'flex'}
                    justifyContent={'spaceBetween'}
                    alignItems={'center'}
                  >
                    <span>{t('canvas.pastedCode')}</span>
                    <Button
                      size={'xs'}
                      theme={'primary'}
                      leftIcon={<SparklesIcon size={'xs'} />}
                      disabled={!activeEditorStore.canFormat()}
                      onClick={() => {
                        const localValue = view.state.doc.toString();
                        activeEditorStore.format(localValue);
                        toast.dismiss(activeToast.id);
                      }}
                    >
                      Format
                    </Button>
                  </HStack>
                </div>
              );
            },
            {
              position: 'bottom-center',
              theme: getUiStore().invertedThemeMode(),
            },
          );
        }, 50);
      },
    });
  }, editorView);

  createEditorControlledValue(
    editorView as Accessor<EditorView>,
    () => activeEditorStore.editor()?.code ?? '',
  );

  return (
    <Show when={editorMode() === 'code'} fallback={
      <TerminalEditor
        value={activeEditorStore.editor()?.code ?? ''}
        onChange={activeEditorStore.setCode}
        options={activeEditorStore.editor()?.terminalOptions}
        readOnly={props.readOnly}
        onPaste={handleTerminalPaste}
      />
    }>
      <CustomEditor
        onEditorViewChange={setEditorView}
        onValueChange={activeEditorStore.setCode}
        readOnly={props.readOnly}
      />
    </Show>
  );
}
