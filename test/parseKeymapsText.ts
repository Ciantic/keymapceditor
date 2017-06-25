import { expect } from "chai";
import { parseKeymapsText, parseKeyExpression } from "../src/KeyboardLayouts/index";

const ERGODOX_DEFAULT = `
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
// If it accepts an argument (i.e, is a function), it doesn't need KC_.
// Otherwise, it needs KC_*
[BASE] = KEYMAP(// layer 0 : default
 /* blaa */
        // left hand
        KC_EQL,         KC_1,         KC_2,   KC_3,   KC_4,   KC_5,   KC_LEFT,
        KC_DELT,        KC_Q,         KC_W,   KC_E,   KC_R,   KC_T,   TG(SYMB),
        KC_BSPC,        KC_A,         KC_S,   KC_D,   KC_F,   KC_G,
        KC_LSFT,        CTL_T(KC_Z),  KC_X,   KC_C,   KC_V,   KC_B,   ALL_T(KC_NO),
        LT(SYMB,KC_GRV),KC_QUOT,      LALT(KC_LSFT),  KC_LEFT,KC_RGHT,
                                              ALT_T(KC_APP),  KC_LGUI,
                                                              KC_HOME,
                                               KC_SPC,KC_BSPC,KC_END,
                /* blaa */
        // right hand
             KC_RGHT,     KC_6,   KC_7,  KC_8,   KC_9,   KC_0,             KC_MINS,
             TG(SYMB),    KC_Y,   KC_U,  KC_I,   KC_O,   KC_P,             KC_BSLS,
                          KC_H,   KC_J,  KC_K,   KC_L,   LT(MDIA, KC_SCLN),GUI_T(KC_QUOT),
             MEH_T(KC_NO),KC_N,   KC_M,  KC_COMM,KC_DOT, CTL_T(KC_SLSH),   KC_RSFT,
                                  KC_UP, KC_DOWN,KC_LBRC,KC_RBRC,          KC_FN1,
             KC_LALT,        CTL_T(KC_ESC),
             KC_PGUP,
             KC_PGDN,KC_TAB, KC_ENT
    ),
/* Keymap 1: Symbol Layer
 *
 */
// SYMBOLS
[SYMB] = KEYMAP(/*blaa */
       // left hand
       VRSN,   KC_F1,  KC_F2,  KC_F3,  KC_F4,  KC_F5,  KC_TRNS,
       KC_TRNS,KC_EXLM,KC_AT,  KC_LCBR,KC_RCBR,KC_PIPE,KC_TRNS,
       KC_TRNS,KC_HASH,KC_DLR, KC_LPRN,KC_RPRN,KC_GRV,
       KC_TRNS,KC_PERC,KC_CIRC,KC_LBRC,KC_RBRC,KC_TILD,KC_TRNS,
          EPRM,KC_TRNS,KC_TRNS,KC_TRNS,KC_TRNS,
                                       RGB_MOD,KC_TRNS,
                                               KC_TRNS,
                               RGB_VAD,RGB_VAI,KC_TRNS,
       // right hand
       KC_TRNS, KC_F6,   KC_F7,  KC_F8,   KC_F9,   KC_F10,  KC_F11,
       KC_TRNS, KC_UP,   KC_7,   KC_8,    KC_9,    KC_ASTR, KC_F12,
                KC_DOWN, KC_4,   KC_5,    KC_6,    KC_PLUS, KC_TRNS,
       KC_TRNS, KC_AMPR, KC_1,   KC_2,    KC_3,    KC_BSLS, KC_TRNS,
                         KC_TRNS,KC_DOT,  KC_0,    KC_EQL,  KC_TRNS,
       RGB_TOG, RGB_SLD,
       KC_TRNS,
       KC_TRNS, RGB_HUD, RGB_HUI
),
/* Keymap 2: Media and mouse keys */
// MEDIA AND MOUSE
[MDIA] = KEYMAP(KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS,
       KC_TRNS, KC_TRNS, KC_TRNS, KC_MS_U, KC_TRNS, KC_TRNS, KC_TRNS,
       KC_TRNS, KC_TRNS, KC_MS_L, KC_MS_D, KC_MS_R, KC_TRNS,
       KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS,
       KC_TRNS, KC_TRNS, KC_TRNS, KC_BTN1, KC_BTN2,
                                           KC_TRNS, KC_TRNS,
                                                    KC_TRNS,
                                  KC_TRNS, KC_TRNS, KC_TRNS,
    // right hand
       KC_TRNS,  KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS,
       KC_TRNS,  KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS,
                 KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_TRNS, KC_MPLY,
       KC_TRNS,  KC_TRNS, KC_TRNS, KC_MPRV, KC_MNXT, KC_TRNS, KC_TRNS,
                          KC_VOLU, KC_VOLD, KC_MUTE, KC_TRNS, KC_TRNS,
       KC_TRNS, KC_TRNS,
       KC_TRNS,
       KC_TRNS, KC_TRNS, KC_WBAK
),
};
`;

describe("parseKeymapsText", () => {
    it("should work", () => {
        let c = parseKeymapsText(76, ERGODOX_DEFAULT);

        // prettier-ignore
        expect(c).to.be.deep.equal([
            ['KC_EQL', 'KC_1', 'KC_2', 'KC_3', 'KC_4', 'KC_5', 'KC_LEFT', 'KC_DELT', 'KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'TG(SYMB)', 'KC_BSPC', 'KC_A', 'KC_S', 'KC_D', 'KC_F', 'KC_G', 'KC_LSFT', 'CTL_T(KC_Z)', 'KC_X', 'KC_C', 'KC_V', 'KC_B', 'ALL_T(KC_NO)', 'LT(SYMB,KC_GRV)', 'KC_QUOT', 'LALT(KC_LSFT)', 'KC_LEFT', 'KC_RGHT', 'ALT_T(KC_APP)', 'KC_LGUI', 'KC_HOME', 'KC_SPC', 'KC_BSPC', 'KC_END', 'KC_RGHT', 'KC_6', 'KC_7', 'KC_8', 'KC_9', 'KC_0', 'KC_MINS', 'TG(SYMB)', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P', 'KC_BSLS', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'LT(MDIA,KC_SCLN)', 'GUI_T(KC_QUOT)', 'MEH_T(KC_NO)', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'CTL_T(KC_SLSH)', 'KC_RSFT', 'KC_UP', 'KC_DOWN', 'KC_LBRC', 'KC_RBRC', 'KC_FN1', 'KC_LALT', 'CTL_T(KC_ESC)', 'KC_PGUP', 'KC_PGDN', 'KC_TAB', 'KC_ENT'],
            ['VRSN', 'KC_F1', 'KC_F2', 'KC_F3', 'KC_F4', 'KC_F5', 'KC_TRNS', 'KC_TRNS', 'KC_EXLM', 'KC_AT', 'KC_LCBR', 'KC_RCBR', 'KC_PIPE', 'KC_TRNS', 'KC_TRNS', 'KC_HASH', 'KC_DLR', 'KC_LPRN', 'KC_RPRN', 'KC_GRV', 'KC_TRNS', 'KC_PERC', 'KC_CIRC', 'KC_LBRC', 'KC_RBRC', 'KC_TILD', 'KC_TRNS', 'EPRM', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'RGB_MOD', 'KC_TRNS', 'KC_TRNS', 'RGB_VAD', 'RGB_VAI', 'KC_TRNS', 'KC_TRNS', 'KC_F6', 'KC_F7', 'KC_F8', 'KC_F9', 'KC_F10', 'KC_F11', 'KC_TRNS', 'KC_UP', 'KC_7', 'KC_8', 'KC_9', 'KC_ASTR', 'KC_F12', 'KC_DOWN', 'KC_4', 'KC_5', 'KC_6', 'KC_PLUS', 'KC_TRNS', 'KC_TRNS', 'KC_AMPR', 'KC_1', 'KC_2', 'KC_3', 'KC_BSLS', 'KC_TRNS', 'KC_TRNS', 'KC_DOT', 'KC_0', 'KC_EQL', 'KC_TRNS', 'RGB_TOG', 'RGB_SLD', 'KC_TRNS', 'KC_TRNS', 'RGB_HUD', 'RGB_HUI'],
            ['KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_MS_U', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_MS_L', 'KC_MS_D', 'KC_MS_R', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_BTN1', 'KC_BTN2', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_MPLY', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_MPRV', 'KC_MNXT', 'KC_TRNS', 'KC_TRNS', 'KC_VOLU', 'KC_VOLD', 'KC_MUTE', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_TRNS', 'KC_WBAK']
        ]);
    });
});

describe("parseKeyExpression", () => {
    it("One param function should work", () => {
        let v = parseKeyExpression("LSFT( KC_1 )");
        expect(v).to.be.deep.equal({
            func: "LSFT",
            params: ["KC_1"],
        });
    });
    it("Broken one param function should error", () => {
        let v = parseKeyExpression("LSFT(KC_1");
        expect(v).to.be.deep.equal(null);
    });

    it("Two param function should work", () => {
        let v = parseKeyExpression("LT(SYMB, KC_GRV)");
        expect(v).to.be.deep.equal({
            func: "LT",
            params: ["SYMB", "KC_GRV"],
        });
    });

    it("Function that takes function should work", () => {
        let v = parseKeyExpression("LSFT( LALT(KC_A))");
        expect(v).to.be.deep.equal({
            func: "LSFT",
            params: [
                {
                    func: "LALT",
                    params: ["KC_A"],
                },
            ],
        });
    });

    it("Function that takes function, test should work", () => {
        let v = parseKeyExpression("LSFT(TEST, LALT(KC_A), TEST2)");
        expect(v).to.be.deep.equal({
            func: "LSFT",
            params: [
                "TEST",
                {
                    func: "LALT",
                    params: ["KC_A"],
                },
                "TEST2",
            ],
        });
    });
});
