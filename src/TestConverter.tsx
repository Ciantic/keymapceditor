require("./App.scss");

import {
    action,
    observable,
    computed,
    when,
    reaction,
    IReactionDisposer,
    autorun,
    runInAction,
} from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { cns } from "./Utils/classnames";
import { Key } from "./Components/Key";
const styles = require("./TestRenderer.module.scss");

type Coordinate = [number, number];

type KeyDefinition = {
    label: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
    ks?: Coordinate[];
};

type LayoutDefinition = {
    layout: KeyDefinition[];
};

type LayoutFormat = {
    [keyword: string]: LayoutDefinition; // keyword is the "LAYOUT_something"
};

type InfoFormat = {
    keyboard_name: string;
    url: string;
    bootloader: string;
    maintainer: string;
    width: number;
    height: number;
    layouts: LayoutFormat;
};

/*
https://jsfiddle.net/3coov881/4/
// The first row starts with coordinate y = 0 by default
let n = 0;
let layout = [
    [{x:3.5},"3",{x:10.5},"41"],
    [{y:-0.875,x:2.5},"2",{x:1},"4",{x:8.5},"40",{x:1},"42"],
    [{y:-0.875,x:5.5},"5","6",{x:4.5},"38","39"],
    [{y:-0.875,w:1.5},"0","1",{x:14.5},"43",{w:1.5},"44"],
    [{y:-0.375,x:3.5},"10",{x:10.5},"48"],
    [{y:-0.875,x:2.5},"9",{x:1},"11",{x:8.5},"47",{x:1},"49"],
    [{y:-0.875,x:5.5},"12",{h:1.5},"13",{x:4.5,h:1.5},"45","46"],
    [{y:-0.875,w:1.5},"7","8",{x:14.5},"50",{w:1.5},"51"],
    [{y:-0.375,x:3.5},"17",{x:10.5},"54"],
    [{y:-0.875,x:2.5},"16",{x:1},"18",{x:8.5},"53",{x:1},"55"],
    [{y:-0.875,x:5.5},"19",{x:6.5},"52"],
    [{y:-0.875,w:1.5},"14","15",{x:14.5},"56",{w:1.5},"57"],
    [{y:-0.625,x:6.5,h:1.5},"26",{x:4.5,h:1.5},"58"],
    [{y:-0.75,x:3.5},"23",{x:10.5},"61"],
    [{y:-0.875,x:2.5},"22",{x:1},"24",{x:8.5},"60",{x:1},"62"],
    [{y:-0.875,x:5.5},"25",{x:6.5},"59"],
    [{y:-0.875,w:1.5},"20","21",{x:14.5},"63",{w:1.5},"64"],
    [{y:-0.375,x:3.5},"30",{x:10.5},"66"],
    [{y:-0.875,x:2.5},"29",{x:1},"31",{x:8.5},"65",{x:1},"67"],
    [{y:-0.75,x:0.5},"27","28",{x:14.5},"68","69"],
    [{r:30,rx:6.5,ry:4.25,y:-1,x:1},"32","33"],
    [{h:2},"35",{h:2},"36","34"],
    [{x:2},"37"],
    [{r:-30,rx:13,y:-1,x:-3},"70","71"],
    [{x:-3},"72",{h:2},"74",{h:2},"75"],
    [{x:-3},"73"]
];
let keys = [];
let y = 0;
let r = 0;
let rx = 0;
let ry = 0;
let areaHeight = 0;
let areaWidth = 0;
layout.forEach(row => {
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
        if (typeof k === "object") {
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
                                let newKey = {
                    label: k,
                // Regular key settings
                x: sx,
                y: sy
            };
            keys.push(newKey);
            
            if (r != 0) {
                newKey["r"] = r;
            }
            
            if (w != 1) {
                newKey["w"] = w;
            }
            if (h != 1) {
                newKey["h"] = h;
            }
            
            if (x2 && y2 && w2 && h2) {
                newKey["VECTORDATA"] = [x2, y2, w2, h2];
            }

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

document.write(JSON.stringify({
    width: areaWidth,
    height: areaHeight,
    layouts: {
    LAYOUT: keys
    }
}));

*/

@observer
export class TestConverter extends React.Component<{}, {}> {
    // @observable private infoJsonValue: InfoFormat | null = null;
    @observable
    private infoJsonTextarea = `

    `;
    render() {
        let infoJsonValue: InfoFormat = null as any;
        try {
            infoJsonValue = JSON.parse(this.infoJsonTextarea);
        } catch (e) {}
        return (
            <div>
                <textarea
                    value={this.infoJsonTextarea}
                    spellCheck={false}
                    className={cns("pt-input pt-fill", styles.inputTextarea)}
                    onChange={this.onChangeKeymapsTextarea}
                />
            </div>
        );
    }
    @action
    private onChangeKeymapsTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.infoJsonTextarea = e.target.value;
    };
}
