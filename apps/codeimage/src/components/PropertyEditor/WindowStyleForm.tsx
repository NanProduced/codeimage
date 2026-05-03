import {useI18n} from '@codeimage/locale';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {RangeField} from '@codeimage/ui';
import {VersionStore} from '@codeimage/store/version/version.store';
import {createSelectOptions, Select, TextField} from '@codeui/kit';
import {shadowsLabel} from '@core/configuration/shadow';
import {getUmami} from '@core/constants/umami';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import type {ParentComponent} from 'solid-js';
import {createMemo, Show} from 'solid-js';
import {provideState} from 'statebuilder';
import type {AppLocaleEntries} from '../../i18n';
import {CustomColorPicker} from './controls/ColorPicker/CustomColorPicker';
import {TerminalControlField} from './controls/TerminalControlField/TerminalControlField';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const WindowStyleForm: ParentComponent = () => {
  const terminal = getTerminalState();
  const versionStore = provideState(VersionStore);
  const [t] = useI18n<AppLocaleEntries>();

  const terminalShadows = createMemo(
    () => shadowsLabel() as {label: string; value: string}[],
  );

  const terminalShadowsSelect = createSelectOptions(terminalShadows(), {
    key: 'label',
    valueKey: 'value',
  });

  const borderTypeSelect = createSelectOptions(
    [
      {label: 'None', value: 'none'},
      {label: 'Glass', value: 'glass'},
    ],
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  const positionOptions = createMemo(() => [
    {label: t('frame.userWatermarkPositionLeft'), value: 'left'},
    {label: t('frame.userWatermarkPositionCenter'), value: 'center'},
    {label: t('frame.userWatermarkPositionRight'), value: 'right'},
  ]);

  const positionSelect = createSelectOptions(positionOptions(), {
    key: 'label',
    valueKey: 'value',
  });

  const fontSizeOptions = createMemo(() => [
    {label: '10', value: '10'},
    {label: '12', value: '12'},
    {label: '14', value: '14'},
    {label: '16', value: '16'},
    {label: '18', value: '18'},
    {label: '20', value: '20'},
  ]);

  const fontSizeSelect = createSelectOptions(fontSizeOptions(), {
    key: 'label',
    valueKey: 'value',
  });

  return (
    <>
      <PanelHeader label={t('frame.terminal')} />

      <PanelRow for={'frameAlternativeField'} label={t('frame.backgroundType')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.alternativeTheme}
              onChange={terminal.setAlternativeTheme}
              items={[
                {label: 'Default', value: false},
                {label: 'Alternative', value: true},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameHeaderField'} label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              id={'frameHeaderInput'}
              value={terminal.state.showHeader}
              onChange={terminal.setShowHeader}
              items={[
                {label: t('common.yes'), value: true},
                {label: t('common.no'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.state.showHeader}>
        <PanelRow
          for={'frameTerminalTypeField'}
          label={'Window'}
          feature={'windowStylePicker'}
        >
          <FullWidthPanelRow>
            <TerminalControlField
              showAccent={terminal.state.accentVisible}
              selectedTerminal={terminal.state.type}
              onTerminalChange={type => {
                terminal.setType(type);
                getUmami().track('change-terminal-type', {
                  type,
                });
              }}
              onShowAccentChange={terminal.setAccentVisible}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'frameTabReflectionField'} label={t('frame.reflection')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.showGlassReflection}
              onChange={terminal.setShowGlassReflection}
              items={[
                {label: t('common.show'), value: true},
                {label: t('common.hide'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameShowWatermarkField'} label={t('frame.watermark')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.showWatermark}
              onChange={terminal.setShowWatermark}
              items={[
                {label: t('common.show'), value: true},
                {label: t('common.hide'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelHeader label={t('frame.userWatermark')} />

      <PanelRow for={'userWatermarkEnabled'} label={t('frame.userWatermarkEnabled')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.userWatermark.enabled}
              onChange={enabled =>
                terminal.setUserWatermark({enabled})
              }
              items={[
                {label: t('common.yes'), value: true},
                {label: t('common.no'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.state.userWatermark.enabled}>
        <PanelRow for={'userWatermarkText'} label={t('frame.userWatermarkText')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              <TextField
                size={'xs'}
                value={terminal.state.userWatermark.text}
                onChange={text => terminal.setUserWatermark({text})}
                placeholder={'e.g. @username or mywebsite.com'}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for={'userWatermarkAvatar'} label={t('frame.userWatermarkAvatar')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              <TextField
                size={'xs'}
                value={terminal.state.userWatermark.avatarUrl}
                onChange={avatarUrl => terminal.setUserWatermark({avatarUrl})}
                placeholder={'https://example.com/avatar.png'}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for={'userWatermarkPosition'} label={t('frame.userWatermarkPosition')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              {/*@ts-expect-error Fix @codeui/kit select types*/}
              <Select
                options={positionSelect.options()}
                {...positionSelect.props()}
                {...positionSelect.controlled(
                  () => terminal.state.userWatermark.position,
                  position => {
                    terminal.setUserWatermark({
                      position: position as 'left' | 'center' | 'right',
                    });
                  },
                )}
                aria-label={'Position'}
                size={'xs'}
                id={'userWatermarkPosition'}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for={'userWatermarkFontSize'} label={t('frame.userWatermarkFontSize')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              {/*@ts-expect-error Fix @codeui/kit select types*/}
              <Select
                options={fontSizeSelect.options()}
                {...fontSizeSelect.props()}
                {...fontSizeSelect.controlled(
                  () => String(terminal.state.userWatermark.fontSize),
                  fontSize => {
                    terminal.setUserWatermark({
                      fontSize: Number(fontSize),
                    });
                  },
                )}
                aria-label={'Font Size'}
                size={'xs'}
                id={'userWatermarkFontSize'}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for={'userWatermarkColor'} label={t('frame.userWatermarkColor')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              <CustomColorPicker
                value={terminal.state.userWatermark.color || undefined}
                onChange={color => terminal.setUserWatermark({color})}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for={'userWatermarkOpacity'} label={t('frame.userWatermarkOpacity')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              <RangeField
                value={terminal.state.userWatermark.opacity}
                min={10}
                max={100}
                step={5}
                onChange={opacity => terminal.setUserWatermark({opacity})}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>

        <PanelRow for={'userWatermarkExportOnly'} label={t('frame.userWatermarkExportOnly')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'24px'} />}
            >
              <SegmentedField
                size={'xs'}
                adapt
                value={terminal.state.userWatermark.showOnlyOnExport}
                onChange={showOnlyOnExport =>
                  terminal.setUserWatermark({showOnlyOnExport})
                }
                items={[
                  {label: t('common.yes'), value: true},
                  {label: t('common.no'), value: false},
                ]}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'frameSelectShadow'} label={t('frame.shadow')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            {/*@ts-expect-error Fix @codeui/kit select types*/}
            <Select
              options={terminalShadowsSelect.options()}
              multiple={false}
              {...terminalShadowsSelect.props()}
              {...terminalShadowsSelect.controlled(
                () => terminal.state.shadow ?? undefined,
                shadow => {
                  getUmami().track('change-shadow', {
                    shadow: shadow ?? 'none',
                  });
                  terminal.setShadow(shadow ?? null);
                },
              )}
              aria-label={'Shadow'}
              size={'xs'}
              id={'frameSelectShadow'}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
      <PanelRow
        for={'frameSelectShadow'}
        feature={'borderType'}
        label={t('frame.border')}
      >
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            {/*@ts-expect-error Fix @codeui/kit select types*/}
            <Select
              options={borderTypeSelect.options()}
              {...borderTypeSelect.props()}
              {...borderTypeSelect.controlled(
                () => terminal.state.borderType ?? 'none',
                border => {
                  const isNone = border === 'none';
                  versionStore.see('borderType', false);
                  getUmami().track('change-border', {
                    border: border ?? 'none',
                  });
                  terminal.setBorder(isNone ? null : (border ?? null));
                },
              )}
              aria-label={'Border'}
              size={'xs'}
              id={'frameSelectBorder'}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
