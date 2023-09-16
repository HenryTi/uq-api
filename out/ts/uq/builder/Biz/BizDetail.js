"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizDetail = void 0;
const bstatement_1 = require("../bstatement");
const sql_1 = require("../sql");
const BizEntity_1 = require("./BizEntity");
class BBizDetail extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        let { appObjs } = this.context;
        let { procedures } = appObjs;
        let { acts } = this.bizEntity;
        for (let act of acts) {
            let proc = this.buildActProcedure(act);
            procedures.push(proc);
        }
    }
    buildActProcedure(act) {
        let { factory, unitField, userParam } = this.context;
        let { pend } = this.bizEntity;
        let { name: actName, idParam } = act;
        let procName = `${this.bizEntity.name}.${actName}`;
        let proc = this.context.createProcedure(procName);
        let { parameters, statements } = proc;
        parameters.push(unitField, userParam, idParam);
        let declare = factory.createDeclare();
        statements.push(declare);
        /*
        declare.var('a', new Int());
        let setA = factory.createSet();
        statements.push(setA);
        setA.equ('a', ExpNum.num1);
        */
        // statements.push(proc.createTransaction());
        let procSqls = new bstatement_1.Sqls(this.context, statements);
        if (pend !== undefined) {
            const procDecPend = factory.createCall();
            procSqls.push(procDecPend);
            procDecPend.procName = '$DecPend';
            procDecPend.params = [
                { value: new sql_1.ExpVar('$unit') },
                { value: new sql_1.ExpVar('$user') },
                { value: new sql_1.ExpVar(idParam.name) },
                { value: new sql_1.ExpStr(pend.phrase) },
            ];
        }
        const { statements: actStatements } = act.statement;
        procSqls.head(actStatements);
        let rb = this.context.returnStartStatement();
        rb.body(procSqls);
        procSqls.body(actStatements);
        let re = this.context.returnEndStatement();
        re.body(procSqls);
        procSqls.foot(actStatements);
        procSqls.done(proc);
        // statements.push(proc.createCommit());
        return proc;
    }
}
exports.BBizDetail = BBizDetail;
//# sourceMappingURL=BizDetail.js.map