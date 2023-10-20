import { BigInt, BizBudValue, BizEntity, BizQueryValue, BudValueAct, Char, DataType, Expression, ValueExpression, bigIntField, jsonField } from "../../il";
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
        const { on } = query;
        const site = '$site';
        const json = '$json';
        const varJson = new ExpVar(json);
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push(
            bigIntField('$user'),
            jsonField(json),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new BigInt());

        if (on !== undefined) {
            for (let p of on) {
                declare.var(p, new Char(200));
                const setP = factory.createSet();
                statements.push(setP);
                setP.equ(p, new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${p}"`)));
            }
        }

        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpNum(this.context.site));

        let sqls = new Sqls(this.context, statements);
        let { statements: queryStatements } = query.statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
    }
}
