import {
    BizBudValue, BizEntity, DataType, Expression,
    JoinType, EnumSysTable, FieldShow, ValueExpression
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import {
    ExpAnd, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpNum, ExpVal, Statement,
} from "../sql";
import { EntityTable, VarTableWithSchema } from "../sql/statementWithFrom";

const a = 'a';
const b = 'b';
const c = 'c';

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
        });
    }

    async buildDirectSqls() { }

    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud) return;
            bud.buildBudValue(this.expStringify);
        });
    }

    protected expStringify = (value: ValueExpression): string => {
        const exp = this.context.convertExp(value);
        if (exp === undefined) return;
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        if (sql.length > 30) {
            debugger;
            let sb = this.context.createClientBuilder();
            exp.to(sb);
        }
        return sql;
    }

    protected createSiteTable(tableName: string | number) {
        return this.createTable(String(tableName));
    }

    protected createTable(tableName: string) {
        const table = this.context.createTable(tableName);
        this.context.coreObjs.tables.push(table);
        return table;
    }

    protected createSiteEntityProcedure(suffix: string = undefined) {
        //return this.createProcedure(`${this.context.site}.${procName}`);
        return this.createProcedure(`${this.bizEntity.id}` + (suffix ?? ''));
    }

    protected createSiteProcedure(objId: number, suffix: string = undefined) {
        return this.createProcedure(`${objId}` + (suffix ?? ''));
    }

    protected createProcedure(procName: string) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }

    protected createSiteEntityFunction(returnType: DataType, suffix: string = undefined) {
        return this.createFunction(`${this.bizEntity.id}` + (suffix ?? ''), returnType);
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

    protected buildGetShowBuds(showBuds: FieldShow[], tempTable: string, tempField: string): Statement[] {
        let statements: Statement[] = [];
        let { factory } = this.context;
        for (let fieldShow of showBuds) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = fieldShow.map(v => v === undefined ? '^' : v.ui?.caption ?? v.name).join('.');
            let select = this.buildSelect(fieldShow, tempTable, tempField);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.ignore = true;
            insert.table = new VarTableWithSchema('props');
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'id', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }

    private buildSelect(fieldShow: FieldShow, tempTable: string, tempfield: string) {
        const { factory } = this.context;
        const select = factory.createSelect();
        select.from(new VarTableWithSchema(tempTable, a));
        let lastT: string = 't0', lastField: string;
        let len = fieldShow.length - 1;
        let lastBud = fieldShow[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, lastT))
                .on(new ExpEQ(new ExpField('id', lastT), new ExpField(tempfield, a)));
            lastField = lastBudName;
        }
        else if (lastBudName[0] === '.') {
            let budName = lastBudName[1];
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
                .on(new ExpEQ(new ExpField('id', b), new ExpField(tempfield, a)))
                .join(JoinType.join, new EntityTable(EnumSysTable.fork, false, c))
                .on(new ExpEQ(new ExpField('id', c), new ExpField(budName, b)))
                .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, lastT))
                .on(new ExpEQ(new ExpField('id', lastT), new ExpField('base', c)));
            lastField = 'base';
        }
        else {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
                .on(new ExpEQ(new ExpField('id', b), new ExpField(tempfield, a)))
                .join(JoinType.join, new EntityTable(EnumSysTable.ixInt, false, lastT))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', lastT), new ExpField('id', b)),
                    new ExpEQ(new ExpField('x', lastT), new ExpNum(lastBud.id)),
                ));
            lastField = 'value';
        }

        let tp: string, tId: string, fId: string;
        for (let i = 1; i < len; i++) {
            let bizBud = fieldShow[i];
            tp = 't' + i;
            if (bizBud === undefined) {
                let tblBin = tp + 'bin';
                let tblDetail = tp + 'detail';
                select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, tblBin))
                    .on(new ExpEQ(new ExpField('id', tblBin), new ExpField(lastField, lastT)))
                // .join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, tblDetail))
                // .on(new ExpEQ(new ExpField('id', tblDetail), new ExpField('id', tblBin)))
                // .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, tp))
                // .on(new ExpEQ(new ExpField('id', tp), new ExpField('base', tblDetail)))
                lastField = 'base';
                tId = 't0';
                fId = 'value';
            }
            else {
                select.join(JoinType.join, new EntityTable(EnumSysTable.ixInt, false, tp))
                    .on(new ExpAnd(
                        new ExpEQ(new ExpField('i', tp), new ExpField(lastField, lastT)),
                        new ExpEQ(new ExpField('x', tp), new ExpNum(bizBud.id)),
                    ));
                lastField = 'value';
            }
            lastT = tp;
        }
        let t = 't' + len;
        if (tId === undefined) {
            tId = t;
            fId = 'i';
        }
        let bizBud = fieldShow[len];
        let tblIxBud: EnumSysTable;
        let expFieldValue = new ExpField('value', t);
        let colValue: ExpVal = new ExpFuncCustom(factory.func_cast, expFieldValue, new ExpDatePart('JSON'));
        switch (bizBud.dataType) {
            default:
            case BudDataType.radio:
                tblIxBud = EnumSysTable.ixInt;
                selectValue();
                break;
            case BudDataType.dec:
                tblIxBud = EnumSysTable.ixDec;
                selectValue();
                break;
            case BudDataType.fork:
                tblIxBud = EnumSysTable.ixJson;
                selectValue();
                break;
            case BudDataType.str:
            case BudDataType.char:
                tblIxBud = EnumSysTable.ixStr;
                colValue = new ExpFunc('JSON_QUOTE', expFieldValue);
                selectValue();
                break;

            case BudDataType.check:
                tblIxBud = EnumSysTable.ix;
                selectCheck();
                break;
        }
        function selectValue() {
            select.join(JoinType.join, new EntityTable(tblIxBud, false, t))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)),
                    new ExpEQ(new ExpField('x', t), new ExpNum(bizBud.id)),
                ));
            select.column(new ExpNum(bizBud.id), 'phrase');
            select.column(colValue);
        }
        function selectCheck() {
            const k = 'k';
            select.join(JoinType.join, new EntityTable(tblIxBud, false, t))
                .on(new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)))
                .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, k))
                .on(new ExpEQ(new ExpField('id', k), new ExpField('x', t)));
            select.column(new ExpField('base', k), 'phrase');
            select.column(new ExpFunc('JSON_ARRAY', ExpNum.num0, new ExpField('ext', k)));
            select.where(new ExpEQ(new ExpField('base', k), new ExpNum(bizBud.id)))
        }
        select.column(new ExpField(fId, tId), 'id');
        return select;
    }
}
