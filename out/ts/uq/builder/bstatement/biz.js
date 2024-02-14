"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementOut = exports.BBizStatementSpec = exports.BBizStatementAtom = exports.BBizStatementSheet = exports.BBizStatementTitle = exports.BBizStatementInPend = exports.BBizStatementBinPend = exports.BBizStatementPend = exports.BBizStatement = void 0;
const il_1 = require("../../il");
const consts_1 = require("../consts");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
class BBizStatement extends bstatement_1.BStatement {
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
exports.BBizStatement = BBizStatement;
const pendFrom = 'pend';
const binId = 'bin';
class BBizStatementPend extends bstatement_1.BStatement {
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
exports.BBizStatementPend = BBizStatementPend;
class BBizStatementBinPend extends BBizStatementPend {
}
exports.BBizStatementBinPend = BBizStatementBinPend;
class BBizStatementInPend extends BBizStatementPend {
}
exports.BBizStatementInPend = BBizStatementInPend;
const phraseId = '$phraseId_';
const objId = '$objId_';
const budId = '$budId_';
const historyId = '$history_';
class BBizStatementTitle extends bstatement_1.BStatement {
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
            let upsert = factory.createInsert();
            sqls.push(upsert);
            upsert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false);
            const expBud = new sql_1.ExpFuncInUq('bud$id', [expSite, expUser, sql_1.ExpNum.num1, sql_1.ExpVal.null, expValue, expPhraseId], true);
            upsert.keys = [
                { col: 'i', val: expBud },
                { col: 'x', val: expObjId },
            ];
        }
        let upsert = factory.createInsert();
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
exports.BBizStatementTitle = BBizStatementTitle;
class BBizStatementSheet extends bstatement_1.BStatement {
    body(sqls) {
        const { detail } = this.istatement;
        if (detail === undefined)
            this.buildMain(sqls);
        else
            this.buildDetail(sqls);
    }
    buildMain(sqls) {
        const { factory } = this.context;
        const { useSheet } = this.istatement;
        const { sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Sheet ' + sheet.getJName();
        const setId = factory.createSet();
        sqls.push(setId);
        let idVarName = useSheet.varName;
        let idParams = [
            new sql_1.ExpVar(consts_1.$site),
            sql_1.ExpNum.num0,
            sql_1.ExpNum.num1,
            sql_1.ExpNull.null,
            new sql_1.ExpNum(sheet.id),
            new sql_1.ExpFuncInUq('$no', [new sql_1.ExpVar(consts_1.$site), new sql_1.ExpStr('sheet'), sql_1.ExpNull.null], true),
        ];
        setId.equ(idVarName, new sql_1.ExpFuncInUq('sheet$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }
    buildDetail(sqls) {
        const { factory } = this.context;
        let idVarName = 'detail$id';
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars((0, il_1.bigIntField)(idVarName));
        const { useSheet, bin } = this.istatement;
        const { varName, sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = `Biz Detail ${bin.getJName()} OF Sheet ${sheet.getJName()}`;
        const setBinId = factory.createSet();
        sqls.push(setBinId);
        let idParams = [
            new sql_1.ExpVar(consts_1.$site),
            sql_1.ExpNum.num0,
            sql_1.ExpNum.num1,
            sql_1.ExpNull.null,
            new sql_1.ExpFuncInUq('bud$id', [
                new sql_1.ExpVar(consts_1.$site), sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                new sql_1.ExpVar(varName), new sql_1.ExpNum(bin.id)
            ], true),
        ];
        setBinId.equ(idVarName, new sql_1.ExpFuncInUq('detail$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }
    createUpdate(idVarName) {
        const { factory } = this.context;
        const varId = new sql_1.ExpVar(idVarName);
        const update = factory.createUpdate();
        const { fields, buds, bin } = this.istatement;
        const { cols } = update;
        const { props } = bin;
        for (let i in fields) {
            cols.push({ col: i, val: this.context.expVal(fields[i]) });
        }
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        let ret = [update];
        for (let i in buds) {
            let val = buds[i];
            let bud = props.get(i);
            let memo = factory.createMemo();
            ret.push(memo);
            memo.text = bud.getJName();
            let expVal = this.context.expVal(val);
            let insert = factory.createInsert();
            insert.ignore = true;
            const createIxBudValue = (table, valValue) => {
                insert.table = new statementWithFrom_1.EntityTable(table, false);
                insert.cols = [
                    { col: 'i', val: varId },
                    { col: 'x', val: new sql_1.ExpNum(bud.id) },
                    { col: 'value', val: valValue },
                ];
                return insert;
            };
            const createIxBud = (table, valValue) => {
                insert.table = new statementWithFrom_1.EntityTable(table, false);
                insert.cols = [
                    { col: 'i', val: varId },
                    { col: 'x', val: valValue },
                ];
                return insert;
            };
            switch (bud.dataType) {
                default:
                    debugger;
                    break;
                case il_1.BudDataType.check:
                    debugger;
                    break;
                case il_1.BudDataType.datetime:
                    debugger;
                    break;
                case il_1.BudDataType.int: break;
                case il_1.BudDataType.atom:
                    insert = createIxBudValue(il_1.EnumSysTable.ixBudInt, expVal);
                    break;
                case il_1.BudDataType.char:
                case il_1.BudDataType.str:
                    insert = createIxBudValue(il_1.EnumSysTable.ixBudStr, expVal);
                    break;
                case il_1.BudDataType.radio:
                    insert = createIxBud(il_1.EnumSysTable.ixBud, expVal);
                    break;
                case il_1.BudDataType.date:
                    insert = createIxBudValue(il_1.EnumSysTable.ixBudInt, new sql_1.ExpNum(10000) /* expVal*/);
                    break;
                case il_1.BudDataType.dec:
                    insert = createIxBudValue(il_1.EnumSysTable.ixBudDec, expVal);
                    break;
            }
            ret.push(insert);
        }
        return ret;
    }
}
exports.BBizStatementSheet = BBizStatementSheet;
class BBizStatementID extends bstatement_1.BStatement {
    body(sqls) {
    }
}
const a = 'a', b = 'b';
class BBizStatementAtom extends BBizStatementID {
    body(sqls) {
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
exports.BBizStatementAtom = BBizStatementAtom;
class BBizStatementSpec extends BBizStatementID {
    body(sqls) {
        const { inVals, spec } = this.istatement;
        const { factory } = this.context;
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), undefined, this.istatement.toVar);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, a));
        let wheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('base', a), this.context.expVal(inVals[0])),
        ];
        let { keys } = spec;
        let len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { id, dataType } = key;
            let tbl, val = this.context.expVal(inVals[i + 1]);
            switch (dataType) {
                default:
                    tbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case il_1.BudDataType.date:
                    tbl = il_1.EnumSysTable.ixBudInt;
                    val = new sql_1.ExpFunc('DATEDIFF', val, new sql_1.ExpStr('1970-01-01'));
                    break;
                case il_1.BudDataType.str:
                case il_1.BudDataType.char:
                    tbl = il_1.EnumSysTable.ixBudStr;
                    break;
                case il_1.BudDataType.dec:
                    tbl = il_1.EnumSysTable.ixBudDec;
                    break;
            }
            let t = 't' + i;
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, t));
            select.on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(id))));
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('value', t), val));
        }
        select.where(new sql_1.ExpAnd(...wheres));
    }
}
exports.BBizStatementSpec = BBizStatementSpec;
class BBizStatementOut extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        const { useOut, tos, detail, sets } = this.istatement;
        let varName = '$' + useOut.varName;
        const tblTo = new sql_1.SqlVarTable(varName + '$TO');
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
        function buildParams(path) {
            let params = [];
            for (let i in sets) {
                params.push(new sql_1.ExpStr(path + i), context.expVal(sets[i]));
            }
            return params;
        }
        let vNew;
        if (detail === undefined) {
            vNew = new sql_1.ExpFunc('JSON_SET', new sql_1.ExpAtVar(varName), ...buildParams('$.'));
        }
        else {
            vNew = new sql_1.ExpFunc('JSON_ARRAY_Append', new sql_1.ExpAtVar(varName), new sql_1.ExpStr('$.' + detail), new sql_1.ExpFunc('JSON_OBJECT', ...buildParams('')));
        }
        setV.equ(varName, vNew);
    }
}
exports.BBizStatementOut = BBizStatementOut;
//# sourceMappingURL=biz.js.map