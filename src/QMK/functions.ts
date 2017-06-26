import { keycode, modifierkeys, modifierkeytype } from "./keycodes";
import { KeycapText } from "../Components/Key";
import { ILanguageMapping, keytypes } from "../LanguageMaps/index";
import { isKeycode } from "./index";
import { Executor } from "../KeyboardLayouts/index";

// https://github.com/qmk/qmk_firmware/blob/master/docs/key_functions.md
// https://github.com/qmk/qmk_firmware/blob/master/quantum/quantum_keycodes.h

interface Context {
    langMapping: ILanguageMapping;
}

interface IRenderable {
    getKeycapText(): KeycapText;
}

interface IParseError {
    type: "error";
    error: "parse";
    data: string;
}

interface IModResult extends IRenderable {
    type: "modresult";
    keycode: keycode;
    mods: modifierkeytype[];
}

export type QmkFunctionResult = IModResult | IParseError | string | undefined | null;

export const isModResult = (res: QmkFunctionResult): res is IModResult => {
    return res && typeof res === "object" && res.type === "modresult";
};

export const isRenderableResult = (res: QmkFunctionResult | IRenderable): res is IRenderable => {
    return res && typeof res === "object" && "getKeycapText" in res;
};

class QmkFunctionsExecutor {
    _MT = (kc: keycode | IModResult, key: modifierkeytype): IModResult | IParseError => {
        if (isKeycode(kc)) {
            return {
                type: "modresult",
                keycode: kc,
                mods: [key],
                getKeycapText() {
                    return {
                        centered: kc,
                        bottomcenter: key,
                    };
                },
            };
        } else if (isModResult(kc)) {
            return {
                type: "modresult",
                keycode: kc.keycode,
                mods: kc.mods.concat(key),
                getKeycapText() {
                    return {
                        centered: kc.keycode,
                        bottomcenter: kc.mods.concat(key).join("+"),
                    };
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

    // LT = (layer: number, kc: keycode) => {};
    // TG = (layer: number) => {};
    // TO = (layer: number) => {};
    // TT = (layer: number) => {};

    LCTL = (kc: keycode | IModResult) => this._MT(kc, "KC_LCTRL");
    LSFT = (kc: keycode | IModResult) => this._MT(kc, "KC_LSHIFT");
    LALT = (kc: keycode | IModResult) => this._MT(kc, "KC_LALT");
    LGUI = (kc: keycode | IModResult) => this._MT(kc, "KC_LGUI");
    RCTL = (kc: keycode | IModResult) => this._MT(kc, "KC_RCTRL");
    RSFT = (kc: keycode | IModResult) => this._MT(kc, "KC_RSHIFT");
    RALT = (kc: keycode | IModResult) => this._MT(kc, "KC_RALT");
    RGUI = (kc: keycode | IModResult) => this._MT(kc, "KC_RGUI");
}

export const qmkExecutor: Executor<QmkFunctionResult> = new QmkFunctionsExecutor() as any;
