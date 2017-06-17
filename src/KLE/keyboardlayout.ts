export interface IKeyboardLayoutNextKey {
    x: number;
    y: number;
    w: number;
    h: number;
    x2: number;
    y2: number;
    w2: number;
    h2: number;
    l: number;
    n: boolean;
    r: number;
    rx: number;
    ry: number;
}

export interface IKeyboardLayoutSubsequentKey {
    c: string;
    t: string;
    g: boolean;
    a: number;
    f: number;
    f2: number;
    p: string;
}

export type IKeyboardLayoutKeyDefinition = Partial<IKeyboardLayoutNextKey & IKeyboardLayoutSubsequentKey>

export type KeyboardLayoutArray = (string | IKeyboardLayoutKeyDefinition)[][];