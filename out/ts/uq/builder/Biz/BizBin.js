"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizBin = void 0;
const il_1 = require("../../il");
const BizEntity_1 = require("./BizEntity");
const bstatement_1 = require("../bstatement");
class BBizBin extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { id, act } = this.bizEntity;
        const site = '$site';
        function valueField(name) { return (0, il_1.decField)(name, 18, 6); }
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.bigIntField)('sheet'), (0, il_1.bigIntField)('pend'), (0, il_1.bigIntField)('bin'), (0, il_1.bigIntField)('si'), (0, il_1.bigIntField)('sx'), valueField('svalue'), valueField('samount'), valueField('sprice'), (0, il_1.bigIntField)('i'), (0, il_1.bigIntField)('x'), valueField('value'), valueField('amount'), valueField('price'));
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }
}
exports.BBizBin = BBizBin;
//# sourceMappingURL=BizBin.js.map