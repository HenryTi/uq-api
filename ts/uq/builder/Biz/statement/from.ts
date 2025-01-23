import { FromStatement, EnumSysTable, ValueExpression, JoinType, BizBud, EnumAsc, BizIDWithShowBuds, FromColumn, EnumDataType } from "../../../il";
import {
    ExpAnd, ExpCmp, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpGT, ExpIn, ExpIsNull,
    ExpLT, ExpNull, ExpNum, ExpStr, ExpVal, ExpVar, Select,
    Statement
} from "../../sql";
import { EntityTable, VarTable } from "../../sql/statementWithFrom";
import { Sqls } from "../../bstatement/sqls";
import { BudDataType } from "../../../il/Biz/BizPhraseType";
import { BBizSelect } from "./biz.select";
import { buildSelectIxBuds } from "../../tools";

const a = 'a', b = 'b', c = 'c';
export type BudsValue = { buds: BizBud[]; value: ExpVal; };
// const t1 = 't1';
const pageStart = '$pageStart';

export abstract class BFromStatement<T extends FromStatement> extends BBizSelect<T> {
    protected asc: EnumAsc;

    override body(sqls: Sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';

        let varStart = new ExpVar(pageStart);
        const ifStateNull = factory.createIf();
        sqls.push(ifStateNull);
        ifStateNull.cmp = new ExpIsNull(varStart);
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expFieldPageId = this.buildExpFieldPageId();
        let expStart: ExpVal, cmpPage: ExpCmp;
        if (this.asc === EnumAsc.asc) {
            expStart = new ExpNum(0);
            cmpPage = new ExpGT(expFieldPageId, varStart);
        }
        else {
            expStart = new ExpStr('9223372036854775807');
            cmpPage = new ExpLT(expFieldPageId, varStart);
        }
        setPageState.equ(pageStart, expStart);

        let stat = this.buildFromMain(cmpPage);
        sqls.push(...stat);
        this.buildFromEntity(sqls);

        this.buildInsertColumnsProps(sqls);
    }

    private buildInsertColumnsProps(sqls: Sqls): void {
        const { cols } = this.istatement;
        for (let col of cols) {
            if (col.valBud === undefined) continue;
            this.buildColumnProps(sqls, col);
        }
    }

    private buildColumnProps(sqls: Sqls, col: FromColumn) {
        const { factory } = this.context;
        /*
        const insert = factory.createInsert();
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'no', val: undefined },
        ];
        */
    }

    override foot(sqls: Sqls): void {
        let memo = this.context.factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM foot';
    }

    protected buildExpFieldPageId(): ExpVal {
        const { fromEntity } = this.istatement;
        let { alias: t1 } = fromEntity;
        return new ExpField('id', t1);
    }

    protected abstract buildFromMain(cmpPage: ExpCmp): Statement[];

    protected buildSelectBan(select: Select) {
        const { ban } = this.istatement;
        const cBan = 'ban';
        if (ban === undefined) {
            select.column(ExpNum.num0, cBan);
        }
        else {
            select.column(this.context.expCmp(ban.val) as ExpVal, cBan);
        }
    }

    protected buildSelectValue(select: Select) {
        this.buildSelectValueBase(select, false);
    }

    protected buildSelectVallueSum(select: Select) {
        this.buildSelectValueBase(select, true);
    }

    private buildSelectValueBase(select: Select, sum: boolean) {
        const { factory } = this.context;
        const { value } = this.istatement;
        const cValue = 'value';
        if (value === undefined) {
            select.column(ExpNull.null, cValue);
        }
        else {
            let exp = this.context.expVal(value.val);
            if (sum === true) exp = new ExpFunc(factory.func_sum, exp);
            select.column(exp, cValue);
        }
    }

    protected buildSelectCols() {
        const { cols } = this.istatement;
        const arr: ExpVal[] = cols.map(col => {
            const { name, val, bud } = col;
            let expBud: ExpVal;
            if (bud !== undefined) expBud = new ExpNum(bud.id);
            else expBud = new ExpStr(name);
            return new ExpFunc('JSON_ARRAY', expBud, this.context.expVal(val as ValueExpression));
        });
        return arr;
    }

    protected buildSelect(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        select.from(new EntityTable(bizEntityTable, false, t0));
        this.buildSelectJoin(select, fromEntity);
        let wheres: ExpCmp[] = [
            cmpPage,
            this.context.expCmp(where),
        ];
        select.where(new ExpAnd(...wheres));
        select.order(new ExpField('id', t0), this.asc === EnumAsc.asc ? 'asc' : 'desc');
        select.limit(new ExpVar('$pageSize'));
        return select;
    }

    protected buildInsertAtom() {
        const { factory } = this.context;
        let insertAtom = factory.createInsert();
        insertAtom.ignore = true;
        insertAtom.table = new VarTable('atoms');
        insertAtom.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
        ];
        let select = factory.createSelect();
        insertAtom.select = select;
        select.distinct = true;
        select.column(new ExpField('id', b));
        select.column(new ExpField('base', c));
        select.column(new ExpField('no', b));
        select.column(new ExpField('ex', b));
        return insertAtom;
    }

    protected abstract buildFromEntity(sqls: Sqls): void;

    protected buildInsertAtomBuds(sqls: Sqls, atom: BizIDWithShowBuds) {
        let titlePrimeBuds = atom.getTitlePrimeBuds();
        let mapBuds = this.buildMapBuds(titlePrimeBuds);
        sqls.push(...this.buildInsertBuds('atoms', mapBuds));
    }

    protected ixValueArr(): [EnumSysTable, ExpVal][] {
        const { factory } = this.context;
        const valField = new ExpField('value', 'b');
        const valNumExp = new ExpFuncCustom(factory.func_cast, valField, new ExpDatePart('json'));
        const valStrExp = new ExpFunc('JSON_QUOTE', valField);
        return [
            [EnumSysTable.ixInt, valNumExp],
            [EnumSysTable.ixDec, valNumExp],
            [EnumSysTable.ixStr, valStrExp],
        ];
    }

    private createMapBuds() {
        // const { factory } = this.context;
        const mapBuds: Map<EnumSysTable, { buds: BizBud[]; value: ExpVal; }> = new Map();
        this.ixValueArr().forEach(([tbl, val]) => {
            mapBuds.set(tbl, { buds: [], value: val });
        });
        return mapBuds;
    }

    protected buildMapBuds(buds: BizBud[]) {
        if (buds === undefined) return;
        let mapBuds: Map<EnumSysTable, BudsValue> = this.createMapBuds();
        for (let bud of buds) {
            let ixBudTbl: EnumSysTable = EnumSysTable.ixInt;
            switch (bud.dataType) {
                default: ixBudTbl = EnumSysTable.ixInt; break;
                case BudDataType.dec:
                    ixBudTbl = EnumSysTable.ixDec; break;
                case BudDataType.str:
                case BudDataType.char:
                    ixBudTbl = EnumSysTable.ixStr; break;
                case BudDataType.fork:
                    ixBudTbl = EnumSysTable.ixJson; break;
            }
            let tbl = mapBuds.get(ixBudTbl);
            tbl.buds.push(bud);
        }
        return mapBuds;
    }

    protected buildInsertBuds(mainTbl: string, mapBuds: Map<EnumSysTable, BudsValue>) {
        let ret = [];
        for (let [tbl, { buds, value }] of mapBuds) {
            if (buds.length === 0) continue;
            ret.push(this.buildInsertBud(mainTbl, tbl, buds, value));
        }
        return ret;
    }

    protected buildInsertBud(mainTbl: string, tbl: EnumSysTable, buds: BizBud[], expVal: ExpVal) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        insertBud.ignore = true;
        insertBud.table = new VarTable('props');
        insertBud.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertBud.select = select;
        let expIdEQ = new ExpEQ(new ExpField('id', a), new ExpField('i', b));
        let expON = buds === undefined || buds.length === 0 ?
            expIdEQ
            :
            new ExpAnd(
                expIdEQ,
                new ExpIn(new ExpField('x', b), ...buds.map(v => new ExpNum(v.id))),
            );
        select.from(new VarTable(mainTbl, a))
            .join(JoinType.join, new EntityTable(tbl, false, b))
            .on(expON);
        select.column(new ExpField('id', a), 'id');
        select.column(new ExpField('x', b), 'phrase');
        select.column(expVal, 'value');
        // select.order(new ExpField('x', b), 'asc');
        return insertBud;
    }
}
