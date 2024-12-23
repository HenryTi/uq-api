"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementBook = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const dbContext_1 = require("../../dbContext");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
const binId = '$bin';
const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
class BBizStatementBook extends bstatement_1.BStatement {
    head(sqls) {
        let { factory } = this.context;
        let { bud, no } = this.istatement;
        let { hasHistory } = bud;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(phraseId + no, new il_1.BigInt());
        declare.var(objId + no, new il_1.BigInt());
        if (hasHistory === true) {
            declare.var(budId + no, new il_1.BigInt());
            declare.var(historyId + no, new il_1.BigInt());
        }
    }
    body(sqls) {
        let { factory, varUser, varSite } = this.context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Book ';
        let { setEqu, entity, val, bud, no, of } = this.istatement;
        let { hasHistory, dataType, id, flag } = bud;
        let varPhraseId = phraseId + no;
        let varObjId = objId + no;
        let setPhraseId = factory.createSet();
        sqls.push(setPhraseId);
        setPhraseId.equ(varPhraseId, new sql_1.ExpNum(id));
        const expObj = of === undefined ? sql_1.ExpNum.num0 : this.context.expVal(of);
        const setObj = factory.createSet();
        sqls.push(setObj);
        setObj.equ(varObjId, expObj);
        const expValue = this.context.convertExp(val);
        const expObjId = new sql_1.ExpVar(varObjId);
        const expPhraseId = new sql_1.ExpVar(varPhraseId);
        let table;
        switch (dataType) {
            default:
                table = il_1.EnumSysTable.ixBudInt;
                buildIxBudIndex();
                break;
            case BizPhraseType_1.BudDataType.char:
                table = il_1.EnumSysTable.ixBudStr;
                break;
            case BizPhraseType_1.BudDataType.dec:
                table = il_1.EnumSysTable.ixBudDec;
                break;
        }
        const expSite = new sql_1.ExpVar('$site');
        const expUser = new sql_1.ExpVar('$user');
        function buildIxBudIndex() {
            if ((flag & il_1.BudIndex.index) !== il_1.BudIndex.index)
                return;
            let upsert = factory.createUpsert();
            sqls.push(upsert);
            upsert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false);
            const expBud = new sql_1.ExpFuncInUq('bud$id', [expSite, expUser, sql_1.ExpNum.num1, sql_1.ExpVal.null, expValue, expPhraseId], true);
            upsert.keys = [
                { col: 'i', val: expBud },
                { col: 'x', val: expObjId },
            ];
        }
        let insertOnDup = factory.createInsertOnDuplicate();
        sqls.push(insertOnDup);
        insertOnDup.table = (0, dbContext_1.sysTable)(table);
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
            let expRef = new sql_1.ExpVar(binId);
            let vHistory = historyId + no;
            let vBudId = budId + no;
            let setHistoryId = factory.createSet();
            sqls.push(setHistoryId);
            setHistoryId.equ(vHistory, new sql_1.ExpFuncInUq('history$id', [varSite, varUser, sql_1.ExpNum.num1, sql_1.ExpVal.null], true));
            let setBudId = factory.createSet();
            sqls.push(setBudId);
            setBudId.equ(vBudId, new sql_1.ExpFuncInUq('bud$id', [varSite, varUser, sql_1.ExpNum.num1, sql_1.ExpVal.null, expObjId, expPhraseId], true));
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.history);
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(vHistory));
            let expPlusMinus;
            switch (setEqu) {
                default:
                    debugger;
                    throw new Error('unknown setEQU ' + setEqu);
                case il_1.SetEqu.add:
                    expPlusMinus = sql_1.ExpNum.num1;
                    break;
                case il_1.SetEqu.sub:
                    expPlusMinus = sql_1.ExpNum.num_1;
                    break;
                case il_1.SetEqu.equ:
                    expPlusMinus = sql_1.ExpNum.num0;
                    break;
            }
            let cols = [
                { col: 'bud', val: new sql_1.ExpVar(vBudId) },
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
exports.BBizStatementBook = BBizStatementBook;
//# sourceMappingURL=biz.statement.book.js.map