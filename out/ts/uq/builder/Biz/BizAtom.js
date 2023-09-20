"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAtom = void 0;
const BizEntity_1 = require("./BizEntity");
class BBizAtom extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        const { id } = this.bizEntity;
        /*
        const procSave = this.createProcedure(`${id}$s`);
        this.buildSaveProc(procSave);
        const procGet = this.createProcedure(`${id}$g`);
        this.buildGetProc(procGet);
        */
    }
}
exports.BBizAtom = BBizAtom;
//# sourceMappingURL=BizAtom.js.map