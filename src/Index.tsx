import * as React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { TestRenderer } from "./TestRenderer";
// import { observable, action, runInAction } from "mobx";
// import { observer } from "mobx-react";

const rootEl = document.getElementById("root");

render(window.location.hash === "#testrenderer" ? <TestRenderer /> : <App />, rootEl);
