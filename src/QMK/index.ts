import { keys, keycode, modifierkeys, normalkeys, specialkeys, modifierkeytype } from "./keycodes";
import { keycodeAliases } from "./aliases";

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
    if (kc in keycodeAliases) {
        return (keycodeAliases as any)[kc];
    }
    if (kc in keys) {
        return keys[kc];
    }
    return null;
};

export const isKeycode = (k: any): k is keycode => {
    return typeof k === "string" && (k in keys || k in keycodeAliases);
};

export const isModifierKeytype = (k: any): k is modifierkeytype => {
    return typeof k === "string" && k in modifierkeys;
};

export const normalizeKeycode = (k: any): keycode | null => {
    if (k in keycodeAliases) {
        return usbcodeToKeycode((keycodeAliases as any)[k]);
    }
    if (k in keys) {
        return k;
    }
    return null;
};
