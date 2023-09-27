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
        const { factory, varSite, varUser } = this.context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Pend';
        const a = 'a';
        let declare = factory.createDeclare();
        sqls.push(declare);
        let { pend, no, val, setEqu } = this.istatement;
        let expValue = this.context.expVal(val);
        if (pend === undefined) {
            pend = this.istatement.bizStatement.bizDetailAct.bizDetail.pend;
            buildChangePendFrom();
        }
        else {
            buildWritePend();
        }
        function buildChangePendFrom() {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.pend, false, a);
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar('$pendFrom'));
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
            del.from(new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.pend, false, a));
            del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar('$pendFrom')), new sql_1.ExpEQ(new sql_1.ExpField('value', a), sql_1.ExpNum.num0)));
        }
        function buildWritePend() {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new il_1.BigInt());
            let setPendId = factory.createSet();
            sqls.push(setPendId);
            setPendId.equ(pendId, new sql_1.ExpFuncInUq('pend$id', [varSite, varUser, sql_1.ExpNum.num1, sql_1.ExpVal.null, new sql_1.ExpNum(pend.id)], true));
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new sql_1.ExpNum(pend.id) },
                { col: 'detail', val: new sql_1.ExpVar('detailid') },
                { col: 'value', val: expValue },
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(pendId));
        }
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
        let { factory, varUnit, varUser } = this.context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Bud ';
        /*
                let { setEqu, entity, val, bud, no, of } = this.istatement;
                let { hasHistory, dataType, phrase, flag } = bud;
                let varPhraseId = phraseId + no;
                let varObjId = objId + no;
                let selectPhraseId = factory.createSelect();
                sqls.push(selectPhraseId);
                selectPhraseId.toVar = true;
                selectPhraseId.col('id', varPhraseId);
                selectPhraseId.from(sysTable(EnumSysTable.phrase));
                selectPhraseId.where(new ExpEQ(new ExpField('name'), new ExpStr(phrase)));
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
                    if ((flag & BudFlag.index) !== BudFlag.index) return;
                    let upsert = factory.createUpsert();
                    sqls.push(upsert);
                    upsert.table = new EntityTable(EnumSysTable.ixBud, false);
                    // -- VAR budSiteUomType ID = BudId($site, 'atom.uom.type');
                    // -- VAR budSiteUomTypeValue ID = ID(Bud New KEY base=budSiteUomType, ext=type);
                    const expBud = new ExpFuncInUq('bud$id'
                        , [
                            expSite
                            , expUser
                            , ExpNum.num1
                            , new ExpFuncInUq('bud$id'
                                , [
                                    expSite
                                    , expUser
                                    , ExpNum.num1
                                    , expSite
                                    , expPhraseId
                                ]
                                , true
                            )
                            , expValue
                        ]
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
                    let expRef = new ExpVar('id');
                    let vHistory = historyId + no;
                    let vBudId = budId + no;
                    let setHistoryId = factory.createSet();
                    sqls.push(setHistoryId);
                    setHistoryId.equ(vHistory, new ExpFunc('history$id', varUnit, varUser, ExpNum.num1, ExpVal.null));
                    let setBudId = factory.createSet();
                    sqls.push(setBudId);
                    setBudId.equ(vBudId, new ExpFunc('bud$id', varUnit, varUser, ExpNum.num1, expObjId, expPhraseId));
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
        */
    }
}
exports.BBizDetailActSubBud = BBizDetailActSubBud;
//# sourceMappingURL=biz.js.map