import { ansi104 } from './ansi104';
import { iso105 } from './iso105';
import { QmkUsbLayoutArray } from "./keycodes";
import { LANGS } from "../Langs";

export interface IReferenceKeyboard {
    keyboard: QmkUsbLayoutArray;
    name: string;
}

export const referenceKeyboards: IReferenceKeyboard[] = [
    {
        keyboard : ansi104,
        name : LANGS.Ansi104,
    },
    {
        keyboard : iso105,
        name : LANGS.Iso105,
    }
]