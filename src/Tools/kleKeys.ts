export const kleKeys = (layout: any[][]) => {
    let keys = [];
    layout.forEach(r => {
        r.forEach(c => {
            if (typeof c === "string") {
                keys.push(c);
            }
        })
    })

    return keys;
}
