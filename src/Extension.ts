if (typeof VSC_MODE === "undefined") {
    (window as any)["VSC_MODE"] = false;
}
if (typeof VSC_URI === "undefined") {
    (window as any)["VSC_URI"] = "";
}
export const vscode = VSC_MODE ? acquireVsCodeApi() : null;

const sendToExtension = (command: string, data?: {}) => {
    if (!VSC_MODE) {
        return;
    }
    if (!vscode) {
        return;
    }
    vscode.postMessage({
        command: command,
        uri: VSC_URI,
        ...data,
    });
};

export const sendConnectRequestToExtension = () => {
    sendToExtension("_keymapceditor.connectedPreview");
};

let throttleTimeout: number | null = null;

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
        sendToExtension("_keymapceditor.keymapFromPreview", {
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
