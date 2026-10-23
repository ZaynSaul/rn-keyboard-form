import { useState, type ReactNode } from 'react';

import { StyleSheet, View, type ScrollViewProps } from 'react-native';

import {
  KEYBOARD_HAS_ROUNDED_CORNERS,
  KeyboardAwareScrollView,
  KeyboardStickyView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useKeyboardFormTheme, type KeyboardFormThemeOverride } from './theme';

// The toolbar's own height, and how far it lifts off a keyboard with rounded corners (iOS 26).
// Measured with react-native-keyboard-controller 1.22; check again when it changes.
const TOOLBAR_H = 42;
const TOOLBAR_LIFT = KEYBOARD_HAS_ROUNDED_CORNERS ? 11 : 0;
// The strip behind the toolbar reaches this far under the keyboard's top edge (its rounded corners).
const CORNER_UNDERLAP = 30;

export type FormScrollProps = Omit<ScrollViewProps, 'children'> & {
  children: ReactNode;
  /**
   * Stays at the bottom, and rides on top of the keyboard while it's open (e.g. a Save button).
   * It brings its own look and its bottom safe-area padding; that padding tucks under the keyboard.
   */
  footer?: ReactNode;
  /** The bar on the keyboard with previous / next field and Done. On by default. */
  toolbar?: boolean;
  /** This screen's changes to the theme from `KeyboardHost`. */
  theme?: KeyboardFormThemeOverride;
};

/**
 * A screen of fields: the focused field always scrolls above the keyboard (and above the toolbar and
 * footer), a bar on the keyboard moves to the previous / next field or closes it, and the footer rides
 * on top of it.
 */
export function FormScroll({
  children,
  footer,
  toolbar = true,
  theme: override,
  contentContainerStyle,
  ...scroll
}: FormScrollProps) {
  const theme = useKeyboardFormTheme(override);
  const insets = useSafeAreaInsets();
  // The home-bar padding this screen really has: none inside an iOS modal sheet, unlike what the
  // app-wide insets say. Measured by an empty safe-area view laid out like the footer's.
  const [bottomInset, setBottomInset] = useState(insets.bottom);
  const [footerH, setFooterH] = useState(0);
  const bar = toolbar ? TOOLBAR_H + TOOLBAR_LIFT : 0;
  // What covers the screen just above the keyboard: the toolbar, and the footer without its home-bar padding.
  const covered = bar + (footer ? Math.max(0, footerH - bottomInset) : 0);
  const backdropH = bar + CORNER_UNDERLAP;
  // The app picks light or dark through the theme it passes, so both of the toolbar's own are the same.
  const toolbarColors = {
    primary: theme.toolbar.tint,
    disabled: theme.toolbar.disabled,
    background: theme.toolbar.background,
    ripple: theme.toolbar.ripple,
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={covered + theme.fieldGap}
        extraKeyboardSpace={covered}
        contentContainerStyle={[
          {
            padding: theme.padding,
            gap: theme.gap,
            paddingBottom: theme.padding * 3,
          },
          contentContainerStyle,
        ]}
        {...scroll}
      >
        {children}
      </KeyboardAwareScrollView>
      <SafeAreaView
        edges={['bottom']}
        pointerEvents="none"
        style={styles.insetProbe}
        onLayout={(e) => setBottomInset(e.nativeEvent.layout.height)}
      />
      {footer ? (
        <KeyboardStickyView offset={{ closed: 0, opened: bottomInset - bar }}>
          <View onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}>
            {footer}
          </View>
        </KeyboardStickyView>
      ) : null}
      {toolbar ? (
        <>
          {/* A solid strip behind the toolbar, down under the keyboard's rounded corners, so the
              form doesn't show through around it. */}
          <KeyboardStickyView
            offset={{ closed: backdropH, opened: CORNER_UNDERLAP }}
            style={[
              styles.backdrop,
              { height: backdropH, backgroundColor: theme.backdrop },
            ]}
          />
          <KeyboardToolbar
            theme={{ light: toolbarColors, dark: toolbarColors }}
          >
            <KeyboardToolbar.Prev />
            <KeyboardToolbar.Next />
            <KeyboardToolbar.Done text={theme.toolbar.doneLabel} />
          </KeyboardToolbar>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  insetProbe: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    opacity: 0,
  },
  backdrop: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
