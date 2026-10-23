import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';

import {
  StyleSheet,
  TextInput,
  Dimensions,
  findNodeHandle,
  Platform,
  useWindowDimensions,
  View,
  type ScrollViewProps,
} from 'react-native';

import {
  KEYBOARD_HAS_ROUNDED_CORNERS,
  KeyboardAwareScrollView,
  KeyboardControllerNative,
  KeyboardEvents,
  KeyboardToolbar,
  useReanimatedKeyboardAnimation,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useKeyboardFormTheme, type KeyboardFormThemeOverride } from './theme';

// The toolbar's own height, and how far it lifts off a keyboard with rounded corners (iOS 26): the
// same on every device, keyboard-controller 1.22's KEYBOARD_TOOLBAR_HEIGHT and OPENED_OFFSET (not
// exported). Check again when it changes.
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
  /**
   * Below this window height the footer stays behind the keyboard instead of riding on it, so the
   * field being typed in has room (a phone on its side). 500 by default; 0 to always ride.
   */
  hideFooterBelow?: number;
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
  hideFooterBelow = 500,
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
  const { height: windowH } = useWindowDimensions();
  const footerRides = !!footer && windowH >= hideFooterBelow;
  const { height, progress } = useReanimatedKeyboardAnimation();
  // How far the keyboard reaches up into this screen. The whole keyboard on a full-screen form, but
  // less when the form ends above the screen's bottom edge: an iPad form sheet (which iOS lifts part
  // of the way), a Stage Manager window. Android already reports only the part over the app's window,
  // and this comes out the same. The form's bottom edge is measured in window coordinates (inside a
  // modal, measure() and measureInWindow() on iOS are relative to the modal; keyboard-controller's
  // native viewPositionInWindow isn't, and the difference is kept in `shift` for revealFocused).
  const areaBottom = useSharedValue(-1);
  const shift = useRef(0);
  const measureArea = useRef(() => {});
  measureArea.current = () => {
    const screen = screenRef.current;
    screen?.measureInWindow((_x, y, _w, h) => {
      const tag = Platform.OS === 'ios' ? findNodeHandle(screen) : null;
      if (tag == null) {
        areaBottom.value = withTiming(y + h, { duration: 120 });
        return;
      }
      KeyboardControllerNative.viewPositionInWindow(tag).then(
        (frame) => {
          const top = (frame as { y: number }).y;
          shift.current = top - y;
          areaBottom.value = withTiming(top + h, { duration: 120 });
        },
        () => undefined
      );
    });
  };
  const overlap = useDerivedValue(() => {
    const keyboard = -height.value;
    if (keyboard <= 0) return 0;
    if (areaBottom.value < 0) return keyboard;
    return Math.min(
      keyboard,
      Math.max(0, areaBottom.value - (windowH - keyboard))
    );
  });
  // Where a piece riding on the keyboard sits: `closed` and `opened` offsets as in KeyboardStickyView,
  // but moved by the part of the keyboard over this screen. (The shared values are read in each style
  // itself, so those styles update with them.)
  const ride = (
    keyboard: number,
    shown: number,
    closed: number,
    opened: number
  ) => {
    'worklet';
    return [
      {
        translateY: -keyboard + interpolate(shown, [0, 1], [closed, opened]),
      },
    ];
  };
  // A footer left behind the keyboard stays put and fades out: iOS keyboards let what's under them
  // show through.
  const footerStyle = useAnimatedStyle(() =>
    footerRides
      ? {
          transform: ride(overlap.value, progress.value, 0, bottomInset - bar),
          opacity: 1,
        }
      : { transform: [{ translateY: 0 }], opacity: 1 - progress.value }
  );
  const live = bar + (footerRides ? Math.max(0, footerH - bottomInset) : 0);
  const covered = useSettled(live);
  const screenRef = useRef<ComponentRef<typeof View>>(null);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const offset = useRef(0);
  const contentH = useRef(0);
  // The keyboard's height from its own events: KeyboardController.state() can be left at an old
  // value after the screen turns.
  const keyboardH = useRef(0);
  const liveRef = useRef(live);
  liveRef.current = live;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The scroll view brings the field into view where it was when it got focus, and again when the
  // field itself grows. Not when something above it changes size (an error under the field just
  // left), and not reliably after the screen turns (Android hides and shows the keyboard on the way,
  // and the field's old position is used). Once its own scroll is done, this checks the field again,
  // measured in its own window, and scrolls the rest of the way, up or down.
  const revealFocused = useRef(() => {});
  revealFocused.current = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput();
      if (!input || !keyboardH.current) return;
      screenRef.current?.measureInWindow((_sx, screenY) => {
        input.measureInWindow((_x, inputY, _w, h) => {
          const screenTop = screenY + shift.current;
          const y = inputY + shift.current;
          const top = screenTop + theme.padding;
          const limit =
            Dimensions.get('window').height -
            keyboardH.current -
            liveRef.current -
            theme.fieldGap;
          const below = y + h - limit;
          // Scrolled past the end of the form: empty space between its end and the keyboard.
          const past =
            limit +
            theme.fieldGap -
            (screenTop + contentH.current - offset.current);
          const by =
            below > 1
              ? // Down only as far as the field's top: a tall multiline field keeps its top in view.
                Math.min(below, y - top)
              : y < top
                ? y - top
                : // Back up over the empty space, but not so far that the field goes under.
                  -Math.max(0, Math.min(past, offset.current, -below));
          if (Math.abs(by) > 1) {
            scrollRef.current?.scrollTo({
              y: Math.max(0, offset.current + by),
              animated: true,
            });
          }
        });
      });
    }, 250);
  };
  useEffect(() => {
    const subs = [
      KeyboardEvents.addListener('keyboardWillShow', () =>
        measureArea.current()
      ),
      KeyboardEvents.addListener('keyboardDidShow', (e) => {
        keyboardH.current = e.height;
        // Where iOS has lifted a form sheet to.
        measureArea.current();
        revealFocused.current();
      }),
      KeyboardEvents.addListener('keyboardDidHide', () => {
        keyboardH.current = 0;
        measureArea.current();
      }),
    ];
    return () => {
      subs.forEach((sub) => sub.remove());
      clearTimeout(timer.current);
    };
  }, []);
  const backdropH = bar + CORNER_UNDERLAP;
  const backdropStyle = useAnimatedStyle(() => ({
    transform: ride(overlap.value, progress.value, backdropH, CORNER_UNDERLAP),
  }));
  // Below the screen while the keyboard is closed, on it (lifted off a rounded one) while it's open.
  const toolbarStyle = useAnimatedStyle(() => ({
    transform: ride(overlap.value, progress.value, TOOLBAR_H, -TOOLBAR_LIFT),
  }));
  // The app picks light or dark through the theme it passes, so both of the toolbar's own are the same.
  const toolbarColors = {
    primary: theme.toolbar.tint,
    disabled: theme.toolbar.disabled,
    background: theme.toolbar.background,
    ripple: theme.toolbar.ripple,
  };

  return (
    <View
      ref={screenRef}
      onLayout={() => measureArea.current()}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <KeyboardAwareScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
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
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          scroll.onScroll?.(e);
        }}
        onContentSizeChange={(w, h) => {
          contentH.current = h;
          revealFocused.current();
          scroll.onContentSizeChange?.(w, h);
        }}
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
        <Animated.View
          style={footerStyle}
          onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
        >
          {footer}
        </Animated.View>
      ) : null}
      {toolbar ? (
        <>
          {/* A solid strip behind the toolbar, down under the keyboard's rounded corners, so the
              form doesn't show through around it. */}
          <Animated.View
            style={[
              styles.backdrop,
              { height: backdropH, backgroundColor: theme.backdrop },
              backdropStyle,
            ]}
          />
          {/* Moved by this screen (its own movement is off), so it sits on the part of the
              keyboard that covers the screen. */}
          <Animated.View
            pointerEvents="box-none"
            style={[styles.toolbar, toolbarStyle]}
          >
            <KeyboardToolbar
              enabled={false}
              offset={{ closed: -TOOLBAR_H }}
              theme={{ light: toolbarColors, dark: toolbarColors }}
              // Keeps the arrows and Done clear of the notch in landscape.
              insets={{ left: insets.left, right: insets.right }}
            >
              <KeyboardToolbar.Prev />
              <KeyboardToolbar.Next />
              <KeyboardToolbar.Done text={theme.toolbar.doneLabel} />
            </KeyboardToolbar>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

/**
 * `value`, but held still while the keyboard opens or closes. On the way, the footer's height can
 * change for no real reason (inside an Android Modal its safe-area padding goes as it rides up), and
 * a new `bottomOffset` makes the scroll view scroll again. Changes once the keyboard is up (an error
 * banner in the footer) are taken up; so is everything once it has closed.
 *
 * The scroll view's re-sync on a new `bottomOffset` reads a stale field position inside an Android
 * Modal (keyboard-controller 1.22), so there a footer that grows while typing still over-scrolls.
 */
function useSettled(value: number) {
  const [settled, setSettled] = useState(value);
  const latest = useRef(value);
  const moving = useRef(false);
  latest.current = value;

  useEffect(() => {
    if (!moving.current) setSettled(value);
  }, [value]);

  useEffect(() => {
    const start = () => {
      moving.current = true;
    };
    const subs = [
      KeyboardEvents.addListener('keyboardWillShow', start),
      KeyboardEvents.addListener('keyboardWillHide', start),
      // What changed while it opened is left out: taking it up now would scroll the field again.
      KeyboardEvents.addListener('keyboardDidShow', () => {
        moving.current = false;
      }),
      KeyboardEvents.addListener('keyboardDidHide', () => {
        moving.current = false;
        setSettled(latest.current);
      }),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, []);

  return settled;
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
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TOOLBAR_H,
  },
});
