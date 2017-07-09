if (typeof VSC_MODE === "undefined") {
    window["VSC_MODE"] = false;
}
if (typeof VSC_URI === "undefined") {
    window["VSC_URI"] = "";
}

const sendToExtension = (command: string, ...args: any[]) => {
    if (!VSC_MODE) {
        return;
    }
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

export const sendConnectRequestToExtension = () => {
    sendToExtension("_qmkmapper.connectedPreview", {
        uri: VSC_URI,
    });
};

export const sendLogToExtension = (a: any) => {
    sendToExtension("_qmkmapper.logging", a);
};

let throttleTimeout = null;

let sendSaveToExtension = () => {
    setTimeout(() => {
        sendToExtension("_qmkmapper.save", {
            uri: VSC_URI,
        });
    }, 400); // 400 is greater than 300 below
};

let avoidResendCycle = "";

export let sendKeymapToExtension = (keymap: string) => {
    if (!VSC_MODE) {
        return;
    }

    if (keymap === avoidResendCycle) {
        return;
    }

    // Throttle assumes that documentUri does not change
    if (throttleTimeout) {
        clearTimeout(throttleTimeout);
    }
    throttleTimeout = setTimeout(() => {
        sendToExtension("_qmkmapper.keymapFromPreview", {
            uri: VSC_URI,
            keymap,
        });
    }, 300);
};

interface ExtensionMessages {
    (command: "setKeymap", cb: (data: { keymap: string }) => void): void;
}

export const listenMessageFromExtension: ExtensionMessages = (
    command: string,
    cb: (data: any) => void
) => {
    if (!VSC_MODE) {
        return;
    }
    // Listen messages from VSC extension
    addEventListener("message", e => {
        if (!e || !e.data || !e.data.command || e.data.command !== command) {
            return;
        }

        if (e.data.command === "setKeymap") {
            avoidResendCycle = e.data.keymap;
        }

        cb(e.data);
    });
};

export const initExtension = () => {
    // This doesn't seem to work with VSCode, it overrides keyboard shortcuts
    // and some work (e.g. building and saving still seems to work from the
    // preview) and some doesn't addEventListener("keydown", e => { if ((e.key

    // == "s" || e.key == "S") && (e.ctrlKey || e.metaKey)) {
    // e.preventDefault(); sendSaveToExtension(); return false;
    //     }
    //     return true;
    // });

    // Send connect request to extension, for editor to send the initial keymap
    sendConnectRequestToExtension();
};
