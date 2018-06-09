type Coordinate = [number, number];

export type QmkKeyDefinition = {
    label?: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
    ks?: Coordinate[];
};

export type QmkLayoutDefinition = {
    layout: QmkKeyDefinition[];
};

export type QmkLayoutDictionary = {
    [keyword: string]: QmkLayoutDefinition; // keyword is the "LAYOUT_something"
};

export type QmkInfoJson = {
    _defaultKeymapUrl?: string; // TODO: NOT REALLY, REMOVE THIS!
    keyboard_name: string;
    url: string;
    bootloader?: string;
    maintainer: string;
    width: number;
    height: number;
    layouts: QmkLayoutDictionary;
};

// export const getKeyCount = (layout?: QmkInfoJson | null): number => {
//     if (!layout) {
//         return 0;
//     }
//     return (
//         (layout &&
//             layout.layouts[0] &&
//             layout.layouts[0].layout &&
//             layout.layouts[0].layout.length) ||
//         0
//     );
// };
