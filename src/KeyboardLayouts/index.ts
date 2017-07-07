import { ergodoxKeyboardLayout } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";
import { keycode } from "../QMK/keycodes";
import { clueboardKeyboardLayout } from "./clueboard";

export interface IKeyboardLayout {
    qmkDirectory: string;
    layout: KeyboardLayoutArray;
    name: string;
    keyCount: number;
}

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout, clueboardKeyboardLayout];
