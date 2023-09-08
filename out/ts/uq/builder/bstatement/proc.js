"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BProcStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
class BProcStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { proc, params } = this.istatement;
        let len = params.length;
        let { factory } = this.context;
        let c = factory.createCall();
        let cParams = c.params;
        cParams.push({
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpVar(this.context.unitFieldName),
        });
        cParams.push({
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpVar(this.context.userParam.name),
        });
        let p = 0;
        if (proc) {
            c.procName = this.context.twProfix + proc.name;
        }
        else if (len === 0) {
            return;
        }
        else {
            const { value } = params[p];
            c.procNameExp = (0, sql_1.convertExp)(this.context, value);
            ++p;
        }
        for (; p < len; p++) {
            const { paramType, value } = params[p];
            cParams.push({
                paramType,
                value: (0, sql_1.convertExp)(this.context, value),
            });
        }
        sqls.push(c);
    }
}
exports.BProcStatement = BProcStatement;
//# sourceMappingURL=proc.js.map