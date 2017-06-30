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
export const generateKeymapsText = (keyCount: number, layoutLayers: string[][]) => {
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

// TODO Create single parser for keymap and key expressions, which returns the
// offsets so it can be live edited instead of regenerated

/**
 * Tries to parse KEYMAP() definitions from the text
 * 
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
    return keymaps;
};

export const parseKeymapsText2 = (expr: string) => {
    let pos = 0;
    let keymaps = [];

    const tokenWithoutSpaces = (s: string): [number, string] => {
        let start = 0;
        let end = s.length;
        let leadingSpaces = /^\s+/.exec(s);
        start += (leadingSpaces && leadingSpaces[0].length) || 0;

        let trailingSpaces = /\s+$/.exec(s);
        end -= (trailingSpaces && trailingSpaces[0].length) || 0;

        return [start, s.slice(start, end)];
    };

    while (expr.indexOf("KEYMAP(", pos) !== -1) {
        pos = expr.indexOf("KEYMAP(", pos);
        pos += 6; // "KEYMAP"
        let pcount = 0;
        const main = (start: number) => {
            let arr = [];
            let addWord = (end: number) => {
                if (end <= start) {
                    return;
                }
                let [offset, token] = tokenWithoutSpaces(expr.slice(start, end));
                if (token !== "") {
                    arr.push({
                        type: "word",
                        content: token,
                        offset: start + offset,
                        end: end, // end includes the whitespace
                    });
                }
            };

            let addFunc = (end: number) => {
                if (end <= start) {
                    return;
                }
                let [offset, token] = tokenWithoutSpaces(expr.slice(start, end));
                if (token !== "") {
                    let params = main(end + 1);
                    let paramsend = params.slice(-1)[0].end;
                    arr.push({
                        type: "func",
                        func: token,
                        params: params,
                        offset: start + offset,
                        end: start + paramsend + 1, // + 1 for the ending parenthesis
                        content: expr.slice(start + offset, paramsend + 1),
                    });
                }
            };

            while (pos < expr.length) {
                let char = expr[pos++];
                let next = expr[pos];
                switch (char + next) {
                    case "/*":
                        addWord(pos - 1);
                        while (pos < expr.length) {
                            let char = expr[pos++];
                            let next = expr[pos];
                            if (char + next === "*/") {
                                pos++;
                                start = pos;
                                break;
                            }
                        }
                        break;
                    case "//":
                        addWord(pos - 1);
                        while (pos < expr.length) {
                            let char = expr[pos++];
                            let next = expr[pos + 1];
                            if (char === "\n") {
                                pos++;
                                start = pos;
                                break;
                            }
                        }
                        break;
                }
                switch (char) {
                    case " ":
                        continue;
                    case ",":
                        addWord(pos - 1);
                        start = pos;
                        continue;
                    case "(":
                        addFunc(pos - 1);
                        pcount++;
                        start = pos;
                        continue;
                    case ")":
                        addWord(pos - 1);
                        pcount--;
                        return arr;
                }
            }
            return arr;
        };
        let keymap = main(pos);
        if (pcount !== 0) {
            return null;
        }
        keymaps.push(keymap);
    }
    return keymaps;
};

type result = string | { func: string; params: result[] };

export const parseKeyExpression = (expr: string): result | null => {
    let pos = 0;
    let pcount = 0;

    const main = () => {
        let arr = [];
        let start = pos;
        let addWord = () => {
            if (pos > start) {
                let token = expr.slice(start, pos).trim().replace(/[\s\\(\\),]+$/, "");
                if (token !== "") {
                    arr.push(token);
                }
            }
        };
        let addFunc = () => {
            if (pos > start) {
                let token = expr.slice(start, pos).trim().replace(/[\s\\(\\),]+$/, "");
                if (token !== "") {
                    arr.push({
                        func: token,
                        params: main(),
                    });
                }
            }
        };

        while (pos < expr.length) {
            switch (expr[pos++]) {
                case " ":
                    continue;
                case ",":
                    addWord();
                    start = pos;
                    continue;
                case "(":
                    addFunc();
                    pcount++;
                    start = pos;
                    continue;
                case ")":
                    addWord();
                    pcount--;
                    return arr;
            }
        }
        addWord();
        return arr;
    };
    let val = main();
    if (pcount !== 0) {
        return null;
    }
    return val[0];
};

export interface Executor<T> {
    [k: string]: () => T | string | null;
}

export const evalKeyExpression = <T>(expr: result | null, executor: Executor<T>): T => {
    if (expr !== null) {
        if (typeof expr === "string") {
            return expr as any;
        } else if (expr && typeof expr.func === "string") {
            let evaledParams = [];
            expr.params.forEach(t => {
                evaledParams.push(evalKeyExpression(t, executor));
            });
            if (expr.func in executor) {
                return executor[expr.func].apply(null, evaledParams) || null;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    return null;
};

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout];
