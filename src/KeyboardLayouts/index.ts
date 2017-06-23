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
    let chars = [];
    let pos = 0;
    let keymaps: keycode[][] = [];
    while (text.indexOf("KEYMAP(", pos) !== -1) {
        let keymap = [];
        pos = text.indexOf("KEYMAP(", pos);

        // "KEYMAP" == 6, then the "(" is removed by the while loop
        pos += 6;

        // Parenthesis counter
        let pcount = 1; // First parenthesis on KEYMAP(
        let token = [];
        while (pcount >= 1) {
            if (text.length < pos) {
                // EOF failure
                return pos;
            }
            pos += 1;
            let char = text[pos];

            // Parenthesis counter
            if (char === "(") {
                pcount++;
            } else if (char === ")") {
                pcount--;
            }

            // The normal // comments removal
            if (char === "/" && text[pos + 1] === "/") {
                for (var ci = 0; ci < text.length; ci++) {
                    pos += 1;
                    let cchar = text[pos];
                    if (cchar === "\n") {
                        break;
                    }
                }
                continue;
            }

            // The asterisk /* comments */ removal
            if (char === "/" && text[pos + 1] === "*") {
                for (var ci = 0; ci < text.length; ci++) {
                    pos += 1;
                    let cchar = text[pos];
                    if (cchar === "*" && text[pos + 1] === "/") {
                        pos += 1;
                        break;
                    }
                }
                continue;
            }

            if (char === "," && pcount === 1) {
                // Save token
                if (token[0] === ",") {
                    token.shift(); // Remove the prepended comma
                }
                keymap.push(token.join(""));

                // Look for a new token
                token = [];
            }

            if (char !== " " && char !== "\n") {
                token.push(char);
            }
        }

        // Save token
        if (token[0] === ",") {
            token.shift(); // Remove the prepended comma
        }
        token.pop(); // Remove the trailing parenthesis
        keymap.push(token.join(""));

        keymaps.push(keymap);
    }
    return keymaps;
};

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout];
