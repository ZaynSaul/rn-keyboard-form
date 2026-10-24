# rn-keyboard-form

`@saulzayn/rn-keyboard-form`: keyboard-aware forms for React Native / Expo, on top of
react-native-keyboard-controller. Public npm package, installable with npm and yarn.

Maintainer-only notes (status, devices, local setup) live in `CLAUDE.local.md`, which is not committed.

## What it solves (keep these working)

- `FormScroll`: focused field scrolls above the keyboard + toolbar + footer; `footer` rides on the
  keyboard; the footer's home-bar padding tucks under the keyboard.
- iOS 26+ rounded keyboard: the toolbar lifts 11pt (`KEYBOARD_HAS_ROUNDED_CORNERS`), and a backdrop strip
  reaches 30pt under the keyboard's corners so the form doesn't show through.
- iOS modal sheets: the real bottom inset is measured with a hidden `SafeAreaView` (it's 0 there,
  unlike `useSafeAreaInsets()`).
- `bottomOffset` is held while the keyboard opens/closes (`useSettled`): inside an Android `Modal` the
  footer's safe-area padding changes as it rides up, and a `bottomOffset` change made
  `KeyboardAwareScrollView` scroll the field up twice. Changes while the keyboard is up and settled
  (an error banner in the footer) are applied. keyboard-controller 1.22 bug, worth reporting upstream:
  its re-sync (`synchronizeFocusedInputLayout`) only refreshes the main window's focused input, so in
  a Modal it reads a stale position; a footer growing while typing in an Android Modal still
  over-scrolls. Cost: in an Android Modal the field sits ~23dp (nav-bar padding) higher than needed.
- `revealFocused`: when content changes size with the keyboard up (an error appears above the focused
  field, a switch adds fields), and after every keyboard show (rotation, keyboard type change),
  re-measures the focused field and scrolls the rest of the way, up or down; never past the field's top
  (tall multiline fields). Uses the keyboard height from events: `KeyboardController.state()` goes
  stale after rotation on Android.
- Footer, toolbar and corner strip are moved by `overlap`: how far the keyboard reaches into the form
  (form bottom measured in window coords; on iOS via keyboard-controller's native
  `viewPositionInWindow`, because measure()/measureInWindow() inside an iOS Modal are modal-relative).
  Needed for iPad form/page sheets, which iOS lifts only part of the way. `KeyboardToolbar` is wrapped
  with `enabled={false}` and moved by us.
- `hideFooterBelow` (default 500): on short windows (phone landscape) the footer stays put and fades
  out instead of riding on the keyboard.
- `SheetScroll`: in a bottom sheet that lifts itself above the keyboard, scrolls the focused field
  into view 300ms after `keyboardDidShow`, and when the arrows move focus. (A `KeyboardAwareScrollView`
  inside a lifted sheet scrolled twice — that's why this exists.) Same ↑/↓/Done bar (`toolbar`, on by
  default) in the sheet's own layout at its bottom, shown only while the keyboard is open, with a strip
  under the keyboard's rounded corners. Its `footer` prop (e.g. Send) sits under the fields and above
  the bar, so it stays in sight on the keyboard.
- Both components wrap their fields in `KeyboardToolbar.Group`, so ↑/↓ stay among their own fields
  (a sheet is its own Android window; without the group ↓ jumped to a field behind it). SheetScroll's
  toolbar stays mounted (hidden while closed): it learns the focused field's index from `focusDidSet`,
  sent before the keyboard opens, so mounting it late left the arrows wrong.
- Toolbar height 42 and lift 11 are keyboard-controller 1.22's `KEYBOARD_TOOLBAR_HEIGHT` and
  `OPENED_OFFSET` (not exported); recheck when it changes (peer range is `>=1.22.6 <1.23.0` on purpose).

Known: a multiline field low on screen first scrolls only to its caret (keyboard-controller behaviour),
then follows typing. Right after moving the app between full screen and an Android floating window, the
first keyboard open can be off.

## Layout

- `src/`: `theme.tsx` (light/dark themes, `mergeTheme`, context), `KeyboardHost.tsx`, `FormScroll.tsx`,
  `SheetScroll.tsx`, `index.tsx`.
- `example/`: Expo SDK 58 dev-client app (react-native-keyboard-controller is native: no Expo Go).
  Screens (`src/forms.tsx`, shared bits in `src/ui.tsx`): long form (+ without toolbar / footer), sign in
  (autoFocus, password, return key), short form, sections (cards, validation, footer banner, switch),
  note taller than the screen, iOS page-sheet modal, bottom sheet; dark + "OK" switches. Android back
  returns to the list. `example/android` and `example/ios` are generated (`expo prebuild`), not committed.
- Built with react-native-builder-bob (`yarn prepare` → `lib/`). Yarn 4 via `.yarnrc.yml` `yarnPath`.

## Checks

- `yarn typecheck`, `yarn lint`, `yarn prepare`; `npm pack --dry-run` ships only lib/, src/, README,
  LICENSE (~23 kB).
- Device testing: every example screen on a phone and a tablet, portrait and landscape, rotating with
  the keyboard open, light/dark. Android: `yarn example android`. iOS: EAS dev builds (`example/eas.json`
  has `simulator` and `development` profiles).
- `example/src/remote.ts`: dev-only remote control for a real device that can't be tapped from the
  computer. The app polls `http://<metro host>:8097/cmd.json` (serve a folder with
  `python3 -m http.server 8097`). Commands: `screen <key>`, `modal|sheet|dark|ok [off]`,
  `focus <label>`, `next`, `prev`, `dismiss`, `type <label>=<text>`.

## Conventions

- Yarn only, never `npm install` for dependencies. Node 24.
- New npm dependencies must be at least 2 weeks old.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
