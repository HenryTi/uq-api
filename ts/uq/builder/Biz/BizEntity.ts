import { BizEntity, Expression, ValueExpression } from "../../il";
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
            bud.valueString = this.stringify(bud.value);
        });
    }

    protected createProcedure(procName: string) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }

    private stringify(value: Expression): string {
        if (value === undefined) return;
        const exp = this.context.convertExp(value);
        let sb = this.context.createSqlBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }
}
