import {
    EnumSysTable, BigInt, BizStatementPend
    , BizStatementBook, BudIndex, SetEqu, BizBinAct, BizAct, BizInAct
    , BizStatement, BizStatementSheet
    , BizStatementID, BizStatementAtom, BizStatementSpec, JoinType, BizStatementOut, bigIntField, BizBud, BizStatementTie,
    BizStatementError,
    jsonField,
    JsonDataType
} from "../../../il";
import { BudDataType } from "../../../il/Biz/BizPhraseType";
import { $site } from "../../consts";
import { sysTable } from "../../dbContext";
import {
    ColVal, ExpAdd, ExpAnd, ExpAtVar, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq
    , ExpGT, ExpIsNotNull, ExpIsNull, ExpNE, ExpNull, ExpNum, ExpSelect, ExpStr, ExpSub, ExpVal, ExpVar, SqlVarTable, Statement, Statements, VarTable
} from "../../sql";
import { EntityTable, GlobalTable } from "../../sql/statementWithFrom";
import { buildSetAtomBud, buildSetSheetBud } from "../../tools";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";
import { LockType, Select, SelectTable } from "../../sql/select";

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

const pendFrom = '$pend';
const binId = '$bin';
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
        let { pend, no, val, setEqu, sets, keys, setI, setX } = this.istatement;

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
            sqls.push(...buildUpdatePoke());
        }

        const buildWritePend = () => {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new BigInt());
            let mid = '$mid_' + no;
            declare.var(mid, new JsonDataType());

            if (val === undefined) {
                expValue = new ExpVar('value');
            }
            let ifValue = factory.createIf();
            sqls.push(ifValue);
            ifValue.cmp = new ExpNE(expValue, ExpNum.num0);

            let setPendId = factory.createSet();
            setPendId.equ(pendId,
                new ExpFuncInUq(
                    'pend$id',
                    [varSite, varUser, ExpNum.num1, ExpVal.null, new ExpNum(pend.id)],
                    true
                )
            );

            if (keys === undefined) {
                ifValue.then(setPendId);
            }
            else {
                let setPendIdNull = factory.createSet();
                ifValue.then(setPendIdNull);
                setPendIdNull.equ(pendId, ExpNull.null);

                let pendKeyTable = new GlobalTable($site, `${this.context.site}.${pend.id}`);
                let selectPendId = factory.createSelect();
                ifValue.then(selectPendId);
                selectPendId.toVar = true;
                selectPendId.column(new ExpField('id'), pendId);
                selectPendId.from(pendKeyTable);
                let wheres: ExpCmp[] = [];
                for (let [name, val] of this.istatement.keys) {
                    wheres.push(new ExpEQ(new ExpField(name), this.context.expVal(val)));
                }
                selectPendId.where(new ExpAnd(...wheres));

                let ifKeyedId = factory.createIf();
                ifValue.then(ifKeyedId);
                ifKeyedId.cmp = new ExpIsNull(new ExpVar(pendId));
                ifKeyedId.then(setPendId);
                let insertPendKey = factory.createInsert();
                ifKeyedId.then(insertPendKey);
                insertPendKey.table = pendKeyTable;
                const { cols } = insertPendKey;
                cols.push({ col: 'id', val: new ExpVar(pendId) });
                for (let [name, val] of this.istatement.keys) {
                    cols.push({ col: name, val: this.context.expVal(val) });
                }
            }

            let setMid = factory.createSet();
            ifValue.then(setMid);
            setMid.equ(mid, new ExpFunc('JSON_OBJECT'));
            // let selectMids: Select[] = [];
            let vMid = new ExpVar(mid);
            function buildMidProp(prop: string, exp: ExpVal) {
                let iff = factory.createIf();
                ifValue.then(iff);
                iff.cmp = new ExpIsNotNull(exp);
                let setProp = factory.createSet();
                iff.then(setProp);
                setProp.equ(mid, new ExpFunc(
                    'JSON_SET', vMid, new ExpStr(`$."${prop}"`), exp
                ));
            }
            // let expMids: ExpVal[] = [];
            for (let s of sets) {
                let [bud, val] = s;
                buildMidProp(String(bud.id), context.expVal(val));
                /*
                expMids.push(
                    new ExpStr(String(bud.id)),
                    context.expVal(val)
                );
                */
            }
            const { i, x } = pend;
            if (i !== undefined) {
                let val = setI === undefined ? new ExpVar(i.name) : context.expVal(setI);
                //expMids.push(new ExpStr(String(i.id)), val);
                buildMidProp(String(i.id), val);
            }
            if (x !== undefined) {
                let val = setX === undefined ? new ExpVar(x.name) : context.expVal(setX);
                // expMids.push(new ExpStr(String(x.id)), val);
                buildMidProp(String(x.id), val);
            }

            let update = factory.createUpdate();
            ifValue.then(update);

            update.table = new EntityTable(EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new ExpNum(pend.id) },
                { col: 'bin', val: new ExpVar(binId) },
                { col: 'value', val: expValue, setEqu },
                { col: 'mid', val: new ExpVar(mid) },
            ];
            update.where = new ExpEQ(
                new ExpField('id'), new ExpVar(pendId)
            );

            ifValue.then(...buildUpdatePoke());
        }

        let expValue = this.context.expVal(val);
        if (pend === undefined) {
            buildChangePendFrom();
        }
        else {
            buildWritePend();
        }
    }

    foot(sqls: Sqls): void {
        const { factory } = this.context;
        let { pend } = this.istatement;
        if (pend !== undefined) return;
        let del = factory.createDelete();
        sqls.push(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.pend, false, a));
        del.where(new ExpAnd(
            new ExpEQ(new ExpField('id', a), new ExpVar(pendFrom)),
            new ExpEQ(new ExpField('value', a), ExpNum.num0),
        ));
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
export class BBizStatementBook extends BStatement<BizStatementBook> {
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
        memo.text = 'Biz Book ';
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

        let insertOnDup = factory.createInsertOnDuplicate();
        sqls.push(insertOnDup);
        insertOnDup.table = sysTable(table);
        insertOnDup.keys = [
            { col: 'i', val: expObjId },
            { col: 'x', val: expPhraseId },
        ];
        const valueCol = 'value';

        insertOnDup.cols = [
            {
                col: valueCol,
                val: expValue,
                setEqu
            },
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
        const insert = factory.createInsert();
        const { fields, buds, bin } = this.istatement;
        const { cols } = insert;
        const { props } = bin;
        cols.push({ col: 'id', val: varId });
        for (let i in fields) {
            cols.push({ col: i, val: this.context.expVal(fields[i]) });
        }
        insert.table = new EntityTable(EnumSysTable.bizBin, false);

        let ret: Statement[] = [insert];
        for (let i in buds) {
            let val = buds[i];
            let bud = props.get(i);
            let memo = factory.createMemo();
            ret.push(memo);
            memo.text = bud.getJName();
            let expVal = this.context.expVal(val);
            ret.push(...buildSetSheetBud(this.context, bud, varId, expVal));
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
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Atom';
        const { unique, inVals, atomCase, no, toVar, ex, sets } = this.istatement;
        let inExps = inVals.map(v => this.context.expVal(v));
        let declare = factory.createDeclare();
        sqls.push(declare);
        const atomPhrase = 'atomPhrase_' + no;
        declare.var(atomPhrase, new BigInt());
        const varAtomPhrase = new ExpVar(atomPhrase);

        const { bizID: bizID0, condition: condition0 } = atomCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(atomPhrase, new ExpNum(bizID0.id));
        let len = atomCase.length;
        if (len === 1) {
            sqls.push(setAtomPhrase0);
        }
        else {
            let ifCase = factory.createIf();
            sqls.push(ifCase);
            ifCase.cmp = this.context.expCmp(condition0);
            ifCase.then(setAtomPhrase0);
            for (let i = 1; i < len; i++) {
                let { bizID, condition } = atomCase[i];
                let statements = new Statements();
                let setAtomPhrase = factory.createSet();
                statements.statements.push(setAtomPhrase);
                setAtomPhrase.equ(atomPhrase, new ExpNum(bizID.id));
                if (condition !== undefined) {
                    ifCase.elseIf(this.context.expCmp(condition), statements);
                }
                else {
                    ifCase.else(...statements.statements);
                }
            }
        }

        let vBase: string = 'bizatomBase_' + no;
        let varBase = new ExpVar(vBase);
        let vId: string;
        if (toVar === undefined) {
            vId = 'bizatom_' + no;
        }
        else {
            vId = toVar.varName(undefined);
        }
        declare.var(vId, new BigInt());
        declare.var(vBase, new BigInt());
        let varId = new ExpVar(vId);
        let setVarIdNull = factory.createSet();
        sqls.push(setVarIdNull);
        setVarIdNull.equ(vId, ExpNull.null);
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new ExpField('id', a), vId);
        select.column(new ExpField('base', a), vBase);
        select.from(new EntityTable(EnumSysTable.atom, false, a));
        if (unique === undefined) {
            select.where(new ExpEQ(new ExpField('no', a), inExps[0]));
        }
        else {
            let len = inExps.length;
            let expKey = new ExpFuncInUq('bud$id', [
                ExpNum.num0, ExpNum.num0, ExpNum.num0, ExpNum.num_1
                , new ExpNum(unique.id), inExps[0]
            ], true);

            for (let i = 1; i < len - 1; i++) {
                expKey = new ExpFuncInUq('bud$id', [
                    ExpNum.num0, ExpNum.num0, ExpNum.num0, ExpNum.num_1
                    , expKey, inExps[i]
                ], true);
            }
            select.join(JoinType.join, new EntityTable(EnumSysTable.atomUnique, false, b))
                .on(new ExpEQ(new ExpField('atom', b), new ExpField('id', a)));
            select.where(new ExpAnd(
                new ExpEQ(new ExpField('i', b), expKey),
                new ExpEQ(new ExpField('x', b), inExps[len - 1]),
            ));
        }
        let ifIdNull = factory.createIf();
        sqls.push(ifIdNull);
        ifIdNull.cmp = new ExpIsNull(varId);
        let setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(vId, new ExpFuncInUq('atom$id', [ExpNum.num0, ExpNum.num0, ExpNum.num1, varAtomPhrase], true));
        let updateNo = factory.createUpdate();
        ifIdNull.then(updateNo);
        updateNo.cols = [
            { col: 'no', val: new ExpFuncInUq('$no', [ExpNum.num0, new ExpStr('atom'), ExpNull.null], true) },
        ];
        updateNo.table = new EntityTable(EnumSysTable.atom, false);
        updateNo.where = new ExpEQ(new ExpField('id'), varId);

        let ifBaseChange = factory.createIf();
        ifIdNull.else(ifBaseChange);
        ifBaseChange.cmp = new ExpNE(varAtomPhrase, varBase);
        let updateBase = factory.createUpdate();
        ifBaseChange.then(updateBase);
        updateBase.cols = [{ col: 'base', val: varAtomPhrase }];
        updateBase.table = new EntityTable(EnumSysTable.atom, false);
        updateBase.where = new ExpEQ(new ExpField('id'), varId);

        let updateEx = factory.createUpdate();
        sqls.push(updateEx);
        updateEx.cols = [{
            col: 'ex', val: this.context.expVal(ex)
        }];
        updateEx.table = new EntityTable(EnumSysTable.atom, false);
        updateEx.where = new ExpEQ(new ExpField('id'), varId);

        for (let [bud, val] of sets) {
            let valExp = this.context.expVal(val);
            let statements = buildSetAtomBud(this.context, bud, varId, valExp, no);
            sqls.push(...statements);
        }

        let sqlCall = factory.createExecSql();
        sqls.push(sqlCall);
        sqlCall.no = no;
        sqlCall.sql = new ExpFunc(factory.func_concat,
            new ExpStr('CALL `$site`.`'),
            new ExpNum(this.context.site),
            new ExpStr('.'),
            varAtomPhrase,
            new ExpStr('u`(?)'),
        );
        sqlCall.parameters = [varId];
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

export class BBizStatementTie extends BStatement<BizStatementTie> {
    override body(sqls: Sqls): void {
        const { tie, i, x } = this.istatement;
        const { factory } = this.context;
        let insert = factory.createInsert();
        sqls.push(insert);
        let iVal = new ExpFuncInUq('bud$id', [
            ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNull.null
            , new ExpNum(tie.id)
            , this.context.expVal(i),
        ], true);
        insert.cols = [
            { col: 'i', val: iVal },
            { col: 'x', val: this.context.expVal(x) },
        ]
        insert.table = new EntityTable(EnumSysTable.ixBud, false);
        insert.ignore = true;
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
        }

        let setV = factory.createSet();
        sqls.push(setV);
        setV.isAtVar = true;
        const context = this.context;
        function buildParams(pathFunc: (path: string) => string) {
            let params: ExpVal[] = [];
            for (let i in sets) {
                params.push(new ExpStr(pathFunc(i)), context.expVal(sets[i]));
            }
            return params;
        }
        let vNew: ExpVal;
        if (detail === undefined) {
            vNew = new ExpFunc('JSON_SET', new ExpAtVar(varName), ...buildParams((path: string) => `$."${path}"`));
        }
        else {
            vNew = new ExpFunc(
                'JSON_ARRAY_Append',
                new ExpAtVar(varName),
                new ExpStr(`$."${detail}"`),
                new ExpFunc('JSON_OBJECT', ...buildParams((path: string) => path)),
            );
        }
        setV.equ(varName, vNew);
    }
}

export class BBizStatementError extends BStatement<BizStatementError> {
    override body(sqls: Sqls): void {
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        let setError = factory.createSet();
        sqls.push(setError);
        setError.isAtVar = true;
        const { pendOver, message } = this.istatement;
        let msg: string;
        if (pendOver !== undefined) {
            msg = 'PEND';
            setError.equ('checkPend', new ExpFunc(
                'JSON_ARRAY_APPEND',
                new ExpAtVar('checkPend'),
                new ExpStr('$'),
                new ExpFunc('JSON_OBJECT'
                    , new ExpStr('pend'), new ExpVar('$pend')
                    , new ExpStr('overValue'), this.context.expVal(pendOver)
                )
            ));
        }
        else {
            msg = 'BIN';
            setError.equ('checkBin', new ExpFunc(
                'JSON_ARRAY_APPEND',
                new ExpAtVar('checkBin'),
                new ExpStr('$'),
                new ExpFunc('JSON_OBJECT'
                    , new ExpStr('bin'), new ExpVar('$bin')
                    , new ExpStr('message'), this.context.expVal(message)
                )
            ));
        }
        memo.text = 'ERROR ' + msg;
    }
}
