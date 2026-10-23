import type { ComponentRef, ReactNode, Ref } from 'react';

import {
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

import { fields } from './remote';

export const textColor = (theme: KeyboardFormTheme) =>
  theme.background === darkTheme.background ? '#F5F6FA' : '#11141C';

export const ERROR = '#E5484D';

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
}: {
  title: string;
  onPress: () => void;
}): ReactNode {
  const theme = useKeyboardFormTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.toolbar.tint }]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

/** The bar under a form: anything passed in goes above its button. */
export function Footer({
  title = 'Save',
  children,
}: {
  title?: string;
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
      <Button title={title} onPress={() => undefined} />
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
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
