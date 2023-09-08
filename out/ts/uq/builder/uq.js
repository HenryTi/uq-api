"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUq = void 0;
const sys_1 = require("./sys");
class BUq {
    constructor(uq, context) {
        this.context = context;
        this.uq = uq;
        this.sys = new sys_1.Sys(context);
    }
    getTuid(name) { return this.uq.tuids[name]; }
}
exports.BUq = BUq;
//# sourceMappingURL=uq.js.map