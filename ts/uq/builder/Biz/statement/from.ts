import { FromStatement, EnumSysTable, ValueExpression, JoinType, FromEntity, BizBud, BizAtom, BizFork, BizID, EnumAsc, bigIntField, BizIDWithShowBuds } from "../../../il";
import {
    ExpAnd, ExpCmp, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpGT, ExpIn, ExpIsNull,
    ExpLT, ExpNull, ExpNum, ExpStr, ExpVal, ExpVar, Select,
    Statement
} from "../../sql";
import { EntityTable, GlobalTable, VarTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";
import { BizPhraseType, BudDataType } from "../../../il/Biz/BizPhraseType";
import { BBizSelect } from "./biz.select";

const a = 'a', b = 'b';
export type BudsValue = { buds: BizBud[]; value: ExpVal; };
// const t1 = 't1';
const pageStart = '$pageStart';

export abstract class BFromStatement<T extends FromStatement> extends BBizSelect<T> {
    protected asc: EnumAsc;

    body(sqls: Sqls) {
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
    }

    protected buildExpFieldPageId() {
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

    private buildSelectVallueBase(select: Select, sum: boolean) {
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

    protected buildSelectValue(select: Select) {
        this.buildSelectVallueBase(select, false);
    }

    protected buildSelectVallueSum(select: Select) {
        this.buildSelectVallueBase(select, true);
    }

    protected buildSelectCols(/*select: Select, alias: string*/) {
        const { cols } = this.istatement;
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val, bud } = col;
            let expName: ExpVal;
            if (bud !== undefined) expName = new ExpNum(bud.id);
            else expName = new ExpStr(name);
            arr.push(new ExpFunc('JSON_ARRAY', expName, this.context.expVal(val as ValueExpression)));
        }
        return arr;
        // select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
    }

    protected buildSelect(cmpPage: ExpCmp) {
        const { factory } = this.context;
        const { where, fromEntity } = this.istatement;
        const { bizEntityTable, alias: t0 } = fromEntity;
        const select = factory.createSelect();
        select.from(new EntityTable(bizEntityTable, false, t0));
        this.buildSelectFrom(select, fromEntity);
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
        select.column(new ExpField('base', b));
        select.column(new ExpField('no', b));
        select.column(new ExpField('ex', b));
        return insertAtom;
    }

    protected abstract buildFromEntity(sqls: Sqls): void;

    protected buildInsertAtomBuds(sqls: Sqls, atom: BizIDWithShowBuds) {
        let titlePrimeBuds = atom.getTitlePrimeBuds();
        // let mapBuds = this.createMapBuds();
        let mapBuds = this.buildMapBuds(titlePrimeBuds);
        sqls.push(...this.buildInsertBuds('atoms', mapBuds));
    }

    private createMapBuds() {
        const { factory } = this.context;
        const mapBuds: Map<EnumSysTable, { buds: BizBud[]; value: ExpVal; }> = new Map();
        const valField = new ExpField('value', 'b');
        const valNumExp = new ExpFuncCustom(factory.func_cast, valField, new ExpDatePart('json'));
        const valStrExp = new ExpFunc('JSON_QUOTE', valField);
        mapBuds.set(EnumSysTable.ixBudInt, { buds: [], value: valNumExp });
        mapBuds.set(EnumSysTable.ixBudDec, { buds: [], value: valNumExp });
        mapBuds.set(EnumSysTable.ixBudStr, { buds: [], value: valStrExp });
        return mapBuds;
    }

    protected buildMapBuds(buds: BizBud[]) {
        if (buds === undefined) return;
        let mapBuds: Map<EnumSysTable, BudsValue> = this.createMapBuds();
        for (let bud of buds) {
            let ixBudTbl: EnumSysTable = EnumSysTable.ixBudInt;
            switch (bud.dataType) {
                default: ixBudTbl = EnumSysTable.ixBudInt; break;
                case BudDataType.dec:
                    ixBudTbl = EnumSysTable.ixBudDec; break;
                case BudDataType.str:
                case BudDataType.char:
                    ixBudTbl = EnumSysTable.ixBudStr; break;
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

    private buildInsertBud(mainTbl: string, tbl: EnumSysTable, buds: BizBud[], expVal: ExpVal) {
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
        select.from(new VarTable(mainTbl, a))
            .join(JoinType.join, new EntityTable(tbl, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('id', a), new ExpField('i', b)),
                new ExpIn(new ExpField('x', b), ...buds.map(v => new ExpNum(v.id))),
            ));
        select.column(new ExpField('id', a), 'id');
        select.column(new ExpField('x', b), 'phrase');
        select.column(expVal, 'value');
        return insertBud;
    }
}
