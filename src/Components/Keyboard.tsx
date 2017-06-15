import * as React from "react";
import { Key, KeyStyle, KeyProps } from './Key';
import { observable, action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { asDefaultMap } from "../Utils/asDefaultMap";

const styles = require("./Keyboard.module.scss");

interface IKeyboardLayoutNextKey {
    x: number;
    y: number;
    w: number;
    h: number;
    x2: number;
    y2: number;
    w2: number;
    h2: number;
    l: number;
    n: boolean;
    r: number;
    rx: number;
    ry: number;
}

interface IKeyboardLayoutSubsequentKey {
    c: string;
    t: string;
    g: boolean;
    a: number;
    f: number;
    f2: number;
    p: string;
}

type IKeyboardLayoutKeyDefinition = Partial<IKeyboardLayoutNextKey> & Partial<IKeyboardLayoutSubsequentKey>

const isKeyboardLayoutKeyDefinition = (o: any): o is IKeyboardLayoutKeyDefinition => {
    return typeof o === "object";
}

@observer
export class KeyboardLayout extends React.Component<{ 
    className?: string;
    layout: any[][];
    keyStyles: KeyStyle[];
    onMouseOverKey?: (keyIndex: number) => () => void;
    onMouseOutKey?: (keyIndex: number) => () => void;
    onClickKey?: (keyIndex: number) => () => void;
}, void> {
    render() {
        let props = this.props;
        let keys: KeyProps[] = [];
        let n = 0;
        let onMouseOverKey = props.onMouseOverKey || ((n: number) => () => {});
        let onMouseOutKey = props.onMouseOutKey || ((n: number) => () => {});
        let onClickKey = props.onClickKey || ((n: number) => () => {});

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
                    if (("rx" in k) || ("ry" in k)) {
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
                    if (("x2" in k) || ("y2" in k) || ("w2" in k) || ("h2" in k)) {
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

                        // Rotation 
                        text: k,

                        // Style
                        style: props.keyStyles[n],

                        // Events
                        onMouseOut: onMouseOutKey(n),
                        onMouseOver: onMouseOverKey(n),
                        onClick: onClickKey(n)
                    });

                    areaWidth = Math.max(areaWidth, x + w, x + x2 + w2);
                    areaHeight = Math.max(areaHeight, hy, y + h, y + y2 + h2);

                    // Key index
                    n += 1;

                    // After each keycap, the current x coordinate is incremented by the previous cap's width.
                    x += w;

                    // Reset the width and height for subsequent keys
                    w = 1;
                    h = 1;
                    x2 = 0;
                    y2 = 0;
                    w2 = 0;
                    h2 = 0;
                }
            })
            // each subsequent row increments the y coordinate by 1.0.
            y += 1;
        })

        // Convert the value to percentages
        const c = (v) => {
            return v / areaWidth * 100;
        };
        
        return <div 
            className={this.props.className}
            style={{
                position: "relative"
            }}>
            {keys.map(k => <Key 
            {...k} 
            x={c(k.x)} 
            y={c(k.y)} 
            x2={c(k.x2)} 
            y2={c(k.y2)} 
            w={c(k.w)} 
            h={c(k.h)} 
            w2={c(k.w2)} 
            h2={c(k.h2)} 
            />)}
            <div style={{
                position: "relative",
                paddingTop: areaHeight / areaWidth * 100 + "%"
            }}></div>
        </div>
    }
}


@observer
export class Keyboard extends React.Component<{
    className?: string;
    layout: (string | IKeyboardLayoutKeyDefinition)[][]
}, void> {
    // 1K oughta be enough
    @observable
    private keyStyles = new Array<KeyStyle>(1024).fill({
        hovered : false,
        pressed : false
    });
    render() {
        return <KeyboardLayout 
            className={this.props.className}
            keyStyles={this.keyStyles} 
            layout={this.props.layout} 
            onMouseOutKey={this.onMouseOutKey}
            onMouseOverKey={this.onMouseOverKey}
            onClickKey={this.onClickKey}
            />
    }

    onClickKey = (n: number) => action(() => {
        this.keyStyles[n].pressed = !this.keyStyles[n].pressed;
    });
    
    onMouseOverKey = (n: number) => action(() => {
        this.keyStyles[n].hovered = true;
    })

    onMouseOutKey = (n: number) => action(() => {
        this.keyStyles[n].hovered = false;
    })
}
