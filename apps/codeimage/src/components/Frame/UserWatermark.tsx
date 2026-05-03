import type {UserWatermarkConfig} from '@codeimage/store/editor/model';
import {Box} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {createMemo, Show} from 'solid-js';
import * as styles from './Frame.css';

interface UserWatermarkProps {
  userWatermark: UserWatermarkConfig;
  textColor: string;
  preview?: boolean;
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

export function UserWatermark(props: UserWatermarkProps) {
  const shouldShowWatermark = createMemo(() => {
    if (!props.userWatermark.enabled) {
      return false;
    }
    if (props.userWatermark.showOnlyOnExport) {
      return props.preview === true;
    }
    return true;
  });

  const hasWatermarkContent = createMemo(() => {
    return (
      props.userWatermark.text.trim() !== '' ||
      props.userWatermark.avatarUrl.trim() !== ''
    );
  });

  const watermarkColor = createMemo(() => {
    if (props.userWatermark.color) {
      return props.userWatermark.color;
    }
    return props.textColor;
  });

  const watermarkOpacity = createMemo(() => {
    return props.userWatermark.opacity / 100;
  });

  return (
    <Show
      when={
        shouldShowWatermark() &&
        hasWatermarkContent()
      }
    >
      <Box
        class={clsx(
          styles.userWatermark,
          getUserWatermarkPositionClass(props.userWatermark.position),
        )}
        style={assignInlineVars({
          opacity: String(watermarkOpacity()),
        })}
      >
        <Show when={props.userWatermark.avatarUrl.trim() !== ''}>
          <img
            class={styles.userWatermarkAvatar}
            src={props.userWatermark.avatarUrl}
            alt={'Avatar'}
            style={{
              width: `${props.userWatermark.fontSize + 12}px`,
              height: `${props.userWatermark.fontSize + 12}px`,
            }}
          />
        </Show>
        <Show when={props.userWatermark.text.trim() !== ''}>
          <span
            class={styles.userWatermarkText}
            style={{
              'font-size': `${props.userWatermark.fontSize}px`,
              color: watermarkColor(),
            }}
          >
            {props.userWatermark.text}
          </span>
        </Show>
      </Box>
    </Show>
  );
}
