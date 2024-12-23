import {
    EnumSysTable, BigInt, BizStatementBook, BudIndex, SetEqu
} from "../../../il";
import { BudDataType } from "../../../il/Biz/BizPhraseType";
import { sysTable } from "../../dbContext";
import {
    ColVal, ExpEQ, ExpField, ExpFuncInUq, ExpNum, ExpVal, ExpVar
} from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

const binId = '$bin';
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
