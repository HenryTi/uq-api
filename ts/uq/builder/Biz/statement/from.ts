import { FromStatement, EnumSysTable, ValueExpression, JoinType, FromEntity, BizBud, BizAtom, BizSpec, BizID, EnumAsc, bigIntField } from "../../../il";
import {
    ExpAnd, ExpCmp, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpGT, ExpIn, ExpIsNull,
    ExpLT, ExpNull, ExpNum, ExpStr, ExpVal, ExpVar, Select,
    Statement
} from "../../sql";
import { EntityTable, GlobalTable, VarTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";
import { BizPhraseType, BudDataType } from "../../../il/Biz/BizPhraseType";

const a = 'a', b = 'b';
export type BudsValue = { buds: BizBud[]; value: ExpVal; };
// const t1 = 't1';
const pageStart = '$pageStart';

export abstract class BFromStatement<T extends FromStatement> extends BStatement<T> {
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

    protected buildSelectVallue(select: Select) {
        this.buildSelectVallueBase(select, false);
    }

    protected buildSelectVallueSum(select: Select) {
        this.buildSelectVallueBase(select, true);
    }

    protected buildSelectCols(select: Select, alias: string) {
        const { cols } = this.istatement;
        const arr: ExpVal[] = [];
        for (let col of cols) {
            const { name, val, bud } = col;
            let expName: ExpVal;
            if (bud !== undefined) expName = new ExpNum(bud.id);
            else expName = new ExpStr(name);
            arr.push(new ExpFunc('JSON_ARRAY', expName, this.context.expVal(val as ValueExpression)));
        }
        select.column(new ExpFunc('JSON_ARRAY', ...arr), alias);
    }

    protected buildSelectFrom(select: Select, fromEntity: FromEntity) {
        const { bizEntityArr, bizPhraseType, ofIXs, ofOn, alias, subs } = fromEntity;
        /*
        function eqOrIn(expField: ExpField) {
            if (bizEntityArr.length === 1) {
                return new ExpEQ(expField, new ExpNum(bizEntityArr[0].id));
            }
            else {
                return new ExpIn(expField, ...bizEntityArr.map(v => new ExpNum(v.id)));
            }
        }
        const $bzp = `${alias}$bzp`;
        switch (bizPhraseType) {
            default: debugger; break;
            case BizPhraseType.atom:
                select.join(JoinType.join, new EntityTable(EnumSysTable.bizPhrase, false, $bzp))
                    .on(
                        new ExpAnd(
                            new ExpEQ(new ExpField('id', $bzp), new ExpField('base', alias)),
                            eqOrIn(new ExpField('id', $bzp))
                        )
                    );
                break;
            case BizPhraseType.spec:
                select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, $bzp))
                    .on(eqOrIn(new ExpField('ext', $bzp)))
                break;
            case BizPhraseType.combo:
                break;
        }
        */
        let expPrev = new ExpField('id', alias);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;

                let fieldBase = new ExpField('base', alias);
                let expBase = bizEntityArr.length === 1 ?
                    new ExpEQ(fieldBase, new ExpNum(bizEntityArr[0].id))
                    :
                    new ExpIn(
                        fieldBase,
                        ...bizEntityArr.map(v => new ExpNum(v.id))
                    );
                let wheres: ExpCmp[] = [
                    expBase,
                    new ExpEQ(new ExpField('id', tBud), new ExpField('i', tOf)),
                    new ExpEQ(new ExpField('base', tBud), new ExpNum(ix.id)),
                ];
                if (ofOn !== undefined) {
                    wheres.push(new ExpEQ(expPrev, this.context.expVal(ofOn)));
                }

                select.join(JoinType.join, new EntityTable(EnumSysTable.ixBud, false, tOf))
                    .on(new ExpEQ(new ExpField('x', tOf), expPrev))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, tBud))
                    .on(new ExpAnd(...wheres));
                expPrev = new ExpField('ext', tBud);
            }
        }
        if (subs !== undefined) {
            for (let sub of subs) {
                const { field, fromEntity: subFromEntity, isSpecBase } = sub;
                const { alias: subAlias, bizPhraseType } = subFromEntity;
                let { id } = subFromEntity.bizEntityArr[0];
                const entityTable = this.buildEntityTable(subFromEntity);
                let budAlias = alias + '$bud';
                let subBudAlias = subAlias + '$bud';
                /*
                if (isSpecBase === true) {
                    select.join(JoinType.join, entityTable)
                        .on(new ExpEQ(new ExpField('id', subAlias), new ExpField('base', subBudAlias)));
                }
                else {
                */
                let prevAlias = isSpecBase === true ? budAlias : alias;
                switch (bizPhraseType) {
                    case BizPhraseType.atom:
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpAnd(
                                new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias)),
                                new ExpEQ(new ExpField('base', subAlias), new ExpNum(id)),
                            ));
                        break;
                    case BizPhraseType.spec:
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias)));
                        select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, subBudAlias))
                            .on(new ExpAnd(
                                new ExpEQ(new ExpField('id', subBudAlias), new ExpField(field, alias)),
                                new ExpEQ(new ExpField('ext', subBudAlias), new ExpNum(id)),
                            ));
                        break;
                }
                //}
                this.buildSelectFrom(select, subFromEntity);
            }
        }
    }

    protected buildEntityTable(fromEntity: FromEntity) {
        const { bizEntityArr, bizEntityTable, alias: t0 } = fromEntity;
        if (bizEntityTable !== undefined) {
            let ret = new EntityTable(bizEntityTable, false, t0);
            return ret;
        }
        else {
            let ret = new GlobalTable('$site', `${this.context.site}.${bizEntityArr[0].id}`, t0);
            return ret;
        }
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

    protected buildInsertAtomBuds(sqls: Sqls, atom: BizID) {
        let titlePrimeBuds = atom.getTitlePrimeBuds();
        let mapBuds = this.createMapBuds();
        this.buildMapBuds(mapBuds, titlePrimeBuds);
        this.buildInsertBuds(sqls, 'atoms', mapBuds);
    }

    protected createMapBuds() {
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

    protected buildMapBuds(mapBuds: Map<EnumSysTable, BudsValue>, buds: BizBud[]) {
        if (buds === undefined) return;
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
    }

    protected buildInsertBuds(sqls: Sqls, mainTbl: string, mapBuds: Map<EnumSysTable, BudsValue>) {
        for (let [tbl, { buds, value }] of mapBuds) {
            if (buds.length === 0) continue;
            this.buildInsertBud(sqls, mainTbl, tbl, buds, value);
        }
    }

    private buildInsertBud(sqls: Sqls, mainTbl: string, tbl: EnumSysTable, buds: BizBud[], expVal: ExpVal) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        sqls.push(insertBud);
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
    }
}
