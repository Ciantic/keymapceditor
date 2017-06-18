import { keycode } from "../QMK/keycodes";
import { KeyTexts } from "../Components/Key";

export type mapping = Partial<{[k in keycode]: KeyProducedChars | KeyProducedCharsShort | string | [string, string, string, string] | [string, string, string] | [string, string] }> 

export interface KeyProducedChars {
    normal?: string;
    shifted?: string;
    altgr?: string;
    altgrshifted?: string;
    render?: KeyTexts;
    deadKeys?: ("normal" | "shifted" | "altgr" | "altgrshifted")[]
}

export interface KeyProducedCharsShort {
    symbols?: string;
    text?: string[];
    deadKeys?: ("normal" | "shifted" | "altgr" | "altgrshifted")[]
}

const isShortFormat = (k: any): k is KeyProducedCharsShort => {
    return "symbols" in k || "render" in k || "deadKeys" in k || "text" in k;
}

export abstract class Keymapping {
    public name: string
    protected mapping: mapping

    // chars these are used mostly in C file generation
    public get chars() {
        let keys: { [k in keycode]? : KeyProducedChars } = {};
        Object.keys(this.mapping).forEach((k: keycode) => {
            let val = this.mapping[k];
            let keytexts: KeyTexts = {};
            // "1!" or "2\\" or "=+", ...
            if (typeof val === "string") {
                keys[k] = {
                    normal : val.charAt(0),
                    shifted : val.charAt(1),
                    altgr : val.charAt(2),
                    altgrshifted : val.charAt(3)
                }
            // ["1", "!"] or ["2", "\\"] or ["=", "+"]
            } else if (val instanceof Array) {
                keys[k] = {
                    normal : val[0] || "",
                    shifted : val[1] || "",
                    altgr : val[2] || "",
                    altgrshifted : val[3] || ""
                }
            // KeyProducedCharsShort
            } else if (isShortFormat(val)) {
                let render: KeyTexts
                if (typeof val.text === "string") {
                    render = {
                        c: val.text
                    }
                } else if (typeof val.text as any instanceof Array) {
                    render = {
                        bl : val.text[0] || "",
                        tl : val.text[1] || "",
                        br : val.text[2] || "",
                        tr : val.text[3] || "",
                    }
                } else {
                    throw "wrong format";
                }
                
                keys[k] = {
                    normal : val.symbols[0] || "",
                    shifted : val.symbols[1] || "",
                    altgr : val.symbols[2] || "",
                    altgrshifted : val.symbols[3] || "",
                    deadKeys : val.deadKeys,
                    render : render
                }
            } else {
                throw "wrong format 2"
            }
        });
        return keys;
    }

    // Each language may have own weird way to render keycaps, this can be
    // overridden in the language definition
    public get keytexts() {
        let chars = this.chars;
        let keys: { [k in keycode]? : KeyTexts } = {};
        Object.keys(chars).forEach((k: keycode) => {
            let val = chars[k];
            keys[k] = val.render || {
                tl : val.shifted,
                bl : val.normal,
                br : val.altgr,
                tr : val.altgrshifted
            }
        })
        return keys;
    }
}