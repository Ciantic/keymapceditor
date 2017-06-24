require("./App.scss");

import { action, observable, computed, when, reaction, IReactionDisposer } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

import { KeyboardLayout } from "./Components/Keyboard";
import {
    IKeyboardLayout,
    keyboardLayouts,
    generateKeymapsText,
    parseKeymapsText,
} from "./KeyboardLayouts";
import { LANGS } from "./Langs";
import { IKeymapping, languageMappings } from "./LanguageMaps";
import { keycode } from "./QMK/keycodes";
import { IReferenceKeyboard, referenceKeyboards } from "./ReferenceKeyboards";
import { initTools } from "./Tools";
import { cns } from "./Utils/classnames";
import { some } from "lodash";
import { Tabs2, Tab2, FocusStyleManager } from "@blueprintjs/core";
import { KeycapText } from "./Components/Key";

FocusStyleManager.onlyShowFocusOnTabs();

const styles = require("./App.module.scss");

initTools((window["QMTOOLS"] = {}));

@observer
export class App extends React.Component<{}, {}> {
    // Drop downs
    @observable private langMappingIndex = 1;
    @observable private referenceKeyboardIndex = 1;
    @observable private keyboardLayoutIndex = 0;

    // Currently configured keys.
    //
    // Note that this is not fully omnidirectional data flow since layoutLayers
    // duplicates the value of the textarea. In omnidirectional data flow there
    // should be only textarea or layoutLayers which the inputs would edit.
    @observable private layoutLayers: keycode[][] = [new Array(1024).fill("KC_NO")];
    @observable private layoutLayerIndex = 0;
    @observable private selectedKey: number | null = null;
    @observable private hoveredKeys = new Map<string, boolean>();
    @observable private keymapsTextareaValue = "";
    @observable private layoutNotSelectedError = "";
    @observable private keymapsParseError: number | null = null;

    // Reference layout
    @observable private hoveredRefKeys = new Map<keycode, boolean>();

    // Input line for C code
    private inputRef: HTMLInputElement | null = null;

    // Textarea ref
    private textareaRef: HTMLTextAreaElement | null = null;

    private listenForLayoutChanges: IReactionDisposer;

    constructor() {
        super();
        this.listenForLayoutChanges = reaction(
            () => JSON.stringify(this.layoutLayers) + this.keyboardLayoutIndex,
            this.updateKeymapsTextarea
        );
    }

    render() {
        let refKeyboard: IReferenceKeyboard | null =
            referenceKeyboards[this.referenceKeyboardIndex];
        let keyboardLayout: IKeyboardLayout | null = keyboardLayouts[this.keyboardLayoutIndex];

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
                                <option value="-2">{LANGS.MyLanguageMapIsMissing}</option>
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
                                <option value="-2">{LANGS.MyLayoutIsMissing}</option>
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
                                <option value="-2">{LANGS.MyReferenceKeyboardIsMissing}</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-navbar-group pt-align-right">
                        <button className="pt-button pt-minimal pt-icon-cog" />
                    </div>
                </nav>
                <Tabs2
                    className="pt-large"
                    id="layouts"
                    onChange={this.onChangeLayer}
                    selectedTabId={this.layoutLayerIndex}
                >
                    {this.layoutLayers.map((t, i) =>
                        <Tab2 key={i} title={`Layer ${i}`} id={i} panel={null} />
                    )}
                    <a className="pt-button pt-minimal pt-icon-add" onClick={this.onClickAddLayer}>
                        {LANGS.Add}
                    </a>
                </Tabs2>
                {keyboardLayout &&
                    <KeyboardLayout
                        styleHoveredKeys={this.hoveredKeys}
                        stylePressedKeys={new Map().set("" + this.selectedKey, true)}
                        layout={keyboardLayout.layout}
                        onMouseLeaveKey={this.onMouseOutConfigureKey}
                        onMouseEnterKey={this.onMouseOverConfigureKey}
                        getKeycapText={this.getConfigureKeycapText}
                        onClickKey={this.onClickConfigureKey}
                    />}

                <input
                    disabled={this.selectedKey === null}
                    value={this.layoutLayers[this.layoutLayerIndex][this.selectedKey] || ""}
                    ref={this.setInputRef}
                    onChange={this.onChangeInput}
                    type="text"
                    className={cns("pt-input pt-fill pt-large", styles.layoutInput)}
                    placeholder={LANGS.LayoutInput}
                />

                {refKeyboard &&
                    <KeyboardLayout
                        styleHoveredKeys={this.hoveredRefKeys}
                        stylePressedKeys={this.selectedRefKeysFromInput}
                        layout={refKeyboard.keyboard}
                        onMouseLeaveKey={this.onMouseOutReferenceKey}
                        onMouseEnterKey={this.onMouseOverReferenceKey}
                        getKeycapText={this.getReferenceKeycapText}
                        onClickKey={this.onClickReferenceKey}
                    />}

                <textarea
                    ref={this.setTextareaRef}
                    placeholder={LANGS.KeymapsPlaceholder}
                    value={this.keymapsTextareaValue}
                    className={cns(
                        "pt-input pt-fill",
                        this.layoutNotSelectedError && "pt-intent-danger",
                        this.keymapsParseError !== null && "pt-intent-danger",
                        styles.keymapsTextarea
                    )}
                    onBlur={this.onBlurKeymapsTextarea}
                    onFocus={this.onFocusKeymapsTextarea}
                    onClick={this.onClickKeymapsTextarea}
                    onChange={this.onChangeKeymapsTextarea}
                />
                {this.layoutNotSelectedError &&
                    <div className="pt-callout pt-intent-danger">
                        {this.layoutNotSelectedError}
                    </div>}
                {this.keymapsParseError !== null &&
                    <div className="pt-callout pt-intent-danger">
                        Parse error at {this.keymapsParseError}
                    </div>}
            </div>
        );
    }

    private setInputRef = (el: HTMLInputElement) => {
        this.inputRef = el;
    };

    private setTextareaRef = (el: HTMLTextAreaElement) => {
        this.textareaRef = el;
    };

    private getReferenceKeycapText = (c: keycode): KeycapText => {
        let langMapping = languageMappings[this.langMappingIndex];
        if (langMapping) {
            let value = langMapping.getKeycapText(c);
            if (value) {
                return value;
            }
        }
        return {
            centered: c,
        };
    };

    private getConfigureKeycapText = (index: string): KeycapText => {
        let langMapping = languageMappings[this.langMappingIndex];
        let setkeycode = this.layoutLayers[this.layoutLayerIndex][+index];
        if (langMapping && setkeycode) {
            let value = langMapping.getKeycapText(setkeycode);
            if (value) {
                return value;
            }
        }
        if (setkeycode === "KC_NO") {
            return {};
        }

        return {
            centered: setkeycode,
        };
    };

    private getLayoutOrError = (): IKeyboardLayout | null => {
        let layout = keyboardLayouts[this.keyboardLayoutIndex] || null;
        if (!layout) {
            this.layoutNotSelectedError = LANGS.LayoutNotSelectedError;
            return null;
        }
        this.layoutNotSelectedError = "";
        return layout;
    };

    @action
    private updateKeymapsTextarea = () => {
        let layout: IKeyboardLayout;
        if ((layout = this.getLayoutOrError())) {
            if (document.activeElement !== this.textareaRef) {
                this.keymapsTextareaValue = generateKeymapsText(layout.keyCount, this.layoutLayers);
                this.keymapsParseError = null;
            }
        }
    };

    private onBlurKeymapsTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (this.keymapsParseError === null) {
            this.updateKeymapsTextarea();
        }
    };

    private onFocusKeymapsTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        e.currentTarget.select();
    };

    private onClickKeymapsTextarea = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        // if (document.activeElement !== e.currentTarget) {
        //     e.currentTarget.select();
        // }
    };

    @action
    private onChangeKeymapsTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        console.log("change keymaps textarea");
        let layout: IKeyboardLayout;
        if ((layout = this.getLayoutOrError())) {
            let parsed = parseKeymapsText(layout.keyCount, e.target.value);
            if (typeof parsed === "number") {
                this.keymapsParseError = parsed;
            } else {
                this.keymapsParseError = null;
                this.layoutLayers = parsed;
            }
        }
        this.keymapsTextareaValue = e.target.value;
    };

    @action
    private onChangeLayer = (newTabId: number, prevTabId: number) => {
        this.selectedKey = null;
        this.layoutLayerIndex = newTabId;
    };

    @action
    private onClickAddLayer = (e: React.MouseEvent<any>) => {
        e.preventDefault();
        this.layoutLayers.push(new Array(1024).fill("KC_NO"));
        this.layoutLayerIndex = this.layoutLayers.length - 1;
        this.selectedKey = null;
    };

    @computed
    private get selectedRefKeysFromInput() {
        let val = this.layoutLayers[this.layoutLayerIndex][this.selectedKey];
        let m = new Map().set(val || "", true);
        return m;
    }

    @action
    private onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.layoutLayers[this.layoutLayerIndex][this.selectedKey] = e.target.value as keycode;
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
            if (+v === this.selectedKey) {
                this.selectedKey = null;
            } else {
                this.selectedKey = +v;
            }

            if (this.inputRef) {
                setTimeout(() => {
                    this.inputRef.focus();
                    this.inputRef.select();
                }, 100);
            }
        });

    private onMouseOverConfigureKey = (v: string, n: number) =>
        action(() => {
            this.hoveredKeys.set(v, true);
        });

    private onMouseOutConfigureKey = (v: string, n: number) =>
        action(() => {
            this.hoveredKeys.set(v, false);
        });

    // Reference keyboard layout
    private onClickReferenceKey = (k: keycode, n: number) =>
        action(() => {
            if (this.selectedKey !== null) {
                this.layoutLayers[this.layoutLayerIndex][this.selectedKey] = k;
            }
        });

    private onMouseOverReferenceKey = (k: keycode, n: number) =>
        action(() => {
            if (this.selectedKey !== null) {
                this.hoveredRefKeys.set(k, true);
            }
        });

    private onMouseOutReferenceKey = (k: keycode, n: number) =>
        action(() => {
            this.hoveredRefKeys.set(k, false);
        });
}
