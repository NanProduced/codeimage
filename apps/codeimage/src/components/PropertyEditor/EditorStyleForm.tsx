import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {LanguageDefinition} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import type {LineHighlight} from '@codeimage/store/editor/model';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {Button, createSelectOptions, NumberField, Select} from '@codeui/kit';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import type {ParentComponent} from 'solid-js';
import {createMemo, For, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {FontPicker} from './controls/FontPicker/FontPicker';
import {PanelDivider} from './PanelDivider';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

const DEFAULT_HIGHLIGHT_COLORS = [
  'rgba(255, 107, 107, 0.3)',
  'rgba(78, 205, 196, 0.3)',
  'rgba(69, 183, 209, 0.3)',
  'rgba(150, 206, 180, 0.3)',
  'rgba(255, 238, 173, 0.3)',
  'rgba(255, 154, 162, 0.3)',
  'rgba(255, 183, 77, 0.3)',
  'rgba(162, 155, 254, 0.3)',
];

const languages: readonly LanguageDefinition[] = [...SUPPORTED_LANGUAGES].sort(
  (a, b) => {
    if (a.featured && !b.featured) {
      return -1; // a comes first
    } else if (!a.featured && b.featured) {
      return 1; // b comes first
    } else if (a.featured && b.featured) {
      return SUPPORTED_LANGUAGES.indexOf(a) - SUPPORTED_LANGUAGES.indexOf(b); // sort by position
    } else {
      return a.label.localeCompare(b.label); // sort alphabetically
    }
  },
);

export const EditorStyleForm: ParentComponent = () => {
  const {themeArray} = getThemeStore();
  const {lineNumbers: lineNumbersConfig} = appEnvironment;
  const [t] = useI18n<AppLocaleEntries>();
  const {
    editor,
    setLanguageId,
    formatter,
    setFormatterName,
    setLineNumberStart,
    addHighlight,
    removeHighlight,
    updateHighlight,
    clearHighlights,
  } = getActiveEditorStore();
  const {
    state,
    actions: {setShowLineNumbers, setFontWeight, setFontId, setEnableLigatures},
    computed: {selectedFont},
  } = getRootEditorStore();

  const highlightedLines = createMemo(() => editor()?.highlightedLines ?? []);

  const codeLines = createMemo(() => {
    const code = editor()?.code ?? '';
    if (!code) return 1;
    return code.split('\n').length;
  });

  const lineNumberStart = createMemo(() => editor()?.lineNumberStart ?? 1);
  const maxDisplayLine = createMemo(() => lineNumberStart() + codeLines() - 1);

  const colorOptions = createSelectOptions(
    DEFAULT_HIGHLIGHT_COLORS.map((color, index) => ({
      label: `Color ${index + 1}`,
      value: color,
    })),
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  const handleAddHighlight = () => {
    const defaultColor = DEFAULT_HIGHLIGHT_COLORS[0];
    const defaultFrom = lineNumberStart();
    const defaultTo = Math.min(lineNumberStart(), maxDisplayLine());
    addHighlight(defaultFrom, defaultTo, defaultColor);
  };

  const handleUpdateHighlightFrom = (highlight: LineHighlight, newFrom: number | null | undefined) => {
    const from = newFrom ?? lineNumberStart();
    const clampedFrom = Math.max(lineNumberStart(), Math.min(from, maxDisplayLine()));
    const clampedTo = Math.max(clampedFrom, Math.min(highlight.to, maxDisplayLine()));

    updateHighlight(highlight.id, {from: clampedFrom, to: clampedTo});
  };

  const handleUpdateHighlightTo = (highlight: LineHighlight, newTo: number | null | undefined) => {
    const to = newTo ?? maxDisplayLine();
    const clampedTo = Math.max(lineNumberStart(), Math.min(to, maxDisplayLine()));
    const clampedFrom = Math.min(highlight.from, clampedTo);

    updateHighlight(highlight.id, {from: clampedFrom, to: clampedTo});
  };

  const languagesOptions = createSelectOptions(
    languages.map(language => ({
      label: language.label,
      value: language.id,
    })),
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  const syntaxHighlightOptions = createSelectOptions(
    () =>
      themeArray()
        .map(theme => theme())
        .filter((theme): theme is CustomTheme => !!theme)
        .map(theme => {
          return {
            label: theme.properties.label,
            value: theme.id,
          };
        }),
    {key: 'label', valueKey: 'value'},
  );

  const languageFormatterOptions = createSelectOptions(
    () =>
      formatter.availableFormatters().map(prettierPlugin => {
        return {
          label: prettierPlugin.name,
          value: prettierPlugin.parser,
        };
      }),
    {key: 'label', valueKey: 'value'},
  );

  const fontWeightByFont = () => {
    const font = selectedFont();
    if (!font) {
      return [];
    }
    return font.types.map(type => ({
      label: type.name,
      value: type.weight,
    }));
  };

  const fontWeightOptions = createSelectOptions(fontWeightByFont, {
    key: 'label',
    valueKey: 'value',
  });

  return (
    <Show when={editor()}>
      {editor => (
        <>
          <DynamicSizedContainer>
            <PanelHeader label={t('frame.editor')} />

            <PanelRow for={'frameLanguageField'} label={t('frame.language')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  {/* @ts-expect-error Fix @codeui/kit types */}
                  <Select
                    {...languagesOptions.props()}
                    {...languagesOptions.controlled(
                      () => editor().languageId,
                      language => {
                        setLanguageId(language!);
                        getUmami().track('change-language', {
                          language: language!,
                        });
                      },
                    )}
                    options={languagesOptions.options()}
                    aria-label={'Language'}
                    id={'frameLanguageField'}
                    size={'xs'}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <PanelRow for={'frameLanguageField'} label={t('frame.theme')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  {/* @ts-expect-error Fix @codeui/kit types */}
                  <Select
                    {...syntaxHighlightOptions.props()}
                    {...syntaxHighlightOptions.controlled(
                      () => state.options.themeId,
                      theme => {
                        theme = theme as string;
                        dispatchUpdateTheme({
                          updateBackground: false,
                          theme,
                        });
                      },
                    )}
                    options={syntaxHighlightOptions.options()}
                    aria-label={'Syntax highlight'}
                    id={'frameSyntaxHighlightField'}
                    size={'xs'}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <Show
              when={formatter.availableFormatters().length > 0}
              keyed={true}
            >
              {_ => (
                <PanelRow
                  for={'editorLanguageFormatterField'}
                  label={t('frame.formatter')}
                >
                  <TwoColumnPanelRow>
                    <SuspenseEditorItem
                      fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                    >
                      {/* @ts-expect-error Fix @codeui/kit types */}
                      <Select
                        {...languageFormatterOptions.props()}
                        {...languageFormatterOptions.controlled(
                          () =>
                            editor()?.formatter ??
                            formatter.availableFormatters()[0]?.parser,
                          formatter => {
                            formatter = formatter as string;
                            setFormatterName(formatter);
                          },
                        )}
                        disabled={formatter.availableFormatters().length === 1}
                        options={languageFormatterOptions.options()}
                        aria-label={'Editor language formatter'}
                        id={'editorLanguageFormatterField'}
                        size={'xs'}
                      />
                    </SuspenseEditorItem>
                  </TwoColumnPanelRow>
                </PanelRow>
              )}
            </Show>

            <PanelRow
              for={'frameLineNumbersField'}
              label={t('frame.lineNumbers')}
            >
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <SegmentedField
                    size={'xs'}
                    adapt
                    id={'frameLineNumbersField'}
                    value={state.options.showLineNumbers}
                    onChange={setShowLineNumbers}
                    items={[
                      {label: t('common.show'), value: true},
                      {label: t('common.hide'), value: false},
                    ]}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <Show when={state.options.showLineNumbers}>
              <PanelRow
                for={'frameLineNumberStartField'}
                label={t('frame.lineNumberStart')}
              >
                <TwoColumnPanelRow>
                  <SuspenseEditorItem
                    fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                  >
                    <NumberField
                      size={'xs'}
                      min={lineNumbersConfig.min}
                      max={lineNumbersConfig.max}
                      id={'frameLineNumberStartField'}
                      value={editor().lineNumberStart}
                      ref={el => {
                        // TODO why called two times?
                        if (el) {
                          el.autocomplete = 'off';
                        }
                      }}
                      onChange={setLineNumberStart}
                    />
                  </SuspenseEditorItem>
                </TwoColumnPanelRow>
              </PanelRow>
            </Show>
          </DynamicSizedContainer>

          <PanelDivider />

          <DynamicSizedContainer>
            <PanelHeader label={t('frame.highlightLines')} />

            <For each={highlightedLines()}>
              {(highlight: LineHighlight) => (
                <>
                  <PanelRow
                    for={`highlightFrom-${highlight.id}`}
                    label={t('frame.fromLine')}
                  >
                    <TwoColumnPanelRow>
                      <SuspenseEditorItem
                        fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                      >
                        <NumberField
                          size={'xs'}
                          min={lineNumberStart()}
                          max={maxDisplayLine()}
                          id={`highlightFrom-${highlight.id}`}
                          value={highlight.from}
                          onChange={value =>
                            handleUpdateHighlightFrom(highlight, value)
                          }
                        />
                      </SuspenseEditorItem>
                    </TwoColumnPanelRow>
                  </PanelRow>

                  <PanelRow
                    for={`highlightTo-${highlight.id}`}
                    label={t('frame.toLine')}
                  >
                    <TwoColumnPanelRow>
                      <SuspenseEditorItem
                        fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                      >
                        <NumberField
                          size={'xs'}
                          min={lineNumberStart()}
                          max={maxDisplayLine()}
                          id={`highlightTo-${highlight.id}`}
                          value={highlight.to}
                          onChange={value =>
                            handleUpdateHighlightTo(highlight, value)
                          }
                        />
                      </SuspenseEditorItem>
                    </TwoColumnPanelRow>
                  </PanelRow>

                  <PanelRow
                    for={`highlightColor-${highlight.id}`}
                    label={t('frame.highlightColor')}
                  >
                    <TwoColumnPanelRow>
                      <SuspenseEditorItem
                        fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            'align-items': 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              'border-radius': '4px',
                              'background-color': highlight.color,
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          />
                          {/* @ts-expect-error Fix @codeui/kit types */}
                          <Select
                            {...colorOptions.props()}
                            {...colorOptions.controlled(
                              () => highlight.color,
                              color => {
                                updateHighlight(highlight.id, {
                                  color: color as string,
                                });
                              },
                            )}
                            options={colorOptions.options()}
                            aria-label={'Highlight color'}
                            id={`highlightColor-${highlight.id}`}
                            size={'xs'}
                          />
                          <Button
                            size={'xs'}
                            variant={'ghost'}
                            onClick={() => removeHighlight(highlight.id)}
                          >
                            {t('frame.removeHighlight')}
                          </Button>
                        </div>
                      </SuspenseEditorItem>
                    </TwoColumnPanelRow>
                  </PanelRow>
                </>
              )}
            </For>

            <PanelRow for={'addHighlight'} label={''}>
              <TwoColumnPanelRow>
                <Button
                  size={'xs'}
                  variant={'ghost'}
                  onClick={handleAddHighlight}
                >
                  {t('frame.addHighlight')}
                </Button>
                <Show when={highlightedLines().length > 0}>
                  <Button
                    size={'xs'}
                    variant={'ghost'}
                    onClick={clearHighlights}
                    style={{'margin-left': '8px'}}
                  >
                    {t('frame.clearAllHighlights')}
                  </Button>
                </Show>
              </TwoColumnPanelRow>
            </PanelRow>
          </DynamicSizedContainer>

          <PanelDivider />

          <DynamicSizedContainer>
            <PanelHeader label={t('frame.font')} />

            <PanelRow
              for={'fontPicker'}
              label={t('frame.font')}
              feature={'fontPicker'}
            >
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'100%'} height={'26px'} />}
                >
                  <FontPicker
                    value={selectedFont()?.id}
                    onChange={fontId => setFontId(fontId)}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <PanelRow
              for={'frameFontWeightField'}
              label={t('frame.fontWeight')}
            >
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'85%'} height={'26px'} />}
                >
                  {/* @ts-expect-error Fix @codeui/kit types */}
                  <Select
                    {...fontWeightOptions.props()}
                    {...fontWeightOptions.controlled(
                      () => state.options.fontWeight,
                      value => setFontWeight(value ?? 400),
                    )}
                    aria-label={'Font weight'}
                    id={'frameFontWeightField'}
                    options={fontWeightOptions.options()}
                    size={'xs'}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>

            <PanelRow for={'frameFontWeightField'} label={t('frame.ligatures')}>
              <TwoColumnPanelRow>
                <SuspenseEditorItem
                  fallback={<SkeletonLine width={'85%'} height={'26px'} />}
                >
                  <SegmentedField
                    adapt
                    size={'xs'}
                    id={'frameLigaturesField'}
                    value={state.options.enableLigatures}
                    onChange={setEnableLigatures}
                    items={[
                      {label: t('common.yes'), value: true},
                      {label: t('common.no'), value: false},
                    ]}
                  />
                </SuspenseEditorItem>
              </TwoColumnPanelRow>
            </PanelRow>
          </DynamicSizedContainer>
        </>
      )}
    </Show>
  );
};
