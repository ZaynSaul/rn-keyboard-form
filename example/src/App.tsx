import { useState, type ReactNode } from 'react';

import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  darkTheme,
  FormScroll,
  KeyboardHost,
  lightTheme,
  SheetScroll,
  useKeyboardFormTheme,
  type KeyboardFormTheme,
} from '@saulzayn/rn-keyboard-form';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type Screen = 'home' | 'form' | 'noToolbar';

export default function App() {
  const [dark, setDark] = useState(false);
  const [french, setFrench] = useState(false);
  const base = dark ? darkTheme : lightTheme;
  const theme: KeyboardFormTheme = {
    ...base,
    toolbar: { ...base.toolbar, doneLabel: french ? 'OK' : 'Done' },
  };

  return (
    <SafeAreaProvider>
      <KeyboardHost theme={theme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Demo
          dark={dark}
          setDark={setDark}
          french={french}
          setFrench={setFrench}
        />
      </KeyboardHost>
    </SafeAreaProvider>
  );
}

function Demo({
  dark,
  setDark,
  french,
  setFrench,
}: {
  dark: boolean;
  setDark: (v: boolean) => void;
  french: boolean;
  setFrench: (v: boolean) => void;
}) {
  const theme = useKeyboardFormTheme();
  const text = textColor(theme);
  const [screen, setScreen] = useState<Screen>('home');
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);

  if (screen !== 'home') {
    return (
      <SafeAreaView
        edges={['top']}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <Header
          title={screen === 'form' ? 'Long form' : 'No toolbar'}
          onBack={() => setScreen('home')}
        />
        <LongForm toolbar={screen === 'form'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={[styles.title, { color: text }]}>rn-keyboard-form</Text>
        <Row label="Dark theme" value={dark} onChange={setDark} />
        <Row
          label="French Done label (OK)"
          value={french}
          onChange={setFrench}
        />
        <Item
          title="Long form with a Save footer"
          onPress={() => setScreen('form')}
        />
        <Item
          title="Long form without the toolbar"
          onPress={() => setScreen('noToolbar')}
        />
        <Item
          title="Form in a modal sheet (iOS page sheet)"
          onPress={() => setModal(true)}
        />
        <Item
          title="Bottom sheet with several fields"
          onPress={() => setSheet(true)}
        />
      </View>

      <Modal
        visible={modal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <Header title="Modal form" onBack={() => setModal(false)} />
          <LongForm toolbar />
        </View>
      </Modal>

      <Modal
        visible={sheet}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setSheet(false)} />
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.sheetHost}
          pointerEvents="box-none"
        >
          <SafeAreaView
            edges={['bottom']}
            style={[styles.sheet, { backgroundColor: theme.backdrop }]}
          >
            <Text style={[styles.sheetTitle, { color: text }]}>
              Reply to a review
            </Text>
            <SheetScroll contentContainerStyle={{ gap: 12, padding: 16 }}>
              <Field label="Name" />
              <Field label="Phone" keyboardType="phone-pad" />
              <Field
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field label="Reply" multiline />
              <Field label="Note" />
              <Button title="Send" onPress={() => setSheet(false)} />
            </SheetScroll>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function LongForm({ toolbar }: { toolbar: boolean }) {
  const theme = useKeyboardFormTheme();
  return (
    <FormScroll
      toolbar={toolbar}
      footer={
        <SafeAreaView
          edges={['bottom']}
          style={{
            padding: 16,
            backgroundColor: theme.backdrop,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: theme.toolbar.disabled,
          }}
        >
          <Button title="Save" onPress={() => undefined} />
        </SafeAreaView>
      }
    >
      <Field label="Service name" />
      <Field label="Price" keyboardType="numeric" />
      <Field label="Duration (minutes)" keyboardType="number-pad" />
      <Field label="Description" multiline />
      <Field label="Buffer before" keyboardType="number-pad" />
      <Field label="Buffer after" keyboardType="number-pad" />
      <Field label="Deposit %" keyboardType="number-pad" />
      <Field label="Notes for staff" multiline />
      <Field label="Internal code" />
      <Field label="Last field" />
    </FormScroll>
  );
}

function Field({ label, ...input }: { label: string } & TextInputProps) {
  const theme = useKeyboardFormTheme();
  const text = textColor(theme);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: text, fontWeight: '600' }}>{label}</Text>
      <TextInput
        placeholder={label}
        placeholderTextColor={theme.toolbar.disabled}
        style={[
          styles.input,
          {
            color: text,
            backgroundColor: theme.backdrop,
            borderColor: theme.toolbar.disabled,
          },
          input.multiline && { minHeight: 96, textAlignVertical: 'top' },
        ]}
        {...input}
      />
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const theme = useKeyboardFormTheme();
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12}>
        <Text style={{ color: theme.toolbar.tint, fontSize: 16 }}>‹ Back</Text>
      </Pressable>
      <Text style={[styles.headerTitle, { color: textColor(theme) }]}>
        {title}
      </Text>
      <View style={{ width: 56 }} />
    </View>
  );
}

function Item({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = useKeyboardFormTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, { backgroundColor: theme.backdrop }]}
    >
      <Text style={{ color: textColor(theme), fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useKeyboardFormTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: textColor(theme), fontSize: 16 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function Button({
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

const textColor = (theme: KeyboardFormTheme) =>
  theme.background === darkTheme.background ? '#F5F6FA' : '#11141C';

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  item: { padding: 16, borderRadius: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#00000066' },
  sheetHost: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 0,
  },
});
