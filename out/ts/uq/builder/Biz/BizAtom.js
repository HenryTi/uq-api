"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAtom = void 0;
const BizEntity_1 = require("./BizEntity");
class BBizAtom extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        const { base, id } = this.bizEntity;
        if (base === undefined)
            return;
        const proc = this.context.createProcedure(`${id}$test`, true);
        this.context.coreObjs.procedures.push(proc);
    }
}
exports.BBizAtom = BBizAtom;
//# sourceMappingURL=BizAtom.js.map