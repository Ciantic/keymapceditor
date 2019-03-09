declare var VSC_MODE: boolean;

declare var VSC_URI: string;

interface State {
    keyboard: string;
    language: string;
    referenceKeyboard: string;
}

declare var acquireVsCodeApi: () => {
    postMessage: (
        o: {
            command: string;
            uri: string;
        }
    ) => void;
    setState: (o: State) => void;
    getState: () => State | null;
};
