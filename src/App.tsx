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

import { KeyboardLayout } from "./Components/Keyboard";
import {
    IKeyboardLayout,
    keyboardLayouts,
    generateKeymapsText,
    evalKeyExpression,
    tryParseKeymapsText,
    KeymapParseResult,
    addLayerKeymaps,
    trySetKeymapsKey,
} from "./KeyboardLayouts";
import { LANGS } from "./Langs";
import { ILanguageMapping, languageMappings } from "./LanguageMaps";
import { keycode, keys, keycodeToUsbcode, normalizeKeycode } from "./QMK";
import { IReferenceKeyboard, referenceKeyboards } from "./ReferenceKeyboards";
import { initTools } from "./Tools";
import { cns } from "./Utils/classnames";
import { some } from "lodash";
import { Tabs2, Tab2, FocusStyleManager } from "@blueprintjs/core";
import { KeycapText } from "./Components/Key";
import { qmkExecutor, isRenderableResult } from "./QMK/functions";

FocusStyleManager.onlyShowFocusOnTabs();

const styles = require("./App.module.scss");

const sendToExtension = (command: string, ...args: any[]) => {
    if (window && window.parent && window.parent.postMessage) {
        window.parent.postMessage(
            {
                // This is required to be "did-click-link" in all cases, this is
                // some misfeature in vscode that actually sends the event to the
                // command specified in data
                //
                // This pattern is used in the vscode/markdown extension itself
                command: "did-click-link",
                data: `command:${command}?${encodeURIComponent(JSON.stringify(args))}`,
            },
            "file://"
        );
    }
};

const sendConnectRequestToExtension = () => {
    sendToExtension("_qmkmapper.connectedPreview");
};

let throttleTimeout = null;

let sendKeymapToExtension = (documentUri: string, keymap: string) => {
    // Throttle assumes that documentUri does not change
    if (throttleTimeout) {
        clearTimeout(throttleTimeout);
    }
    throttleTimeout = setTimeout(() => {
        sendToExtension("_qmkmapper.keymapFromPreview", {
            documentUri,
            keymap,
        });
    }, 300);
};

initTools((window["QMTOOLS"] = {}));

@observer
export class App extends React.Component<{}, {}> {
    // Drop downs
    @observable private langMappingIndex = 1;
    @observable private referenceKeyboardIndex = 1;
    @observable private keyboardLayoutIndex = 0;

    // Layer tab index
    @observable private layerIndex = 0;

    // Configure layout
    @observable private selectedKey: number | null = null;
    @observable private hoveredKeys = new Map<string, boolean>();
    @observable private layoutNotSelectedError = "";
    @observable private keymapsParseError: string = "";
    @observable private keyValidationError: string = "";
    @observable private keymapsTextareaValue = "";
    @observable private keyInputValue = "";
    @observable private lastSuccessfulKeymapParsed: KeymapParseResult = [];
    private inputRef: HTMLInputElement | null = null;
    private textareaRef: HTMLTextAreaElement | null = null;
    private avoidResendCycleKeymapText = "";

    // Reference layout
    @observable private hoveredRefKeys = new Map<keycode, boolean>();

    constructor() {
        super();

        addEventListener("message", e => {
            if (!e || !e.data || !e.data.command) {
                return;
            }

            switch (e.data.command) {
                case "setKeymap":
                    runInAction(() => {
                        this.avoidResendCycleKeymapText = this.keymapsTextareaValue = e.data.keymap;
                    });
                    break;
            }
        });

        sendToExtension("_qmkmapper.logging", "Howdy preview is done!");
        sendConnectRequestToExtension();
        // This is almost like a caching trick, parsing happens only when these
        // two changes
        reaction(t => [this.keymapsTextareaValue, this.keyboardLayoutIndex], this.parseKeymapsText);

        // Somewhat bad way to update a keyInputValue
        reaction(
            () => [this.keyboardLayoutIndex, this.currentSelectedValue],
            () => {
                this.keyValidationError = "";
                this.keyInputValue =
                    (this.currentSelectedValue && this.currentSelectedValue.content) || "";
            }
        );

        this.keymapsTextareaValue = localStorage.getItem("keymap") || "";
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
                    selectedTabId={Math.min(
                        this.layerIndex,
                        this.lastSuccessfulKeymapParsed.length - 1
                    )}
                >
                    {this.lastSuccessfulKeymapParsed.map((t, i) =>
                        <Tab2 key={i} title={`Layer ${i}`} id={i} panel={null} />
                    )}
                    <a className="pt-button pt-minimal pt-icon-add" onClick={this.onClickAddLayer}>
                        {LANGS.Add}
                    </a>
                </Tabs2>
                {keyboardLayout &&
                    <KeyboardLayout
                        disabled={!!this.keymapsParseError}
                        styleHoveredKeys={this.hoveredKeys}
                        stylePressedKeys={new Map().set("" + this.selectedKey, true)}
                        layout={keyboardLayout.layout}
                        onMouseLeaveKey={this.onMouseOutConfigureKey}
                        onMouseEnterKey={this.onMouseOverConfigureKey}
                        getKeycapText={this.getConfigureKeycapText}
                        onClickKey={this.onClickConfigureKey}
                    />}
                {keyboardLayout &&
                    <div className={styles.layoutInput}>
                        <input
                            disabled={!!this.keymapsParseError || this.selectedKey === null}
                            value={this.keyInputValue}
                            ref={this.setInputRef}
                            onChange={this.onChangeInput}
                            type="text"
                            className={cns("pt-input pt-fill pt-large")}
                            placeholder={LANGS.LayoutInput}
                        />
                        {(this.keyValidationError &&
                            <div className="pt-callout pt-intent-danger">
                                {this.keyValidationError}
                            </div>) ||
                            <div className="pt-callout" style={{ opacity: 0 }}>
                                {LANGS.NoErrors}
                            </div>}

                    </div>}

                {refKeyboard &&
                    <KeyboardLayout
                        disabled={!!this.keymapsParseError || !!this.layoutNotSelectedError}
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
                        this.keymapsParseError !== "" && "pt-intent-danger",
                        styles.keymapsTextarea
                    )}
                    onFocus={this.onFocusKeymapsTextarea}
                    onChange={this.onChangeKeymapsTextarea}
                />
                {this.layoutNotSelectedError &&
                    <div className="pt-callout pt-intent-danger">
                        {this.layoutNotSelectedError}
                    </div>}
                {this.keymapsParseError !== "" &&
                    <div className="pt-callout pt-intent-danger">
                        {this.keymapsParseError}
                    </div>}
            </div>
        );
    }

    private getKeymapFromUrl = (path: string) => {};

    @computed
    private get currentSelectedValue() {
        return this.safeGetKeymapValue(this.layerIndex, this.selectedKey);
    }

    private safeGetKeymapValue = (layer: number, key: number) => {
        if (this.lastSuccessfulKeymapParsed[layer]) {
            if (this.lastSuccessfulKeymapParsed[layer][key]) {
                return this.lastSuccessfulKeymapParsed[layer][key];
            }
        }
        return null;
    };

    private setInputRef = (el: HTMLInputElement) => {
        this.inputRef = el;
    };

    private setTextareaRef = (el: HTMLTextAreaElement) => {
        this.textareaRef = el;
    };

    private getReferenceKeycapText = (c: keycode): KeycapText => {
        let langMapping = languageMappings[this.langMappingIndex];
        if (langMapping) {
            let value = langMapping.getKeycapTextFromUsbcode(keys[c]);
            if (value) {
                return value;
            }
        }
        return {
            centered: c,
        };
    };

    private getConfigureKeycapText = (index: string): KeycapText => {
        // Index string is the selected layout keyboard's KEYMAP position number
        // as a string
        let langMapping = languageMappings[this.langMappingIndex];
        let parsed = this.safeGetKeymapValue(this.layerIndex, +index);
        if (!parsed) {
            return {
                centered: "",
            };
        }

        let fallback = {
            centered: parsed.content,
        };
        let evaled = evalKeyExpression(parsed, qmkExecutor);
        if (evaled === null) {
            return fallback;
        }

        if (langMapping) {
            let langvalue = langMapping.getKeycapTextFromExpr(evaled);
            if (langvalue !== null) {
                return langvalue;
            }
        }

        if (isRenderableResult(evaled)) {
            let evaledrender = evaled.getKeycapText();
            if (evaledrender) {
                return evaledrender;
            }
        }
        let kc = normalizeKeycode(parsed.content);
        if (kc === "KC_NO" || kc === "KC_ROLL_OVER") {
            return {};
        }

        return fallback;
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

    private onFocusKeymapsTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        e.currentTarget.select();
    };

    @action
    private parseKeymapsText = () => {
        let layout = this.getLayoutOrError();
        if (!layout) {
            return;
        }
        try {
            this.lastSuccessfulKeymapParsed = tryParseKeymapsText(
                this.keymapsTextareaValue,
                layout.keyCount
            );
            this.keymapsParseError = "";
            if (this.avoidResendCycleKeymapText !== this.keymapsTextareaValue) {
                sendKeymapToExtension("", this.keymapsTextareaValue);
            }
        } catch (e) {
            if (e instanceof Error) {
                this.keymapsParseError = e.message;
            }
        }
    };

    @action
    private onChangeKeymapsTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.keymapsTextareaValue = e.target.value;
    };

    @action
    private onChangeLayer = (newTabId: number, prevTabId: number) => {
        this.selectedKey = null;
        this.layerIndex = newTabId;
    };

    @action
    private onClickAddLayer = (e: React.MouseEvent<any>) => {
        e.preventDefault();
        this.keymapsTextareaValue = addLayerKeymaps(this.keymapsTextareaValue);
        this.layerIndex = this.lastSuccessfulKeymapParsed.length;
        this.selectedKey = null;
    };

    @computed
    private get selectedRefKeysFromInput() {
        let value = this.safeGetKeymapValue(this.layerIndex, this.selectedKey);
        if (value) {
            return new Map().set(value.content || "", true);
        }
        return new Map();
    }

    @action
    private onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let layout = this.getLayoutOrError();
        try {
            this.keyValidationError = "";
            this.keymapsTextareaValue = trySetKeymapsKey(
                this.keymapsTextareaValue,
                this.layerIndex,
                this.selectedKey,
                e.target.value,
                layout && layout.keyCount
            );
        } catch (e) {
            if (e instanceof Error) {
                this.keyValidationError = e.message;
            }
        }

        this.keyInputValue = e.target.value;
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
                let layout = this.getLayoutOrError();
                try {
                    this.keymapsTextareaValue = trySetKeymapsKey(
                        this.keymapsTextareaValue,
                        this.layerIndex,
                        this.selectedKey,
                        k,
                        layout && layout.keyCount
                    );
                } catch (e) {}
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
