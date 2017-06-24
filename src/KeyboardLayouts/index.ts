import { ergodoxKeyboardLayout } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";
import { keycode } from "../QMK/keycodes";

export interface IKeyboardLayout {
    layout: KeyboardLayoutArray;
    name: string;
    keyCount: number;
}

/**
 * Generate keymaps text
 * 
 * @param keyCount Key count of the layout
 * @param layoutLayers 
 */
export const generateKeymapsText = (keyCount: number, layoutLayers: keycode[][]) => {
    let keymaps = [];
    layoutLayers.forEach((t, i) => {
        let str = [];
        str.push(`[${i}] = KEYMAP(`);
        str.push(t.slice(0, keyCount).join(", "));
        str.push(")");
        keymaps.push(str.join(""));
    });
    return keymaps.join(",\n\n");
};

/**
 * Tries to parse KEYMAP() definitions from the text
 * 
 * @todo Change the parsing so that it returns offset of each key, this way it
 * can be used to live edit the text
 * @param keyCount Key count of the layout
 * @param text
 * @return Numeric position of the error, or the parsed layout layers array
 */
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
        if (keymap.length > keyCount) {
            return pos;
        }

        keymaps.push(keymap);
    }
    if (keymaps.length === 0) {
        return 0;
    }
    // let map = [];
    // keymaps.forEach(layer => {
    //     let l = new Map<string, keycode>();
    //     layer.forEach((kc, index) => {
    //         l.set("" + index, kc);
    //     });
    //     map.push(l);
    // });
    return keymaps;
};

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout];
