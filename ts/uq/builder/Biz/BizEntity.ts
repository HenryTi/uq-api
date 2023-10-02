import { BizEntity, BudValueAct, Expression, ValueExpression } from "../../il";
import { DbContext } from "../dbContext";

export class BBizEntity<B extends BizEntity = any> {
    protected readonly context: DbContext;
    protected readonly bizEntity: B;

    constructor(context: DbContext, bizEntity: B) {
        this.context = context;
        this.bizEntity = bizEntity;
    }
    async buildTables() {
    }
    async buildProcedures() {
    }

    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud) return;
            let { value } = bud;
            if (value === undefined) return;
            let { exp, act } = value;
            let str = this.stringify(exp);
            if (act === BudValueAct.init) {
                str += '\ninit';
            }
            else {
                str += '\nequ';
            }
            value.str = str;
        });
    }

    protected createProcedure(procName: string) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }

    private stringify(value: Expression): string {
        const exp = this.context.convertExp(value);
        if (exp === undefined) return;
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }
}
