import * as React from "react";
import { Key, KeyStyle, KeyProps, KeycapText } from "./Key";
import { observable, action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { asDefaultMap } from "../Utils/asDefaultMap";
import {
    IKeyboardLayoutNextKey,
    IKeyboardLayoutSubsequentKey,
    IKeyboardLayoutKeyDefinition,
    KeyboardLayoutArray,
} from "../KLE/keyboardlayout";
import { cns } from "../Utils/classnames";

const styles = require("./Keyboard.module.scss");

const isKeyboardLayoutKeyDefinition = (o: any): o is IKeyboardLayoutKeyDefinition => {
    return typeof o === "object";
};

interface KeyboardLayoutProps {
    className?: string;
    layout: KeyboardLayoutArray;
    disabled?: boolean;
    stylePressedKeys?: Map<string, boolean>;
    styleHoveredKeys?: Map<string, boolean>;
    getKeycapText?: (layoutValue: string, keyIndex: number) => KeycapText;
    onMouseEnterKey?: (layoutValue: string, keyIndex: number) => () => void;
    onMouseLeaveKey?: (layoutValue: string, keyIndex: number) => () => void;
    onClickKey?: (layoutValue: string, keyIndex: number) => () => void;
}

@observer
export class KeyboardLayout extends React.Component<KeyboardLayoutProps, void> {
    static defaultProps: Partial<KeyboardLayoutProps> = {
        disabled: false,
        stylePressedKeys: new Map(),
        styleHoveredKeys: new Map(),
        onClickKey: (v: string, n: number) => () => {},
        onMouseLeaveKey: (v: string, n: number) => () => {},
        onMouseEnterKey: (v: string, n: number) => () => {},
    };

    render() {
        let props = this.props;
        let keys: KeyProps[] = [];
        let n = 0;
        let onMouseEnterKey = props.onMouseEnterKey;
        let onMouseLeaveKey = props.onMouseLeaveKey;
        let onClickKey = props.onClickKey;

        // The first row starts with coordinate y = 0 by default
        let y = 0;
        let r = 0;
        let rx = 0;
        let ry = 0;
        let areaHeight = 0;
        let areaWidth = 0;
        props.layout.forEach(row => {
            // Specification says "Each row resets the coordinate x = 0.", but
            // I've found out it's not true, at least the way my renderer works
            let x = rx;
            let w = 1;
            let h = 1;
            let x2 = 0;
            let y2 = 0;
            let w2 = 0;
            let h2 = 0;
            row.forEach(k => {
                if (isKeyboardLayoutKeyDefinition(k)) {
                    // Initialize rx and ry if either one is given
                    if ("rx" in k || "ry" in k) {
                        k.rx = "rx" in k ? k.rx : rx;
                        k.ry = "ry" in k ? k.ry : ry;
                    }

                    // Rotation
                    if ("rx" in k) {
                        rx = k.rx;
                        x = k.rx; // notify!
                    }
                    if ("ry" in k) {
                        ry = k.ry;
                        y = k.ry; // notify!
                    }
                    if ("r" in k) {
                        r = k.r;
                    }

                    // These specify x and y values to be added to the current coordinates.
                    x += "x" in k ? k.x : 0;
                    y += "y" in k ? k.y : 0;

                    // Width and height of the main key
                    w = k.w || 1;
                    h = k.h || 1;

                    // Additional rectangle e.g. for special enter in Ansi 104
                    if ("x2" in k || "y2" in k || "w2" in k || "h2" in k) {
                        x2 = "x2" in k ? k.x2 : 0;
                        y2 = "y2" in k ? k.y2 : 0;
                        w2 = "w2" in k ? k.w2 : 0;
                        h2 = "h2" in k ? k.h2 : 0;
                    }
                } else if (typeof k === "string") {
                    // Rotate the keys along the points rx and ry, notice the
                    // negative angle for coordinate corrected values
                    let rr = -r * Math.PI / 180;
                    let xp = rx * Math.cos(rr) - ry * Math.sin(rr);
                    let yp = ry * Math.cos(rr) + rx * Math.sin(rr);
                    let sx = x - rx + xp;
                    let sy = y - ry + yp;

                    // Height corrected y in the original transform
                    let hy = (sy + h) * Math.cos(-rr) + (sx + w) * Math.sin(-rr);

                    keys.push({
                        // Regular key settings
                        x: sx,
                        y: sy,
                        w: w,
                        h: h,
                        r: r,

                        // Second Rectangle for oddly shaped key e.g. Enter
                        x2: x2,
                        y2: y2,
                        w2: w2,
                        h2: h2,

                        // Text
                        texts: props.getKeycapText && props.getKeycapText(k, n),

                        // Style
                        style: {
                            disabled: props.disabled,
                            hovered: !props.disabled && props.styleHoveredKeys.get(k),
                            pressed: !props.disabled && props.stylePressedKeys.get(k),
                        },

                        // Events
                        onMouseLeave: !props.disabled && onMouseLeaveKey(k, n),
                        onMouseEnter: !props.disabled && onMouseEnterKey(k, n),
                        onClick: !props.disabled && onClickKey(k, n),
                    });

                    areaWidth = Math.max(areaWidth, x + w, x + x2 + w2);
                    areaHeight = Math.max(areaHeight, hy, y + h, y + y2 + h2);

                    // Key index
                    n += 1;

                    // After each keycap, the current x coordinate is
                    // incremented by the previous cap's width.
                    x += w;

                    // Reset the width and height for subsequent keys
                    w = 1;
                    h = 1;
                    x2 = 0;
                    y2 = 0;
                    w2 = 0;
                    h2 = 0;
                }
            });
            // each subsequent row increments the y coordinate by 1.0.
            y += 1;
        });

        // Convert the value to percentages
        const c = v => {
            return v / areaWidth * 100;
        };

        return (
            <div
                className={cns(styles.keyboard, this.props.className)}
                style={{
                    position: "relative",
                }}
            >
                {keys.map((k, n) =>
                    <Key
                        key={n}
                        {...k}
                        x={c(k.x)}
                        y={c(k.y)}
                        x2={c(k.x2)}
                        y2={c(k.y2)}
                        w={c(k.w)}
                        h={c(k.h)}
                        w2={c(k.w2)}
                        h2={c(k.h2)}
                    />
                )}
                <div
                    style={{
                        position: "relative",
                        paddingTop: areaHeight / areaWidth * 100 + "%",
                    }}
                />
            </div>
        );
    }
}
