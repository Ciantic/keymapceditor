const hasOwn = {}.hasOwnProperty;
export const cns = (...args: any[]) => {
    let classes = [];

    for (let i = 0; i < args.length; i++) {
        var arg = args[i];
        if (!arg) {
            continue;
        }

        let argType = typeof arg;

        if (argType === "string" || argType === "number") {
            classes.push(arg);
        } else if (Array.isArray(arg)) {
            classes.push(cns.apply(null, arg));
        } else if (argType === "object") {
            for (let key in arg) {
                if (hasOwn.call(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }

    return classes.join(" ");
};
