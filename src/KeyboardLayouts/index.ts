import { ergodoxKeyboardLayout } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";
import { keycode } from "../QMK/keycodes";

export interface IKeyboardLayout {
    layout: KeyboardLayoutArray;
    name: string;
    keyCount: number;
}

export const generateKeymapsText = (keyCount: number, layoutLayers: Map<string, keycode>[]) => {
    let keymaps = [];
    layoutLayers.forEach((t, i) => {
        let str = [];
        str.push(`[${i}] = KEYMAP(`);
        let keys = new Array(keyCount).fill("KC_NO" as keycode);
        t.forEach((v, k) => {
            let ki = +k;
            if (keyCount > ki) {
                keys[ki] = v;
            }
        });
        str.push(keys.join(", "));
        str.push(")");
        keymaps.push(str.join(""));
    });
    return keymaps.join(",\n");
};

export const parseKeymapsText = (keyCount: number, text: string) => {
    let ret: Map<string, keycode>[] = [];
    let pos = text.indexOf("KEYMAP(");
    let chars = [];
    // Parenthesis counter
    let pcount = 1; // First parenthesis on KEYMAP(

    while (pcount >= 1) {
        pos += 1;
        if (text.length < pos) {
            break;
        }
        chars.push(text[pos]);
    }

    console.log("chars");
};

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout];
