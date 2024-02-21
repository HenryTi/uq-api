import {
    EnumSysTable, BigInt, BizStatementPend
    , BizStatementTitle, BudDataType, BudIndex, SetEqu, BizBinAct, BizAct, BizInAct
    , BizStatement, BizStatementSheet, intField
    , BizStatementID, BizStatementAtom, BizStatementSpec, JoinType, BizStatementOut, bigIntField
} from "../../il";
import { $site } from "../consts";
import { sysTable } from "../dbContext";
import {
    ColVal, ExpAdd, ExpAnd, ExpAtVar, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq
    , ExpGT, ExpNull, ExpNum, ExpStr, ExpSub, ExpVal, ExpVar, SqlVarTable, Statement, VarTable
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BBizStatement extends BStatement<BizStatement<BizAct>> {
    head(sqls: Sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.head(sqls);
    }
    body(sqls: Sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.body(sqls);
    }
    foot(sqls: Sqls): void {
        let bSub = this.istatement.sub.db(this.context);
        bSub.foot(sqls);
    }
}

const pendFrom = 'pend';
const binId = 'bin';
export abstract class BBizStatementPend<T extends BizAct> extends BStatement<BizStatementPend<T>> {
    // 可以发送sheet主表，也可以是Detail
    body(sqls: Sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Pend';

        const a = 'a';
        let declare = factory.createDeclare();
        sqls.push(declare);
        let { pend, no, val, setEqu, sets } = this.istatement;
        let expValue = this.context.expVal(val);
        if (pend === undefined) {
            // const { pend } = this.istatement.bizStatement.bizDetailAct.bizDetail;
            buildChangePendFrom();
        }
        else {
            buildWritePend();
        }

        function buildUpdatePoke(): Statement[] {
            let updatePoke = factory.createUpdate();
            updatePoke.table = new EntityTable(EnumSysTable.userSite, false);
            updatePoke.cols = [
                { col: 'poke', val: ExpNum.num1 },
            ];
            updatePoke.where = new ExpEQ(
                new ExpField('site'), new ExpVar('$site'),
            );
            return [updatePoke];
        }

        function buildChangePendFrom() {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new EntityTable(EnumSysTable.pend, false, a);
            update.where = new ExpEQ(
                new ExpField('id', a), new ExpVar(pendFrom)
            );
            let cols = update.cols = [];
            let expValueField = new ExpField('value', a);
            switch (setEqu) {
                case SetEqu.equ: break;
                case SetEqu.add: expValue = new ExpAdd(expValueField, expValue); break;
                case SetEqu.sub: expValue = new ExpSub(expValueField, expValue); break;
            }
            cols.push({ col: 'value', val: expValue });
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [a];
            del.from(new EntityTable(EnumSysTable.pend, false, a));
            del.where(new ExpAnd(
                new ExpEQ(new ExpField('id', a), new ExpVar(pendFrom)),
                new ExpEQ(new ExpField('value', a), ExpNum.num0),
            ));
            sqls.push(...buildUpdatePoke());
        }

        function buildWritePend() {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new BigInt());

            if (val === undefined) {
                expValue = new ExpVar('value');
            }
            let ifValue = factory.createIf();
            sqls.push(ifValue);
            ifValue.cmp = new ExpGT(expValue, ExpNum.num0);

            let setPendId = factory.createSet();
            ifValue.then(setPendId);
            setPendId.equ(pendId,
                new ExpFuncInUq(
                    'pend$id',
                    [varSite, varUser, ExpNum.num1, ExpVal.null, new ExpNum(pend.id)],
                    true
                )
            );

            let update = factory.createUpdate();
            ifValue.then(update);
            let expMids: ExpVal[] = [];
            for (let s of sets) {
                let [bud, val] = s;
                expMids.push(
                    new ExpStr(String(bud.id)),
                    context.expVal(val)
                );
            }

            update.table = new EntityTable(EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new ExpNum(pend.id) },
                { col: 'bin', val: new ExpVar(binId) },
                { col: 'value', val: expValue },
                { col: 'mid', val: new ExpFunc('JSON_OBJECT', ...expMids) },
            ];
            update.where = new ExpEQ(
                new ExpField('id'), new ExpVar(pendId)
            );

            ifValue.then(...buildUpdatePoke());
        }
    }
}

export class BBizStatementBinPend extends BBizStatementPend<BizBinAct> {
}

export class BBizStatementInPend extends BBizStatementPend<BizInAct> {
}

const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
export class BBizStatementTitle extends BStatement<BizStatementTitle> {
    head(sqls: Sqls): void {
        let { factory } = this.context;
        let { bud, no } = this.istatement;
        let { hasHistory } = bud;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(phraseId + no, new BigInt());
        declare.var(objId + no, new BigInt());
        if (hasHistory === true) {
            declare.var(budId + no, new BigInt());
            declare.var(historyId + no, new BigInt());
        }
    }
    body(sqls: Sqls) {
        let { factory, varUser, varSite } = this.context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Title ';
        let { setEqu, entity, val, bud, no, of } = this.istatement;
        let { hasHistory, dataType, id, flag } = bud;
        let varPhraseId = phraseId + no;
        let varObjId = objId + no;

        let setPhraseId = factory.createSet()
        sqls.push(setPhraseId);
        setPhraseId.equ(varPhraseId, new ExpNum(id));

        const expObj = of === undefined ? ExpNum.num0 : this.context.expVal(of);
        const setObj = factory.createSet();
        sqls.push(setObj);
        setObj.equ(varObjId, expObj);
        const expValue = this.context.convertExp(val) as ExpVal;
        const expObjId = new ExpVar(varObjId);
        const expPhraseId = new ExpVar(varPhraseId);
        let table: EnumSysTable;
        switch (dataType) {
            default:
                table = EnumSysTable.ixBudInt;
                buildIxBudIndex();
                break;
            case BudDataType.char:
                table = EnumSysTable.ixBudStr;
                break;
            case BudDataType.dec:
                table = EnumSysTable.ixBudDec;
                break;
        }

        const expSite = new ExpVar('$site');
        const expUser = new ExpVar('$user');
        function buildIxBudIndex() {
            if ((flag & BudIndex.index) !== BudIndex.index) return;
            let upsert = factory.createUpsert();
            sqls.push(upsert);
            upsert.table = new EntityTable(EnumSysTable.ixBud, false);
            const expBud = new ExpFuncInUq('bud$id'
                , [expSite, expUser, ExpNum.num1, ExpVal.null, expValue, expPhraseId]
                , true);
            upsert.keys = [
                { col: 'i', val: expBud },
                { col: 'x', val: expObjId },
            ];
        }

        let upsert = factory.createUpsert();
        sqls.push(upsert);
        upsert.table = sysTable(table);
        upsert.keys = [
            { col: 'i', val: expObjId },
            { col: 'x', val: expPhraseId },
        ];
        const valueCol = 'value';
        upsert.cols = [
            { col: valueCol, val: expValue, setEqu },
        ];

        if (hasHistory === true) {
            let expRef = new ExpVar(binId);
            let vHistory = historyId + no;
            let vBudId = budId + no;
            let setHistoryId = factory.createSet();
            sqls.push(setHistoryId);
            setHistoryId.equ(vHistory, new ExpFuncInUq('history$id', [varSite, varUser, ExpNum.num1, ExpVal.null], true));
            let setBudId = factory.createSet();
            sqls.push(setBudId);
            setBudId.equ(vBudId, new ExpFuncInUq('bud$id', [varSite, varUser, ExpNum.num1, ExpVal.null, expObjId, expPhraseId], true));
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = sysTable(EnumSysTable.history);
            update.where = new ExpEQ(new ExpField('id'), new ExpVar(vHistory));
            let expPlusMinus: ExpVal;
            switch (setEqu) {
                default: debugger; throw new Error('unknown setEQU ' + setEqu);
                case SetEqu.add: expPlusMinus = ExpNum.num1; break;
                case SetEqu.sub: expPlusMinus = ExpNum.num_1; break;
                case SetEqu.equ: expPlusMinus = ExpNum.num0; break;
            }
            let cols: ColVal[] = [
                { col: 'bud', val: new ExpVar(vBudId) },
                { col: 'plusMinus', val: expPlusMinus },
            ];
            if (expValue !== undefined) {
                cols.push({ col: 'value', val: expValue });
            }
            if (expRef !== undefined) {
                cols.push({ col: 'ref', val: expRef });
            }
            update.cols = cols;
        }
    }
}

export class BBizStatementSheet extends BStatement<BizStatementSheet> {
    body(sqls: Sqls) {
        const { detail } = this.istatement;
        if (detail === undefined) this.buildMain(sqls);
        else this.buildDetail(sqls);
    }

    private buildMain(sqls: Sqls) {
        const { factory } = this.context;
        const { useSheet } = this.istatement;
        const { sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Sheet ' + sheet.getJName();
        const setId = factory.createSet();
        sqls.push(setId);
        let idVarName = useSheet.varName;
        let idParams: ExpVal[] = [
            new ExpVar($site),
            ExpNum.num0,
            ExpNum.num1,
            ExpNull.null,
            new ExpNum(sheet.id),
            new ExpFuncInUq('$no', [new ExpVar($site), new ExpStr('sheet'), ExpNull.null], true),
        ];
        setId.equ(idVarName, new ExpFuncInUq('sheet$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }

    private buildDetail(sqls: Sqls) {
        const { factory } = this.context;
        let idVarName = 'detail$id';
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars(bigIntField(idVarName));
        const { useSheet, bin } = this.istatement;
        const { varName, sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = `Biz Detail ${bin.getJName()} OF Sheet ${sheet.getJName()}`;
        const setBinId = factory.createSet();
        sqls.push(setBinId);
        let idParams: ExpVal[] = [
            new ExpVar($site),
            ExpNum.num0,
            ExpNum.num1,
            ExpNull.null,
            new ExpFuncInUq('bud$id', [
                new ExpVar($site), ExpNum.num0, ExpNum.num1, ExpNull.null
                , new ExpVar(varName), new ExpNum(bin.id)
            ], true),
        ];
        setBinId.equ(idVarName, new ExpFuncInUq('detail$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }

    private createUpdate(idVarName: string) {
        const { factory } = this.context;
        const varId = new ExpVar(idVarName);
        const update = factory.createUpdate();
        const { fields, buds, bin } = this.istatement;
        const { cols } = update;
        const { props } = bin;
        for (let i in fields) {
            cols.push({ col: i, val: this.context.expVal(fields[i]) });
        }
        update.table = new EntityTable(EnumSysTable.bizBin, false);
        update.where = new ExpEQ(new ExpField('id'), varId);

        let ret: Statement[] = [update];
        for (let i in buds) {
            let val = buds[i];
            let bud = props.get(i);
            let memo = factory.createMemo();
            ret.push(memo);
            memo.text = bud.getJName();
            let expVal = this.context.expVal(val);

            let insert = factory.createInsert();
            insert.ignore = true;
            const createIxBudValue = (table: EnumSysTable, valValue: ExpVal) => {
                insert.table = new EntityTable(table, false);
                insert.cols = [
                    { col: 'i', val: varId },
                    { col: 'x', val: new ExpNum(bud.id) },
                    { col: 'value', val: valValue },
                ]
                return insert;
            }
            const createIxBud = (table: EnumSysTable, valValue: ExpVal) => {
                insert.table = new EntityTable(table, false);
                insert.cols = [
                    { col: 'i', val: varId },
                    { col: 'x', val: valValue },
                ]
                return insert;
            }
            switch (bud.dataType) {
                default: debugger; break;
                case BudDataType.check: debugger; break;
                case BudDataType.datetime: debugger; break;
                case BudDataType.int: break;
                case BudDataType.atom:
                    insert = createIxBudValue(EnumSysTable.ixBudInt, expVal);
                    break;
                case BudDataType.char:
                case BudDataType.str:
                    insert = createIxBudValue(EnumSysTable.ixBudStr, expVal);
                    break;
                case BudDataType.radio:
                    insert = createIxBud(EnumSysTable.ixBud, expVal);
                    break;
                case BudDataType.date:
                    insert = createIxBudValue(EnumSysTable.ixBudInt, new ExpNum(10000) /* expVal*/);
                    break;
                case BudDataType.dec:
                    insert = createIxBudValue(EnumSysTable.ixBudDec, expVal);
                    break;
            }
            ret.push(insert);
        }
        return ret;
    }
}

abstract class BBizStatementID<T extends BizStatementID> extends BStatement<T> {
    override body(sqls: Sqls): void {
    }
}

const a = 'a', b = 'b';
export class BBizStatementAtom extends BBizStatementID<BizStatementAtom> {
    override body(sqls: Sqls): void {
        // 底层自动转换，所以没有必要显式转化ID
        /*
        const { factory } = this.context;
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new ExpField('atom', a), undefined, this.istatement.toVar);
        select.from(new EntityTable(EnumSysTable.IOAtom, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.IOAtomType, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('type', a)));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('outer', b), new ExpVar('$outer')),
            new ExpEQ(new ExpField('phrase', b), new ExpVar('$in')),
            new ExpEQ(new ExpField('no', a), this.context.expVal(this.istatement.inVals[0])),
        ));
        */
    }
}

export class BBizStatementSpec extends BBizStatementID<BizStatementSpec> {
    override body(sqls: Sqls): void {
        const { inVals, spec } = this.istatement;
        const { factory } = this.context;
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new ExpField('id', a), undefined, this.istatement.toVar);
        select.from(new EntityTable(EnumSysTable.spec, false, a));
        let wheres: ExpCmp[] = [
            new ExpEQ(new ExpField('base', a), this.context.expVal(inVals[0])),
        ]
        let { keys } = spec;
        let len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { id, dataType } = key;
            let tbl: EnumSysTable, val: ExpVal = this.context.expVal(inVals[i + 1]);
            switch (dataType) {
                default:
                    tbl = EnumSysTable.ixBudInt;
                    break;
                case BudDataType.date:
                    tbl = EnumSysTable.ixBudInt;
                    val = new ExpFunc('DATEDIFF', val, new ExpStr('1970-01-01'));
                    break;
                case BudDataType.str:
                case BudDataType.char:
                    tbl = EnumSysTable.ixBudStr;
                    break;
                case BudDataType.dec:
                    tbl = EnumSysTable.ixBudDec;
                    break;
            }
            let t = 't' + i;
            select.join(JoinType.join, new EntityTable(tbl, false, t))
            select.on(new ExpAnd(
                new ExpEQ(new ExpField('i', t), new ExpField('id', a)),
                new ExpEQ(new ExpField('x', t), new ExpNum(id)),
            ));
            wheres.push(new ExpEQ(new ExpField('value', t), val));
        }
        select.where(new ExpAnd(...wheres));
    }
}

export class BBizStatementOut extends BStatement<BizStatementOut> {
    override body(sqls: Sqls): void {
        const { factory } = this.context;
        const { useOut, tos, detail, sets } = this.istatement;
        let varName = '$' + useOut.varName;

        const tblTo = new SqlVarTable(varName + '$TO');
        for (let to of tos) {
            const insert = factory.createInsert();
            sqls.push(insert);
            insert.table = tblTo;
            insert.cols = [
                { col: 'to', val: this.context.expVal(to) }
            ];
            /*
            let setTo = factory.createSet();
            sqls.push(setTo);
            setTo.isAtVar = true;
            setTo.equ(varName + '$TO', this.context.expVal(to));
            */
        }

        let setV = factory.createSet();
        sqls.push(setV);
        setV.isAtVar = true;
        const context = this.context;
        function buildParams(path: string) {
            let params: ExpVal[] = [];
            for (let i in sets) {
                params.push(new ExpStr(path + i), context.expVal(sets[i]));
            }
            return params;
        }
        let vNew: ExpVal;
        if (detail === undefined) {
            vNew = new ExpFunc('JSON_SET', new ExpAtVar(varName), ...buildParams('$.'));
        }
        else {
            vNew = new ExpFunc(
                'JSON_ARRAY_Append',
                new ExpAtVar(varName),
                new ExpStr('$.' + detail),
                new ExpFunc('JSON_OBJECT', ...buildParams('')),
            );
        }
        setV.equ(varName, vNew);
    }
}
