import { keycode } from "../QMK/keycodes";
import { KeyTexts } from "../Components/Key";

export type mapping = Partial<{[k in keycode]: KeyProducedChars | KeyProducedCharsShort | string | [string, string, string, string] | [string, string, string] | [string, string] }> 

export interface KeyProducedChars {
    normal?: string;
    shifted?: string;
    altgr?: string;
    altgrshifted?: string;
    deadKeys?: ("normal" | "shifted" | "altgr" | "altgrshifted")[]
}

export interface KeyProducedCharsShort {
    symbols?: string;
    deadKeys?: ("normal" | "shifted" | "altgr" | "altgrshifted")[]
}

export abstract class Keymapping {
    public name: string
    protected mapping: mapping

    // actions these are used mostly in C file generation
    public get chars() {
        let keys: { [k in keycode]? : KeyProducedChars } = {};
        Object.keys(this.mapping).forEach((k: keycode) => {
            let val = this.mapping[k];
            let keytexts: KeyTexts = {};
            if (typeof val === "string") {
                keys[k] = {
                    normal : val.charAt(0),
                    shifted : val.charAt(1),
                    altgr : val.charAt(2),
                    altgrshifted : val.charAt(3)
                }
            } else if (val instanceof Array) {
                keys[k] = {
                    normal : val[0] || "",
                    shifted : val[1] || "",
                    altgr : val[2] || "",
                    altgrshifted : val[3] || ""
                }
            }
        })
        return keys;
    }

    // Each language may have own weird way to render keycaps, this can be
    // overridden in the language definition
    public get keytexts() {
        let chars = this.chars;
        let keys: { [k in keycode]? : KeyTexts } = {};
        Object.keys(chars).forEach((k: keycode) => {
            let val = chars[k];
            keys[k] = {
                tl : val.shifted,
                bl : val.normal,
                br : val.altgr,
                tr : val.altgrshifted
            }
        })
        return keys;
    }
}