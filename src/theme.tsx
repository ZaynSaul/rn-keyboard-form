import { createContext, useContext, type ReactNode } from 'react';

export type KeyboardFormTheme = {
  /** Behind the form. */
  background: string;
  /** The strip behind the keyboard toolbar; match the toolbar so nothing shows through around it. */
  backdrop: string;
  toolbar: {
    background: string;
    /** Prev / Next / Done when they can be pressed. */
    tint: string;
    disabled: string;
    /** Android press ripple. */
    ripple: string;
    /** The button that closes the keyboard. */
    doneLabel: string;
  };
  /** Room between the focused field and whatever sits on top of the keyboard. */
  fieldGap: number;
  /** Padding around the form, and space between its children. */
  padding: number;
  gap: number;
};

export const lightTheme: KeyboardFormTheme = {
  background: '#F5F6FA',
  backdrop: '#FFFFFF',
  toolbar: {
    background: '#FFFFFF',
    tint: '#1F6FFF',
    disabled: '#C4C9D4',
    ripple: '#1F6FFF22',
    doneLabel: 'Done',
  },
  fieldGap: 16,
  padding: 16,
  gap: 16,
};

export const darkTheme: KeyboardFormTheme = {
  background: '#0B0F19',
  backdrop: '#1C1F26',
  toolbar: {
    background: '#1C1F26',
    tint: '#6EA0FF',
    disabled: '#4A5060',
    ripple: '#6EA0FF33',
    doneLabel: 'Done',
  },
  fieldGap: 16,
  padding: 16,
  gap: 16,
};

/** A theme with only some values changed; the rest come from the theme above it. */
export type KeyboardFormThemeOverride = Partial<
  Omit<KeyboardFormTheme, 'toolbar'>
> & {
  toolbar?: Partial<KeyboardFormTheme['toolbar']>;
};

export function mergeTheme(
  base: KeyboardFormTheme,
  override?: KeyboardFormThemeOverride
): KeyboardFormTheme {
  if (!override) return base;
  return {
    ...base,
    ...override,
    toolbar: { ...base.toolbar, ...override.toolbar },
  };
}

const ThemeContext = createContext<KeyboardFormTheme>(lightTheme);

export function KeyboardFormThemeProvider({
  theme,
  children,
}: {
  theme: KeyboardFormTheme;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/** The theme in use here, with this screen's changes (if any) on top. */
export function useKeyboardFormTheme(override?: KeyboardFormThemeOverride) {
  return mergeTheme(useContext(ThemeContext), override);
}
