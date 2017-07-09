import { ansi104ReferenceKeyboard } from "./ansi104";
import { iso105ReferenceKeyboard } from "./iso105";
import { keycode } from "../QMK/keycodes";
import { IKeyboardLayoutKeyDefinition } from "../KLE/keyboardlayout";

export type IReferenceKeyboardLayout = (keycode | IKeyboardLayoutKeyDefinition)[][];

export interface IReferenceKeyboard {
    keyboard: IReferenceKeyboardLayout;
    name: string;
}

const referenceKeyboardIndex = {
    ansi104: ansi104ReferenceKeyboard,
    iso105: iso105ReferenceKeyboard,
};

export const referenceKeyboards: { [k: string]: IReferenceKeyboard } = referenceKeyboardIndex;

export type ReferenceKeyboardKey = keyof typeof referenceKeyboardIndex;
