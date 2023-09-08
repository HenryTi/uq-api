"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizDetailActSubBud = exports.BBizDetailActSubPend = exports.BBizDetailActStatement = void 0;
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
class BBizDetailActStatement extends bstatement_1.BStatement {
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
exports.BBizDetailActStatement = BBizDetailActStatement;
class BBizDetailActSubPend extends bstatement_1.BStatement {
    // 可以发送sheet主表，也可以是Detail
    body(sqls) {
        let { pend, valId, toVar, valDetailId, valValue, receiver, pendAct, valueCalc } = this.istatement;
        let { factory, varUnit, varUser } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Pend ';
        let declare = factory.createDeclare();
        sqls.push(declare);
        let { no } = this.istatement;
        let vId = 'id_' + no;
        let varId = new sql_1.ExpVar(vId);
        let vBase = 'base_' + no;
        let varBase = new sql_1.ExpVar(vBase);
        declare.var(vBase, new il_1.BigInt());
        declare.var(vId, new il_1.BigInt());
        let setBase = factory.createSet();
        sqls.push(setBase);
        setBase.equ(vBase, this.context.buildExpBudId(new sql_1.ExpStr(pend.phrase)));
        switch (pendAct) {
            case il_1.PendAct.del:
                this.buildPendDel(sqls, varBase);
                return;
            case il_1.PendAct.goto:
                this.buildPendGoto(sqls, varBase);
                return;
        }
        let setId = factory.createSet();
        sqls.push(setId);
        if (valId === undefined) {
            setId.equ(vId, new sql_1.ExpFuncInUq('pend$id', [varUnit, varUser, sql_1.ExpNum.num1, sql_1.ExpVal.null], true));
            if (toVar !== undefined) {
                let setToVar = factory.createSet();
                sqls.push(setToVar);
                setToVar.equ(toVar.varName(), varId);
            }
        }
        else {
            setId.equ(vId, this.context.expVal(valId));
        }
        let update = factory.createUpdate();
        sqls.push(update);
        update.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.pend, false);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        update.cols = [{ col: 'base', val: varBase }];
        let { cols } = update;
        if (valDetailId !== undefined) {
            cols.push({ col: 'detail', val: this.context.expVal(valDetailId) });
        }
        if (valValue !== undefined) {
            let expValueField = new sql_1.ExpField('value');
            let expValue = this.context.expVal(valValue);
            let val;
            switch (valueCalc) {
                case il_1.PendValueCalc.equ:
                    val = expValue;
                    break;
                case il_1.PendValueCalc.add:
                    val = new sql_1.ExpAdd(expValueField, expValue);
                    break;
                case il_1.PendValueCalc.sub:
                    val = new sql_1.ExpSub(expValueField, expValue);
                    break;
            }
            cols.push({ col: 'value', val });
        }
    }
    buildPendDel(sqls, varBase) {
        let { valId, valDetailId } = this.istatement;
        let { factory } = this.context;
        let del = factory.createDelete();
        sqls.push(del);
        let a = 'a';
        del.from(new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.pend, false, a));
        del.tables = [a];
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('base'), varBase)];
        if (valId !== undefined) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('id', a), this.context.expVal(valId)));
        }
        if (valDetailId !== undefined) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('id', a), this.context.expVal(valDetailId)));
        }
        del.where(new sql_1.ExpAnd(...wheres));
    }
    buildPendGoto(sqls, varBase) {
        let { valId, valDetailId, pendGoto } = this.istatement;
        let { factory } = this.context;
        let update = factory.createUpdate();
        sqls.push(update);
        update.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.pend, false);
        update.cols = [
            { col: 'base', val: this.context.buildExpBudId(new sql_1.ExpStr(pendGoto.phrase)) }
        ];
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('base'), varBase)];
        if (valId !== undefined) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('id'), this.context.expVal(valId)));
        }
        if (valDetailId !== undefined) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('id'), this.context.expVal(valDetailId)));
        }
        update.where = new sql_1.ExpAnd(...wheres);
    }
}
exports.BBizDetailActSubPend = BBizDetailActSubPend;
const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
class BBizDetailActSubBud extends bstatement_1.BStatement {
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
        let { setEqu, value, ref, bud, no, obj, toVar } = this.istatement;
        let { hasHistory, dataType, phrase, hasIndex: indexName } = bud;
        let { factory, varUnit, varUser } = this.context;
        let varPhraseId = phraseId + no;
        let varObjId = objId + no;
        let selectPhraseId = factory.createSelect();
        sqls.push(selectPhraseId);
        selectPhraseId.toVar = true;
        selectPhraseId.col('id', varPhraseId);
        selectPhraseId.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.phrase));
        selectPhraseId.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(phrase)));
        const expObj = obj === undefined ? sql_1.ExpNum.num0 : this.context.expVal(obj);
        const setObj = factory.createSet();
        sqls.push(setObj);
        setObj.equ(varObjId, expObj);
        const expValue = this.context.convertExp(value);
        const expObjId = new sql_1.ExpVar(varObjId);
        const expPhraseId = new sql_1.ExpVar(varPhraseId);
        let table;
        switch (dataType) {
            default:
                table = dbContext_1.EnumSysTable.ixBudInt;
                buildIxBudIndex();
                break;
            case 'char':
                table = dbContext_1.EnumSysTable.ixBudStr;
                break;
            case 'dec':
                table = dbContext_1.EnumSysTable.ixBudDec;
                break;
        }
        const expSite = new sql_1.ExpVar('$site');
        const expUser = new sql_1.ExpVar('$user');
        function buildIxBudIndex() {
            if (indexName === undefined)
                return;
            let upsert = factory.createUpsert();
            sqls.push(upsert);
            upsert.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.ixBud, false);
            // -- VAR budSiteUomType ID = BudId($site, 'atom.uom.type');
            // -- VAR budSiteUomTypeValue ID = ID(Bud New KEY base=budSiteUomType, ext=type);
            const expBud = new sql_1.ExpFuncInUq('bud$id', [
                expSite,
                expUser,
                sql_1.ExpNum.num1,
                new sql_1.ExpFuncInUq('bud$id', [
                    expSite,
                    expUser,
                    sql_1.ExpNum.num1,
                    expSite,
                    expPhraseId
                ], true),
                expValue
            ], true);
            upsert.keys = [
                { col: 'i', val: expBud },
                { col: 'x', val: expObjId },
            ];
        }
        if (toVar !== undefined) {
            let selectToVar = factory.createSelect();
            sqls.push(selectToVar);
            selectToVar.toVar = true;
            selectToVar.column(new sql_1.ExpField('value'), toVar.varName());
            selectToVar.from(new statementWithFrom_1.EntityTable(table, false));
            selectToVar.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), expObjId), new sql_1.ExpEQ(new sql_1.ExpField('x'), expPhraseId)));
            return;
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
            let expRef = this.context.convertExp(ref);
            let vHistory = historyId + no;
            let vBudId = budId + no;
            let setHistoryId = factory.createSet();
            sqls.push(setHistoryId);
            setHistoryId.equ(vHistory, new sql_1.ExpFunc('history$id', varUnit, varUser, sql_1.ExpNum.num1, new sql_1.ExpNull()));
            let setBudId = factory.createSet();
            sqls.push(setBudId);
            setBudId.equ(vBudId, new sql_1.ExpFunc('bud$id', varUnit, varUser, sql_1.ExpNum.num1, expObjId, expPhraseId));
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.history);
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
exports.BBizDetailActSubBud = BBizDetailActSubBud;
//# sourceMappingURL=biz.js.map