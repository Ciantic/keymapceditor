import { QmkInfoJson } from "../QMK/info";

export const keyboards: { [k: string]: QmkInfoJson } = {};

// Insert the global values from a cache to keyboards list
if (typeof window !== "undefined" && (window as any)["INFO_JSON_FILES"]) {
    Object.keys((window as any)["INFO_JSON_FILES"]).forEach(key => {
        let value = (window as any)["INFO_JSON_FILES"][key];
        keyboards[key] = value;
    });
}
