import {Box, FadeInOutTransition} from '@codeimage/ui';
import type {UserWatermarkConfig} from '@codeimage/store/editor/model';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import type {JSXElement, ParentComponent} from 'solid-js';
import {children, createMemo, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use/props';
import {CodeImageLogoV2} from '../../Icons/CodeImageLogoV2';
import * as styles from '../terminal.css';
import type {BaseTerminalProps} from '../TerminalHost';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

function getDefaultUserWatermark(): UserWatermarkConfig {
  return {
    enabled: false,
    text: '',
    avatarUrl: '',
    position: 'right',
    fontSize: 12,
    color: '',
    opacity: 60,
    showOnlyOnExport: false,
  };
}

function getUserWatermarkPositionClass(position: UserWatermarkConfig['position']) {
  switch (position) {
    case 'left':
      return styles.userWatermarkLeft;
    case 'center':
      return styles.userWatermarkCenter;
    case 'right':
      return styles.userWatermarkRight;
    default:
      return styles.userWatermarkRight;
  }
}

export const DynamicTerminal: ParentComponent<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;

  const terminal = createMemo(
    () =>
      terminalThemes.entries[
        props.type as (typeof terminalThemes)['keys'][number]
      ].component,
  );

  const resolvedChildren = children(() => props.children);

  const userWatermark = createMemo(() => {
    return props.userWatermark ?? getDefaultUserWatermark();
  });

  const shouldShowUserWatermark = createMemo(() => {
    if (!userWatermark().enabled) {
      return false;
    }
    if (userWatermark().showOnlyOnExport) {
      return props.preview === true;
    }
    return true;
  });

  const hasUserWatermarkContent = createMemo(() => {
    return (
      userWatermark().text.trim() !== '' ||
      userWatermark().avatarUrl.trim() !== ''
    );
  });

  const watermarkColor = createMemo(() => {
    if (userWatermark().color) {
      return userWatermark().color;
    }
    return props.textColor;
  });

  const watermarkOpacity = createMemo(() => {
    return userWatermark().opacity / 100;
  });

  return (
    <Dynamic component={terminal()} {...omitProps(props, ['type'])}>
      {resolvedChildren()}

      <FadeInOutTransition show={props.showWatermark}>
        <Box class={styles.watermark}>
          <CodeImageLogoV2 width={125} withGradient={false} />
        </Box>
      </FadeInOutTransition>

      <Show
        when={
          shouldShowUserWatermark() &&
          hasUserWatermarkContent()
        }
      >
        <Box
          class={clsx(
            styles.userWatermark,
            getUserWatermarkPositionClass(userWatermark().position),
          )}
          style={assignInlineVars({
            opacity: String(watermarkOpacity()),
          })}
        >
          <Show when={userWatermark().avatarUrl.trim() !== ''}>
            <img
              class={styles.userWatermarkAvatar}
              src={userWatermark().avatarUrl}
              alt={'Avatar'}
              style={{
                width: `${userWatermark().fontSize + 12}px`,
                height: `${userWatermark().fontSize + 12}px`,
              }}
            />
          </Show>
          <Show when={userWatermark().text.trim() !== ''}>
            <span
              class={styles.userWatermarkText}
              style={{
                'font-size': `${userWatermark().fontSize}px`,
                color: watermarkColor(),
              }}
            >
              {userWatermark().text}
            </span>
          </Show>
        </Box>
      </Show>
    </Dynamic>
  );
};
