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

interface AstComma {
    type: "comma";
    content: ",";
    offset: number;
    end: number;
}

interface AstWord {
    type: "word";
    content: string;
    offset: number;
    end: number;
}

interface AstFunction {
    type: "func";
    func: string;
    params: AstNode[];
    offset: number;
    end: number;
    content: string;
}

type AstNode = AstWord | AstFunction;

export const parseKeymapsText = (expr: string): AstNode[][] => {
    let pos = 0;
    let keymaps: AstNode[][] = [];

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
        pos += 7; // "KEYMAP("
        let pcount = 1; // First parenthesis of KEYMAP(
        const main = (start: number) => {
            let arr: AstNode[] = [];
            let lastToken = -1;

            let ensureTokenExists = () => {
                if (lastToken === arr.length || arr.length === 0) {
                    throw new Error("Missing token at: " + pos);
                }
                lastToken = arr.length;
            };

            let addWord = (end: number) => {
                if (end <= start) {
                    return false;
                }
                let [offset, token] = tokenWithoutSpaces(expr.slice(start, end));
                if (token === "") {
                    return false;
                }
                if (/\s/.test(token)) {
                    throw new Error("Whitespaces are not allowed at: " + (start + offset));
                }
                arr.push(
                    {
                        type: "word",
                        content: token,
                        offset: start + offset,
                        end: end, // end includes the whitespace
                    } as AstWord
                );
                return true;
            };

            let addFunc = (end: number) => {
                if (end <= start) {
                    throw new Error("Function name required at: " + end);
                }
                let [offset, token] = tokenWithoutSpaces(expr.slice(start, end));
                if (token === "") {
                    throw new Error("Function name required at: " + (start + offset));
                }
                if (/\s/.test(token)) {
                    throw new Error(
                        "Function name can't have spaces, parse error at: " + (start + offset)
                    );
                }
                let params = main(end + 1);
                let paramsend = params.slice(-1)[0].end;
                arr.push(
                    {
                        type: "func",
                        func: token,
                        params: params,
                        offset: start + offset,
                        end: start + paramsend + 1, // + 1 for the ending parenthesis
                        content: expr.slice(start + offset, paramsend + 1),
                    } as AstFunction
                );
                return true;
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
                        ensureTokenExists();
                        start = pos;
                        continue;
                    case "(":
                        addFunc(pos - 1);
                        pcount++;
                        start = pos;
                        continue;
                    case ")":
                        addWord(pos - 1);
                        ensureTokenExists();
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

/// @deprecated
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
