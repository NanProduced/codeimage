import {ANSI_THEMES, ANSI_THEME_KEYS} from '@core/ansi';
import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import type {EditorMode} from '@codeimage/store/editor/model';
import {createSelectOptions, Select, TextField} from '@codeui/kit';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import type {ParentComponent} from 'solid-js';
import {createMemo, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const TerminalStyleForm: ParentComponent = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const {editor, setMode, setTerminalOptions} = getActiveEditorStore();

  const editorMode = createMemo((): EditorMode => editor()?.mode ?? 'code');
  const terminalOptions = createMemo(() => editor()?.terminalOptions);

  const ansiThemeOptions = createSelectOptions(
    ANSI_THEME_KEYS.map(key => ({
      label: ANSI_THEMES[key].label,
      value: key,
    })),
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  const promptStyleOptions = createSelectOptions(
    [
      {label: 'Default', value: 'default'},
      {label: 'Minimal', value: 'minimal'},
      {label: 'Full', value: 'full'},
    ],
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  return (
    <Show when={editor()}>
      {editor => (
        <>
          <DynamicSizedContainer>
            <PanelHeader label={t('editor.mode')} />

            <PanelRow for={'editorModeField'} label={t('editor.mode')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <SegmentedField
                    size={'xs'}
                    adapt
                    id={'editorModeField'}
                    value={editorMode()}
                    onChange={mode => setMode(mode as EditorMode)}
                    items={[
                      {label: t('editor.codeMode'), value: 'code'},
                      {label: t('editor.terminalMode'), value: 'terminal'},
                    ]}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>
          </DynamicSizedContainer>

          <Show when={editorMode() === 'terminal'}>
            <DynamicSizedContainer>
              <PanelHeader label={t('editor.ansiTheme')} />

              <PanelRow for={'ansiThemeField'} label={t('editor.ansiTheme')}>
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    {/* @ts-expect-error Fix @codeui/kit types */}
                    <Select
                      {...ansiThemeOptions.props()}
                      {...ansiThemeOptions.controlled(
                        () => terminalOptions()?.ansiThemeId ?? 'default',
                        theme => {
                          setTerminalOptions({ansiThemeId: theme!});
                        },
                      )}
                      options={ansiThemeOptions.options()}
                      aria-label={'ANSI Theme'}
                      id={'ansiThemeField'}
                      size={'xs'}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>
            </DynamicSizedContainer>

            <DynamicSizedContainer>
              <PanelHeader label={t('editor.prompt')} />

              <PanelRow for={'showPromptField'} label={t('editor.showPrompt')}>
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    <SegmentedField
                      size={'xs'}
                      adapt
                      id={'showPromptField'}
                      value={terminalOptions()?.prompt.showPrompt ?? true}
                      onChange={value => {
                        setTerminalOptions({
                          prompt: {showPrompt: value},
                        });
                      }}
                      items={[
                        {label: t('common.show'), value: true},
                        {label: t('common.hide'), value: false},
                      ]}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>

              <Show when={terminalOptions()?.prompt.showPrompt}>
                <PanelRow for={'promptStyleField'} label={t('editor.promptStyle')}>
                  <TwoColumnPanelRow>
                    <SuspenseEditorItem
                      fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                    >
                      {/* @ts-expect-error Fix @codeui/kit types */}
                      <Select
                        {...promptStyleOptions.props()}
                        {...promptStyleOptions.controlled(
                          () => terminalOptions()?.prompt.promptStyle ?? 'default',
                          style => {
                            setTerminalOptions({
                              prompt: {
                                promptStyle: style as 'default' | 'minimal' | 'full',
                              },
                            });
                          },
                        )}
                        options={promptStyleOptions.options()}
                        aria-label={'Prompt Style'}
                        id={'promptStyleField'}
                        size={'xs'}
                      />
                    </SuspenseEditorItem>
                  </TwoColumnPanelRow>
                </PanelRow>

                <PanelRow for={'usernameField'} label={t('editor.username')}>
                  <TwoColumnPanelRow>
                    <SuspenseEditorItem
                      fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                    >
                      <TextField
                        size={'xs'}
                        id={'usernameField'}
                        value={terminalOptions()?.prompt.username ?? 'user'}
                        onChange={value => {
                          setTerminalOptions({
                            prompt: {username: value},
                          });
                        }}
                      />
                    </SuspenseEditorItem>
                  </TwoColumnPanelRow>
                </PanelRow>

                <PanelRow for={'hostnameField'} label={t('editor.hostname')}>
                  <TwoColumnPanelRow>
                    <SuspenseEditorItem
                      fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                    >
                      <TextField
                        size={'xs'}
                        id={'hostnameField'}
                        value={terminalOptions()?.prompt.hostname ?? 'localhost'}
                        onChange={value => {
                          setTerminalOptions({
                            prompt: {hostname: value},
                          });
                        }}
                      />
                    </SuspenseEditorItem>
                  </TwoColumnPanelRow>
                </PanelRow>

                <PanelRow for={'directoryField'} label={t('editor.directory')}>
                  <TwoColumnPanelRow>
                    <SuspenseEditorItem
                      fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                    >
                      <TextField
                        size={'xs'}
                        id={'directoryField'}
                        value={terminalOptions()?.prompt.directory ?? '~'}
                        onChange={value => {
                          setTerminalOptions({
                            prompt: {directory: value},
                          });
                        }}
                      />
                    </SuspenseEditorItem>
                  </TwoColumnPanelRow>
                </PanelRow>
              </Show>
            </DynamicSizedContainer>

            <DynamicSizedContainer>
              <PanelHeader label={t('editor.cursor')} />

              <PanelRow for={'showCursorField'} label={t('editor.showCursor')}>
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    <SegmentedField
                      size={'xs'}
                      adapt
                      id={'showCursorField'}
                      value={terminalOptions()?.showCursor ?? true}
                      onChange={value => {
                        setTerminalOptions({showCursor: value});
                      }}
                      items={[
                        {label: t('common.show'), value: true},
                        {label: t('common.hide'), value: false},
                      ]}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>

              <PanelRow for={'cursorBlinkField'} label={t('editor.cursorBlink')}>
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    <SegmentedField
                      size={'xs'}
                      adapt
                      id={'cursorBlinkField'}
                      value={terminalOptions()?.cursorBlink ?? false}
                      onChange={value => {
                        setTerminalOptions({cursorBlink: value});
                      }}
                      items={[
                        {label: t('common.yes'), value: true},
                        {label: t('common.no'), value: false},
                      ]}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>
            </DynamicSizedContainer>
          </Show>
        </>
      )}
    </Show>
  );
};
