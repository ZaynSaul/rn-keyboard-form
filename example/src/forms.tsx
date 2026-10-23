import { useRef, useState, type ComponentRef } from 'react';

import {
  Keyboard,
  StyleSheet,
  Switch,
  Text,
  View,
  TextInput,
} from 'react-native';

import { FormScroll, useKeyboardFormTheme } from '@saulzayn/rn-keyboard-form';

import { Button, ERROR, Field, Footer, textColor } from './ui';

/** Ten fields, two of them multiline. */
export function LongForm({
  toolbar = true,
  footer = true,
}: {
  toolbar?: boolean;
  footer?: boolean;
}) {
  return (
    <FormScroll toolbar={toolbar} footer={footer ? <Footer /> : undefined}>
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

/**
 * Opens with the keyboard already coming up (autoFocus), return goes to the next field, and the
 * password field changes the keyboard's height (no suggestion strip). No footer: the button is in
 * the form.
 */
export function SignInForm() {
  const theme = useKeyboardFormTheme();
  const password = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <FormScroll>
      <Text style={[styles.heading, { color: textColor(theme) }]}>
        Welcome back
      </Text>
      <Field
        label="Email"
        autoFocus
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => password.current?.focus()}
      />
      <Field
        ref={password}
        label="Password"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      <Button title="Sign in" onPress={() => Keyboard.dismiss()} />
      <Text style={[styles.link, { color: theme.toolbar.tint }]}>
        Forgot your password?
      </Text>
    </FormScroll>
  );
}

/** Less than a screen of content: little or nothing to scroll. */
export function ShortForm() {
  return (
    <FormScroll footer={<Footer title="Rename" />}>
      <Field label="Name" defaultValue="Morning shift" />
      <Field label="Code" autoCapitalize="characters" />
    </FormScroll>
  );
}

const REQUIRED = ['First name', 'Last name', 'Email', 'Street', 'City'];

/**
 * Fields in cards, two side by side, a switch that adds a field, and errors that appear under a field
 * when it's left empty. The footer grows a banner while there are errors, with the keyboard open.
 */
export function SectionsForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [company, setCompany] = useState(false);
  const errors = REQUIRED.filter((f) => touched[f] && !values[f]?.trim());

  const field = (
    label: string,
    props: Partial<Parameters<typeof Field>[0]> = {}
  ) => (
    <Field
      label={label}
      value={values[label] ?? ''}
      onChangeText={(v) => setValues((s) => ({ ...s, [label]: v }))}
      onBlur={() => setTouched((s) => ({ ...s, [label]: true }))}
      error={errors.includes(label) ? `${label} is required` : undefined}
      {...props}
    />
  );

  return (
    <FormScroll
      footer={
        <Footer title="Continue">
          {errors.length ? (
            <Text style={styles.banner}>
              {errors.length === 1
                ? '1 field needs attention'
                : `${errors.length} fields need attention`}
            </Text>
          ) : null}
        </Footer>
      }
    >
      <Card title="You">
        <View style={styles.pair}>
          <View style={styles.half}>{field('First name')}</View>
          <View style={styles.half}>{field('Last name')}</View>
        </View>
        {field('Email', {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
        })}
        {field('Phone', { keyboardType: 'phone-pad' })}
      </Card>
      <Card title="Address">
        {field('Street')}
        <View style={styles.pair}>
          <View style={styles.third}>
            {field('Postcode', { keyboardType: 'number-pad' })}
          </View>
          <View style={styles.half}>{field('City')}</View>
        </View>
      </Card>
      <Card title="Billing">
        <SwitchRow
          label="Bill a company"
          value={company}
          onChange={setCompany}
        />
        {company ? field('Company name') : null}
        {company ? field('VAT number', { autoCapitalize: 'characters' }) : null}
        {field('Note on the invoice', { multiline: true })}
      </Card>
    </FormScroll>
  );
}

const STORY = Array.from(
  { length: 18 },
  (_, i) => `Line ${i + 1} of a note that is already longer than the screen.`
).join('\n');

/** A multiline field with no height limit, already taller than the room above the keyboard. */
export function GrowingNoteForm() {
  return (
    <FormScroll footer={<Footer />}>
      <Field label="Title" defaultValue="Opening hours change" />
      <Field label="Story" multiline defaultValue={STORY} />
      <Field label="Signed" />
    </FormScroll>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useKeyboardFormTheme();
  return (
    <View style={styles.card}>
      <Text style={[styles.cardTitle, { color: textColor(theme) }]}>
        {title}
      </Text>
      <View style={[styles.cardBody, { backgroundColor: theme.backdrop }]}>
        {children}
      </View>
    </View>
  );
}

function SwitchRow({
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
    <View style={styles.switchRow}>
      <Text style={{ color: textColor(theme), fontSize: 16 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: '800', marginVertical: 24 },
  link: { fontSize: 16, textAlign: 'center' },
  banner: { color: ERROR, fontWeight: '600', textAlign: 'center' },
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  third: { flex: 0.6 },
  card: { gap: 8 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  cardBody: { borderRadius: 14, padding: 14, gap: 14 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
