import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';

import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewProps,
} from 'react-native';

import {
  FocusedInputEvents,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardFormTheme, type KeyboardFormThemeOverride } from './theme';

// keyboard-controller 1.22's KEYBOARD_TOOLBAR_HEIGHT, as in FormScroll.
const TOOLBAR_H = 42;
// The bar's background reaches this far down, under the keyboard's rounded corners (iOS 26+), so what
// scrolls behind the bar doesn't show around them.
const CORNER_UNDERLAP = 30;

export type SheetScrollProps = Omit<ScrollViewProps, 'children'> & {
  children: ReactNode;
  /**
   * Stays under the fields, always in sight (e.g. a Send button): on the keyboard while it's open,
   * instead of scrolling away under it. It brings its own padding.
   */
  footer?: ReactNode;
  /**
   * The bar with previous / next field and Done, at the bottom of the sheet (on the keyboard) while it's
   * open. On by default.
   */
  toolbar?: boolean;
  /** This sheet's changes to the theme from `KeyboardHost`. */
  theme?: KeyboardFormThemeOverride;
};

/**
 * The scrolling body of a bottom sheet with fields. Your sheet sits on the keyboard and shrinks to the
 * room above it; once it has, this scrolls the focused field into view if it ended up out of sight.
 * While the keyboard is open, a bar under it moves between fields or closes the keyboard.
 */
export function SheetScroll({
  children,
  footer,
  toolbar = true,
  theme: override,
  onLayout,
  onScroll,
  style,
  ...scroll
}: SheetScrollProps) {
  const theme = useKeyboardFormTheme(override);
  const { fieldGap } = theme;
  const insets = useSafeAreaInsets();
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const view = useRef({ height: 0, y: 0 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput();
        const content = ref.current?.getInnerViewRef();
        if (!input || !content) return;
        input.measureLayout(
          content,
          (_x, y, _w, h) => {
            const { height, y: top } = view.current;
            if (y + h + fieldGap > top + height) {
              ref.current?.scrollTo({
                y: y + h + fieldGap - height,
                animated: true,
              });
            } else if (y - fieldGap < top) {
              ref.current?.scrollTo({
                y: Math.max(0, y - fieldGap),
                animated: true,
              });
            }
          },
          () => undefined
        );
      }, delay);
    };
    const subs = [
      Keyboard.addListener('keyboardWillShow', () => setOpen(true)),
      Keyboard.addListener('keyboardDidShow', () => {
        setOpen(true);
        // Wait for the sheet to finish fitting itself above the keyboard.
        reveal(300);
      }),
      Keyboard.addListener('keyboardDidHide', () => setOpen(false)),
      // Moving to another field with the keyboard already up (the bar's arrows, return key).
      FocusedInputEvents.addListener('focusDidSet', () => reveal(100)),
    ];
    return () => {
      subs.forEach((sub) => sub.remove());
      if (timer) clearTimeout(timer);
    };
  }, [fieldGap]);

  // The app picks light or dark through the theme it passes, so both of the toolbar's own are the same.
  const toolbarColors = {
    primary: theme.toolbar.tint,
    disabled: theme.toolbar.disabled,
    background: theme.toolbar.background,
    ripple: theme.toolbar.ripple,
  };

  return (
    <>
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={32}
        style={[styles.scroll, style]}
        onLayout={(e) => {
          view.current.height = e.nativeEvent.layout.height;
          onLayout?.(e);
        }}
        onScroll={(e) => {
          view.current.y = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
        {...scroll}
      >
        {children}
      </ScrollView>
      {footer}
      {toolbar && open ? (
        // In the sheet's own layout, at its bottom: the sheet sits on the keyboard, so this does too.
        <View style={styles.bar}>
          <View
            style={[
              styles.underlap,
              { backgroundColor: theme.toolbar.background },
            ]}
          />
          <KeyboardToolbar
            enabled={false}
            offset={{ closed: -TOOLBAR_H }}
            theme={{ light: toolbarColors, dark: toolbarColors }}
            insets={{ left: insets.left, right: insets.right }}
          >
            <KeyboardToolbar.Prev />
            <KeyboardToolbar.Next />
            <KeyboardToolbar.Done text={theme.toolbar.doneLabel} />
          </KeyboardToolbar>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  bar: { height: TOOLBAR_H },
  underlap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: -CORNER_UNDERLAP,
  },
});
