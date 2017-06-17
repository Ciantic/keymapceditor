require("./App.scss");
import * as React from "react";
import { Keyboard } from "./Components/Keyboard";
import { LANGS } from "./Langs";
import { iso105 } from './QMK/iso105';
import { ergodox } from './Presets/ergodox';


// TODO: read this file /usr/share/X11/xkb/symbols/fi

export const App = () => <div>
    <Keyboard layout={ergodox} />

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
    <Keyboard layout={iso105} />
</div>;