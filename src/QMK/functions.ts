import { keycode, modifierkeys, modifierkeytype } from "./keycodes";
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

interface IKeycodeResult extends IRenderable {
    type: "keycode";
    keycode: keycode;
}
interface IParseError extends IRenderable {
    type: "error";
    error: "parse";
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

export type QmkFunctionResult =
    | IParseError
    | IModResult
    | IModTapResult
    | ILayerTapResult
    | IMomentaryLayerResult
    | IToggleLayerResult
    | IKeycodeResult
    | string; // Passes keycodes and words

export const isModResult = (res: QmkFunctionResult): res is IModResult => {
    return !!res && typeof res === "object" && res.type === "modresult";
};

export const isModTapResult = (res: QmkFunctionResult): res is IModTapResult => {
    return !!res && typeof res === "object" && res.type === "modtapresult";
};

export const isLayerTapResult = (res: QmkFunctionResult): res is ILayerTapResult => {
    return !!res && typeof res === "object" && res.type === "layertapresult";
};

export const isRenderableResult = (
    res: QmkFunctionResult | IRenderable
): res is {
    rendered: KeycapText;
} => {
    return !!res && typeof res === "object" && !!res.rendered;
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
    } else if (isModResult(kc)) {
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

const _MT = (mod: IModResult | IParseError): IModTapResult | IParseError => {
    if (isModResult(mod)) {
        mod.modifierText = "• " + mod.modifierText;
        return {
            type: "modtapresult",
            keycode: mod.keycode,
            mods: mod.mods,
            modifierText: mod.modifierText,
            rendered: {
                centered: (mod.keycode === "KC_NO" && mod.modifierText) || mod.keycode,
                bottomcenter: mod.keycode !== "KC_NO" && mod.modifierText,
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
        };
    } else {
        return {
            type: "error",
            error: "parse",
            data: `Incorrect data on hyper: "${kc}"`,
        };
    }
};

export class QmkFunctionsExecutor implements Executor<QmkFunctionResult> {
    word = (t: string): string => {
        return t;
    };

    expand = (node: AstNode) => {
        if (node.type === "word") {
            if (node.content in keycodeAliases) {
                return Object.assign({}, node, {
                    content: (keycodeAliases as any)[node.content],
                });
            }

            if (node.content === "KC_DLR") {
                return {
                    type: "func",
                    func: "LSFT",
                    params: [
                        {
                            type: "word",
                            content: "KC_4",
                            offset: 0,
                            end: 0,
                        },
                    ],
                    offset: 0,
                    end: 0,
                    content: "",
                } as AstNode;
            }
        }
        return node;
    };

    functions = {
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
    };
}

export const qmkExecutor: Executor<QmkFunctionResult> = new QmkFunctionsExecutor();

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

const threeLetterModifier = (modifier: modifierkeytype) => {
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
