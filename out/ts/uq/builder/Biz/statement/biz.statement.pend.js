"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementInPend = exports.BBizStatementBinPend = exports.BBizStatementPend = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
const a = 'a', b = 'b';
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
        let { pend, no, val, setEqu, sets, keys, setI, setX } = this.istatement;
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
        const buildWritePend = () => {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new il_1.BigInt());
            let mid = '$mid_' + no;
            declare.var(mid, new il_1.JsonDataType());
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
                // let pendKeyTableName = `${this.context.site}.${pend.id}`;
                let pendKeyTable = new statementWithFrom_1.GlobalSiteTable(this.context.site, pend.id, a);
                let selectPendId = factory.createSelect();
                ifValue.then(selectPendId);
                selectPendId.toVar = true;
                selectPendId.column(new sql_1.ExpField('id', a), pendId);
                selectPendId.from(pendKeyTable)
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false, b))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)));
                let wheres = [];
                for (let [bud, val] of this.istatement.keys) {
                    wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(String(bud.id), a), this.context.expVal(val)));
                }
                selectPendId.where(new sql_1.ExpAnd(...wheres));
                let ifKeyedId = factory.createIf();
                ifValue.then(ifKeyedId);
                ifKeyedId.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(pendId));
                ifKeyedId.then(setPendId);
                let upsertPendKey = factory.createInsertOnDuplicate();
                ifKeyedId.then(upsertPendKey);
                let pendKeyTableInsert = pendKeyTable; // new GlobalTable($site, pendKeyTableName);
                upsertPendKey.table = pendKeyTableInsert;
                const { cols, keys } = upsertPendKey;
                cols.push({ col: 'id', val: new sql_1.ExpVar(pendId) });
                for (let [bud, val] of this.istatement.keys) {
                    keys.push({ col: String(bud.id), val: this.context.expVal(val) });
                }
            }
            let setMid = factory.createSet();
            ifValue.then(setMid);
            setMid.equ(mid, new sql_1.ExpFunc('JSON_OBJECT'));
            // let selectMids: Select[] = [];
            let vMid = new sql_1.ExpVar(mid);
            function buildMidProp(prop, exp) {
                let iff = factory.createIf();
                ifValue.then(iff);
                iff.cmp = new sql_1.ExpIsNotNull(exp);
                let setProp = factory.createSet();
                iff.then(setProp);
                setProp.equ(mid, new sql_1.ExpFunc('JSON_SET', vMid, new sql_1.ExpStr(`$."${prop}"`), exp));
            }
            // let expMids: ExpVal[] = [];
            for (let s of sets) {
                let [bud, val] = s;
                buildMidProp(String(bud.id), context.expVal(val));
            }
            const { i, x } = pend;
            if (i !== undefined) {
                let val = setI === undefined ? new sql_1.ExpVar(i.name) : context.expVal(setI);
                buildMidProp(String(i.id), val);
            }
            if (x !== undefined) {
                let val = setX === undefined ? new sql_1.ExpVar(x.name) : context.expVal(setX);
                buildMidProp(String(x.id), val);
            }
            let update = factory.createUpdate();
            ifValue.then(update);
            update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new sql_1.ExpNum(pend.id) },
                { col: 'bin', val: new sql_1.ExpVar(binId) },
                { col: 'value', val: expValue, setEqu },
                { col: 'mid', val: new sql_1.ExpVar(mid) },
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(pendId));
            ifValue.then(...buildUpdatePoke());
        };
        let expValue = this.context.expVal(val);
        if (pend === undefined) {
            buildChangePendFrom();
        }
        else {
            buildWritePend();
        }
    }
}
exports.BBizStatementPend = BBizStatementPend;
class BBizStatementBinPend extends BBizStatementPend {
    foot(sqls) {
        const { factory } = this.context;
        let { pend } = this.istatement;
        if (pend !== undefined)
            return;
        const { bizBin } = this.istatement.bizStatement.bizAct;
        const { pend: binPend } = bizBin;
        const { keys } = binPend;
        if (keys !== undefined && keys.length > 0) {
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [a];
            del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.pend, false, a));
            del.join(il_1.JoinType.join, new statementWithFrom_1.GlobalSiteTable(this.context.site, binPend.id, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)));
            del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(pendFrom)), new sql_1.ExpEQ(new sql_1.ExpField('value', a), sql_1.ExpNum.num0)));
        }
    }
}
exports.BBizStatementBinPend = BBizStatementBinPend;
class BBizStatementInPend extends BBizStatementPend {
    foot(sqls) {
        // 这个没有在bizscript中定义
    }
}
exports.BBizStatementInPend = BBizStatementInPend;
//# sourceMappingURL=biz.statement.pend.js.map