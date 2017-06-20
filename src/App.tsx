import { cns } from './Utils/classnames';
require("./App.scss");
import * as React from 'react';
import { IKeyboardLayout, keyboardLayouts } from './KeyboardLayouts';
import { KeyboardLayout } from "./Components/Keyboard";
import { LANGS } from "./Langs";
import { observer } from "mobx-react";
import { KeyboardLayoutArray } from "./KLE/keyboardlayout";
import { observable, action, computed } from "mobx";
import { KeyStyle } from "./Components/Key";
import { initTools } from './Tools';
import { IKeymapping, languageMappings } from './LanguageMaps';
import { IReferenceKeyboard, referenceKeyboards } from "./ReferenceKeyboards";

const styles = require("./App.module.scss");

initTools(window["QMTOOLS"] = {});

@observer
export class App extends React.Component<{}, {}> {
    @observable private langMappingIndex = 1;
    @observable private referenceKeyboardIndex = 1;
    @observable private keyboardLayoutIndex = 0;

    @observable private selectedConfigureKeys = new Array(1024).fill(false);
    @observable private hoveredConfigureKeys = new Array(1024).fill(false);
    @observable private selectedRefKeys = new Array(1024).fill(false);
    @observable private hoveredRefKeys = new Array(1024).fill(false);

    render() {
        let langMapping: IKeymapping = languageMappings[this.langMappingIndex] || null;
        let referenceKeyboard: IReferenceKeyboard = referenceKeyboards[this.referenceKeyboardIndex] || null;
        let keyboardLayout: IKeyboardLayout = keyboardLayouts[this.keyboardLayoutIndex] || null;
        let getReferenceKeycapText: typeof langMapping.getKeycapText = (c) => ({ centered: c });
        if (langMapping) {
            getReferenceKeycapText = langMapping.getKeycapText;
        }
        let getConfigureKeycapText: typeof langMapping.getKeycapText = (c) => ({ centered: c });

        return <div>
            <nav className="pt-navbar pt-dark pt-fixed-top">
                <div className="pt-navbar-group pt-align-left">
                    <div className="pt-navbar-heading">QMKMapper</div>
                </div>
                <div className="pt-navbar-group pt-control-group pt-align-left">
                    <div className="pt-select pt-fill">
                        <select value={this.langMappingIndex} onChange={this.changeMapping}>
                            <option value="-1">{LANGS.ChooseReferenceMapping}</option>
                            {languageMappings.map((t, i) => 
                                <option key={i} value={i}>{t.name}</option>
                            )}
                        </select>
                    </div>
                    <div className="pt-select pt-fill .modifier">
                        <select value={this.keyboardLayoutIndex} onChange={this.changeKeyboardLayout}>
                            <option value="-1">{LANGS.ChooseKeyboardLayout}</option>
                            {keyboardLayouts.map((t, i) => 
                                <option key={i} value={i}>{t.name}</option>
                            )}                
                        </select>
                    </div>
                    <div className="pt-select pt-fill .modifier">
                        <select value={this.referenceKeyboardIndex} onChange={this.changeReferenceKeyboard}>
                            <option value="-1">{LANGS.ChooseReferenceKeyboard}</option>
                            {referenceKeyboards.map((t, i) => 
                                <option key={i} value={i}>{t.name}</option>
                            )}                
                        </select>
                    </div>
                </div>
                <div className="pt-navbar-group pt-align-right">
                    <button className="pt-button pt-minimal pt-icon-cog"></button>
                </div>
            </nav>
            {keyboardLayout && 
                <div className={styles.layout}>
                    <KeyboardLayout 
                        styleHoveredKeys={this.hoveredConfigureKeys}
                        stylePressedKeys={this.selectedConfigureKeys}
                        layout={keyboardLayout.layout} 
                        onMouseLeaveKey={this.onMouseOutConfigureKey}
                        onMouseEnterKey={this.onMouseOverConfigureKey}
                        getKeycapText={getConfigureKeycapText}
                        onClickKey={this.onClickConfigureKey}
                    />
                    <input type="text" className={cns(
                        "pt-input pt-fill pt-large",
                        styles.layoutInput
                    )} 
                    placeholder={LANGS.LayoutInput}
                    />
                </div>}

            {referenceKeyboard && <KeyboardLayout 
                    styleHoveredKeys={this.hoveredRefKeys}
                    stylePressedKeys={this.selectedRefKeys}
                    layout={referenceKeyboard.keyboard} 
                    onMouseLeaveKey={this.onMouseOutReferenceKey}
                    onMouseEnterKey={this.onMouseOverReferenceKey}
                    getKeycapText={getReferenceKeycapText}
                    onClickKey={this.onClickReferenceKey}
                />}

            <div className="pt-running-text">
            <h2>{LANGS.CFileTitle}</h2>
            <p>
                <textarea className="pt-input pt-fill"></textarea>
            </p>
            </div>
        </div>
    }

    @action
    private changeMapping = (e: React.SyntheticEvent<any>) => {
        this.langMappingIndex = +(e.target as any).value;
    }

    @action
    private changeReferenceKeyboard = (e: React.SyntheticEvent<any>) => {
        this.referenceKeyboardIndex = +(e.target as any).value;
    }

    @action
    private changeKeyboardLayout = (e: React.SyntheticEvent<any>) => {
        this.keyboardLayoutIndex = +(e.target as any).value;
    }

    private onClickReferenceKey = (v: string, n: number) => action(() => {
        this.selectedRefKeys[n] = !this.selectedRefKeys[n];
    });
    
    private onMouseOverReferenceKey = (v: string, n: number) => action(() => {
        this.hoveredRefKeys[n] = true;
    })

    private onMouseOutReferenceKey = (v: string, n: number) => action(() => {
        this.hoveredRefKeys[n] = false;
    })

    private onClickConfigureKey = (v: string, n: number) => action(() => {
        this.selectedConfigureKeys[n] = !this.selectedConfigureKeys[n];
    });
    
    private onMouseOverConfigureKey = (v: string, n: number) => action(() => {
        this.hoveredConfigureKeys[n] = true;
    })

    private onMouseOutConfigureKey = (v: string, n: number) => action(() => {
        this.hoveredConfigureKeys[n] = false;
    })

}