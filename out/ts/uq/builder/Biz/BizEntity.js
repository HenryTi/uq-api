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
    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud)
                return;
            bud.valueString = this.stringify(bud.value);
        });
    }
    createProcedure(procName) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }
    stringify(value) {
        if (value === undefined)
            return;
        const exp = this.context.convertExp(value);
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }
}
exports.BBizEntity = BBizEntity;
//# sourceMappingURL=BizEntity.js.map