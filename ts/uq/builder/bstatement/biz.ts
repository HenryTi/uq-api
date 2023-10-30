import {
    EnumSysTable, BigInt, BizDetailActStatement, BizDetailActSubPend
    , BizDetailActTitle, BudDataType, BudIndex, SetEqu
} from "../../il";
import { sysTable } from "../dbContext";
import {
    ColVal, ExpAdd, ExpAnd, ExpEQ, ExpField, ExpFunc, ExpFuncInUq
    , ExpGT, ExpNum, ExpStr, ExpSub, ExpVal, ExpVar, Statement
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BBizDetailActStatement extends BStatement<BizDetailActStatement> {
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
export class BBizDetailActSubPend extends BStatement<BizDetailActSubPend> {
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

            let ifValue = factory.createIf();
            sqls.push(ifValue);
            ifValue.cmp = new ExpGT(new ExpVar('value'), ExpNum.num0);

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
            for (let i in sets) {
                expMids.push(
                    new ExpStr(i),
                    context.expVal(sets[i])
                );
            }

            update.table = new EntityTable(EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new ExpNum(pend.id) },
                { col: 'bin', val: new ExpVar(binId) },
                { col: 'value', val: new ExpVar('value') },
                { col: 'mid', val: new ExpFunc('JSON_OBJECT', ...expMids) },
            ];
            update.where = new ExpEQ(
                new ExpField('id'), new ExpVar(pendId)
            );

            ifValue.then(...buildUpdatePoke());
        }
    }
}

const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
export class BBizDetailActTitle extends BStatement<BizDetailActTitle> {
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
