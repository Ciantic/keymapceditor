import { ansi104 } from './QMK/ansi104';
import { usMapping } from './LanguageMaps/us';
require("./App.scss");
import * as React from "react";
import { Keyboard, KeyboardLayout } from "./Components/Keyboard";
import { LANGS } from "./Langs";
import { iso105 } from './QMK/iso105';
import { ergodox } from './Presets/ergodox';
import { observer } from "mobx-react";
import { KeyboardLayoutArray } from "./KLE/keyboardlayout";
import { observable, action, computed } from "mobx";
import { KeyStyle } from "./Components/Key";
import { initTools } from './Tools';
import { languageMappedKeyTexts } from "./LanguageMaps/index";

initTools(window["QMTOOLS"] = {});


// TODO: read this file /usr/share/X11/xkb/symbols/fi

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
            keyTexts={[]}
            layout={this.props.layout} 
            onMouseOutKey={this.onMouseOutKey}
            onMouseOverKey={this.onMouseOverKey}
            onClickKey={this.onClickKey}
            />
    }

    onClickKey = (n: number) => action(() => {
        if (this.selectedKey === n) {
            this.selectedKey = -1;
        } else {
            this.selectedKey = n;
        }
    });
    
    onMouseOverKey = (n: number) => action(() => {
        this.hoveredKey = n;
    })

    onMouseOutKey = (n: number) => action(() => {
        this.hoveredKey = -1;
    })
}

export const App = () => <div>
    <KeyboardConfigure layout={ergodox} />
    <input type="text" className="pt-input pt-fill" />
    <div className="pt-select .modifier">
        <select>
            <option selected>{LANGS.ChooseReferenceKeyboard}</option>
        </select>
    </div>
    <div className="pt-select .modifier">
        <select>
            <option selected>{LANGS.ChooseReferenceMapping}</option>
        </select>
    </div>
    <Keyboard layout={iso105} keyTexts={languageMappedKeyTexts(usMapping, iso105)} />
    <Keyboard layout={ansi104} keyTexts={languageMappedKeyTexts(usMapping, ansi104)} />
</div>;