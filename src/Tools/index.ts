import { kleKeys, kleNumberify } from "./kleKeys";

export const initTools = (o: any) => {
    o["kleKeys"] = kleKeys;
    o["kleNumberify"] = kleNumberify;
};
