"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizEntity = void 0;
class BBizEntity {
    constructor(context, bizEntity) {
        this.context = context;
        this.bizEntity = bizEntity;
    }
    async buildTables() {
    }
    async buildProcedures() {
    }
    createProcedure(procName) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }
}
exports.BBizEntity = BBizEntity;
//# sourceMappingURL=BizEntity.js.map