import { ObservableMap, transaction, runInAction } from "mobx";

export class ObservableDefaultMap<T> extends ObservableMap<T> {
    constructor(private defaultValue: T) {
        super({});
    }

    modifyValue(key: string, mutator: (v: T) => void) {
        runInAction(() => {
            let a = this.getDefault(key);
            mutator(a);
            this.set(key, a);
        });
    }

    setDefault(key: string): T {
        let v = this.get(key);
        if (typeof v === "undefined") {
            this.set(
                key,
                typeof this.defaultValue === "object"
                    ? Object.assign({}, this.defaultValue)
                    : this.defaultValue
            );
            return this.get(key);
        }
        return v;
    }

    // It's not feasible to modify the value of getDefault
    getDefault(key: string) {
        let v = this.get(key);
        if (typeof v === "undefined") {
            return typeof this.defaultValue === "object"
                ? Object.assign({}, this.defaultValue)
                : this.defaultValue;
        }
        return v;
    }
}

export const asDefaultMap = <T>(defaultValue: T) => new ObservableDefaultMap<T>(defaultValue);
