import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';

import {
  Keyboard,
  ScrollView,
  TextInput,
  type ScrollViewProps,
} from 'react-native';

import { useKeyboardFormTheme } from './theme';

export type SheetScrollProps = Omit<ScrollViewProps, 'children'> & {
  children: ReactNode;
};

/**
 * The scrolling body of a bottom sheet with fields. Your sheet sits on the keyboard and shrinks to the
 * room above it; once it has, this scrolls the focused field into view if it ended up out of sight.
 */
export function SheetScroll({
  children,
  onLayout,
  onScroll,
  ...scroll
}: SheetScrollProps) {
  const { fieldGap } = useKeyboardFormTheme();
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const view = useRef({ height: 0, y: 0 });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      // Wait for the sheet to finish fitting itself above the keyboard.
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
      }, 300);
    });
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [fieldGap]);

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={32}
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
  );
}
