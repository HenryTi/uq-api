"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizDetailActTitle = exports.BBizDetailActSubPend = exports.BBizInActStatement = exports.BBizBinActStatement = void 0;
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
class BBizBinActStatement extends bstatement_1.BStatement {
    head(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.head(sqls);
    }
    body(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.body(sqls);
    }
    foot(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.foot(sqls);
    }
}
exports.BBizBinActStatement = BBizBinActStatement;
class BBizInActStatement extends bstatement_1.BStatement {
    head(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.head(sqls);
    }
    body(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.body(sqls);
    }
    foot(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.foot(sqls);
    }
}
exports.BBizInActStatement = BBizInActStatement;
const pendFrom = 'pend';
const binId = 'bin';
class BBizDetailActSubPend extends bstatement_1.BStatement {
    // 可以发送sheet主表，也可以是Detail
    body(sqls) {
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
        function buildUpdatePoke() {
            let updatePoke = factory.createUpdate();
            updatePoke.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.userSite, false);
            updatePoke.cols = [
                { col: 'poke', val: sql_1.ExpNum.num1 },
            ];
            updatePoke.where = new sql_1.ExpEQ(new sql_1.ExpField('site'), new sql_1.ExpVar('$site'));
            return [updatePoke];
        }
        function buildChangePendFrom() {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false, a);
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(pendFrom));
            let cols = update.cols = [];
            let expValueField = new sql_1.ExpField('value', a);
            switch (setEqu) {
                case il_1.SetEqu.equ: break;
                case il_1.SetEqu.add:
                    expValue = new sql_1.ExpAdd(expValueField, expValue);
                    break;
                case il_1.SetEqu.sub:
                    expValue = new sql_1.ExpSub(expValueField, expValue);
                    break;
            }
            cols.push({ col: 'value', val: expValue });
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [a];
            del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false, a));
            del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(pendFrom)), new sql_1.ExpEQ(new sql_1.ExpField('value', a), sql_1.ExpNum.num0)));
            sqls.push(...buildUpdatePoke());
        }
        function buildWritePend() {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new il_1.BigInt());
            let ifValue = factory.createIf();
            sqls.push(ifValue);
            ifValue.cmp = new sql_1.ExpGT(new sql_1.ExpVar('value'), sql_1.ExpNum.num0);
            let setPendId = factory.createSet();
            ifValue.then(setPendId);
            setPendId.equ(pendId, new sql_1.ExpFuncInUq('pend$id', [varSite, varUser, sql_1.ExpNum.num1, sql_1.ExpVal.null, new sql_1.ExpNum(pend.id)], true));
            let update = factory.createUpdate();
            ifValue.then(update);
            let expMids = [];
            for (let s of sets) {
                let [bud, val] = s;
                expMids.push(new sql_1.ExpStr(String(bud.id)), context.expVal(val));
            }
            update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new sql_1.ExpNum(pend.id) },
                { col: 'bin', val: new sql_1.ExpVar(binId) },
                { col: 'value', val: new sql_1.ExpVar('value') },
                { col: 'mid', val: new sql_1.ExpFunc('JSON_OBJECT', ...expMids) },
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(pendId));
            ifValue.then(...buildUpdatePoke());
        }
    }
}
exports.BBizDetailActSubPend = BBizDetailActSubPend;
const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
class BBizDetailActTitle extends bstatement_1.BStatement {
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
        memo.text = 'Biz Title ';
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
            case il_1.BudDataType.char:
                table = il_1.EnumSysTable.ixBudStr;
                break;
            case il_1.BudDataType.dec:
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
        let upsert = factory.createUpsert();
        sqls.push(upsert);
        upsert.table = (0, dbContext_1.sysTable)(table);
        upsert.keys = [
            { col: 'i', val: expObjId },
            { col: 'x', val: expPhraseId },
        ];
        const valueCol = 'value';
        upsert.cols = [
            { col: valueCol, val: expValue, setEqu },
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
exports.BBizDetailActTitle = BBizDetailActTitle;
//# sourceMappingURL=biz.js.map