import { Keymapping } from './index';
import { LANGS } from "../Langs";

// This mapping is typically used in Windows 10 and Linux by default
class FinnishStandardMapping extends Keymapping {
    constructor() {
        super()
        this.name = LANGS.FinnishStandardKeyboard
        this.mapping = {
            // Number row
            "KC_GRAVE" : "§½",
            "KC_1" : "1!}",
            "KC_2" : "2\"@",
            "KC_4" : "4¤$",
            "KC_5" : "5%€",
            "KC_6" : "6&",
            "KC_7" : "7/",
            "KC_8" : "8(",
            "KC_9" : "9)",
            "KC_0" : "0=}",
            "KC_MINUS" : "+?\\",
            "KC_EQUAL" : { symbols : "´`", deadKeys : ["normal", "shifted"] },

            // Qwerty row
            "KC_E" : "eE€",
            "KC_LBRACKET" : "åÅ",
            "KC_RBRACKET" : { symbols : "¨^~", deadKeys : ["normal", "shifted", "altgr"] },

            // Asdf row
            "KC_SCOLON" : "öÖ",
            "KC_QUOTE" : "äÄ",
            "KC_NONUS_HASH" : "'*",

            // Zxcv row
            "KC_NONUS_BSLASH" : "<>|",
            "KC_COMMA" : ",;",
            "KC_DOT" : ".:",
            "KC_SLASH" : "-_"
        }
    }
}