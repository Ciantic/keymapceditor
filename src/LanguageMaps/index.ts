import { keycode, QmkUsbLayoutArray, usbcodeToKeycode } from "../QMK/keycodes";
import { KeycapText } from "../Components/Key";
import { LANGS } from "../Langs";

// export type mapping = Partial<{[k in keycode]: KeyProducedChars | KeyProducedCharsShort | string | [string, string, string, string] | [string, string, string] | [string, string] }>

interface CSVFormat {
    usbcode: number;

    // Symbols produced
    normal: string; 
    shifted: string;
    altgr: string;
    altgrshifted: string;

    deadkeys: string;

    // Presentation on keycap
    bottomleft: string; // normal
    topleft: string; // shifted
    bottomright: string; // altgr
    topright: string; // altgrshifted
    centerleft: string; // Not used normally
    centered: string; // command keys, e.g. Delete
    centerright: string; // Not used normally

    // Name (if differs from keycap presentation)
    name: string;
}

interface KeymappingOpts {
    lang: string;
    name: string;
    mapping: CSVFormat[];
}

export interface IKeymapping {
    name: string;
    getKeycapText(c: keycode): KeycapText
}

export class Keymapping implements IKeymapping {
    public readonly lang: string;
    public readonly name: string;
    public readonly mapping: Readonly<{ [k in keycode] ?: CSVFormat }>

    constructor(opts: KeymappingOpts) {
        this.name = opts.name;
        this.mapping = {};
        opts.mapping.forEach(t => {
            this.mapping[usbcodeToKeycode[t.usbcode]] = t;
        })
    }

    // This can be overridden in some really weird mappings by inheriting from
    // this class
    public getKeycapText = (c: keycode): KeycapText => {
        if (c in this.mapping) {
            let m = this.mapping[c];
            if (m.bottomleft || 
                m.topleft || 
                m.bottomright || 
                m.topright || 
                m.centerleft ||
                m.centered ||
                m.centerright)
            {
                return m;
            }
            return {
                bottomleft : m.normal,
                topleft: m.shifted,
                bottomright: m.altgr,
                topright: m.altgrshifted
            }
        }
        return {};
    }
}

export const languageMappings: IKeymapping[] = [
    new Keymapping({
        lang : "UK",
        mapping : require("./Data/uk.csv"), 
        name : LANGS.UkKeyboard
    }), 
    new Keymapping({
        lang : "FI",
        mapping : require("./Data/fi.csv"), 
        name : LANGS.FinnishStandardKeyboard
    })
]

// export interface KeyProducedChars {
//     normal?: string;
//     shifted?: string;
//     altgr?: string;
//     altgrshifted?: string;
//     render?: KeyTexts;
//     deadKeys?: ("normal" | "shifted" | "altgr" | "altgrshifted")[]
// }

// export interface KeyProducedCharsShort {
//     symbols?: string;
//     text?: string[];
//     deadKeys?: ("normal" | "shifted" | "altgr" | "altgrshifted")[]
// }

// const isShortFormat = (k: any): k is KeyProducedCharsShort => {
//     return "symbols" in k || "render" in k || "deadKeys" in k || "text" in k;
// }

// export abstract class Keymapping {
//     public name: string
//     protected mapping: mapping

//     // chars these are used mostly in C file generation
//     public get chars() {
//         let keys: { [k in keycode]? : KeyProducedChars } = {};
//         Object.keys(this.mapping).forEach((k: keycode) => {
//             let val = this.mapping[k];
//             let keytexts: KeyTexts = {};
//             // "1!" or "2\\" or "=+", ...
//             if (typeof val === "string") {
//                 keys[k] = {
//                     normal : val.charAt(0),
//                     shifted : val.charAt(1),
//                     altgr : val.charAt(2),
//                     altgrshifted : val.charAt(3)
//                 }
//             // ["1", "!"] or ["2", "\\"] or ["=", "+"]
//             } else if (val instanceof Array) {
//                 keys[k] = {
//                     normal : val[0] || "",
//                     shifted : val[1] || "",
//                     altgr : val[2] || "",
//                     altgrshifted : val[3] || ""
//                 }
//             // KeyProducedCharsShort
//             } else if (isShortFormat(val)) {
//                 let render: KeyTexts
//                 let text = val.text;
//                 if (typeof text === "string") {
//                     render = {
//                         c: val.text
//                     }
//                 } else if (text instanceof Array) {
//                     render = {
//                         bl : text[0] || "",
//                         tl : text[1] || "",
//                         br : text[2] || "",
//                         tr : text[3] || "",
//                     }
//                 }
                
//                 keys[k] = {
//                     normal : val.symbols && val.symbols[0] || "",
//                     shifted : val.symbols && val.symbols[1] || "",
//                     altgr : val.symbols && val.symbols[2] || "",
//                     altgrshifted : val.symbols && val.symbols[3] || "",
//                     deadKeys : val.deadKeys,
//                     render : render
//                 }
//             } else {
//                 throw Error("wrong format 2")
//             }
//         });
//         return keys;
//     }

//     // Each language may have own weird way to render keycaps, this can be
//     // overridden in the language definition
//     public get keytexts() {
//         let chars = this.chars;
//         let keys: { [k in keycode]? : KeyTexts } = {};
//         Object.keys(chars).forEach((k: keycode) => {
//             let val = chars[k];
//             keys[k] = val.render || {
//                 tl : val.shifted,
//                 bl : val.normal,
//                 br : val.altgr,
//                 tr : val.altgrshifted
//             }
//         })
//         return keys;
//     }
// }

// export const languageMappedKeyTexts = (keymapping: Keymapping, layout: QmkUsbLayoutArray) => {
//     let keytexts = keymapping.keytexts;
//     let newlayout = [] as KeyTexts[];
//     layout.forEach(r => {
//         r.forEach(k => {
//             if (typeof k === "string") {
//                 newlayout.push(keytexts[k]);
//             }
//         })
//     })
//     return newlayout;
// }