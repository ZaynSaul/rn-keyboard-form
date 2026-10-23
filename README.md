# @saulzayn/rn-keyboard-form

Keyboard-aware forms for React Native and Expo, built on
[react-native-keyboard-controller](https://github.com/kirillzyusko/react-native-keyboard-controller).

- The focused field always scrolls above the keyboard, and above whatever sits on it.
- A **footer** (e.g. a Save button) stays at the bottom and rides on top of the keyboard while it's open.
- A **toolbar** on the keyboard moves to the previous / next field or closes it.
- Works inside **iOS modal sheets** (no home-bar padding there) and with the **rounded keyboard of iOS 26**.
- **Bottom sheets** with several fields scroll the focused one into view.
- Themeable: light, dark, or your own colours, spacing and labels.

## Install

```sh
npm install @saulzayn/rn-keyboard-form react-native-keyboard-controller react-native-reanimated react-native-safe-area-context
# or
yarn add @saulzayn/rn-keyboard-form react-native-keyboard-controller react-native-reanimated react-native-safe-area-context
```

With Expo, use `npx expo install` for the last three so they match your SDK.
`react-native-keyboard-controller` is a native module, so Expo Go won't do: use a
[development build](https://docs.expo.dev/develop/development-builds/introduction/).

Tested with react-native-keyboard-controller 1.22, React Native 0.88 and Expo SDK 58.

## Use

Wrap the app once, inside your `SafeAreaProvider`:

```tsx
import { KeyboardHost } from '@saulzayn/rn-keyboard-form';

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardHost>{/* your navigation */}</KeyboardHost>
    </SafeAreaProvider>
  );
}
```

A screen of fields with a Save button:

```tsx
import { FormScroll } from '@saulzayn/rn-keyboard-form';
import { SafeAreaView } from 'react-native-safe-area-context';

function EditService() {
  return (
    <FormScroll
      footer={
        // The footer brings its own look and bottom safe-area padding.
        <SafeAreaView edges={['bottom']} style={{ padding: 16, backgroundColor: 'white' }}>
          <Button title="Save" onPress={save} />
        </SafeAreaView>
      }
    >
      <TextInput placeholder="Name" />
      <TextInput placeholder="Price" keyboardType="numeric" />
      <TextInput placeholder="Description" multiline />
    </FormScroll>
  );
}
```

The scrolling body of a bottom sheet with fields. Your sheet moves itself above the keyboard
(e.g. with `KeyboardAvoidingView`); once it has, this scrolls the focused field into view:

```tsx
import { SheetScroll } from '@saulzayn/rn-keyboard-form';

<SheetScroll contentContainerStyle={{ padding: 16, gap: 12 }}>
  <TextInput placeholder="Name" />
  <TextInput placeholder="Reply" multiline />
</SheetScroll>;
```

## Props

### `FormScroll`

All `ScrollView` props, plus:

| Prop | Type | Default | |
|---|---|---|---|
| `footer` | `ReactNode` | — | Stays at the bottom and rides on the keyboard. |
| `toolbar` | `boolean` | `true` | The previous / next / Done bar on the keyboard. |
| `theme` | `KeyboardFormThemeOverride` | — | This screen's changes to the theme. |

### `SheetScroll`

All `ScrollView` props.

### `KeyboardHost`

| Prop | Type | |
|---|---|---|
| `theme` | `KeyboardFormTheme \| KeyboardFormThemeOverride` | A full theme, or only the values to change from `lightTheme`. |

## Theming

```tsx
import { useColorScheme } from 'react-native';
import { KeyboardHost, darkTheme, lightTheme, mergeTheme } from '@saulzayn/rn-keyboard-form';

const brand = { toolbar: { tint: '#E5484D', doneLabel: 'OK' }, fieldGap: 24 };

function Root({ children }) {
  const base = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return <KeyboardHost theme={mergeTheme(base, brand)}>{children}</KeyboardHost>;
}
```

| Key | |
|---|---|
| `background` | Behind the form. |
| `backdrop` | The strip behind the toolbar; match the toolbar so nothing shows through around it. |
| `toolbar.background`, `toolbar.tint`, `toolbar.disabled`, `toolbar.ripple` | Toolbar colours (`ripple`: Android press). |
| `toolbar.doneLabel` | The button that closes the keyboard, e.g. `'OK'` in French. |
| `fieldGap` | Room between the focused field and what's on the keyboard. |
| `padding`, `gap` | Around the form, and between its children. |

`useKeyboardFormTheme()` returns the theme in use, for your own fields and buttons.

## Example app

```sh
yarn
yarn example android   # or: yarn example ios
```

It has a long form with a footer, the same without the toolbar, a form in an iOS page sheet,
and a bottom sheet with several fields, with light / dark and label switches.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
