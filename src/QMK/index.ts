import { keys, keycode, modifierkeys, normalkeys, specialkeys } from "./keycodes";
import { keycodeAliases } from "./aliases";

export { keys, keycode, normalkeys, modifierkeys, specialkeys, keycodeAliases };

const _usbcodeToKeycode: { [k: string]: keycode } = {};
Object.keys(keys).forEach((t: keycode) => {
    _usbcodeToKeycode["" + keys[t]] = t;
});

export const usbcodeToKeycode = (usbcode: number): keycode | null => {
    let v = _usbcodeToKeycode["" + usbcode];
    if (v) {
        return v;
    }
    return null;
};

export const keycodeToUsbcode = (kc: keycode): number | null => {
    if (typeof keycodeAliases[kc] !== "undefined") {
        return keycodeAliases[kc];
    }
    if (typeof keys[kc] !== "undefined") {
        return keys[kc];
    }
    return null;
};
