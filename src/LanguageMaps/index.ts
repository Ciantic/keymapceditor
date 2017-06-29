import { keycode, keycodeToUsbcode } from "../QMK";
import { KeycapText } from "../Components/Key";
import { LANGS } from "../Langs";
import { QmkFunctionResult, isModResult } from "../QMK/functions";
import { isKeycode, modifierkeytype } from "../QMK";

export type keytypes = "normal" | "shifted" | "altgr" | "altgrshifted";

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
    getKeycapTextFromUsbcode(usbcode: number): KeycapText;
    getKeycapTextFromExpr(expr: QmkFunctionResult): KeycapText | null;
    // getSymbol(key: keytypes, usbcode: number): string;
}

export class LanguageMapping implements ILanguageMapping {
    public readonly lang: string;
    public readonly name: string;
    protected readonly mapping: Map<number, LanguageCsvFormat>;

    constructor(opts: LanguageMappingOpts) {
        this.lang = opts.lang;
        this.name = opts.name;
        this.mapping = new Map();
        opts.mapping.forEach(t => {
            this.mapping.set(+t.usbcode, t);
        });
    }

    // This can be overridden in some really weird mappings by inheriting from
    // this class
    public getKeycapTextFromUsbcode = (usbcode: number): KeycapText | null => {
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

    public getKeycapTextFromExpr = (expr: QmkFunctionResult | string): KeycapText | null => {
        if (isKeycode(expr)) {
            let usbcode = keycodeToUsbcode(expr);
            if (usbcode !== null) {
                return this.getKeycapTextFromUsbcode(usbcode);
            }
        } else if (isModResult(expr)) {
            let usbcode = keycodeToUsbcode(expr.keycode);
            if (usbcode === null) {
                return null;
            }

            if (expr.mods.length === 1) {
                // Shifted symbol in CSV
                if (expr.mods[0] === "KC_LSHIFT" || expr.mods[0] === "KC_RSHIFT") {
                    let sym = this.getSymbol("shifted", usbcode);
                    if (sym) {
                        return {
                            centered: sym,
                        };
                    }
                }

                // Altgr symbol in CSV
                if (expr.mods[0] === "KC_RALT") {
                    let sym = this.getSymbol("altgr", usbcode);
                    if (sym) {
                        return {
                            centered: sym,
                        };
                    }
                }
            } else if (expr.mods.length === 2) {
                // Altgrshifted symbol in CSV
                if (
                    expr.mods.indexOf("KC_RALT") !== -1 &&
                    (expr.mods.indexOf("KC_LSHIFT") !== -1 || expr.mods.indexOf("KC_RSHIFT") !== -1)
                ) {
                    let sym = this.getSymbol("altgrshifted", usbcode);
                    if (sym) {
                        return {
                            centered: sym,
                        };
                    }
                }
            }
            let modifierText = this.singleLetterModifierOrdering(expr.mods)
                .map(
                    t =>
                        expr.mods.length > 2
                            ? this.singleLetterModifier(t)
                            : this.threeLetterModifier(t)
                )
                .join("+");
            let sym = this.getSymbol("normal", usbcode);
            if (sym) {
                return {
                    centered: sym,
                    bottomcenter: modifierText,
                };
            } else {
                if (expr.keycode === "KC_NO") {
                    return {
                        centered: modifierText,
                    };
                } else {
                    return {
                        centered: expr.keycode,
                        bottomcenter: modifierText,
                    };
                }
            }
        }
        return null;
    };

    // Re-orders the letters in modifiers as C+S+A+W
    protected singleLetterModifierOrdering = (modifiers: modifierkeytype[]) => {
        let preferredOrdering: modifierkeytype[] = [
            "KC_LCTRL",
            "KC_RCTRL",
            "KC_LSHIFT",
            "KC_RSHIFT",
            "KC_LALT",
            "KC_RALT",
            "KC_LGUI",
            "KC_RGUI",
        ];
        let copy = modifiers.slice();
        copy.sort((a, b) => {
            return preferredOrdering.indexOf(a) - preferredOrdering.indexOf(b);
        });
        return copy;
    };

    // Three letter modifier abbreviations
    protected threeLetterModifier = (modifier: modifierkeytype) => {
        switch (modifier) {
            case "KC_RALT":
            case "KC_LALT":
                return LANGS.AltThreeLetter;
            case "KC_RCTRL":
            case "KC_LCTRL":
                return LANGS.CtrlThreeLetter;
            case "KC_RGUI":
            case "KC_LGUI":
                return LANGS.WinThreeLetter;
            case "KC_RSHIFT":
            case "KC_LSHIFT":
                return LANGS.ShiftThreeLetter;
        }
        return modifier;
    };

    // Single letter modifier abbreviations
    protected singleLetterModifier = (modifier: modifierkeytype) => {
        switch (modifier) {
            case "KC_RALT":
            case "KC_LALT":
                return LANGS.AltSingleLetter;
            case "KC_RCTRL":
            case "KC_LCTRL":
                return LANGS.CtrlSingleLetter;
            case "KC_RGUI":
            case "KC_LGUI":
                return LANGS.WinSingleLetter;
            case "KC_RSHIFT":
            case "KC_LSHIFT":
                return LANGS.ShiftSingleLetter;
        }
        return modifier;
    };

    protected getSymbol = (key: keytypes, usbcode: number): string | undefined => {
        let val = this.mapping.get(usbcode);
        if (val) {
            return val[key];
        }
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
