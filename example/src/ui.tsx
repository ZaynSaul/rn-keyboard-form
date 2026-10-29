import type { ComponentRef, ReactNode, Ref, RefObject } from 'react';

import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  darkTheme,
  useKeyboardFormTheme,
  type KeyboardFormTheme,
} from '@saulzayn/rn-keyboard-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buttons, changers, fields } from './remote';

export const textColor = (theme: KeyboardFormTheme) =>
  theme.background === darkTheme.background ? '#F5F6FA' : '#11141C';

export const ERROR = '#E5484D';

/**
 * Call just before showing the next step: focuses its first field once it's there, keeping the
 * keyboard in use. On Android, removing the focused field closes the keyboard, and a field focused
 * while it's closing can be left without one (always in a Modal), so there this waits until it has
 * closed and opens it again for the new field.
 */
export function focusNextStep(
  ref: RefObject<ComponentRef<typeof TextInput> | null>
) {
  if (Platform.OS !== 'android' || !Keyboard.isVisible()) {
    setTimeout(() => ref.current?.focus(), 50);
    return;
  }
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    sub.remove();
    clearTimeout(fallback);
    // A moment later, so the ref points at the new step's field even when the keyboard closed
    // before it was mounted.
    setTimeout(() => {
      const input = ref.current;
      // Android may already have given that field focus by itself, without a keyboard; focus()
      // would then do nothing.
      if (input?.isFocused()) {
        input.blur();
        setTimeout(() => input.focus(), 50);
      } else input?.focus();
    }, 50);
  };
  const sub = Keyboard.addListener('keyboardDidHide', run);
  // In case it stays up after all.
  const fallback = setTimeout(run, 500);
}

export function Field({
  label,
  error,
  ref,
  ...input
}: {
  label: string;
  error?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
} & TextInputProps) {
  const theme = useKeyboardFormTheme();
  const text = textColor(theme);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
      <TextInput
        ref={(node) => {
          // Known to the remote control by its label (dev only).
          if (node) fields.set(label, node);
          else fields.delete(label);
          if (node && input.onChangeText)
            changers.set(label, input.onChangeText);
          else if (!node) changers.delete(label);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        placeholder={label}
        placeholderTextColor={theme.toolbar.disabled}
        {...input}
        style={[
          styles.input,
          {
            color: text,
            backgroundColor: theme.backdrop,
            borderColor: error ? ERROR : theme.toolbar.disabled,
          },
          input.multiline && styles.multiline,
          input.style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  secondary,
}: {
  title: string;
  onPress: () => void;
  /** Outlined instead of filled. */
  secondary?: boolean;
}): ReactNode {
  const theme = useKeyboardFormTheme();
  // Known to the remote control by its title (dev only).
  buttons.set(title, onPress);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        secondary
          ? { borderWidth: 1.5, borderColor: theme.toolbar.tint }
          : { backgroundColor: theme.toolbar.tint },
      ]}
    >
      <Text
        style={[styles.buttonText, secondary && { color: theme.toolbar.tint }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/** The bar under a form: anything passed in goes above its button(s). */
export function Footer({
  title = 'Save',
  onPress = () => undefined,
  back,
  children,
}: {
  title?: string;
  onPress?: () => void;
  /** Shows a Back button next to the main one. */
  back?: () => void;
  children?: ReactNode;
}) {
  const theme = useKeyboardFormTheme();
  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[
        styles.footer,
        {
          backgroundColor: theme.backdrop,
          borderColor: theme.toolbar.disabled,
        },
      ]}
    >
      {children}
      {back ? (
        <View style={styles.buttons}>
          <View style={styles.button1}>
            <Button title="Back" onPress={back} secondary />
          </View>
          <View style={styles.button1}>
            <Button title={title} onPress={onPress} />
          </View>
        </View>
      ) : (
        <Button title={title} onPress={onPress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  error: { color: ERROR, fontSize: 13 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 12 },
  button1: { flex: 1 },
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
