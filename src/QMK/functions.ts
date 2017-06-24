import { keycode } from "./keycodes";
import { KeycapText } from "../Components/Key";

// https://github.com/qmk/qmk_firmware/blob/master/docs/key_functions.md

interface IFunc {
    params: number;
    getKeycapText(params: string[]): KeycapText;
}

class ModifierFunc implements IFunc {
    public params: number;

    private readonly keycode: keycode;

    constructor(keycode: keycode) {
        this.params = 1;
        this.keycode = keycode;
    }
    getKeycapText(params: string[]): KeycapText {
        return {};
    }
}

const functions = {
    LSFT: new ModifierFunc("KC_LSHIFT"),
    RSFT: new ModifierFunc("KC_RSHIFT"),
};
