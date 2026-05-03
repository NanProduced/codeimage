import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {createMemo, Show} from 'solid-js';
import {EditorStyleForm} from './EditorStyleForm';
import {FrameStyleForm} from './FrameStyleForm';
import {PanelDivider} from './PanelDivider';
import {TerminalStyleForm} from './TerminalStyleForm';
import {WindowStyleForm} from './WindowStyleForm';

export const EditorSidebar = () => {
  const {editor} = getActiveEditorStore();
  const isTerminalMode = createMemo(() => editor()?.mode === 'terminal');

  return (
    <>
      <DynamicSizedContainer>
        <FrameStyleForm />
      </DynamicSizedContainer>
      <PanelDivider />

      <DynamicSizedContainer>
        <WindowStyleForm />
      </DynamicSizedContainer>
      <PanelDivider />

      <div>
        <TerminalStyleForm />
      </div>

      <Show when={!isTerminalMode()}>
        <PanelDivider />
        <div>
          <EditorStyleForm />
        </div>
      </Show>
    </>
  );
};
