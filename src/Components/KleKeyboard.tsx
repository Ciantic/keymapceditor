import * as React from "react";
import { Key, KeyStyle, KeyProps, KeycapText, KeycapBackground } from "./Key";
import { observable, action, runInAction } from "mobx";
import { observer } from "mobx-react";
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
    styleBackgroundKeys?: Map<string, KeycapBackground>;
    stylePressedKeys?: Map<string, boolean>;
    styleHoveredKeys?: Map<string, boolean>;
    keycapTexts?: Map<string, KeycapText>;
    onMouseEnterKey?: (layoutValue: string, keyIndex: number) => () => void;
    onMouseLeaveKey?: (layoutValue: string, keyIndex: number) => () => void;
    onClickKey?: (layoutValue: string, keyIndex: number) => () => void;
}

@observer
export class KleKeyboard extends React.Component<KeyboardLayoutProps, {}> {
    static defaultProps: Partial<KeyboardLayoutProps> = {
        disabled: false,
        stylePressedKeys: new Map(),
        styleHoveredKeys: new Map(),
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
                    if ("rx" in k && typeof k.rx === "number") {
                        rx = k.rx;
                        x = k.rx; // notify!
                    }
                    if ("ry" in k && typeof k.ry === "number") {
                        ry = k.ry;
                        y = k.ry; // notify!
                    }
                    if ("r" in k && typeof k.r === "number") {
                        r = k.r;
                    }

                    // These specify x and y values to be added to the current coordinates.
                    x += "x" in k && typeof k.x === "number" ? k.x : 0;
                    y += "y" in k && typeof k.y === "number" ? k.y : 0;

                    // Width and height of the main key
                    w = k.w || 1;
                    h = k.h || 1;

                    // Additional rectangle e.g. for special enter in Ansi 104
                    if ("x2" in k || "y2" in k || "w2" in k || "h2" in k) {
                        x2 = "x2" in k && typeof k.x2 === "number" ? k.x2 : 0;
                        y2 = "y2" in k && typeof k.y2 === "number" ? k.y2 : 0;
                        w2 = "w2" in k && typeof k.w2 === "number" ? k.w2 : 0;
                        h2 = "h2" in k && typeof k.h2 === "number" ? k.h2 : 0;
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
                        texts: props.keycapTexts && props.keycapTexts.get(k),

                        // Style
                        style: {
                            disabled: !!props.disabled,
                            hovered:
                                !props.disabled &&
                                !!(props.styleHoveredKeys && props.styleHoveredKeys.get(k)),
                            pressed:
                                !props.disabled &&
                                !!(props.stylePressedKeys && props.stylePressedKeys.get(k)),
                            background:
                                props.styleBackgroundKeys && props.styleBackgroundKeys.get(k),
                        },

                        // Events
                        onMouseLeave:
                            (!props.disabled && onMouseLeaveKey && onMouseLeaveKey(k, n)) ||
                            undefined,
                        onMouseEnter:
                            (!props.disabled && onMouseEnterKey && onMouseEnterKey(k, n)) ||
                            undefined,
                        onClick: (!props.disabled && onClickKey && onClickKey(k, n)) || undefined,
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
        const c = (v: number) => {
            return v / areaWidth * 100;
        };

        return (
            <div
                className={cns(styles.keyboard, this.props.className)}
                style={{
                    position: "relative",
                }}
            >
                {keys.map((k, n) => (
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
                ))}
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
