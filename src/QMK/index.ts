import {
    keys,
    keycode,
    modifierkeys,
    normalkeys,
    specialkeys,
    modifierkeytype,
    qmkkeycode,
    qmkcodes,
} from "./keycodes";
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
    if (kc in keys) {
        return keys[kc];
    }
    return null;
};

export const isKeycode = (k: any): k is keycode => {
    // Removed this  || k in keycodeAliases without much testing
    return typeof k === "string" && k in keys;
};

export const isQmkKeycode = (k: any): k is qmkkeycode => {
    return typeof k === "string" && k in qmkcodes;
};

export const isModifierKeytype = (k: any): k is modifierkeytype => {
    return typeof k === "string" && k in modifierkeys;
};

export const normalizeKeycode = (k: any): keycode | null => {
    if (k in keycodeAliases) {
        return (keycodeAliases as any)[k];
    }
    if (k in keys) {
        return k;
    }
    return null;
};
