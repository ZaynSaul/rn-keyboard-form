# @saulzayn/rn-keyboard-form

[![npm version](https://img.shields.io/npm/v/@saulzayn/rn-keyboard-form.svg)](https://www.npmjs.com/package/@saulzayn/rn-keyboard-form)
[![npm downloads](https://img.shields.io/npm/dw/@saulzayn/rn-keyboard-form.svg)](https://www.npmjs.com/package/@saulzayn/rn-keyboard-form)
[![license](https://img.shields.io/npm/l/@saulzayn/rn-keyboard-form.svg)](LICENSE)

Keyboard-aware forms for React Native and Expo, built on
[react-native-keyboard-controller](https://github.com/kirillzyusko/react-native-keyboard-controller).

<p align="center">
  <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/demo.gif" width="280" alt="The same long form without the package (the keyboard hides the field and Save) and with it (the field and Save stay above the keyboard)">
</p>

- The focused field always scrolls above the keyboard, and above whatever sits on it.
- A **footer** (e.g. a Save button) stays at the bottom and rides on top of the keyboard while it's open.
- A **toolbar** on the keyboard moves to the previous / next field or closes it.
- Works inside **iOS modal sheets**, including **iPad form and page sheets**, and with the **rounded
  keyboard of iOS 26+**.
- Phones and **tablets**, **portrait and landscape**, and turning the device with the keyboard open.
- **Bottom sheets** with several fields: the focused one scrolls into view, the same bar sits on the
  keyboard, and a footer (e.g. Send) stays in sight.
- Themeable: light, dark, or your own colours, spacing and labels.

| iPhone, long form | iPhone (iOS 27), bottom sheet | Android, long form |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/iphone-form.png" width="200" alt="Long form on iPhone: the focused field above the keyboard, Save and the toolbar on it"> | <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/iphone-bottom-sheet.png" width="200" alt="Bottom sheet on iPhone with the rounded keyboard: Send and the toolbar stay in sight"> | <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/android-form.png" width="200" alt="Long form on Android with Save and the toolbar on the keyboard"> |

| iPad, page sheet | Android tablet, bottom sheet |
|:---:|:---:|
| <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/ipad-sheet.png" width="300" alt="Form in an iPad page sheet with Save and the toolbar on the keyboard"> | <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/android-tablet-sheet.png" width="300" alt="Bottom sheet on an Android tablet with Send and the toolbar on the keyboard"> |

| Sections with validation, iPhone | Sections with validation, Android | The example app |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/iphone-sections.png" width="200" alt="Form in cards on iPhone: the focused field above Continue and the toolbar"> | <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/android-sections.png" width="200" alt="Form in cards on Android: the focused field above Continue and the toolbar"> | <img src="https://raw.githubusercontent.com/ZaynSaul/rn-keyboard-form/main/docs/iphone-home.png" width="200" alt="The example app's list of test screens"> |

## Install

```sh
npm install @saulzayn/rn-keyboard-form react-native-keyboard-controller react-native-reanimated react-native-safe-area-context
# or
yarn add @saulzayn/rn-keyboard-form react-native-keyboard-controller react-native-reanimated react-native-safe-area-context
```

With Expo, use `npx expo install` for the last three so they match your SDK.
`react-native-keyboard-controller` is a native module, so Expo Go won't do: use a
[development build](https://docs.expo.dev/develop/development-builds/introduction/).

Works with react-native-keyboard-controller 1.21.6 and newer (Expo SDK 56, 57 and 58). Tested on
Expo SDK 58 (keyboard-controller 1.22, React Native 0.88) and Expo SDK 57 (1.21.9, React Native 0.86).

## Use

### 1. Wrap the app once

**Expo Router** (`app/_layout.tsx`, the root layout):

```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardHost } from '@saulzayn/rn-keyboard-form';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardHost>
        <Stack />
      </KeyboardHost>
    </SafeAreaProvider>
  );
}
```

Only the root `_layout.tsx` needs it: every screen and nested layout (tabs, stacks, modals) is
inside it.

**Without Expo Router** (React Navigation or a single screen, in `App.tsx`):

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardHost } from '@saulzayn/rn-keyboard-form';

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardHost>{/* your NavigationContainer or screens */}</KeyboardHost>
    </SafeAreaProvider>
  );
}
```

`KeyboardHost` can sit inside or outside your other providers (gesture handler, theme, data). Pass
`theme={darkTheme}` (or your own colours) to style every form at once; see [Theming](#theming).

### 2. A screen of fields with a Save button

With Expo Router this is a screen file such as `app/service/edit.tsx`:

```tsx
import { Button, TextInput } from 'react-native';
import { FormScroll } from '@saulzayn/rn-keyboard-form';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditService() {
  const save = () => {
    /* … */
  };
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

### 3. A bottom sheet with fields

The scrolling body of a bottom sheet with fields. Your sheet moves itself above the keyboard
(e.g. with `KeyboardAvoidingView`); once it has, this scrolls the focused field into view. The footer
stays under the fields, on the keyboard while it's open:

```tsx
import { SheetScroll } from '@saulzayn/rn-keyboard-form';

<SheetScroll
  contentContainerStyle={{ padding: 16, gap: 12 }}
  footer={
    <View style={{ padding: 16 }}>
      <Button title="Send" onPress={send} />
    </View>
  }
>
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
| `hideFooterBelow` | `number` | `500` | Below this window height (a phone on its side) the footer stays behind the keyboard and fades out, so the field has room. `0` to always ride. |
| `theme` | `KeyboardFormThemeOverride` | — | This screen's changes to the theme. |

### `SheetScroll`

All `ScrollView` props, plus:

| Prop | Type | Default | |
|---|---|---|---|
| `footer` | `ReactNode` | — | Under the fields, always in sight: on the keyboard while it's open. |
| `toolbar` | `boolean` | `true` | The previous / next / Done bar, at the bottom of the sheet while the keyboard is open. |
| `theme` | `KeyboardFormThemeOverride` | — | This sheet's changes to the theme. |

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

It has a long form (with and without the toolbar or footer), sign in, a short form, sections with
validation, a note taller than the screen, a form in an iOS page sheet and a bottom sheet, with
light / dark and label switches.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
