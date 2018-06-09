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
import { KeyboardLayoutArray } from "./KLE/keyboardlayout";
import { QmkInfoJson } from "./QMK/info";
const styles = require("./TestRenderer.module.scss");

@observer
export class TestRenderer extends React.Component<{}, {}> {
    @observable private convertFromKleValue: string = "";

    @observable
    private infoJsonTextarea = `
    {
        "keyboard_name": "", 
        "url": "", 
        "maintainer": "qmk", 
        "bootloader": "", 
        "width": 19.5, 
        "height": 9.375, 
        "layouts": {
            "LAYOUT": {
                "layout": [{
                    "label": "3",
                    "x": 3.5,
                    "y": 0
                },
                {
                    "label": "41",
                    "x": 15,
                    "y": 0
                },
                {
                    "label": "2",
                    "x": 2.5,
                    "y": 0.125
                },
                {
                    "label": "4",
                    "x": 4.5,
                    "y": 0.125
                },
                {
                    "label": "40",
                    "x": 14,
                    "y": 0.125
                },
                {
                    "label": "42",
                    "x": 16,
                    "y": 0.125
                },
                {
                    "label": "5",
                    "x": 5.5,
                    "y": 0.25
                },
                {
                    "label": "6",
                    "x": 6.5,
                    "y": 0.25
                },
                {
                    "label": "38",
                    "x": 12,
                    "y": 0.25
                },
                {
                    "label": "39",
                    "x": 13,
                    "y": 0.25
                },
                {
                    "label": "0",
                    "x": 0,
                    "y": 0.375,
                    "w": 1.5
                },
                {
                    "label": "1",
                    "x": 1.5,
                    "y": 0.375
                },
                {
                    "label": "43",
                    "x": 17,
                    "y": 0.375
                },
                {
                    "label": "44",
                    "x": 18,
                    "y": 0.375,
                    "w": 1.5
                },
                {
                    "label": "10",
                    "x": 3.5,
                    "y": 1
                },
                {
                    "label": "48",
                    "x": 15,
                    "y": 1
                },
                {
                    "label": "9",
                    "x": 2.5,
                    "y": 1.125
                },
                {
                    "label": "11",
                    "x": 4.5,
                    "y": 1.125
                },
                {
                    "label": "47",
                    "x": 14,
                    "y": 1.125
                },
                {
                    "label": "49",
                    "x": 16,
                    "y": 1.125
                },
                {
                    "label": "12",
                    "x": 5.5,
                    "y": 1.25
                },
                {
                    "label": "13",
                    "x": 6.5,
                    "y": 1.25,
                    "h": 1.5
                },
                {
                    "label": "45",
                    "x": 12,
                    "y": 1.25,
                    "h": 1.5
                },
                {
                    "label": "46",
                    "x": 13,
                    "y": 1.25
                },
                {
                    "label": "7",
                    "x": 0,
                    "y": 1.375,
                    "w": 1.5
                },
                {
                    "label": "8",
                    "x": 1.5,
                    "y": 1.375
                },
                {
                    "label": "50",
                    "x": 17,
                    "y": 1.375
                },
                {
                    "label": "51",
                    "x": 18,
                    "y": 1.375,
                    "w": 1.5
                },
                {
                    "label": "17",
                    "x": 3.5,
                    "y": 2
                },
                {
                    "label": "54",
                    "x": 15,
                    "y": 2
                },
                {
                    "label": "16",
                    "x": 2.5,
                    "y": 2.125
                },
                {
                    "label": "18",
                    "x": 4.5,
                    "y": 2.125
                },
                {
                    "label": "53",
                    "x": 14,
                    "y": 2.125
                },
                {
                    "label": "55",
                    "x": 16,
                    "y": 2.125
                },
                {
                    "label": "19",
                    "x": 5.5,
                    "y": 2.25
                },
                {
                    "label": "52",
                    "x": 13,
                    "y": 2.25
                },
                {
                    "label": "14",
                    "x": 0,
                    "y": 2.375,
                    "w": 1.5
                },
                {
                    "label": "15",
                    "x": 1.5,
                    "y": 2.375
                },
                {
                    "label": "56",
                    "x": 17,
                    "y": 2.375
                },
                {
                    "label": "57",
                    "x": 18,
                    "y": 2.375,
                    "w": 1.5
                },
                {
                    "label": "26",
                    "x": 6.5,
                    "y": 2.75,
                    "h": 1.5
                },
                {
                    "label": "58",
                    "x": 12,
                    "y": 2.75,
                    "h": 1.5
                },
                {
                    "label": "23",
                    "x": 3.5,
                    "y": 3
                },
                {
                    "label": "61",
                    "x": 15,
                    "y": 3
                },
                {
                    "label": "22",
                    "x": 2.5,
                    "y": 3.125
                },
                {
                    "label": "24",
                    "x": 4.5,
                    "y": 3.125
                },
                {
                    "label": "60",
                    "x": 14,
                    "y": 3.125
                },
                {
                    "label": "62",
                    "x": 16,
                    "y": 3.125
                },
                {
                    "label": "25",
                    "x": 5.5,
                    "y": 3.25
                },
                {
                    "label": "59",
                    "x": 13,
                    "y": 3.25
                },
                {
                    "label": "20",
                    "x": 0,
                    "y": 3.375,
                    "w": 1.5
                },
                {
                    "label": "21",
                    "x": 1.5,
                    "y": 3.375
                },
                {
                    "label": "63",
                    "x": 17,
                    "y": 3.375
                },
                {
                    "label": "64",
                    "x": 18,
                    "y": 3.375,
                    "w": 1.5
                },
                {
                    "label": "30",
                    "x": 3.5,
                    "y": 4
                },
                {
                    "label": "66",
                    "x": 15,
                    "y": 4
                },
                {
                    "label": "29",
                    "x": 2.5,
                    "y": 4.125
                },
                {
                    "label": "31",
                    "x": 4.5,
                    "y": 4.125
                },
                {
                    "label": "65",
                    "x": 14,
                    "y": 4.125
                },
                {
                    "label": "67",
                    "x": 16,
                    "y": 4.125
                },
                {
                    "label": "27",
                    "x": 0.5,
                    "y": 4.375
                },
                {
                    "label": "28",
                    "x": 1.5,
                    "y": 4.375
                },
                {
                    "label": "68",
                    "x": 17,
                    "y": 4.375
                },
                {
                    "label": "69",
                    "x": 18,
                    "y": 4.375
                },
                {
                    "label": "32",
                    "x": 8.75416512459885,
                    "y": -0.5693920339161349,
                    "r": 30
                },
                {
                    "label": "33",
                    "x": 9.75416512459885,
                    "y": -0.5693920339161349,
                    "r": 30
                },
                {
                    "label": "35",
                    "x": 7.754165124598851,
                    "y": 0.4306079660838651,
                    "r": 30,
                    "h": 2
                },
                {
                    "label": "36",
                    "x": 8.75416512459885,
                    "y": 0.4306079660838651,
                    "r": 30,
                    "h": 2
                },
                {
                    "label": "34",
                    "x": 9.75416512459885,
                    "y": 0.4306079660838651,
                    "r": 30
                },
                {
                    "label": "37",
                    "x": 9.75416512459885,
                    "y": 1.430607966083865,
                    "r": 30
                },
                {
                    "label": "70",
                    "x": 6.133330249197703,
                    "y": 9.180607966083864,
                    "r": -30
                },
                {
                    "label": "71",
                    "x": 7.133330249197703,
                    "y": 9.180607966083864,
                    "r": -30
                },
                {
                    "label": "72",
                    "x": 6.133330249197703,
                    "y": 10.180607966083864,
                    "r": -30
                },
                {
                    "label": "74",
                    "x": 7.133330249197703,
                    "y": 10.180607966083864,
                    "r": -30,
                    "h": 2
                },
                {
                    "label": "75",
                    "x": 8.133330249197703,
                    "y": 10.180607966083864,
                    "r": -30,
                    "h": 2
                },
                {
                    "label": "73",
                    "x": 6.133330249197703,
                    "y": 11.180607966083864,
                    "r": -30
                }]
            }
        }
    }
    `;

    convert = (kleValue: string): KeyboardLayoutArray => {
        return null as any;
    };

    render() {
        let infoJsonValue: QmkInfoJson = null as any;
        try {
            infoJsonValue = JSON.parse(this.infoJsonTextarea);
        } catch (e) {}
        return (
            <div>
                Insert KLE here:
                <textarea
                    value={this.convertFromKleValue}
                    spellCheck={false}
                    className={cns("pt-input pt-fill", styles.inputTextarea)}
                    onChange={this.onChangeKeymapsTextarea}
                />
                <br />
                <br />
                Insert INFO.json here:
                <textarea
                    value={this.infoJsonTextarea}
                    spellCheck={false}
                    className={cns("pt-input pt-fill", styles.inputTextarea)}
                    onChange={this.onChangeKeymapsTextarea}
                />
                <div
                    style={{ position: "relative", overflow: "hidden" }}
                    className={styles.keyboard}
                >
                    {infoJsonValue &&
                        Object.keys(infoJsonValue.layouts).map(keyword => {
                            console.log("Keys", keyword);
                            let convertToPercents = (v: number) => {
                                return v / infoJsonValue.width * 100;
                            };
                            let layoutDefintion = infoJsonValue.layouts[keyword];
                            return layoutDefintion.layout.map((k, i) => {
                                return (
                                    <Key
                                        key={i}
                                        x={convertToPercents(k.x)}
                                        y={convertToPercents(k.y)}
                                        w={convertToPercents(k.w || 1)}
                                        h={convertToPercents(k.h || 1)}
                                        r={k.r || 0}
                                        texts={{
                                            centered: k.label,
                                        }}
                                        // Deprecate following
                                        x2={0}
                                        y2={0}
                                        w2={0}
                                        h2={0}
                                    />
                                );
                            });
                        })}

                    {infoJsonValue && (
                        <div
                            style={{
                                position: "relative",
                                paddingTop: infoJsonValue.height / infoJsonValue.width * 100 + "%",
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }
    @action
    private onChangeKeymapsTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.infoJsonTextarea = e.target.value;
    };
}
