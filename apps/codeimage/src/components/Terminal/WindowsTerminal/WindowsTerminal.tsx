import {Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import type {ParentComponent} from 'solid-js';
import {createMemo, Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import * as editorStyles from '../TerminalEditor/TerminalEditor.css';
import type {BaseTerminalProps} from '../TerminalHost';
import {TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';
import {WindowsTerminalControls} from './WindowsTerminalControls';

export const exportExclude = _exportExclude;

function renderTerminalPrompt(options: BaseTerminalProps['terminalOptions']) {
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

export const WindowsTerminal: ParentComponent<BaseTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;
  const isTerminalMode = createMemo(() => props.editorMode === 'terminal');

  return (
    <TerminalHost {...props} themeClass={styles.theme}>
      <Show when={props.showHeader}>
        <div class={baseStyles.header} data-accent-visible={showTab() && !isTerminalMode()}>
          <Show when={isTerminalMode() && props.terminalOptions?.prompt.showPrompt}>
            <div class={styles.terminalPromptHeader}>
              {renderTerminalPrompt(props.terminalOptions)}
            </div>
          </Show>

          <Show when={!isTerminalMode() && props.showTab && (!props.lite || props.preview)}>
            <TerminalWindowTabList
              lite={props.lite}
              preview={props.preview ?? false}
              readOnly={props.readonlyTab}
              accent={props.accentVisible && !props.alternativeTheme}
            />
          </Show>

          <WindowsTerminalControls />
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
