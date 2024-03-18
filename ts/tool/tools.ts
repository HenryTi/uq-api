
export function getErrorString(err: any): string {
    if (err === null) return 'error=null';
    if (err === undefined) return 'error=undefined';

    if (typeof err === 'object') {
        let ret = 'error object - ';
        for (let key of Object.keys(err)) {
            ret += key + ': ' + err[key] + '; ';
        }
        return ret;
    }
    return err;
}

export function jsonNamesLowercase(obj: any) {
    if (typeof obj !== 'object') return obj;
    if (obj === null) return null;
    if (Array.isArray(obj) === true) {
        let ret = [] as any[];
        for (let row of obj as any[]) {
            ret.push(jsonNamesLowercase(row));
        }
        return ret;
    }
    else {
        let ret = {} as any;
        for (let i in obj) {
            ret[i.toLowerCase()] = jsonNamesLowercase(obj[i]);
        }
        return ret;
    }
}