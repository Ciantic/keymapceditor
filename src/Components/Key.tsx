import * as React from "react";
import { cns } from "../Utils/classnames";
import { observer } from "mobx-react";
import { CSSProperties } from "react";

const styles = require("./Key.module.scss");

export interface KeyStyle {
    disabled: boolean;
    hovered: boolean;
    pressed: boolean;
}

export interface KeycapText {
    topleft?: React.ReactNode;
    topcenter?: React.ReactNode;
    topright?: React.ReactNode;
    bottomleft?: React.ReactNode;
    bottomcenter?: React.ReactNode;
    bottomright?: React.ReactNode;
    centerleft?: React.ReactNode;
    centered?: React.ReactNode;
    centerright?: React.ReactNode;
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
    texts?: KeycapText;
    style?: KeyStyle;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
}

const Texts = (opts: { className: string; children: React.ReactNode }) => {
    let fz = "";
    if (typeof opts.children === "string") {
        if (opts.children.length >= 6) {
            fz = styles.smallest;
        } else if (opts.children.length >= 4) {
            fz = styles.smaller;
        }
    }
    return (
        <div className={cns(opts.className, fz)}>
            {opts.children}
        </div>
    );
};

@observer
export class Key extends React.Component<KeyProps, {}> {
    render() {
        let props = this.props;
        let texts = props.texts || {};
        let events = {
            onMouseEnter: props.onMouseEnter,
            onMouseLeave: props.onMouseLeave,
            onClick: props.onClick,
        };
        let style: KeyStyle = props.style || {
            disabled: false,
            hovered: false,
            pressed: false,
        };
        let rectangle1 = {
            position: "absolute",
            left: props.x + "%",
            marginTop: props.y + "%",
            width: props.w + "%",
            paddingTop: props.h + "%",
        };

        // Second rectangle, for weird enter key
        let rectangle2: typeof rectangle1 | null = null;
        if (props.w2 && props.h2) {
            rectangle2 = {
                position: "absolute",
                left: props.x + props.x2 + "%",
                marginTop: props.y + props.y2 + "%",
                width: props.w2 + "%",
                paddingTop: props.h2 + "%",
            };
        }
        return (
            <div
                className={cns(
                    styles.key,
                    style.disabled && styles.disabled,
                    style.pressed && styles.pressed,
                    style.hovered && styles.hovered
                )}
                style={{
                    position: "absolute",
                    width: "100%",
                    transform: `rotate(${props.r || 0}deg)`,
                    transformOrigin: `top left`,
                }}
            >
                {rectangle2 &&
                    <div
                        className={styles.container}
                        style={rectangle2 as CSSProperties}
                        {...events}
                    >
                        <div className={styles.borders}>
                            <div className={styles.shadow} />
                            <div className={styles.top} />
                        </div>
                    </div>}

                <div className={styles.container} style={rectangle1 as CSSProperties} {...events}>
                    <div className={styles.borders}>
                        <div className={styles.shadow} />
                        <div className={styles.top}>
                            <div className={styles.texts}>
                                {texts.topleft &&
                                    <Texts className={styles.tl}>
                                        {texts.topleft}
                                    </Texts>}
                                {texts.topcenter &&
                                    <Texts className={styles.tc}>
                                        {texts.topcenter}
                                    </Texts>}
                                {texts.topright &&
                                    <Texts className={styles.tr}>
                                        {texts.topright}
                                    </Texts>}
                                {texts.bottomleft &&
                                    <Texts className={styles.bl}>
                                        {texts.bottomleft}
                                    </Texts>}
                                {texts.bottomcenter &&
                                    <Texts className={styles.bc}>
                                        {texts.bottomcenter}
                                    </Texts>}
                                {texts.bottomright &&
                                    <Texts className={styles.br}>
                                        {texts.bottomright}
                                    </Texts>}
                                {texts.centered &&
                                    <Texts className={styles.c}>
                                        {texts.centered}
                                    </Texts>}
                                {texts.centerright &&
                                    <Texts className={styles.cr}>
                                        {texts.centerright}
                                    </Texts>}
                                {texts.centerleft &&
                                    <Texts className={styles.cl}>
                                        {texts.centerleft}
                                    </Texts>}
                                {texts.node && texts.node}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
