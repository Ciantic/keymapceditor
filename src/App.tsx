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
import { IKeyboardLayout, keyboardLayouts, KeyboardLayoutKey } from "./KeyboardLayouts";
import { LANGS } from "./Langs";
import { ILanguageMapping, languageMappings, LanguageMappingKey } from "./LanguageMaps";
import { keycodeToUsbcode, normalizeKeycode } from "./QMK";
import { keycode, keys } from "./QMK/keycodes";
import { IReferenceKeyboard, referenceKeyboards, ReferenceKeyboardKey } from "./ReferenceKeyboards";
import { initTools } from "./Tools";
import { cns } from "./Utils/classnames";
import { Tabs2, Tab2, FocusStyleManager } from "@blueprintjs/core";
import { KeycapText } from "./Components/Key";
import {
    evalKeyExpression,
    tryParseKeymapsText,
    KeymapParseResult,
    addLayerKeymaps,
    trySetKeymapsKey,
} from "./QMK/parsing";
import { qmkExecutor, isRenderableResult } from "./QMK/functions";
import {
    sendKeymapToExtension,
    listenMessageFromExtension,
    initExtension,
    sendLogToExtension,
} from "./Extension";
const styles = require("./App.module.scss");

@observer
export class App extends React.Component<{}, {}> {
    // Drop downs
    @observable private languageMappingKey: LanguageMappingKey | "";
    @observable private referenceKeyboardKey: ReferenceKeyboardKey | "";
    @observable private keyboardLayoutKey: KeyboardLayoutKey | "";

    // Keymap.c from url
    @observable private keymapLayoutUrl = "";
    @observable private downloadUrlState: "" | "success" | "downloading" | "error" = "";
    @observable private downloadedKeymap = "";

    // Stored name of the keymap
    @observable private keymapLayoutName = "";

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
    private urlInputRef: HTMLInputElement | null = null;

    // Reference layout
    @observable private hoveredRefKeys = new Map<keycode, boolean>();

    constructor() {
        super();

        // This is almost like a caching trick, parsing happens only when these
        // two changes
        reaction(t => [this.keymapsTextareaValue, this.keyboardLayoutKey], this.parseKeymapsText);

        // Somewhat bad way to update a keyInputValue
        reaction(
            () => [this.keyboardLayoutKey, this.currentSelectedValue],
            () => {
                this.keyValidationError = "";
                this.keyInputValue =
                    (this.currentSelectedValue && this.currentSelectedValue.content) || "";
            }
        );

        reaction(() => this.languageMappingKey, this.updateReferenceKeyboard);

        // Ajax keymap content
        if (!VSC_MODE) {
            reaction(() => this.keymapLayoutUrl, this.downloadKeymapUrl);

            reaction(() => this.keymapsTextareaValue, this.resetUrl);

            // Routing / URL Handling
            this.updateFromUrl();
            addEventListener("hashchange", this.updateFromUrl);
            autorun(this.updateUrl);

            this.parseKeymapsText();
        }

        if (VSC_MODE) {
            // Listen messages from VSC extension
            listenMessageFromExtension("setKeymap", data =>
                runInAction("setKeymap from extension", () => {
                    this.keymapsTextareaValue = data.keymap;
                })
            );

            initExtension();

            // Get keyboard key from a url
            let m = VSC_URI.match(/\/keyboards\/(.*?)\//);
            if (m && m[1]) {
                this.keyboardLayoutKey = m[1] as KeyboardLayoutKey;
            }
        }
    }

    render() {
        let refKeyboard: IReferenceKeyboard | null = referenceKeyboards[this.referenceKeyboardKey];
        let keyboardLayout: IKeyboardLayout | null = keyboardLayouts[this.keyboardLayoutKey];
        let keymapLayoutUrl = this.keymapLayoutUrl;
        if (this.isModified) {
            keymapLayoutUrl = "";
        }
        return (
            <div>
                <nav className="pt-navbar pt-dark pt-fixed-top">
                    {!VSC_MODE
                        ? <div className="pt-navbar-group pt-align-left">
                              <div className="pt-navbar-heading">QMKMapper</div>
                          </div>
                        : null}
                    <div className="pt-navbar-group pt-control-group pt-align-left pt-fill">
                        <div className="pt-select pt-fill .modifier">
                            <select
                                value={this.keyboardLayoutKey}
                                onChange={this.onChangeKeyboardLayoutKey}
                            >
                                <option value="">
                                    {LANGS.ChooseKeyboardLayout}
                                </option>
                                {Object.keys(keyboardLayouts).map((t, i) =>
                                    <option key={i} value={t}>
                                        {keyboardLayouts[t].name}
                                    </option>
                                )}
                                <option value="">
                                    {LANGS.MyLayoutIsMissing}
                                </option>
                            </select>
                        </div>
                        <div className="pt-select pt-fill">
                            <select
                                value={this.languageMappingKey}
                                onChange={this.onChangeLanguageMappingKey}
                            >
                                <option value="">
                                    {LANGS.ChooseReferenceMapping}
                                </option>
                                {Object.keys(languageMappings).map((t, i) =>
                                    <option key={i} value={t}>
                                        {languageMappings[t].name}
                                    </option>
                                )}
                                <option value="">
                                    {LANGS.MyLanguageMapIsMissing}
                                </option>
                            </select>
                        </div>
                        <div className="pt-select pt-fill .modifier">
                            <select
                                value={this.referenceKeyboardKey}
                                onChange={this.onChangeReferenceKeyboardKey}
                            >
                                <option value="-1">
                                    {LANGS.ChooseReferenceKeyboard}
                                </option>
                                {Object.keys(referenceKeyboards).map((key, i) =>
                                    <option key={i} value={key}>
                                        {referenceKeyboards[key].name}
                                    </option>
                                )}
                                <option value="-2">
                                    {LANGS.MyReferenceKeyboardIsMissing}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-navbar-group pt-control-group pt-align-right">
                        <button className="pt-button pt-icon-delete" onClick={this.onClickDelete} />
                    </div>
                </nav>
                {keyboardLayout &&
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
                        <a
                            className="pt-button pt-minimal pt-icon-add"
                            onClick={this.onClickAddLayer}
                        >
                            {LANGS.Add}
                        </a>
                    </Tabs2>}
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
                {!VSC_MODE
                    ? <div>
                          <div className={cns("pt-control-group", styles.keymapUri)}>
                              {this.isModified
                                  ? <input
                                        readOnly
                                        value={keymapLayoutUrl}
                                        spellCheck={false}
                                        placeholder={LANGS.KeymapModifiedPlaceholder}
                                        className={cns("pt-input", "pt-fill")}
                                    />
                                  : <input
                                        ref={this.setChangeUrlInputRef}
                                        onChange={this.onChangeKeymapUrl}
                                        value={keymapLayoutUrl}
                                        spellCheck={false}
                                        placeholder={LANGS.KeymapUriPlaceholder}
                                        className={cns(
                                            "pt-input",
                                            "pt-fill",
                                            this.downloadUrlState === "downloading" &&
                                                "pt-intent-warning",
                                            this.downloadUrlState === "error" && "pt-intent-danger"
                                        )}
                                    />}
                              {this.keyboardLayoutKey &&
                                  this.isModified &&
                                  <button
                                      className="pt-button pt-icon-undo"
                                      onClick={this.onClickDefaultUrl}
                                  />}
                          </div>
                          <textarea
                              ref={this.setTextareaRef}
                              placeholder={LANGS.KeymapsPlaceholder}
                              value={this.keymapsTextareaValue}
                              spellCheck={false}
                              className={cns(
                                  "pt-input pt-fill",
                                  this.keymapsTextareaValue &&
                                      this.layoutNotSelectedError &&
                                      "pt-intent-danger",
                                  this.keymapsTextareaValue &&
                                      this.keymapsParseError !== "" &&
                                      "pt-intent-danger",
                                  styles.keymapsTextarea
                              )}
                              onFocus={this.onFocusKeymapsTextarea}
                              onChange={this.onChangeKeymapsTextarea}
                          />
                      </div>
                    : <input
                          value={VSC_URI}
                          readOnly
                          className={cns("pt-input", "pt-fill", styles.keymapUri)}
                      />}

                {this.keymapsTextareaValue &&
                    this.layoutNotSelectedError &&
                    <div className="pt-callout pt-intent-danger">
                        {this.layoutNotSelectedError}
                    </div>}
                {this.keymapsTextareaValue &&
                    this.keymapsParseError !== "" &&
                    <div className="pt-callout pt-intent-danger">
                        {this.keymapsParseError}
                    </div>}
            </div>
        );
    }

    private updateUrl = () => {
        let parts = [this.keyboardLayoutKey, this.languageMappingKey, this.keymapLayoutUrl];
        let newUrl = parts.join("|");
        if (newUrl) {
            window.location.replace("#" + newUrl);
        } else if (window.location.href.indexOf("#") > 0) {
            window.location.replace(
                window.location.href.substr(0, window.location.href.indexOf("#"))
            );
        }
    };

    @action
    private updateFromUrl = () => {
        // This format may change
        let hash = location.href.indexOf("#");
        if (hash !== -1) {
            let [keyboardLayoutKey, languageMappingKey, keymapLayoutUrl] = location.href
                .slice(hash + 1)
                .split("|");

            if (languageMappingKey && languageMappingKey in languageMappings) {
                this.languageMappingKey = languageMappingKey as LanguageMappingKey;
            }

            if (keyboardLayoutKey && keyboardLayoutKey in keyboardLayouts) {
                this.keyboardLayoutKey = keyboardLayoutKey as KeyboardLayoutKey;
            }

            if (keymapLayoutUrl) {
                if (keymapLayoutUrl.indexOf("%3A") !== -1) {
                    keymapLayoutUrl = decodeURIComponent(keymapLayoutUrl);
                }
                this.keymapLayoutUrl = keymapLayoutUrl;
            }
        }
    };

    private getKeymapFromUrl = (path: string) => {};

    @computed
    private get isModified() {
        if (this.downloadedKeymap) {
            return this.downloadedKeymap !== this.keymapsTextareaValue;
        }
        return !!this.keymapsTextareaValue;
    }

    @computed
    private get currentSelectedValue() {
        return this.safeGetKeymapValue(this.layerIndex, this.selectedKey);
    }

    @action
    private onClickDelete = () => {
        this.keyboardLayoutKey = "";
        this.languageMappingKey = "";
        this.referenceKeyboardKey = "";
        this.downloadUrlState = "";
        this.downloadedKeymap = "";
        this.keymapsTextareaValue = "";
        this.keymapLayoutUrl = "";
    };

    @action
    private onClickDefaultUrl = () => {
        let layout = keyboardLayouts[this.keyboardLayoutKey];
        if (layout) {
            this.keymapsTextareaValue = this.downloadedKeymap;
            setTimeout(() => {
                if (this.urlInputRef) {
                    this.urlInputRef.focus();
                    this.urlInputRef.select();
                }
            }, 100);
        }
    };

    private throttleDownloadKeymapUrlTimeout = null;
    private downloadKeymapUrlXhr: XMLHttpRequest = null;

    @action
    private downloadKeymapUrl = () => {
        if (!this.keymapLayoutUrl) {
            this.downloadUrlState = "";
            return;
        }
        if (!this.keymapLayoutUrl.startsWith("http")) {
            this.downloadUrlState = "error";
            return;
        }
        this.downloadUrlState = "downloading";

        if (this.throttleDownloadKeymapUrlTimeout) {
            clearTimeout(this.throttleDownloadKeymapUrlTimeout);
        }
        this.throttleDownloadKeymapUrlTimeout = setTimeout(() => {
            if (this.downloadKeymapUrlXhr) {
                this.downloadKeymapUrlXhr.abort();
            }
            let xhr = (this.downloadKeymapUrlXhr = new XMLHttpRequest());
            let self = this;
            xhr.open("GET", this.keymapLayoutUrl, true);
            xhr.onreadystatechange = function() {
                let xhrSelf = this;
                // Completed successfully
                if (this.readyState === 4 && this.status === 200) {
                    runInAction(function() {
                        self.downloadUrlState = "success";
                        self.downloadedKeymap = xhrSelf.responseText;
                        self.keymapsTextareaValue = xhrSelf.responseText;
                    });
                } else if (this.readyState === 4) {
                    runInAction(() => {
                        self.downloadUrlState = "error";
                    });
                }
            };
            xhr.send();
        }, this.throttleDownloadKeymapUrlTimeout ? 1000 : 0);
    };

    private safeGetKeymapValue = (layer: number, key: number) => {
        if (this.lastSuccessfulKeymapParsed.length > layer) {
            if (this.lastSuccessfulKeymapParsed[layer][key]) {
                return this.lastSuccessfulKeymapParsed[layer][key];
            }
        }
        return null;
    };

    private setChangeUrlInputRef = (el: HTMLInputElement) => {
        this.urlInputRef = el;
    };

    private setInputRef = (el: HTMLInputElement) => {
        this.inputRef = el;
    };

    private setTextareaRef = (el: HTMLTextAreaElement) => {
        this.textareaRef = el;
    };

    private getReferenceKeycapText = (c: keycode): KeycapText => {
        let langMapping = languageMappings[this.languageMappingKey];
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
        let langMapping = languageMappings[this.languageMappingKey];
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
        let layout = keyboardLayouts[this.keyboardLayoutKey] || null;
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
    private updateReferenceKeyboard = () => {
        let newLanguageMapping = languageMappings[this.languageMappingKey];
        if (newLanguageMapping) {
            this.referenceKeyboardKey = newLanguageMapping.referenceKeyboard;
        }
    };

    @action
    private resetUrl = () => {
        // if () {
        //     this.keymapLayoutUrl = "";
        // }
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
            sendKeymapToExtension(this.keymapsTextareaValue);
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
    private onChangeKeymapUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.keymapLayoutUrl = e.target.value;
    };

    private throttleTimeoutInput = null;

    @action
    private onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.keyInputValue = e.target.value;
        if (this.throttleTimeoutInput) {
            clearTimeout(this.throttleTimeoutInput);
        }
        this.throttleTimeoutInput = setTimeout(() => {
            this.validateKeyChange(this.keyInputValue);
        }, 300);
    };

    private validateKeyChange = (keymap: string) => {
        let layout = this.getLayoutOrError();
        try {
            this.keyValidationError = "";
            this.keymapsTextareaValue = trySetKeymapsKey(
                this.keymapsTextareaValue,
                this.layerIndex,
                this.selectedKey,
                keymap,
                layout && layout.keyCount
            );
        } catch (e) {
            if (e instanceof Error) {
                this.keyValidationError = e.message;
            }
        }
    };

    // Drop downs at the top
    @action
    private onChangeLanguageMappingKey = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.languageMappingKey = e.target.value as LanguageMappingKey;
    };

    @action
    private onChangeReferenceKeyboardKey = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.referenceKeyboardKey = e.target.value as ReferenceKeyboardKey;
    };

    @action
    private onChangeKeyboardLayoutKey = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let oldLayout = keyboardLayouts[this.keyboardLayoutKey];
        this.keyboardLayoutKey = e.target.value as KeyboardLayoutKey;
        let newLayout = keyboardLayouts[this.keyboardLayoutKey];
        if (
            // If nothing is set, allow changing url
            (!this.keymapLayoutUrl && !this.keymapsTextareaValue) ||
            // If the URL is default URL of the old layout, allow changing the
            // url to new default url
            (oldLayout &&
                oldLayout.defaultKeymapUrl === this.keymapLayoutUrl &&
                !this.isModified) ||
            // If the keymap text is not modified allow changing the download url
            (!oldLayout && !this.isModified)
        ) {
            this.keymapLayoutUrl = newLayout.defaultKeymapUrl;
        }
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

// Blueprint js focus system which hides the ugly focus rings when navigating
// with mouse. With keyboard tab navigation the focus rings are preserved.
FocusStyleManager.onlyShowFocusOnTabs();

// Inject some helpers to use with JS console
initTools((window["QMTOOLS"] = {}));
