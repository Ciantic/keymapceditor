import { ergodoxKeyboardLayout } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";
import { keycode } from "../QMK/keycodes";
import { clueboardKeyboardLayout } from "./clueboard";

export interface IKeyboardLayout {
    defaultKeymapUrl?: string;
    layout: KeyboardLayoutArray;
    name: string;
    keyCount: number;
}

const keyboardLayoutsIndex = {
    ergodox: ergodoxKeyboardLayout,
    clueboard: clueboardKeyboardLayout,
};

export const keyboardLayouts: { [k: string]: IKeyboardLayout } = keyboardLayoutsIndex;

export type KeyboardLayoutKey = keyof typeof keyboardLayoutsIndex;
