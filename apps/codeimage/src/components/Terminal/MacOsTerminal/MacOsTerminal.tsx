import {backgroundColorVar, Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {ParentComponent} from 'solid-js';
import {createMemo, Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import * as editorStyles from '../TerminalEditor/TerminalEditor.css';
import type {BaseTerminalProps} from '../TerminalHost';
import {TerminalHost} from '../TerminalHost';
import * as styles from './MacOsTerminal.css';

export const exportExclude = _exportExclude;

export interface MacOsTerminalProps extends BaseTerminalProps {
  headerType: 'default' | 'outline' | 'gray';
}

function renderTerminalPrompt(options: MacOsTerminalProps['terminalOptions']) {
  if (!options?.prompt.showPrompt) {
    return null;
  }

  const {prompt} = options;

  switch (prompt.promptStyle) {
    case 'minimal':
      return (
        <span class={editorStyles.terminalEditorMinimalPrompt}>
          $
        </span>
      );

    case 'full':
      return (
        <span class={editorStyles.terminalEditorFullPrompt}>
          <span class={editorStyles.terminalEditorPromptUser}>{prompt.username}</span>
          <span class={editorStyles.terminalEditorPromptSeparator}>@</span>
          <span class={editorStyles.terminalEditorPromptHost}>{prompt.hostname}</span>
          <span class={editorStyles.terminalEditorPromptSeparator}>:</span>
          <span class={editorStyles.terminalEditorPromptPath}>{prompt.directory}</span>
          <span class={editorStyles.terminalEditorPromptSymbol}>$</span>
        </span>
      );

    case 'default':
    default:
      return (
        <>
          <span class={editorStyles.terminalEditorPromptUser}>{prompt.username}</span>
          <span class={editorStyles.terminalEditorPromptSeparator}>@</span>
          <span class={editorStyles.terminalEditorPromptHost}>{prompt.hostname}</span>
          <span class={editorStyles.terminalEditorPromptSeparator}>:</span>
          <span class={editorStyles.terminalEditorPromptPath}>{prompt.directory}</span>
          <span class={editorStyles.terminalEditorPromptSymbol}>$</span>
        </>
      );
  }
}

export const MacOsTerminal: ParentComponent<MacOsTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;
  const isTerminalMode = createMemo(() => props.editorMode === 'terminal');

  return (
    <TerminalHost {...props} themeClass={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-lite={props.lite}
          data-accent-visible={showTab() && !isTerminalMode()}
        >
          <div
            class={styles.headerIconRow}
            data-lite={props.lite}
            data-header-type={props.headerType ?? 'default'}
          >
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.red,
              })}
            />
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.yellow,
              })}
            />
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.green,
              })}
            />
          </div>

          <Show when={isTerminalMode() && props.terminalOptions?.prompt.showPrompt}>
            <div class={styles.terminalPromptHeader}>
              {renderTerminalPrompt(props.terminalOptions)}
            </div>
          </Show>

          <Show when={!isTerminalMode() && props.showTab && (!props.lite || props.preview)}>
            <TerminalWindowTabList
              lite={props.lite}
              showOnlyActiveTab={props.showOnlyActiveTab}
              preview={props.preview ?? false}
              readOnly={props.readonlyTab}
              accent={props.accentVisible && !props.alternativeTheme}
            />
          </Show>
        </div>
      </Show>
      <Show when={props.children}>
        <div class={baseStyles.content}>
          <Box position={'relative'}>
            <div>{props.children}</div>
          </Box>
        </div>
      </Show>
    </TerminalHost>
  );
};
