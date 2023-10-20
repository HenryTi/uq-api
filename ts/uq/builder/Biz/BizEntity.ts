import { BigInt, BizBudValue, BizEntity, BizQueryValue, BudValueAct, DataType, Expression, ValueExpression, bigIntField, jsonField } from "../../il";
import { Sqls } from "../bstatement";
import { DbContext } from "../dbContext";
import { ExpFunc, ExpNum, ExpStr, ExpVal, ExpVar, Procedure } from "../sql";

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
        this.bizEntity.forEachBud((bud) => {
            const { value } = bud as BizBudValue;
            if (value === undefined) return;
            const { query } = value;
            if (query === undefined) return;
            const { id } = bud;
            const procBudValue = this.createProcedure(`${this.context.site}.${id}`);
            this.buildBudValueProc(procBudValue, query);
        });
    }

    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud) return;
            let { value } = bud as BizBudValue;
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

    protected createFunction(name: string, returnType: DataType) {
        const func = this.context.createAppFunc(name, returnType);
        this.context.coreObjs.procedures.push(func);
        return func;
    }

    private stringify(value: Expression): string {
        const exp = this.context.convertExp(value);
        if (exp === undefined) return;
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }

    private buildBudValueProc(proc: Procedure, query: BizQueryValue) {
        const { parameters, statements } = proc;
        parameters.push(
            bigIntField('$user'),
            jsonField('$json'),
        );

        const site = '$site';
        const { factory } = this.context;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new BigInt());

        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpNum(this.context.site));

        let sqls = new Sqls(this.context, statements);
        let { statements: queryStatements } = query.statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);

        let select = factory.createSelect();
        statements.push(select);
        let names: string[] = ['value'];
        let values: ExpVal[] = [];
        for (let name of names) {
            values.push(new ExpStr(name), new ExpVar(name));
        }
        select.column(
            new ExpFunc('JSON_Object', ...values)
            , 'a'
        );
    }
}
