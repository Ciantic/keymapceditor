import { ergodoxKeyboardLayout, ergodoxKeyboardInfoJsonFormat } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";
import { keycode } from "../QMK/keycodes";
import { clueboardKeyboardLayout, clueboardKeyboard60Layout } from "./clueboard";
import { QmkInfoJson } from "../QMK/info";

export interface IKeyboardLayout {
    defaultKeymapUrl?: string;
    layout: KeyboardLayoutArray;
    name: string;
    keyCount: number;
}

const keyboardLayoutsIndex = {
    ergodox: ergodoxKeyboardLayout,
    clueboard: clueboardKeyboardLayout,
    clueboard60: clueboardKeyboard60Layout,
};

// export const keyboardLayouts: { [k: string]: IKeyboardLayout } = keyboardLayoutsIndex;

export const keyboards: { [k: string]: QmkInfoJson } = {};

// Insert the global values from a cache to keyboards list
if (typeof window !== "undefined" && (window as any)["INFO_JSON_FILES"]) {
    Object.keys((window as any)["INFO_JSON_FILES"]).forEach(key => {
        let value = (window as any)["INFO_JSON_FILES"][key];
        keyboards[key] = value;
    });
}

// export type KeyboardLayoutKey = keyof typeof keyboardLayoutsIndex;

// https://api.github.com/search/code?q=filename:info.json+repo:qmk/qmk_firmware
