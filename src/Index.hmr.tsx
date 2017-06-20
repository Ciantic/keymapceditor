import { AppContainer } from "react-hot-loader";
import * as React from "react";
import { render } from "react-dom";
import { App } from "./App";
import DevTools from 'mobx-react-devtools';

const rootEl = document.getElementById("root");

// NOTE: This file cannot be hot reloaded, try editing App.tsx instead!

render(<AppContainer>
    <div>
        <App />
        <DevTools />
    </div>
</AppContainer>, rootEl);

declare var module: any; // Hot module replacement thingie
declare var require: any; // require (remove once you've got types for this)

if (process.env.NODE_ENV === "development" && (module as any).hot) {
    (module as any).hot.accept("./App", () => {
        // If you use Webpack 2 in ES modules mode, you can
        // use <App /> here rather than require() a <NextApp />.
        const NextApp = require("./App").App;
        render(
            <AppContainer>
                <div>
                    <NextApp />
                    <DevTools />
                </div>
            </AppContainer>,
            rootEl
        );
    });
}