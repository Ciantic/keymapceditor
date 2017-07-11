import { keycode, modifierkeys, modifierkeytype } from "./keycodes";
import { KeycapText } from "../Components/Key";
import { isKeycode, normalizeKeycode, isModifierKeytype } from "./index";
import { Executor } from "./parsing";
import { LANGS } from "../Langs";

// https://github.com/qmk/qmk_firmware/blob/master/docs/key_functions.md
// https://github.com/qmk/qmk_firmware/blob/master/quantum/quantum_keycodes.h

interface IRenderable {
    rendered?: KeycapText;
}

interface IKeycodeResult extends IRenderable {
    type: "keycode";
    keycode: keycode;
}

interface IModLikeResult extends IRenderable {
    type: "modlikeresult";
    keycode: keycode;
    modifierText: string;
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

export type QmkFunctionResult =
    | IKeycodeResult
    | IModResult
    | IParseError
    | IModLikeResult
    | string
    | undefined
    | null;

export const isModResult = (res: QmkFunctionResult): res is IModResult => {
    return res && typeof res === "object" && res.type === "modresult";
};

export const isModLikeResult = (res: QmkFunctionResult): res is IModLikeResult => {
    return res && typeof res === "object" && res.type === "modlikeresult";
};

export const isRenderableResult = (res: QmkFunctionResult | IRenderable): res is IRenderable => {
    return res && typeof res === "object" && "rendered" in res;
};

export class QmkFunctionsExecutor {
    _MOD = (
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
            return {
                type: "modresult",
                keycode: kcn,
                mods: mods,
                modifierText: modifierTextShortened(mods),
            };
        } else if (isModResult(kc)) {
            return {
                type: "modresult",
                keycode: kc.keycode,
                mods: kc.mods.concat(key),
                modifierText: modifierTextShortened(kc.mods.concat(key)),
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

    _MT = (mod: IModResult | IModLikeResult | IParseError) => {
        if (isModResult(mod) || isModLikeResult(mod)) {
            mod.modifierText = "• " + mod.modifierText;
            return mod;
        }

        return mod;
    };

    // LT = (layer: number, kc: keycode) => {};
    // TG = (layer: number) => {};
    // TO = (layer: number) => {};
    // TT = (layer: number) => {};
    LT = (n: string, kc: keycode) => {
        return {
            type: "modlikeresult",
            keycode: kc,
            modifierText: "LT → " + n,
        };
    };
    MO = (n: string) => {
        return {
            getKeycapText: () => ({
                centered: "MO → " + n,
            }),
        };
    };
    TG = (n: string) => {
        return {
            getKeycapText: () => ({
                centered: "TG → " + n,
            }),
        };
    };

    CTL_T = (kc: keycode) => this._MT(this.LCTL(kc));
    SFT_T = (kc: keycode) => this._MT(this.LSFT(kc));
    ALT_T = (kc: keycode) => this._MT(this.LALT(kc));
    ALGR_T = (kc: keycode) => this._MT(this.RALT(kc));
    GUI_T = (kc: keycode) => this._MT(this.LGUI(kc));
    ALL_T = (kc: keycode) => this._MT(this.HYPR(kc));
    LCAG_T = (kc: keycode) => this._MT(this.LCAG(kc));
    MEH_T = (kc: keycode) => this._MT(this.MEH(kc));

    LCTL = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_LCTRL");
    LSFT = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_LSHIFT");
    LALT = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_LALT");
    LGUI = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_LGUI");
    RCTL = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_RCTRL");
    RSFT = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_RSHIFT");
    RALT = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_RALT");
    RGUI = (kc: keycode | IModResult | IParseError) => this._MOD(kc, "KC_RGUI");
    LCAG = (kc: keycode | IModResult | IParseError) => this.LCTL(this.LALT(this.LGUI(kc)));
    HYPR = (kc: keycode): IModLikeResult | IParseError => {
        if (isKeycode(kc)) {
            return {
                type: "modlikeresult",
                keycode: kc,
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
    MEH = (kc: keycode): IModLikeResult | IParseError => {
        if (isKeycode(kc)) {
            return {
                type: "modlikeresult",
                keycode: kc,
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
}

export const qmkExecutor: Executor<QmkFunctionResult> = new QmkFunctionsExecutor() as any;

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
