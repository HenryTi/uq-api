"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonNamesLowercase = exports.getErrorString = void 0;
function getErrorString(err) {
    if (err === null)
        return 'error=null';
    if (err === undefined)
        return 'error=undefined';
    if (typeof err === 'object') {
        let ret = 'error object - ';
        for (let key of Object.keys(err)) {
            ret += key + ': ' + err[key] + '; ';
        }
        return ret;
    }
    return err;
}
exports.getErrorString = getErrorString;
function jsonNamesLowercase(obj) {
    if (typeof obj !== 'object')
        return obj;
    if (obj === null)
        return null;
    if (Array.isArray(obj) === true) {
        let ret = [];
        for (let row of obj) {
            ret.push(jsonNamesLowercase(row));
        }
        return ret;
    }
    else {
        let ret = {};
        for (let i in obj) {
            ret[i.toLowerCase()] = jsonNamesLowercase(obj[i]);
        }
        return ret;
    }
}
exports.jsonNamesLowercase = jsonNamesLowercase;
//# sourceMappingURL=tools.js.map