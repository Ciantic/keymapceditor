import { keycode } from "../QMK";
import { KeycapText } from "../Components/Key";
import { LANGS } from "../Langs";

interface LanguageCsvFormat {
    usbcode: number;

    // Symbols produced
    normal: string;
    shifted: string;
    altgr: string;
    altgrshifted: string;

    deadkeys: string; // deadkeys separated by space, e.g. "normal shifted"

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

interface LanguageMappingOpts {
    lang: string;
    name: string;
    mapping: LanguageCsvFormat[];
}

export interface ILanguageMapping {
    name: string;
    getKeycapText(usbcode: number): KeycapText;
}

export class LanguageMapping implements ILanguageMapping {
    public readonly lang: string;
    public readonly name: string;
    private readonly mapping: Map<number, LanguageCsvFormat>;

    constructor(opts: LanguageMappingOpts) {
        this.name = opts.name;
        this.mapping = new Map();
        opts.mapping.forEach(t => {
            this.mapping.set(+t.usbcode, t);
        });
    }

    // This can be overridden in some really weird mappings by inheriting from
    // this class
    public getKeycapText = (usbcode: number): KeycapText | null => {
        if (this.mapping.has(usbcode)) {
            let m = this.mapping.get(usbcode);
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
        return null;
    };
}

export const languageMappings: ILanguageMapping[] = [
    new LanguageMapping({
        lang: "UK",
        mapping: require("./Data/uk.csv"),
        name: LANGS.UkKeyboard,
    }),
    new LanguageMapping({
        lang: "FI",
        mapping: require("./Data/fi.csv"),
        name: LANGS.FinnishStandardKeyboard,
    }),
];
