import { KeyboardLayoutArray } from "../KLE/keyboardlayout";
import { IKeyboardLayout } from "./index";
import { LANGS } from "../Langs";

// prettier-ignore
const clueboard: KeyboardLayoutArray = [
    [{"a":4,"f":3},"0","1","2","3","4","5","6","7","8","9","10","11","12","13","14",{"x":0.5},"15"],
    [{"w":1.5},"16","17","18","19","20","21","22","23","24","25","26","27","28",{"w":1.5},"29",{"x":0.5},"30"],
    [{"w":1.75},"31","32","33","34","35","36","37","38","39","40","41","42","43",{"w":1.25},"44"],
    [{"w":1.25},"45","46","47","48","49","50","51","52","53","54","55","56","57",{"w":1.25},"58","59"],
    [{"w":1.25},"60","61",{"w":1.25},"62",{"w":1.25},"63",{"w":2},"64",{"w":2},"65",{"w":1.25},"66",{"w":1.25},"67","68",{"w":1.25},"69","70","71","72"]
];

export const clueboardKeyboardLayout: IKeyboardLayout = {
    defaultKeymapUrl:
        "https://raw.githubusercontent.com/qmk/qmk_firmware/3f3fa0791895f14370b4bb3e8512597688c45122/keyboards/clueboard/66/keymaps/default/keymap.c",
    layout: clueboard,
    name: "Clueboard",
    keyCount: 73,
};
