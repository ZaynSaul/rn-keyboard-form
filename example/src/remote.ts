// Dev only: lets the Mac drive this example on a real iPhone, which can't be tapped from the Mac.
// The app reads `cmd.json` from a small server on the Mac (port 8097, same host as Metro) twice a
// second and runs each new command once. Example: {"id": 3, "do": "focus", "arg": "Deposit %"}.

import { useEffect, useRef, type ComponentRef } from 'react';

import { NativeModules, type TextInput } from 'react-native';

type Input = ComponentRef<typeof TextInput>;

/** Fields by label, so a command can focus one. */
export const fields = new Map<string, Input>();

export type Command = { id: number; do: string; arg?: string };

function remoteHost() {
  const url: string | undefined =
    NativeModules.SourceCode?.getConstants?.().scriptURL ??
    NativeModules.SourceCode?.scriptURL;
  const host = url?.match(/^https?:\/\/([^:/]+)/)?.[1];
  return host ? `http://${host}:8097/cmd.json` : null;
}

export function useRemote(run: (command: Command) => void) {
  const last = useRef<number | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!__DEV__) return;
    const url = remoteHost();
    if (!url) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`);
        const command = (await res.json()) as Command;
        // The first command seen is only remembered, so an old one isn't replayed on start.
        if (last.current === null) last.current = command.id;
        else if (command.id !== last.current) {
          last.current = command.id;
          runRef.current(command);
          console.log(
            `REMOTE ran ${command.id} ${command.do} ${command.arg ?? ''}`
          );
        }
      } catch {
        // No server running: nothing to do.
      }
      if (!stopped) setTimeout(tick, 500);
    };
    tick();
    return () => {
      stopped = true;
    };
  }, []);
}
