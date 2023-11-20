import {
    BigInt, BizBudValue, BizEntity, BizQueryValue, BudValueAct
    , Char, DataType, Expression, bigIntField, jsonField
    , JoinType, EnumSysTable, BudDataType, FieldShow
} from "../../il";
import { Sqls } from "../bstatement";
import { DbContext } from "../dbContext";
import {
    ExpAnd, ExpEQ, ExpField, ExpFunc, ExpNum
    , ExpStr, ExpVal, ExpVar, Procedure, Statement
} from "../sql";
import { EntityTable, VarTableWithSchema } from "../sql/statementWithFrom";

const a = 'a';
const b = 'b';
const c = 'c';
const tempBinTable = 'bin';

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

    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud) return;
            let { value } = bud as BizBudValue;
            if (value === undefined) return;
            let { exp, act } = value;
            let str = this.stringify(exp);
            switch (act) {
                case BudValueAct.init: str += '\ninit'; break;
                case BudValueAct.equ: str += '\nequ'; break;
                case BudValueAct.show: str += '\nshow'; break;
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

    protected buildGetShowBuds(showBuds: { [bud: string]: FieldShow }, tempTable: string, tempField: string): Statement[] {
        let statements: Statement[] = [];
        let { factory } = this.context;
        for (let i in showBuds) {
            let fieldShow = showBuds[i];
            let select = this.buildSelect(fieldShow, tempTable, tempField);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.table = new VarTableWithSchema('props');
            insert.cols = [
                { col: 'id', val: undefined },
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'owner', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }

    private buildSelect(fieldShow: FieldShow, tempTable: string, tempfield: string) {
        const { owner, items } = fieldShow;
        const { factory } = this.context;
        const select = factory.createSelect();
        select.column(new ExpField(tempfield, a), 'id');
        select.from(new VarTableWithSchema(tempTable, a));
        let lastT: string = 't0', lastField: string;
        let len = items.length - 1;
        let { bizEntity: lastEntity, bizBud: lastBud } = items[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, lastT))
                .on(new ExpEQ(new ExpField('id', lastT), new ExpField(tempfield, a)));
            lastField = lastBudName;
        }
        else {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
                .on(new ExpEQ(new ExpField('id', b), new ExpField(tempfield, a)))
                .join(JoinType.join, new EntityTable(EnumSysTable.ixBudInt, false, lastT))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', lastT), new ExpField('id', b)),
                    new ExpEQ(new ExpField('x', lastT), new ExpNum(lastBud.id)),
                ));
            lastField = 'value';
        }

        for (let i = 1; i < len; i++) {
            let { bizEntity, bizBud } = items[i];
            lastEntity = bizEntity;
            lastBud = bizBud;
            const t = 't' + i;
            select.join(JoinType.join, new EntityTable(EnumSysTable.ixBudInt, false, t))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)),
                    new ExpEQ(new ExpField('x', t), new ExpNum(bizBud.id)),
                ));
            lastT = t;
            lastField = 'value';
        }
        let t = 't' + len;
        let { bizEntity, bizBud } = items[len];
        let tblIxBud: string;
        switch (bizBud.dataType) {
            default:
                tblIxBud = EnumSysTable.ixBudInt;
                selectValue();
                break;
            case BudDataType.dec:
                tblIxBud = EnumSysTable.ixBudDec;
                selectValue();
                break;
            case BudDataType.str:
            case BudDataType.char:
                tblIxBud = EnumSysTable.ixBudStr;
                selectValue();
                break;
            case BudDataType.radio:
            case BudDataType.check:
                tblIxBud = EnumSysTable.ixBud;
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
            select.column(new ExpFunc('JSON_ARRAY', new ExpField('value', t)));
        }
        function selectCheck() {
            select.join(JoinType.join, new EntityTable(tblIxBud, false, t))
                .on(new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)))
                .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, c))
                .on(new ExpEQ(new ExpField('id', c), new ExpField('x', t)));
            select.column(new ExpField('base', c), 'phrase');
            select.column(new ExpFunc('JSON_ARRAY', ExpNum.num0, new ExpField('ext', c)));
            select.where(new ExpEQ(new ExpField('base', c), new ExpNum(bizBud.id)))
        }
        let expOwner: ExpVal;
        if (owner === undefined) {
            expOwner = ExpNum.num0;
        }
        else {
            expOwner = new ExpNum(owner.id);
        }
        select.column(expOwner, 'owner');
        return select;
    }
}
