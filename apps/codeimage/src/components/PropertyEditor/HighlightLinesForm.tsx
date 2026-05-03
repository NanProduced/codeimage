import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {Box, Button, HStack, VStack} from '@codeimage/ui';
import {NumberField, Select, createSelectOptions} from '@codeui/kit';
import {createMemo, createSignal, For, Show} from 'solid-js';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {PanelDivider} from './PanelDivider';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';

const PRESET_COLORS = [
  {label: 'Yellow', value: 'rgba(255, 235, 59, 0.3)'},
  {label: 'Blue', value: 'rgba(33, 150, 243, 0.3)'},
  {label: 'Green', value: 'rgba(76, 175, 80, 0.3)'},
  {label: 'Red', value: 'rgba(244, 67, 54, 0.3)'},
  {label: 'Purple', value: 'rgba(156, 39, 176, 0.3)'},
  {label: 'Orange', value: 'rgba(255, 152, 0, 0.3)'},
];

const colorOptions = createSelectOptions(
  PRESET_COLORS.map(color => ({
    label: color.label,
    value: color.value,
  })),
  {
    key: 'label',
    valueKey: 'value',
  },
);

export function HighlightLinesForm() {
  const activeEditorStore = getActiveEditorStore();
  const highlightLines = createMemo(
    () => activeEditorStore.editor()?.highlightLines ?? [],
  );

  const [newStartLine, setNewStartLine] = createSignal<number>(1);
  const [newEndLine, setNewEndLine] = createSignal<number>(1);
  const [newColor, setNewColor] = createSignal<string>(PRESET_COLORS[0].value);

  const addHighlightLine = () => {
    const start = newStartLine();
    const end = newEndLine();
    if (start > 0 && end >= start) {
      activeEditorStore.addHighlightLine(start, end, newColor());
    }
  };

  const removeHighlightLine = (id: string) => {
    activeEditorStore.removeHighlightLine(id);
  };

  const updateHighlightLineColor = (id: string, color: string) => {
    activeEditorStore.updateHighlightLine(id, {color});
  };

  const updateHighlightLineStart = (id: string, start: number | null | undefined) => {
    if (start && start > 0) {
      activeEditorStore.updateHighlightLine(id, {startLine: start});
    }
  };

  const updateHighlightLineEnd = (id: string, end: number | null | undefined) => {
    if (end && end > 0) {
      activeEditorStore.updateHighlightLine(id, {endLine: end});
    }
  };

  return (
    <>
      <DynamicSizedContainer>
        <PanelHeader label="Highlight Lines" />

        <PanelRow for="highlightLineStartField" label="Start Line">
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'26px'} />}
            >
              <NumberField
                size={'xs'}
                min={1}
                max={999999}
                id={'highlightLineStartField'}
                value={newStartLine()}
                onChange={value => setNewStartLine(value ?? 1)}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for="highlightLineEndField" label="End Line">
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'26px'} />}
            >
              <NumberField
                size={'xs'}
                min={1}
                max={999999}
                id={'highlightLineEndField'}
                value={newEndLine()}
                onChange={value => setNewEndLine(value ?? 1)}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for="highlightLineColorField" label="Color">
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'26px'} />}
            >
              {/* @ts-expect-error Fix @codeui/kit types */}
              <Select
                {...colorOptions.props()}
                {...colorOptions.controlled(
                  () => newColor(),
                  color => setNewColor(color as string),
                )}
                options={colorOptions.options()}
                aria-label={'Highlight Color'}
                id={'highlightLineColorField'}
                size={'xs'}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for="addHighlightLineButton" label="">
          <TwoColumnPanelRow>
            <Button
              size={'xs'}
              theme={'primary'}
              block
              onClick={addHighlightLine}
            >
              Add Highlight
            </Button>
          </TwoColumnPanelRow>
        </PanelRow>

        <Show when={highlightLines().length > 0}>
          <PanelDivider />
          <PanelHeader label="Active Highlights" />
          <VStack spacing={2}>
            <For each={highlightLines()}>
              {line => (
                <Box
                  padding={2}
                  borderRadius="md"
                  style={{backgroundColor: line.color}}
                >
                  <HStack spacing={2} justifyContent="spaceBetween" alignItems="center">
                    <Box>
                      <span>Lines {line.startLine} - {line.endLine}</span>
                    </Box>
                    <HStack spacing={1}>
                      {/* @ts-expect-error Fix @codeui/kit types */}
                      <Select
                        {...colorOptions.props()}
                        {...colorOptions.controlled(
                          () => line.color,
                          color => updateHighlightLineColor(line.id, color as string),
                        )}
                        options={colorOptions.options()}
                        aria-label={'Change Highlight Color'}
                        size={'xs'}
                      />
                      <Button
                        size={'xs'}
                        theme={'secondary'}
                        onClick={() => removeHighlightLine(line.id)}
                      >
                        Remove
                      </Button>
                    </HStack>
                  </HStack>
                  <HStack spacing={2} marginTop={1}>
                    <Box flex={1}>
                      <NumberField
                        size={'xs'}
                        min={1}
                        max={999999}
                        placeholder="Start"
                        value={line.startLine}
                        onChange={value => updateHighlightLineStart(line.id, value)}
                      />
                    </Box>
                    <Box flex={1}>
                      <NumberField
                        size={'xs'}
                        min={1}
                        max={999999}
                        placeholder="End"
                        value={line.endLine}
                        onChange={value => updateHighlightLineEnd(line.id, value)}
                      />
                    </Box>
                  </HStack>
                </Box>
              )}
            </For>
          </VStack>
          <PanelRow for="clearAllHighlightsButton" label="">
            <TwoColumnPanelRow>
              <Button
                size={'xs'}
                theme={'secondary'}
                block
                onClick={() => activeEditorStore.clearHighlightLines()}
              >
                Clear All Highlights
              </Button>
            </TwoColumnPanelRow>
          </PanelRow>
        </Show>
      </DynamicSizedContainer>
    </>
  );
}
