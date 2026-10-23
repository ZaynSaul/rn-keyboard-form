import { useEffect, useState, type ReactNode } from 'react';

import {
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  darkTheme,
  KeyboardHost,
  lightTheme,
  SheetScroll,
  useKeyboardFormTheme,
  type KeyboardFormTheme,
} from '@saulzayn/rn-keyboard-form';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  KeyboardController,
} from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  GrowingNoteForm,
  LongForm,
  SectionsForm,
  ShortForm,
  SignInForm,
} from './forms';
import { fields, useRemote } from './remote';
import { Button, Field, textColor } from './ui';

const SCREENS: Record<string, { title: string; render: () => ReactNode }> = {
  form: { title: 'Long form', render: () => <LongForm /> },
  noToolbar: {
    title: 'No toolbar',
    render: () => <LongForm toolbar={false} />,
  },
  noFooter: { title: 'No footer', render: () => <LongForm footer={false} /> },
  signIn: { title: 'Sign in', render: () => <SignInForm /> },
  short: { title: 'Short form', render: () => <ShortForm /> },
  sections: { title: 'Sections', render: () => <SectionsForm /> },
  note: { title: 'Growing note', render: () => <GrowingNoteForm /> },
};

const ITEMS: [keyof typeof SCREENS, string][] = [
  ['form', 'Long form with a Save footer'],
  ['noToolbar', 'Long form without the toolbar'],
  ['noFooter', 'Long form without a footer'],
  ['signIn', 'Sign in (autofocus, password, return key)'],
  ['short', 'Short form with a footer'],
  ['sections', 'Sections, validation, growing footer'],
  ['note', 'Note taller than the screen'],
];

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
  const [screen, setScreen] = useState<keyof typeof SCREENS | null>(null);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);

  // Dev only: driven from the Mac on a real iPhone (see remote.ts).
  useRemote((c) => {
    switch (c.do) {
      case 'screen':
        setModal(false);
        setSheet(false);
        setScreen(c.arg && c.arg in SCREENS ? c.arg : null);
        break;
      case 'modal':
        setModal(c.arg !== 'off');
        break;
      case 'sheet':
        setSheet(c.arg !== 'off');
        break;
      case 'dark':
        setDark(c.arg !== 'off');
        break;
      case 'ok':
        setFrench(c.arg !== 'off');
        break;
      case 'focus':
        fields.get(c.arg ?? '')?.focus();
        break;
      case 'type':
        fields.get(c.arg?.split('=')[0] ?? '')?.setNativeProps({
          text: c.arg?.split('=').slice(1).join('='),
        });
        break;
      case 'next':
        KeyboardController.setFocusTo('next');
        break;
      case 'prev':
        KeyboardController.setFocusTo('prev');
        break;
      case 'dismiss':
        KeyboardController.dismiss();
        break;
    }
  });

  // Android's back button goes back to this list instead of leaving the app.
  useEffect(() => {
    if (!screen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setScreen(null);
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  if (screen) {
    const { title, render } = SCREENS[screen]!;
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <Header title={title} onBack={() => setScreen(null)} />
        {render()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={[styles.title, { color: text }]}>rn-keyboard-form</Text>
        <Row label="Dark theme" value={dark} onChange={setDark} />
        <Row
          label="French Done label (OK)"
          value={french}
          onChange={setFrench}
        />
        {ITEMS.map(([key, title]) => (
          <Item key={key} title={title} onPress={() => setScreen(key)} />
        ))}
        <Item
          title="Form in a modal sheet (iOS page sheet)"
          onPress={() => setModal(true)}
        />
        <Item
          title="Bottom sheet with several fields"
          onPress={() => setSheet(true)}
        />
      </ScrollView>

      <Modal
        visible={modal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModal(false)}
      >
        {/* Android draws the modal under the status bar; an iOS page sheet has no top inset. */}
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={{ flex: 1, backgroundColor: theme.background }}
        >
          <Header title="Modal form" onBack={() => setModal(false)} />
          <LongForm />
        </SafeAreaView>
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
            edges={['bottom', 'left', 'right']}
            style={[styles.sheet, { backgroundColor: theme.backdrop }]}
          >
            <Text style={[styles.sheetTitle, { color: text }]}>
              Reply to a review
            </Text>
            <SheetScroll
              contentContainerStyle={{ gap: 12, padding: 16 }}
              footer={
                <View style={styles.sheetFooter}>
                  <Button title="Send" onPress={() => setSheet(false)} />
                </View>
              }
            >
              <Field label="Name" />
              <Field label="Phone" keyboardType="phone-pad" />
              <Field
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field label="Reply" multiline />
              <Field label="Note" />
            </SheetScroll>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#00000066' },
  sheetHost: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetFooter: { paddingHorizontal: 16, paddingVertical: 12 },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 0,
  },
});
