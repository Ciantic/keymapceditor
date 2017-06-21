import { ergodoxKeyboardLayout } from "./ergodox";
import { KeyboardLayoutArray } from "../KLE/keyboardlayout";

export interface IKeyboardLayout {
    layout: KeyboardLayoutArray;
    name: string;
}

export const keyboardLayouts: IKeyboardLayout[] = [ergodoxKeyboardLayout];
