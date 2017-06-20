import { ansi104ReferenceKeyboard } from './ansi104';
import { iso105ReferenceKeyboard } from './iso105';
import { keycode } from "../QMK/keycodes";
import { IKeyboardLayoutKeyDefinition } from "../KLE/keyboardlayout";

export type IReferenceKeyboardLayout = (keycode | IKeyboardLayoutKeyDefinition)[][];

export interface IReferenceKeyboard {
    keyboard: IReferenceKeyboardLayout;
    name: string;
}

export const referenceKeyboards: IReferenceKeyboard[] = [
    ansi104ReferenceKeyboard,
    iso105ReferenceKeyboard
]