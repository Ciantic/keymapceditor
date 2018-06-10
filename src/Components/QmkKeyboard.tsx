import * as React from "react";
import { Key, KeyStyle, KeyProps, KeycapText, KeycapBackground } from "./Key";
import { observable, action, runInAction, computed } from "mobx";
import { observer } from "mobx-react";
import {
    IKeyboardLayoutNextKey,
    IKeyboardLayoutSubsequentKey,
    IKeyboardLayoutKeyDefinition,
    KeyboardLayoutArray,
} from "../KLE/keyboardlayout";
import { cns } from "../Utils/classnames";
import { QmkInfoJson, QmkKeyDefinition } from "../QMK/info";

const styles = require("./Keyboard.module.scss");

const isKeyboardLayoutKeyDefinition = (o: any): o is IKeyboardLayoutKeyDefinition => {
    return typeof o === "object";
};

interface KeyboardLayoutProps {
    className?: string;
    keys: QmkKeyDefinition[];
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
export class QmkKeyboardLayout extends React.Component<KeyboardLayoutProps, {}> {
    static defaultProps: Partial<KeyboardLayoutProps> = {
        disabled: false,
        stylePressedKeys: new Map(),
        styleHoveredKeys: new Map(),
    };

    @computed
    private get width() {
        return Math.max(...this.props.keys.map(t => t.x + (t.w || 1)));
    }

    @computed
    private get height() {
        return Math.max(...this.props.keys.map(t => t.y + (t.h || 1)));
    }

    render() {
        let props = this.props;
        let keys: KeyProps[] = [];
        let n = 0;
        let onMouseEnterKey = props.onMouseEnterKey;
        let onMouseLeaveKey = props.onMouseLeaveKey;
        let onClickKey = props.onClickKey;

        let convertToPercents = (v: number) => {
            return v / this.width * 100;
        };
        // let layoutDefintion = props.keyboard.layouts[props.layoutKey];
        // if (!layoutDefintion) {
        //     return (
        //         <div className="pt-intent-danger pt-callout">
        //             Unable to render keyboard, definition for `{props.layoutKey}` not found.
        //         </div>
        //     );
        // }
        return (
            <div style={{ position: "relative", overflow: "hidden" }} className={styles.keyboard}>
                {props.keys.map((k, i) => {
                    let indice = "" + i;
                    return (
                        <Key
                            key={i}
                            x={convertToPercents(k.x)}
                            y={convertToPercents(k.y)}
                            w={convertToPercents(k.w || 1)}
                            h={convertToPercents(k.h || 1)}
                            r={k.r || 0}
                            texts={props.keycapTexts && props.keycapTexts.get(indice)}
                            // Style
                            style={{
                                disabled: !!props.disabled,
                                hovered:
                                    !props.disabled &&
                                    !!(
                                        props.styleHoveredKeys && props.styleHoveredKeys.get(indice)
                                    ),
                                pressed:
                                    !props.disabled &&
                                    !!(
                                        props.stylePressedKeys && props.stylePressedKeys.get(indice)
                                    ),
                                background:
                                    props.styleBackgroundKeys &&
                                    props.styleBackgroundKeys.get(indice),
                            }}
                            // Events
                            onMouseLeave={
                                (!props.disabled &&
                                    onMouseLeaveKey &&
                                    onMouseLeaveKey(indice, n)) ||
                                undefined
                            }
                            onMouseEnter={
                                (!props.disabled &&
                                    onMouseEnterKey &&
                                    onMouseEnterKey(indice, n)) ||
                                undefined
                            }
                            onClick={
                                (!props.disabled && onClickKey && onClickKey(indice, n)) ||
                                undefined
                            }
                            // Deprecate following
                            x2={0}
                            y2={0}
                            w2={0}
                            h2={0}
                        />
                    );
                })}
                <div
                    style={{
                        position: "relative",
                        paddingTop: this.height / this.width * 100 + "%",
                    }}
                />
            </div>
        );
    }
}
