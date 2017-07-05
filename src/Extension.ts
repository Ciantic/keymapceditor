if (typeof VSC_MODE === "undefined") {
    window["VSC_MODE"] = false;
}
if (typeof VSC_MODE === "undefined") {
    window["VSC_MODE"] = false;
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
    sendToExtension("_qmkmapper.connectedPreview");
};

let throttleTimeout = null;

export let sendKeymapToExtension = (documentUri: string, keymap: string) => {
    if (!VSC_MODE) {
        return;
    }

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
        cb(e.data);
    });
};
