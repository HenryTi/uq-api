"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
// import { centerApi } from '../centerApi';
// import { DbContainer } from '../db';
class Runner {
    constructor(dbUq) {
        this.dbUq = dbUq;
    }
    async procCall(proc, params) {
        return await this.dbUq.call(proc, params);
    }
}
exports.Runner = Runner;
//# sourceMappingURL=Runner.js.map