require("./App.scss");

import { action, observable, computed } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

import { KeyboardLayout } from "./Components/Keyboard";
import { IKeyboardLayout, keyboardLayouts } from "./KeyboardLayouts";
import { LANGS } from "./Langs";
import { IKeymapping, languageMappings } from "./LanguageMaps";
import { keycode } from "./QMK/keycodes";
import { IReferenceKeyboard, referenceKeyboards } from "./ReferenceKeyboards";
import { initTools } from "./Tools";
import { cns } from "./Utils/classnames";
import { some } from "lodash";

const styles = require("./App.module.scss");

initTools((window["QMTOOLS"] = {}));

@observer
export class App extends React.Component<{}, {}> {
    // Drop downs
    @observable private langMappingIndex = 1;
    @observable private referenceKeyboardIndex = 1;
    @observable private keyboardLayoutIndex = 0;

    // Currently configured keys
    @observable private configuredKeys: Map<string, keycode> = observable.map() as any;

    @observable private selectedKey = "";
    @observable private hoveredConfigureKeys: Map<string, boolean> = observable.map() as any;

    // Reference layout
    @observable private selectedRefKeys: Map<keycode, boolean> = observable.map() as any;
    @observable private hoveredRefKeys: Map<keycode, boolean> = observable.map() as any;

    // Input line for C code
    private inputRef: HTMLInputElement | null = null;

    render() {
        let langMapping: IKeymapping | null = languageMappings[this.langMappingIndex];
        let refKeyboard: IReferenceKeyboard | null =
            referenceKeyboards[this.referenceKeyboardIndex];
        let keyboardLayout: IKeyboardLayout | null = keyboardLayouts[this.keyboardLayoutIndex];
        let getReferenceKeycapText: typeof langMapping.getKeycapText = c => ({
            centered: c,
        });
        if (langMapping) {
            getReferenceKeycapText = langMapping.getKeycapText;
        }
        let getConfigureKeycapText: typeof langMapping.getKeycapText = c => {
            let setkeycode = this.configuredKeys.get(c);
            return (
                (setkeycode && langMapping && langMapping.getKeycapText(setkeycode)) || {
                    centered: c,
                }
            );
        };

        return (
            <div>
                <nav className="pt-navbar pt-dark pt-fixed-top">
                    <div className="pt-navbar-group pt-align-left">
                        <div className="pt-navbar-heading">QMKMapper</div>
                    </div>
                    <div className="pt-navbar-group pt-control-group pt-align-left">
                        <div className="pt-select pt-fill">
                            <select value={this.langMappingIndex} onChange={this.changeMapping}>
                                <option value="-1">
                                    {LANGS.ChooseReferenceMapping}
                                </option>
                                {languageMappings.map((t, i) =>
                                    <option key={i} value={i}>{t.name}</option>
                                )}
                            </select>
                        </div>
                        <div className="pt-select pt-fill .modifier">
                            <select
                                value={this.keyboardLayoutIndex}
                                onChange={this.changeKeyboardLayout}
                            >
                                <option value="-1">
                                    {LANGS.ChooseKeyboardLayout}
                                </option>
                                {keyboardLayouts.map((t, i) =>
                                    <option key={i} value={i}>{t.name}</option>
                                )}
                            </select>
                        </div>
                        <div className="pt-select pt-fill .modifier">
                            <select
                                value={this.referenceKeyboardIndex}
                                onChange={this.changeReferenceKeyboard}
                            >
                                <option value="-1">
                                    {LANGS.ChooseReferenceKeyboard}
                                </option>
                                {referenceKeyboards.map((t, i) =>
                                    <option key={i} value={i}>{t.name}</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="pt-navbar-group pt-align-right">
                        <button className="pt-button pt-minimal pt-icon-cog" />
                    </div>
                </nav>
                {keyboardLayout &&
                    <div className={styles.layout}>
                        <KeyboardLayout
                            styleHoveredKeys={this.hoveredConfigureKeys}
                            stylePressedKeys={new Map([[this.selectedKey, true]])}
                            layout={keyboardLayout.layout}
                            onMouseLeaveKey={this.onMouseOutConfigureKey}
                            onMouseEnterKey={this.onMouseOverConfigureKey}
                            getKeycapText={getConfigureKeycapText}
                            onClickKey={this.onClickConfigureKey}
                        />
                        <input
                            value={this.configuredKeys.get(this.selectedKey) || ""}
                            ref={this.setInputRef}
                            onChange={this.onChangeInput}
                            type="text"
                            className={cns("pt-input pt-fill pt-large", styles.layoutInput)}
                            placeholder={LANGS.LayoutInput}
                        />
                    </div>}

                {refKeyboard &&
                    <KeyboardLayout
                        styleHoveredKeys={this.hoveredRefKeys}
                        stylePressedKeys={this.selectedRefKeysFromInput}
                        layout={refKeyboard.keyboard}
                        onMouseLeaveKey={this.onMouseOutReferenceKey}
                        onMouseEnterKey={this.onMouseOverReferenceKey}
                        getKeycapText={getReferenceKeycapText}
                        onClickKey={this.onClickReferenceKey}
                    />}

                <div className="pt-running-text">
                    <h2>{LANGS.CFileTitle}</h2>
                    <p>
                        <textarea className="pt-input pt-fill" />
                    </p>
                </div>
            </div>
        );
    }

    @computed
    private get selectedRefKeysFromInput() {
        let m = new Map([[this.configuredKeys.get(this.selectedKey) || "", true]]);
        return m;
    }

    @action
    private onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.configuredKeys.set(this.selectedKey, e.target.value as keycode);
    };

    private setInputRef = (el: HTMLInputElement) => {
        this.inputRef = el;
    };

    // Drop downs at the top
    @action
    private changeMapping = (e: React.SyntheticEvent<any>) => {
        this.langMappingIndex = +(e.target as any).value;
    };

    @action
    private changeReferenceKeyboard = (e: React.SyntheticEvent<any>) => {
        this.referenceKeyboardIndex = +(e.target as any).value;
    };

    @action
    private changeKeyboardLayout = (e: React.SyntheticEvent<any>) => {
        this.keyboardLayoutIndex = +(e.target as any).value;
    };

    // Configure keyboard layout
    private onClickConfigureKey = (v: string, n: number) =>
        action(() => {
            if (v === this.selectedKey) {
                this.selectedKey = "";
            } else {
                this.selectedKey = v;
            }

            if (this.inputRef) {
                setTimeout(() => {
                    this.inputRef.focus();
                }, 100);
            }
        });

    private onMouseOverConfigureKey = (v: string, n: number) =>
        action(() => {
            this.hoveredConfigureKeys.set(v, true);
        });

    private onMouseOutConfigureKey = (v: string, n: number) =>
        action(() => {
            this.hoveredConfigureKeys.set(v, false);
        });

    // Reference keyboard layout
    private onClickReferenceKey = (k: keycode, n: number) =>
        action(() => {
            if (this.selectedKey) {
                this.configuredKeys.set(this.selectedKey, k);
            }
            this.selectedRefKeys.set(k, !this.selectedRefKeys.get(k));
        });

    private onMouseOverReferenceKey = (k: keycode, n: number) =>
        action(() => {
            this.hoveredRefKeys.set(k, true);
        });

    private onMouseOutReferenceKey = (k: keycode, n: number) =>
        action(() => {
            this.hoveredRefKeys.set(k, false);
        });
}
