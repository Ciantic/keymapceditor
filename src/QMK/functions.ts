import { keycode, modifierkeys, modifierkeytype, modtapmodifierstype } from "./keycodes";
import { KeycapText } from "../Components/Key";
import { isKeycode, normalizeKeycode, isModifierKeytype } from "./index";
import { Executor, AstNode } from "./parsing";
import { LANGS } from "../Langs";
import { keycodeAliases } from "./aliases";

// https://github.com/qmk/qmk_firmware/blob/master/docs/key_functions.md
// https://github.com/qmk/qmk_firmware/blob/master/quantum/quantum_keycodes.h

interface IRenderable {
    rendered?: KeycapText;
}

interface ILangSymbolResult extends IRenderable {
    type: "langsymbol";
    keycode: keycode;
    mods: modifierkeytype[];
    symbol: string;
}

interface ILangKeycodeResult extends IRenderable {
    type: "langkeycode";
    keycode: keycode;
}

interface IParseError extends IRenderable {
    type: "error";
    error: "parse" | "eval";
    data: string;
}

interface IModResult extends IRenderable {
    type: "modresult";
    keycode: keycode;
    mods: modifierkeytype[];
    modifierText: string;
}

interface IModTapResult extends IRenderable {
    type: "modtapresult";
    keycode: keycode;
    mods: modifierkeytype[];
    modifierText: string;
}

interface ILayerTapResult extends IRenderable {
    type: "layertapresult";
    keycode: keycode;
    layer: string;
}

interface IMomentaryLayerResult extends IRenderable {
    type: "momentarylayer";
    layer: string;
}

interface IToggleLayerResult extends IRenderable {
    type: "togglelayer";
    layer: string;
}

interface IOneShotLayerResult extends IRenderable {
    type: "oneshotlayer";
    layer: string;
}

interface IOneShotModifierResult extends IRenderable {
    type: "oneshotmodifier";
    mod: modtapmodifierstype;
}

export type QmkFunctionResult =
    | IParseError
    | IModResult
    | IModTapResult
    | ILayerTapResult
    | IMomentaryLayerResult
    | IToggleLayerResult
    | ILangSymbolResult
    | ILangKeycodeResult
    | IOneShotLayerResult
    | IOneShotModifierResult
    | string; // Passes keycodes and words

const modifierTextShortened = (mods: modifierkeytype[]) => {
    return singleLetterModifierOrdering(mods)
        .map(t => (mods.length > 2 ? singleLetterModifier(t) : threeLetterModifier(t)))
        .join("+");
};

const singleLetterModifierOrdering = (modifiers: modifierkeytype[]) => {
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

const longNameModifier = (modifier: modifierkeytype | modtapmodifierstype) => {
    switch (modifier) {
        case "MOD_RALT":
        case "MOD_LALT":
        case "KC_RALT":
        case "KC_LALT":
            return LANGS.Alt;
        case "MOD_RCTL":
        case "MOD_LCTL":
        case "KC_RCTRL":
        case "KC_LCTRL":
            return LANGS.Ctrl;
        case "MOD_LGUI":
        case "MOD_RGUI":
        case "KC_RGUI":
        case "KC_LGUI":
            return LANGS.Win;
        case "MOD_RSFT":
        case "MOD_LSFT":
        case "KC_RSHIFT":
        case "KC_LSHIFT":
            return LANGS.Shift;
        case "MOD_HYPR":
            return LANGS.Hyper;
        case "MOD_MEH":
            return LANGS.Meh;
    }
    return modifier;
};

const threeLetterModifier = (modifier: modifierkeytype | modtapmodifierstype) => {
    switch (modifier) {
        case "MOD_RALT":
        case "MOD_LALT":
        case "KC_RALT":
        case "KC_LALT":
            return LANGS.AltThreeLetter;
        case "MOD_RCTL":
        case "MOD_LCTL":
        case "KC_RCTRL":
        case "KC_LCTRL":
            return LANGS.CtrlThreeLetter;
        case "MOD_LGUI":
        case "MOD_RGUI":
        case "KC_RGUI":
        case "KC_LGUI":
            return LANGS.WinThreeLetter;
        case "MOD_RSFT":
        case "MOD_LSFT":
        case "KC_RSHIFT":
        case "KC_LSHIFT":
            return LANGS.ShiftThreeLetter;
    }
    return modifier;
};

// Single letter modifier abbreviations
const singleLetterModifier = (modifier: modifierkeytype) => {
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

const _MOD = (
    kc: keycode | IModResult | IParseError,
    key: modifierkeytype
): IModResult | IParseError => {
    if (isKeycode(kc)) {
        let kcn = normalizeKeycode(kc);
        let mods = [key];
        // Called using syntax: LALT(KC_LSHIFT), this is translated to
        // LALT(LSFT(KC_NO)) equivalent
        if (isModifierKeytype(kcn)) {
            mods = [kcn, key];
            kcn = "KC_NO";
        }
        let modifierText = modifierTextShortened(mods);
        return {
            type: "modresult",
            keycode: (kcn !== null && kcn) || "KC_NO",
            mods: mods,
            modifierText: modifierText,
            rendered: {
                centered: (kcn === "KC_NO" && modifierText) || kcn,
                bottomcenter: kcn !== "KC_NO" && modifierText,
            },
        };
    } else if (kc.type === "modresult") {
        let modifierText = modifierTextShortened(kc.mods.concat(key));
        return {
            type: "modresult",
            keycode: kc.keycode,
            mods: kc.mods.concat(key),
            modifierText: modifierText,
            rendered: {
                centered: (kc.keycode === "KC_NO" && modifierText) || kc.keycode,
                bottomcenter: kc.keycode !== "KC_NO" && modifierText,
            },
        };
    } else {
        // MT called with incorrect data
        return {
            type: "error",
            error: "parse",
            data: `Unable to add modifier to keycode: "${kc}"`,
        };
    }
};

const _MT = (mod: IModResult | IParseError): IModResult | IModTapResult | IParseError => {
    if (mod.type === "modresult") {
        // E.g. HYPR_T(KC_NO) is rendered instead as HYPR(KC_NO)
        if (mod.keycode === "KC_NO") {
            return mod;
        }

        let modifierText = "• " + mod.modifierText;
        return {
            type: "modtapresult",
            keycode: mod.keycode,
            mods: mod.mods,
            modifierText: modifierText,
            rendered: {
                centered: mod.keycode,
                bottomcenter: modifierText,
            },
        };
    }
    return mod;
};
const LT = (n: string, kc: keycode): ILayerTapResult => {
    return {
        type: "layertapresult",
        keycode: kc,
        layer: n,
        rendered: {
            centered: kc,
            bottomcenter: "LT → " + n,
        },
    };
};
const MO = (n: string): IMomentaryLayerResult => {
    return {
        type: "momentarylayer",
        layer: n,
        rendered: {
            centered: "MO → " + n,
        },
    };
};
const TG = (n: string): IToggleLayerResult => {
    return {
        type: "togglelayer",
        layer: n,
        rendered: {
            centered: "TG → " + n,
        },
    };
};
// TT = (layer: number) => {};

const CTL_T = (kc: keycode) => _MT(LCTL(kc));
const SFT_T = (kc: keycode) => _MT(LSFT(kc));
const ALT_T = (kc: keycode) => _MT(LALT(kc));
const ALGR_T = (kc: keycode) => _MT(RALT(kc));
const GUI_T = (kc: keycode) => _MT(LGUI(kc));
const ALL_T = (kc: keycode) => _MT(HYPR(kc));
const LCAG_T = (kc: keycode) => _MT(LCAG(kc));
const MEH_T = (kc: keycode) => _MT(MEH(kc));
const SCMD_T = (kc: keycode) => _MT(LSFT(LGUI(kc)));
const SWIN_T = (kc: keycode) => _MT(LSFT(LGUI(kc)));

const LCTL = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_LCTRL");
const LSFT = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_LSHIFT");
const LALT = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_LALT");
const LGUI = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_LGUI");
const RCTL = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_RCTRL");
const RSFT = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_RSHIFT");
const RALT = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_RALT");
const RGUI = (kc: keycode | IModResult | IParseError) => _MOD(kc, "KC_RGUI");
const LCAG = (kc: keycode | IModResult | IParseError) => LCTL(LALT(LGUI(kc)));
const HYPR = (kc: keycode): IModResult | IParseError => {
    if (isKeycode(kc)) {
        return {
            type: "modresult",
            keycode: kc,
            mods: ["KC_LALT", "KC_LCTRL", "KC_LGUI", "KC_LSHIFT"],
            modifierText: LANGS.Hyper,
            rendered: {
                centered: (kc === "KC_NO" && LANGS.Hyper) || kc,
                bottomcenter: kc !== "KC_NO" && LANGS.Hyper,
            },
        };
    } else {
        return {
            type: "error",
            error: "parse",
            data: `Incorrect data on hyper: "${kc}"`,
        };
    }
};
export const MEH = (kc: keycode): IModResult | IParseError => {
    if (isKeycode(kc)) {
        return {
            type: "modresult",
            keycode: kc,
            mods: ["KC_LALT", "KC_LCTRL", "KC_LSHIFT"],
            modifierText: LANGS.Meh,
            rendered: {
                centered: (kc === "KC_NO" && LANGS.Meh) || kc,
                bottomcenter: kc !== "KC_NO" && LANGS.Meh,
            },
        };
    } else {
        return {
            type: "error",
            error: "parse",
            data: `Incorrect data on meh: "${kc}"`,
        };
    }
};
export const OSL = (layer: string): IOneShotLayerResult => {
    return {
        type: "oneshotlayer",
        layer: layer,
        rendered: {
            centered: "OSL → " + layer,
        },
    };
};

export const OSM = (mod: modtapmodifierstype): IOneShotModifierResult => {
    let centered = longNameModifier(mod);
    return {
        type: "oneshotmodifier",
        mod: mod,
        rendered: {
            centered: centered,
            bottomcenter: "• ",
        },
    };
};

const functionExpansions = {
    KC_TILD: LSFT("KC_GRAVE"),
    KC_EXLM: LSFT("KC_1"),
    KC_AT: LSFT("KC_2"),
    KC_HASH: LSFT("KC_3"),
    KC_DLR: LSFT("KC_4"),
    KC_PERC: LSFT("KC_5"),
    KC_CIRC: LSFT("KC_6"),
    KC_AMPR: LSFT("KC_7"),
    KC_ASTR: LSFT("KC_8"),
    KC_LPRN: LSFT("KC_9"),
    KC_RPRN: LSFT("KC_0"),
    KC_UNDS: LSFT("KC_MINUS"),
    KC_PLUS: LSFT("KC_EQUAL"),
    KC_LCBR: LSFT("KC_LBRACKET"),
    KC_RCBR: LSFT("KC_RBRACKET"),
    KC_LABK: LSFT("KC_COMMA"),
    KC_RABK: LSFT("KC_DOT"),
    KC_COLN: LSFT("KC_SCOLON"),
    KC_PIPE: LSFT("KC_BSLASH"),
    KC_LT: LSFT("KC_COMMA"),
    KC_GT: LSFT("KC_DOT"),
    KC_QUES: LSFT("KC_SLASH"),
    KC_DQT: LSFT("KC_QUOTE"),

    KC_HYPR: HYPR("KC_NO"),
    KC_MEH: MEH("KC_NO"),
};

const functionExpansionAliases: { [k: string]: keyof typeof functionExpansions } = {
    KC_TILDE: "KC_TILD",
    KC_EXCLAIM: "KC_EXLM",
    KC_DOLLAR: "KC_DLR",
    KC_PERCENT: "KC_PERC",
    KC_CIRCUMFLEX: "KC_CIRC",
    KC_AMPERSAND: "KC_AMPR",
    KC_ASTERISK: "KC_ASTR",
    KC_LEFT_PAREN: "KC_LPRN",
    KC_RIGHT_PAREN: "KC_RPRN",
    KC_UNDERSCORE: "KC_UNDS",
    KC_LEFT_CURLY_BRACE: "KC_LCBR",
    KC_RIGHT_CURLY_BRACE: "KC_RCBR",
    KC_LEFT_ANGLE_BRACKET: "KC_LABK",
    KC_RIGHT_ANGLE_BRACKET: "KC_RABK",
    KC_COLON: "KC_COLN",
    KC_QUESTION: "KC_QUES",
    KC_DOUBLE_QUOTE: "KC_DQT",
    KC_DQUO: "KC_DQT",
};

const functionNameAliases = {
    S: LSFT,
};

const functions = {
    LT,
    MO,
    TG,
    CTL_T,
    SFT_T,
    ALT_T,
    ALGR_T,
    GUI_T,
    ALL_T,
    LCAG_T,
    MEH_T,
    SCMD_T,
    SWIN_T,

    LCTL,
    LSFT,
    LALT,
    LGUI,
    RCTL,
    RSFT,
    RALT,
    RGUI,
    LCAG,
    HYPR,
    MEH,

    OSL,
    OSM,
};

export class QmkFunctionsExecutor implements Executor<QmkFunctionResult> {
    word = (t: string): QmkFunctionResult => {
        if (t in keycodeAliases) {
            return this.word(keycodeAliases[t]);
        }
        if (t in functionExpansionAliases) {
            return this.word(functionExpansionAliases[t]);
        }
        if (t in functionExpansions) {
            return (functionExpansions as { [k: string]: QmkFunctionResult })[t];
        }
        return t;
    };

    function = (func: string, args: QmkFunctionResult[]) => {
        if (func in functionNameAliases) {
            return (functionNameAliases as any)[func].apply(this, args);
        }
        return null;
    };

    functions = functions;
}

export const qmkExecutor: Executor<QmkFunctionResult> = new QmkFunctionsExecutor();
