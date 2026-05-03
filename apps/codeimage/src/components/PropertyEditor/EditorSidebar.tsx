import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {EditorStyleForm} from './EditorStyleForm';
import {FrameStyleForm} from './FrameStyleForm';
import {HighlightLinesForm} from './HighlightLinesForm';
import {PanelDivider} from './PanelDivider';
import {WindowStyleForm} from './WindowStyleForm';

export const EditorSidebar = () => {
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
        <EditorStyleForm />
      </div>
      <PanelDivider />

      <div>
        <HighlightLinesForm />
      </div>
    </>
  );
};
