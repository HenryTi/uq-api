"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementError = exports.BBizStatementOut = exports.BBizStatementTie = exports.BBizStatementSpec = exports.BBizStatementAtom = exports.BBizStatementSheet = exports.BBizStatementBook = exports.BBizStatementInPend = exports.BBizStatementBinPend = exports.BBizStatementPend = exports.BBizStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const consts_1 = require("../../consts");
const dbContext_1 = require("../../dbContext");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const tools_1 = require("../../tools");
const bstatement_1 = require("../../bstatement/bstatement");
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
const pendFrom = '$pend';
const binId = '$bin';
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
            sqls.push(...buildUpdatePoke());
        }
        const buildWritePend = () => {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new il_1.BigInt());
            if (val === undefined) {
                expValue = new sql_1.ExpVar('value');
            }
            let ifValue = factory.createIf();
            sqls.push(ifValue);
            ifValue.cmp = new sql_1.ExpNE(expValue, sql_1.ExpNum.num0);
            let setPendId = factory.createSet();
            setPendId.equ(pendId, new sql_1.ExpFuncInUq('pend$id', [varSite, varUser, sql_1.ExpNum.num1, sql_1.ExpVal.null, new sql_1.ExpNum(pend.id)], true));
            if (keys === undefined) {
                ifValue.then(setPendId);
            }
            else {
                let setPendIdNull = factory.createSet();
                ifValue.then(setPendIdNull);
                setPendIdNull.equ(pendId, sql_1.ExpNull.null);
                let pendKeyTable = new statementWithFrom_1.GlobalTable(consts_1.$site, `${this.context.site}.${pend.id}`);
                let selectPendId = factory.createSelect();
                ifValue.then(selectPendId);
                selectPendId.toVar = true;
                selectPendId.column(new sql_1.ExpField('id'), pendId);
                selectPendId.from(pendKeyTable);
                let wheres = [];
                for (let [name, val] of this.istatement.keys) {
                    wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(name), this.context.expVal(val)));
                }
                selectPendId.where(new sql_1.ExpAnd(...wheres));
                let ifKeyedId = factory.createIf();
                ifValue.then(ifKeyedId);
                ifKeyedId.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(pendId));
                ifKeyedId.then(setPendId);
                let insertPendKey = factory.createInsert();
                ifKeyedId.then(insertPendKey);
                insertPendKey.table = pendKeyTable;
                const { cols } = insertPendKey;
                cols.push({ col: 'id', val: new sql_1.ExpVar(pendId) });
                for (let [name, val] of this.istatement.keys) {
                    cols.push({ col: name, val: this.context.expVal(val) });
                }
            }
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
                { col: 'value', val: expValue, setEqu },
                { col: 'mid', val: new sql_1.ExpFunc('JSON_OBJECT', ...expMids) },
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(pendId));
            ifValue.then(...buildUpdatePoke());
        };
        let { pend, no, val, setEqu, sets, keys } = this.istatement;
        let expValue = this.context.expVal(val);
        if (pend === undefined) {
            buildChangePendFrom();
        }
        else {
            buildWritePend();
        }
    }
    foot(sqls) {
        const { factory } = this.context;
        let { pend } = this.istatement;
        if (pend !== undefined)
            return;
        let del = factory.createDelete();
        sqls.push(del);
        del.tables = [a];
        del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false, a));
        del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(pendFrom)), new sql_1.ExpEQ(new sql_1.ExpField('value', a), sql_1.ExpNum.num0)));
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
        const insert = factory.createInsert();
        const { fields, buds, bin } = this.istatement;
        const { cols } = insert;
        const { props } = bin;
        cols.push({ col: 'id', val: varId });
        for (let i in fields) {
            cols.push({ col: i, val: this.context.expVal(fields[i]) });
        }
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false);
        let ret = [insert];
        for (let i in buds) {
            let val = buds[i];
            let bud = props.get(i);
            let memo = factory.createMemo();
            ret.push(memo);
            memo.text = bud.getJName();
            let expVal = this.context.expVal(val);
            ret.push(...(0, tools_1.buildSetSheetBud)(this.context, bud, varId, expVal));
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
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Atom';
        const { unique, inVals, atomCase, no, toVar, ex, sets } = this.istatement;
        let inExps = inVals.map(v => this.context.expVal(v));
        let declare = factory.createDeclare();
        sqls.push(declare);
        const atomPhrase = 'atomPhrase_' + no;
        declare.var(atomPhrase, new il_1.BigInt());
        const varAtomPhrase = new sql_1.ExpVar(atomPhrase);
        const { bizID: bizID0, condition: condition0 } = atomCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(atomPhrase, new sql_1.ExpNum(bizID0.id));
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
                let statements = new sql_1.Statements();
                let setAtomPhrase = factory.createSet();
                statements.statements.push(setAtomPhrase);
                setAtomPhrase.equ(atomPhrase, new sql_1.ExpNum(bizID.id));
                if (condition !== undefined) {
                    ifCase.elseIf(this.context.expCmp(condition), statements);
                }
                else {
                    ifCase.else(...statements.statements);
                }
            }
        }
        let vBase = 'bizatomBase_' + no;
        let varBase = new sql_1.ExpVar(vBase);
        let vId;
        if (toVar === undefined) {
            vId = 'bizatom_' + no;
        }
        else {
            vId = toVar.varName(undefined);
        }
        declare.var(vId, new il_1.BigInt());
        declare.var(vBase, new il_1.BigInt());
        let varId = new sql_1.ExpVar(vId);
        let setVarIdNull = factory.createSet();
        sqls.push(setVarIdNull);
        setVarIdNull.equ(vId, sql_1.ExpNull.null);
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), vId);
        select.column(new sql_1.ExpField('base', a), vBase);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, a));
        if (unique === undefined) {
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('no', a), inExps[0]));
        }
        else {
            let len = inExps.length;
            let expKey = new sql_1.ExpFuncInUq('bud$id', [
                sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num_1,
                new sql_1.ExpNum(unique.id), inExps[0]
            ], true);
            for (let i = 1; i < len - 1; i++) {
                expKey = new sql_1.ExpFuncInUq('bud$id', [
                    sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num_1,
                    expKey, inExps[i]
                ], true);
            }
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('atom', b), new sql_1.ExpField('id', a)));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', b), expKey), new sql_1.ExpEQ(new sql_1.ExpField('x', b), inExps[len - 1])));
        }
        let ifIdNull = factory.createIf();
        sqls.push(ifIdNull);
        ifIdNull.cmp = new sql_1.ExpIsNull(varId);
        let setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(vId, new sql_1.ExpFuncInUq('atom$id', [sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, varAtomPhrase], true));
        let updateNo = factory.createUpdate();
        ifIdNull.then(updateNo);
        updateNo.cols = [
            { col: 'no', val: new sql_1.ExpFuncInUq('$no', [sql_1.ExpNum.num0, new sql_1.ExpStr('atom'), sql_1.ExpNull.null], true) },
        ];
        updateNo.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateNo.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        let ifBaseChange = factory.createIf();
        ifIdNull.else(ifBaseChange);
        ifBaseChange.cmp = new sql_1.ExpNE(varAtomPhrase, varBase);
        let updateBase = factory.createUpdate();
        ifBaseChange.then(updateBase);
        updateBase.cols = [{ col: 'base', val: varAtomPhrase }];
        updateBase.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateBase.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        let updateEx = factory.createUpdate();
        sqls.push(updateEx);
        updateEx.cols = [{
                col: 'ex', val: this.context.expVal(ex)
            }];
        updateEx.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateEx.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        for (let [bud, val] of sets) {
            let valExp = this.context.expVal(val);
            let statements = (0, tools_1.buildSetAtomBud)(this.context, bud, varId, valExp, no);
            sqls.push(...statements);
        }
        let sqlCall = factory.createExecSql();
        sqls.push(sqlCall);
        sqlCall.no = no;
        sqlCall.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('CALL `$site`.`'), new sql_1.ExpNum(this.context.site), new sql_1.ExpStr('.'), varAtomPhrase, new sql_1.ExpStr('u`(?)'));
        sqlCall.parameters = [varId];
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
                case BizPhraseType_1.BudDataType.date:
                    tbl = il_1.EnumSysTable.ixBudInt;
                    val = new sql_1.ExpFunc('DATEDIFF', val, new sql_1.ExpStr('1970-01-01'));
                    break;
                case BizPhraseType_1.BudDataType.str:
                case BizPhraseType_1.BudDataType.char:
                    tbl = il_1.EnumSysTable.ixBudStr;
                    break;
                case BizPhraseType_1.BudDataType.dec:
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
class BBizStatementTie extends bstatement_1.BStatement {
    body(sqls) {
        const { tie, i, x } = this.istatement;
        const { factory } = this.context;
        let insert = factory.createInsert();
        sqls.push(insert);
        let iVal = new sql_1.ExpFuncInUq('bud$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
            new sql_1.ExpNum(tie.id),
            this.context.expVal(i),
        ], true);
        insert.cols = [
            { col: 'i', val: iVal },
            { col: 'x', val: this.context.expVal(x) },
        ];
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false);
        insert.ignore = true;
    }
}
exports.BBizStatementTie = BBizStatementTie;
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
        }
        let setV = factory.createSet();
        sqls.push(setV);
        setV.isAtVar = true;
        const context = this.context;
        function buildParams(pathFunc) {
            let params = [];
            for (let i in sets) {
                params.push(new sql_1.ExpStr(pathFunc(i)), context.expVal(sets[i]));
            }
            return params;
        }
        let vNew;
        if (detail === undefined) {
            vNew = new sql_1.ExpFunc('JSON_SET', new sql_1.ExpAtVar(varName), ...buildParams((path) => `$."${path}"`));
        }
        else {
            vNew = new sql_1.ExpFunc('JSON_ARRAY_Append', new sql_1.ExpAtVar(varName), new sql_1.ExpStr(`$."${detail}"`), new sql_1.ExpFunc('JSON_OBJECT', ...buildParams((path) => path)));
        }
        setV.equ(varName, vNew);
    }
}
exports.BBizStatementOut = BBizStatementOut;
class BBizStatementError extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        let setError = factory.createSet();
        sqls.push(setError);
        setError.isAtVar = true;
        const { pendOver, message } = this.istatement;
        let msg;
        if (pendOver !== undefined) {
            msg = 'PEND';
            setError.equ('checkPend', new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpAtVar('checkPend'), new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_OBJECT', new sql_1.ExpStr('pend'), new sql_1.ExpVar('$pend'), new sql_1.ExpStr('overValue'), this.context.expVal(pendOver))));
        }
        else {
            msg = 'BIN';
            setError.equ('checkBin', new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpAtVar('checkBin'), new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_OBJECT', new sql_1.ExpStr('bin'), new sql_1.ExpVar('$bin'), new sql_1.ExpStr('message'), this.context.expVal(message))));
        }
        memo.text = 'ERROR ' + msg;
    }
}
exports.BBizStatementError = BBizStatementError;
//# sourceMappingURL=biz.js.map