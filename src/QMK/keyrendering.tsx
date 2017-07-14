import * as React from "react";
import { QmkFunctionResult } from "./functions";
import { KeycapText, KeycapBackground } from "../Components/Key";
import { isModifierKeytype, isKeycode, isQmkKeycode } from "./index";
import { IconClasses } from "@blueprintjs/core";
import { keycode, qmkkeycode } from "./keycodes";

const renderBlueprintIcon = (icon: keyof typeof IconClasses) => {
    return (
        <span
            className={`${IconClasses[icon]} pt-icon`}
            style={{
                fontSize: "110%",
            }}
        />
    );
};

const renderBlueprintIconCentered = (icon: keyof typeof IconClasses) => {
    return {
        centered: renderBlueprintIcon(icon),
    };
};

export const renderKeycapBackground = (expr: QmkFunctionResult): KeycapBackground => {
    if (isModifierKeytype(expr)) {
        return "mod";
    }
    if (typeof expr === "object") {
        if (expr.type === "langkeycode" && isModifierKeytype(expr.keycode)) {
            return "mod";
        }
        if (expr.type === "modresult") {
            return "mod";
        }
        if (expr.type === "modtapresult") {
            return "mod";
        }
        if (expr.type === "layertapresult") {
            return "layer";
        }
        if (expr.type === "momentarylayer") {
            return "layer";
        }
        if (expr.type === "togglelayer") {
            return "layer";
        }
    }
    return "";
};

export const renderKeycapText = (expr: QmkFunctionResult, defaultValue: KeycapText): KeycapText => {
    // Language agnostic renderings
    let kc = getKeycodeOrStringExpr(expr);
    if (kc !== null) {
        if ((isKeycode(kc) || isQmkKeycode(kc)) && kc in knownRenderings) {
            return (knownRenderings as any)[kc];
        }
    }

    if (typeof expr === "object" && expr.rendered) {
        return expr.rendered;
    }

    return defaultValue;
};

const knownRenderings = {
    KC_NO: {},
    KC_ROLL_OVER: {},
    KC_BSPACE: {
        centered: <span style={{ fontSize: "130%" }}>⌫</span>,
    },
    KC_ENTER: {
        centered: <span style={{ fontSize: "170%" }}>⏎</span>,
    },
    KC_UP: renderBlueprintIconCentered("ARROW_UP"),
    KC_DOWN: renderBlueprintIconCentered("ARROW_DOWN"),
    KC_LEFT: renderBlueprintIconCentered("ARROW_LEFT"),
    KC_RIGHT: renderBlueprintIconCentered("ARROW_RIGHT"),
    RGB_TOG: {
        centered: [renderBlueprintIcon("LIGHTBULB"), renderBlueprintIcon("POWER")],
    },
    RGB_MOD: {
        centered: [renderBlueprintIcon("LIGHTBULB"), renderBlueprintIcon("MORE")],
    },
    RGB_HUI: {
        centered: [
            renderBlueprintIcon("LIGHTBULB"),
            renderBlueprintIcon("TINT"),
            renderBlueprintIcon("PLUS"),
        ],
    },
    RGB_HUD: {
        centered: [
            renderBlueprintIcon("LIGHTBULB"),
            renderBlueprintIcon("TINT"),
            renderBlueprintIcon("MINUS"),
        ],
    },
    RGB_SAI: {
        centered: [
            renderBlueprintIcon("LIGHTBULB"),
            renderBlueprintIcon("CONTRAST"),
            renderBlueprintIcon("PLUS"),
        ],
    },
    RGB_SAD: {
        centered: [
            renderBlueprintIcon("LIGHTBULB"),
            renderBlueprintIcon("CONTRAST"),
            renderBlueprintIcon("MINUS"),
        ],
    },
    RGB_VAI: {
        centered: [renderBlueprintIcon("LIGHTBULB"), renderBlueprintIcon("PLUS")],
    },
    RGB_VAD: {
        centered: [renderBlueprintIcon("LIGHTBULB"), renderBlueprintIcon("MINUS")],
    },
    KC_AUDIO_VOL_UP: renderBlueprintIconCentered("VOLUME_UP"),
    KC_AUDIO_VOL_DOWN: renderBlueprintIconCentered("VOLUME_DOWN"),
    KC_AUDIO_MUTE: renderBlueprintIconCentered("VOLUME_OFF"),
    KC_MEDIA_PREV_TRACK: renderBlueprintIconCentered("STEP_BACKWARD"),
    KC_MEDIA_NEXT_TRACK: renderBlueprintIconCentered("STEP_FORWARD"),
    KC_MEDIA_PLAY_PAUSE: {
        centered: [renderBlueprintIcon("PLAY"), renderBlueprintIcon("PAUSE")],
    },
    KC_WWW_BACK: {
        centered: [renderBlueprintIcon("GLOBE"), renderBlueprintIcon("ARROW_LEFT")],
    },
} as Partial<{ [k in (qmkkeycode | keycode)]: KeycapText }>;

const getKeycodeOrStringExpr = (expr: QmkFunctionResult): string | null => {
    if (typeof expr === "string") {
        return expr;
    }

    // Language keys with special rendering
    if (typeof expr === "object" && expr.type === "langkeycode") {
        return expr.keycode;
    }
    // Language symbols without modifiers
    if (typeof expr === "object" && expr.type === "langsymbol" && expr.mods.length === 0) {
        return expr.keycode;
    }
    return null;
};
