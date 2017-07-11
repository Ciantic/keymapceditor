import { expect, config } from "chai";
import { QmkFunctionsExecutor } from "../src/QMK/functions";
import { omit } from "lodash";

config.truncateThreshold = 0;
describe("qmk functions", () => {
    let qmkExecutor = new QmkFunctionsExecutor();
    it("modifier combinations LALT", () => {
        expect(omit(qmkExecutor.LALT("KC_NO"), ["getKeycapText"])).to.be.deep.equal({
            type: "modresult",
            keycode: "KC_NO",
            mods: ["KC_LALT"],
            modifierText: "Alt",
            rendered: { centered: "Alt", bottomcenter: false },
        });
    });
    it("modifier combinations nested", () => {
        let inner;
        inner = qmkExecutor.LSFT("KC_NO");
        expect(omit(qmkExecutor.LALT(inner), ["getKeycapText"])).to.be.deep.equal({
            type: "modresult",
            keycode: "KC_NO",
            mods: ["KC_LSHIFT", "KC_LALT"],
            modifierText: "Sft+Alt",
            rendered: { centered: "Sft+Alt", bottomcenter: false },
        });
    });
    it("modifier combinations LALT", () => {
        expect(omit(qmkExecutor.LALT("KC_LSHIFT"), ["getKeycapText"])).to.be.deep.equal({
            type: "modresult",
            keycode: "KC_NO",
            mods: ["KC_LSHIFT", "KC_LALT"],
            modifierText: "Sft+Alt",
            rendered: { centered: "Sft+Alt", bottomcenter: false },
        });
    });
});
