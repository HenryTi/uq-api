import { BStatement } from "./bstatement";
import { ProcParamType, ProcStatement } from "../../il";
import { Sqls } from "./sqls";
import { convertExp, ExpVal, ExpVar } from "../sql";

export class BProcStatement extends BStatement<ProcStatement> {
    body(sqls: Sqls) {
        let { proc, params } = this.istatement;
        let len = params.length;
        let { factory } = this.context;
        let c = factory.createCall();
        let cParams = c.params;
        cParams.push({
            paramType: ProcParamType.in,
            value: new ExpVar(this.context.unitFieldName),
        });
        cParams.push({
            paramType: ProcParamType.in,
            value: new ExpVar(this.context.userParam.name),
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
            c.procNameExp = convertExp(this.context, value) as ExpVal;
            ++p;
        }
        for (; p < len; p++) {
            const { paramType, value } = params[p];
            cParams.push({
                paramType,
                value: convertExp(this.context, value) as ExpVal,
            });
        }
        sqls.push(c);
    }
}
