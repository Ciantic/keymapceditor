import { ergodoxKeyboardLayout } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";

export interface IKeyboardLayout {
    layout: KeyboardLayoutArray;
    name: string;
    keyCount: number;
}

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout];
