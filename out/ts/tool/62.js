"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.to62 = exports.from62 = void 0;
const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const c0 = digits.charCodeAt(0);
const c9 = digits.charCodeAt(9);
const A = digits.charCodeAt(10);
const Z = digits.charCodeAt(35);
const a = digits.charCodeAt(36);
const z = digits.charCodeAt(61);
function from62(v) {
    if (v === null)
        return null;
    if (v === undefined)
        return undefined;
    if (typeof v !== 'string')
        return Number.NaN;
    let len = v.length;
    if (len === 0)
        return Number.NaN;
    let ret = 0;
    for (let i = 0; i < len; i++) {
        let c = v.charCodeAt(i);
        let n;
        if (c < c0)
            return Number.NaN;
        if (c <= c9) {
            n = c - c0;
        }
        else if (c < A) {
            return Number.NaN;
        }
        else if (c <= Z) {
            n = c - A + 10;
        }
        else if (c < a) {
            return Number.NaN;
        }
        else if (c <= z) {
            n = c - a + 36;
        }
        else {
            return Number.NaN;
        }
        ret *= 62;
        ret += n;
    }
    return ret;
}
exports.from62 = from62;
function to62(v) {
    if (v === null)
        return null;
    if (v === undefined)
        return undefined;
    if (typeof v !== 'number')
        return '';
    if (v < 0)
        return '';
    let ret = '';
    for (;;) {
        ret = digits[v % 62] + ret;
        v = Math.floor(v / 62);
        if (v === 0)
            break;
    }
    return ret;
}
exports.to62 = to62;
//# sourceMappingURL=62.js.map