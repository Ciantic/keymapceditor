import { keycode, usbcodeToKeycode } from "../QMK/keycodes";
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
    getKeycapText(c: keycode): KeycapText;
}

export class Keymapping implements IKeymapping {
    public readonly lang: string;
    public readonly name: string;
    public readonly mapping: Readonly<{ [k in keycode]?: CSVFormat }>;

    constructor(opts: KeymappingOpts) {
        this.name = opts.name;
        this.mapping = {};
        opts.mapping.forEach(t => {
            this.mapping[usbcodeToKeycode[t.usbcode]] = t;
        });
    }

    // This can be overridden in some really weird mappings by inheriting from
    // this class
    public getKeycapText = (c: keycode): KeycapText => {
        if (c in this.mapping) {
            let m = this.mapping[c];
            if (
                m.bottomleft ||
                m.topleft ||
                m.bottomright ||
                m.topright ||
                m.centerleft ||
                m.centered ||
                m.centerright
            ) {
                return m;
            }
            return {
                bottomleft: m.normal,
                topleft: m.shifted,
                bottomright: m.altgr,
                topright: m.altgrshifted,
            };
        }
        return {};
    };
}

export const languageMappings: IKeymapping[] = [
    new Keymapping({
        lang: "UK",
        mapping: require("./Data/uk.csv"),
        name: LANGS.UkKeyboard,
    }),
    new Keymapping({
        lang: "FI",
        mapping: require("./Data/fi.csv"),
        name: LANGS.FinnishStandardKeyboard,
    }),
];
