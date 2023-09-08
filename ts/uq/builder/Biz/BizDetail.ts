import { BizDetail, BizDetailAct, Field, Int, ProcParamType, intField } from "../../il";
import { Sqls } from "../bstatement";
import { ExpNum, ExpStr, ExpVar } from "../sql";
import { BBizBase } from "./BizBase";

export class BBizDetail extends BBizBase<BizDetail> {
    buildProcedures() {
        let { appObjs } = this.context;
        let { procedures } = appObjs;
        let { acts } = this.base;
        for (let act of acts) {
            let proc = this.buildActProcedure(act);
            procedures.push(proc);
        }
    }

    private buildActProcedure(act: BizDetailAct) {
        let { factory, unitField, userParam } = this.context;
        let { pend } = this.base;
        let { name: actName, idParam } = act;
        let procName = `${this.base.name}.${actName}`;
        let proc = this.context.createProcedure(procName);
        let { parameters, statements } = proc;
        parameters.push(
            unitField,
            userParam,
            idParam,
        );
        let declare = factory.createDeclare();
        statements.push(declare);
        /*
        declare.var('a', new Int());
        let setA = factory.createSet();
        statements.push(setA);
        setA.equ('a', ExpNum.num1);
        */

        // statements.push(proc.createTransaction());
        let procSqls = new Sqls(this.context, statements);
        if (pend !== undefined) {
            const procDecPend = factory.createCall();
            procSqls.push(procDecPend);
            procDecPend.procName = '$DecPend';
            procDecPend.params = [
                { value: new ExpVar('$unit') },
                { value: new ExpVar('$user') },
                { value: new ExpVar(idParam.name) },
                { value: new ExpStr(pend.phrase) },
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
