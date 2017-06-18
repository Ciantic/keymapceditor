import * as React from "react";
import { cns } from "../Utils/classnames";
import { observer } from "mobx-react";
import { CSSProperties } from "react";

const styles = require("./Key.module.scss");

export interface KeyStyle {
    hovered: boolean;
    pressed: boolean;
};

export interface KeyTexts {
    tl?: React.ReactNode;
    tr?: React.ReactNode;
    bl?: React.ReactNode;
    br?: React.ReactNode;
    cl?: React.ReactNode;
    c?: React.ReactNode;
    cr?: React.ReactNode;
    node?: React.ReactNode;
}

export interface KeyProps { 
    x: number; 
    y: number; 
    w: number; 
    h: number; 
    x2: number;
    y2: number;
    w2: number;
    h2: number;
    r: number; 
    texts?: KeyTexts;
    style?: KeyStyle;
    onMouseOver?: () => void;
    onMouseOut?: () => void;
    onClick?: () => void;
}

@observer
export class Key extends React.Component<KeyProps, {}> {
    render() {
        let props = this.props;
        let texts = props.texts || {};
        let events = {
            onMouseOver : props.onMouseOver,
            onMouseOut : props.onMouseOut,
            onClick : props.onClick
        }
        let style: KeyStyle = props.style || {
            hovered : false,
            pressed : false
        };
        let rectangle1 = {
            position : "absolute",
            left : props.x + "%",
            marginTop : props.y + "%",
            width : props.w + "%",
            paddingTop : props.h + "%"
        };

        // Second rectangle, for weird enter key
        let rectangle2: typeof rectangle1 | null = null;
        if (props.w2 && props.h2) {
            rectangle2 = {
                position : "absolute",
                left : (props.x + props.x2) + "%",
                marginTop : (props.y + props.y2) + "%",
                width : props.w2 + "%",
                paddingTop : props.h2 + "%"
            };
        }
        return <div 
            className={cns(
                styles.key,
                style.pressed && styles.pressed,
                style.hovered && styles.hovered
            )}
            style={{
                position: 'absolute',
                width: "100%",
                transform: `rotate(${props.r || 0}deg)`,
                transformOrigin: `top left`,
            }}>
                {rectangle2 && <div className={styles.container} style={rectangle2 as CSSProperties} {...events}>
                    <div className={styles.borders}>
                        <div className={styles.shadow} />
                        <div className={styles.top}></div>
                    </div>
                </div>}

                <div className={styles.container} style={rectangle1 as CSSProperties} {...events}>
                    <div className={styles.borders}>
                        <div className={styles.shadow} />
                        <div className={styles.top}>
                            <div className={styles.texts}>
                                {texts.tl && <div className={styles.tl}>{texts.tl}</div>}
                                {texts.tr && <div className={styles.tr}>{texts.tr}</div>}
                                {texts.bl && <div className={styles.bl}>{texts.bl}</div>}
                                {texts.br && <div className={styles.br}>{texts.br}</div>}
                                {texts.c && <div className={styles.c}>{texts.c}</div>}
                                {texts.cr && <div className={styles.cr}>{texts.cr}</div>}
                                {texts.cl && <div className={styles.cl}>{texts.cl}</div>}
                                {texts.node && texts.node}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    }
}