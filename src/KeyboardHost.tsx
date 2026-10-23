import type { ReactNode } from 'react';

import { KeyboardProvider } from 'react-native-keyboard-controller';

import {
  KeyboardFormThemeProvider,
  lightTheme,
  mergeTheme,
  type KeyboardFormTheme,
  type KeyboardFormThemeOverride,
} from './theme';

/**
 * Goes once around the app (inside the safe-area provider is fine): lets screens follow the keyboard as
 * it opens and closes, and sets the look every form uses unless a screen changes it.
 */
export function KeyboardHost({
  theme,
  children,
}: {
  /** A full theme (e.g. `darkTheme`), or only the values to change from the light one. */
  theme?: KeyboardFormTheme | KeyboardFormThemeOverride;
  children: ReactNode;
}) {
  return (
    <KeyboardProvider>
      <KeyboardFormThemeProvider theme={mergeTheme(lightTheme, theme)}>
        {children}
      </KeyboardFormThemeProvider>
    </KeyboardProvider>
  );
}
