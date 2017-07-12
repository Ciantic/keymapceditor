/**
 * Helper for KLE creation
 * 
 * @param layout The layout from keyboard-layout-editor.com
 */
export const kleKeys = (layout: any[][]) => {
    let keys: string[] = [];
    layout.forEach((r: any) => {
        r.forEach((c: any) => {
            if (typeof c === "string") {
                keys.push(c);
            }
        });
    });

    return keys;
};

export const kleNumberify = (layout: any[][]) => {
    let keys = [];
    let j = 0;
    layout.forEach(r => {
        r.forEach((c, i) => {
            if (typeof c === "string") {
                r[i] = "" + j++;
            }
        });
    });
    return JSON.stringify(layout);
};
