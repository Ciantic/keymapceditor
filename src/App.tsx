import { IReferenceKeyboard, referenceKeyboards } from './QMK/referencekeyboards';
require("./App.scss");
import * as React from 'react';
import { Keyboard, KeyboardLayout } from "./Components/Keyboard";
import { LANGS } from "./Langs";
import { iso105 } from './QMK/iso105';
import { ergodox } from './Presets/ergodox';
import { observer } from "mobx-react";
import { KeyboardLayoutArray } from "./KLE/keyboardlayout";
import { observable, action, computed } from "mobx";
import { KeyStyle } from "./Components/Key";
import { initTools } from './Tools';
import { IKeymapping, languageMappings } from './LanguageMaps';
import { ansi104 } from './QMK/ansi104';

initTools(window["QMTOOLS"] = {});

@observer
export class KeyboardConfigure extends React.Component<{
    className?: string;
    layout: KeyboardLayoutArray;
}, void> {
    @observable private selectedKey = -1;
    @observable private hoveredKey = -1;
    @computed get keyStyles() {
        let keyStyles = new Array<KeyStyle>(1024);
        if (this.selectedKey >= 0) {
            keyStyles[this.selectedKey] = {
                pressed : true,
                hovered : this.hoveredKey === this.selectedKey
            };
        }
        if (this.hoveredKey >= 0) {
            keyStyles[this.hoveredKey] = {
                pressed : this.selectedKey === this.hoveredKey,
                hovered : true
            };
        }
        return keyStyles;
    }
    render() {
        return <KeyboardLayout 
            className={this.props.className}
            keyStyles={this.keyStyles} 
            layout={this.props.layout} 
            onMouseOutKey={this.onMouseOutKey}
            onMouseOverKey={this.onMouseOverKey}
            getKeycapText={(v) => ({ centered: v })}
            onClickKey={this.onClickKey}
            />
    }

    onClickKey = (v: string, n: number) => action(() => {
        console.log("click qmk index", v);
        if (this.selectedKey === n) {
            this.selectedKey = -1;
        } else {
            this.selectedKey = n;
        }
    });
    
    onMouseOverKey = (v: string, n: number) => action(() => {
        this.hoveredKey = n;
    })

    onMouseOutKey = (v: string, n: number) => action(() => {
        this.hoveredKey = -1;
    })
}

@observer
export class App extends React.Component<{}, {}> {
    @observable langMappingIndex = -1;
    @observable referenceKeyboardIndex = -1;

    render() {
        let langMapping: IKeymapping = languageMappings[this.langMappingIndex] || {} as any;
        let referenceKeyboard: IReferenceKeyboard = referenceKeyboards[this.referenceKeyboardIndex] || null;
        return <div>
            <KeyboardConfigure layout={ergodox} />
            {/*<input type="text" className="pt-input pt-fill" />*/}
            <div className="pt-select pt-fill .modifier">
                <select value={this.langMappingIndex} onChange={this.changeMapping}>
                    <option value="-1">{LANGS.ChooseReferenceMapping}</option>
                    {languageMappings.map((t, i) => 
                        <option value={i} selected>{t.name}</option>
                    )}
                </select>
            </div>
            <div className="pt-select pt-fill .modifier">
                <select value={this.referenceKeyboardIndex} onChange={this.changeReferenceKeyboard}>
                    <option value="-1">{LANGS.ChooseReferenceKeyboard}</option>
                    {referenceKeyboards.map((t, i) => 
                        <option value={i} selected>{t.name}</option>
                    )}                
                </select>
            </div>
            {referenceKeyboard && <Keyboard layout={referenceKeyboard.keyboard}  getKeycapText={langMapping.getKeycapText} />}
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
}