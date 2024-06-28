"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BWithTruncate = exports.BWithIXDel = exports.BWithIDXDel = exports.BWithIDDelOnKeys = exports.BWithIDDelOnId = exports.BWithIXSet = exports.BWithIDXSet = exports.BWithIDSetOnKeys = exports.BWithIDSetOnId = exports.BWithIDX = exports.BWithIDOnKeys = exports.BWithIDOnId = exports.BWithStatement = void 0;
const il_1 = require("../../il");
// import { EnumIdType } from "../../il";
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
class BWithStatement extends bstatement_1.BStatement {
    buildWheresBase() {
        let { where } = this.istatement;
        //let {hasUnit, unitFieldName} = this.context;
        let wheres = [];
        //if (hasUnit === true) {
        //	wheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        //}
        if (where) {
            wheres.push((0, sql_1.convertExp)(this.context, where));
        }
        return wheres;
    }
    buildWheres(alias) {
        let ret = this.buildWheresBase();
        return ret;
    }
    get alias() {
        let { alias } = this.istatement;
        return alias;
    }
    createDel() {
        var _a;
        let { name } = this.entity;
        let { factory } = this.context;
        let hasUnit = false;
        let del = factory.createDelete();
        let alias = (_a = this.alias) !== null && _a !== void 0 ? _a : 'a';
        del.tables = [alias];
        del.from(new statementWithFrom_1.EntityTable(name, hasUnit, alias));
        del.where(new sql_1.ExpAnd(...this.buildWheres(alias)));
        return del;
    }
    createTruncate() {
        let { name } = this.entity;
        let { factory } = this.context;
        let hasUnit = false;
        let truncate = factory.createTruncate();
        truncate.table = new statementWithFrom_1.EntityTable(name, hasUnit);
        return truncate;
    }
    buildInsertIdCol() {
        return undefined;
    }
    buildInsertCols() {
        let { with: _with, act } = this.istatement;
        let ret = [];
        //let {hasUnit, unitFieldName} = this.context;
        let hasUnit = false;
        let idCol = this.buildInsertIdCol();
        if (idCol)
            ret.push(idCol);
        let { sets, setsOnNew } = act;
        this.buildSets(sets, ret);
        if (setsOnNew !== undefined) {
            this.buildSets(setsOnNew, ret);
        }
        return ret;
    }
    buildSets(sets, ret) {
        for (let i in sets) {
            let s = sets[i];
            let { name, equ, value } = s;
            let expValue = (0, sql_1.convertExp)(this.context, value);
            let val;
            let expField = new sql_1.ExpField(name /*, alias*/);
            switch (equ) {
                case '=':
                    val = expValue;
                    break;
                case '+':
                    val = new sql_1.ExpAdd(expField, expValue);
                    break;
                case '-':
                    val = new sql_1.ExpSub(expField, expValue);
                    break;
            }
            ret.push({ col: name, val, update: new sql_1.ExpFunc('VALUES', expField) });
        }
    }
    createInsertOnDuplicate() {
        let { name } = this.entity;
        //let {alias} = this.istatement;
        let { factory } = this.context;
        let hasUnit = false;
        let insert = factory.createInsertOnDuplicate();
        insert.table = new statementWithFrom_1.EntityTable(name, hasUnit); //, alias);
        insert.cols = this.buildInsertCols();
        return insert;
    }
    createInsertIgnore() {
        let { name } = this.entity;
        //let {alias} = this.istatement;
        let { factory } = this.context;
        let hasUnit = false;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(name, hasUnit);
        insert.cols = this.buildInsertCols();
        return insert;
    }
    buildUpdateCols() {
        let { factory } = this.context;
        let { act, alias } = this.istatement;
        let ret = [];
        let { sets } = act;
        for (let i in sets) {
            let s = sets[i];
            let { name, equ, value } = s;
            let expValue = (0, sql_1.convertExp)(this.context, value);
            let val;
            let expField = new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField(name, alias), sql_1.ExpNum.num0);
            switch (equ) {
                case '=':
                    val = expValue;
                    break;
                case '+':
                    val = new sql_1.ExpAdd(expField, expValue);
                    break;
                case '-':
                    val = new sql_1.ExpSub(expField, expValue);
                    break;
            }
            ret.push({ col: name, val });
        }
        return ret;
    }
    createUpdate() {
        let { name } = this.entity;
        let { alias } = this.istatement;
        let { factory } = this.context;
        let hasUnit = false;
        let update = factory.createUpdate();
        update.table = new statementWithFrom_1.EntityTable(name, hasUnit, alias);
        update.where = new sql_1.ExpAnd(...this.buildWheres());
        update.cols = this.buildUpdateCols();
        if (update.cols.length === 0)
            return;
        return update;
    }
    buildUpsert(sqls) {
        let update = this.createUpdate();
        let insert = this.createInsertIgnore();
        if (update) {
            sqls.push(update);
            let { factory } = this.context;
            let iff = factory.createIf();
            sqls.push(iff);
            iff.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_rowCount), sql_1.ExpNum.num0);
            iff.then(insert);
        }
        else {
            sqls.push(insert);
        }
    }
}
exports.BWithStatement = BWithStatement;
class BWithIDOnId extends BWithStatement {
    get entity() { return this.istatement.with.ID; }
    buildWheres(alias) {
        let ret = super.buildWheresBase();
        let { idVal } = this.istatement.with;
        alias = alias !== null && alias !== void 0 ? alias : this.alias;
        ret.push(new sql_1.ExpEQ(new sql_1.ExpField('id', alias), (0, sql_1.convertExp)(this.context, idVal)));
        return ret;
    }
}
exports.BWithIDOnId = BWithIDOnId;
class BWithIDOnKeys extends BWithStatement {
    get entity() { return this.istatement.with.ID; }
    buildWheres(alias) {
        let ret = super.buildWheresBase();
        let { keys } = this.entity;
        let { keyVals } = this.istatement.with;
        alias = alias !== null && alias !== void 0 ? alias : this.alias;
        let len = keys.length;
        for (let i = 0; i < len; i++) {
            let key = keys[i];
            let keyVal = keyVals[i];
            ret.push(new sql_1.ExpEQ(new sql_1.ExpField(key.name, alias), (0, sql_1.convertExp)(this.context, keyVal)));
        }
        return ret;
    }
}
exports.BWithIDOnKeys = BWithIDOnKeys;
class BWithIDX extends BWithStatement {
    get entity() { return this.istatement.with.IDX; }
    buildWheres(alias) {
        let { idVal } = this.istatement.with;
        alias = alias !== null && alias !== void 0 ? alias : this.alias;
        let ret = this.buildWheresBase();
        if (idVal) {
            ret.push(new sql_1.ExpEQ(new sql_1.ExpField('id', alias), (0, sql_1.convertExp)(this.context, idVal)));
        }
        return ret;
    }
    buildInsertIdCol() {
        return { col: 'id', val: (0, sql_1.convertExp)(this.context, this.istatement.with.idVal) };
    }
}
exports.BWithIDX = BWithIDX;
class BWithIX extends BWithStatement {
    get entity() { return this.istatement.with.IX; }
    buildWheres(alias) {
        let { i, x } = this.entity;
        let { ixxVal, iVal, xVal } = this.istatement.with;
        // delete 语句的时候，需要这个
        alias = alias !== null && alias !== void 0 ? alias : this.alias;
        let ret = this.buildWheresBase();
        if (ixxVal) {
            ret.push(new sql_1.ExpEQ(new sql_1.ExpField('ixx', alias), (0, sql_1.convertExp)(this.context, ixxVal)));
        }
        if (iVal) {
            ret.push(new sql_1.ExpEQ(new sql_1.ExpField(i.name, alias), (0, sql_1.convertExp)(this.context, iVal)));
        }
        if (xVal) {
            ret.push(new sql_1.ExpEQ(new sql_1.ExpField(x.name, alias), (0, sql_1.convertExp)(this.context, xVal)));
        }
        return ret;
    }
    buildInsertCols() {
        let { i, x } = this.entity;
        let ret = super.buildInsertCols();
        let { ixxVal, iVal, xVal } = this.istatement.with;
        if (ixxVal) {
            ret.push({
                col: 'ixx', val: (0, sql_1.convertExp)(this.context, ixxVal)
            });
        }
        if (iVal) {
            ret.push({
                col: i.name, val: (0, sql_1.convertExp)(this.context, iVal)
            });
        }
        if (xVal) {
            ret.push({
                col: x.name, val: (0, sql_1.convertExp)(this.context, xVal)
            });
        }
        return ret;
    }
}
class BWithIDSetOnId extends BWithIDOnId {
    body(sqls) {
        this.buildUpsert(sqls);
    }
    buildInsertIdCol() {
        let { idVal } = this.istatement.with;
        let expIdVal = (0, sql_1.convertExp)(this.context, idVal);
        return { col: 'id', val: expIdVal };
    }
}
exports.BWithIDSetOnId = BWithIDSetOnId;
class BWithIDSetOnKeys extends BWithIDOnKeys {
    body(sqls) {
        let { factory } = this.context;
        let { entity, keyVals, idToVar, prevToVar, stampVal, newType } = this.istatement.with;
        let { keys } = entity;
        if (keyVals === undefined)
            keyVals = [];
        if (keyVals.length === keys.length) {
            let vId = `id_$${this.istatement.no}`;
            let setId = factory.createSet();
            sqls.push(setId);
            setId.isAtVar = true;
            let { unitFieldName, userParam } = this.context;
            let expKeys;
            if (keyVals && keyVals.length > 0) {
                expKeys = keyVals.map(v => (0, sql_1.convertExp)(this.context, v));
            }
            else {
                expKeys = [];
            }
            let ID = entity;
            if (ID.isMinute === true) {
                let expStamp;
                if (stampVal === undefined) {
                    expStamp = sql_1.ExpVal.null;
                }
                else {
                    expStamp = this.context.convertExp(stampVal);
                }
                expKeys.unshift(expStamp); // $stamp
            }
            let expIdVal = new sql_1.ExpFuncDb(this.context.dbName, this.context.twProfix + `${entity.name}$id`, new sql_1.ExpVar(unitFieldName), new sql_1.ExpVar(userParam.name), new sql_1.ExpNum(newType), ...expKeys);
            setId.equ(vId, expIdVal);
            if (idToVar !== undefined) {
                let setVar = factory.createSet();
                sqls.push(setVar);
                let varIdToVar = idToVar.pointer.varName(idToVar.name);
                setVar.equ(varIdToVar, new sql_1.ExpAtVar(vId));
                if (prevToVar !== undefined) {
                    let varPrevTo = prevToVar.pointer.varName(prevToVar.name);
                    let select = factory.createSelect();
                    sqls.push(select);
                    select.from(new statementWithFrom_1.EntityTable(entity.name, false));
                    select.toVar = true;
                    select.col('id', varPrevTo);
                    select.where(new sql_1.ExpLT(new sql_1.ExpField('id'), new sql_1.ExpAtVar(vId)));
                    select.order(new sql_1.ExpField('version'), 'desc');
                    select.limit(sql_1.ExpNum.num1);
                    select.lock = select_1.LockType.update;
                }
            }
        }
        let update = this.createUpdate();
        if (update) {
            sqls.push(update);
        }
    }
    buildWheres(alias) {
        let ret = super.buildWheresBase();
        alias = alias !== null && alias !== void 0 ? alias : this.alias;
        ret.push(new sql_1.ExpEQ(new sql_1.ExpField('id', alias), new sql_1.ExpAtVar(`id_$${this.istatement.no}`)));
        return ret;
    }
}
exports.BWithIDSetOnKeys = BWithIDSetOnKeys;
class BWithIDXSet extends BWithIDX {
    body(sqls) {
        this.buildUpsert(sqls);
    }
}
exports.BWithIDXSet = BWithIDXSet;
class BWithIXSet extends BWithIX {
    body(sqls) {
        let { factory } = this.context;
        let { no } = this.istatement;
        let { IX, ixxVal, iVal, xVal } = this.istatement.with;
        let { prev, i, x } = IX;
        let everyX = true;
        if (IX.ixx && !ixxVal)
            everyX = false;
        if (IX.i && !iVal)
            everyX = false;
        if (IX.x && !xVal)
            everyX = false;
        let { name } = this.entity;
        let { alias } = this.istatement;
        let hasUnit = false;
        if (everyX === false) {
            let cols = this.buildUpdateCols();
            let update = factory.createUpdate();
            update.table = new statementWithFrom_1.EntityTable(name, hasUnit, alias);
            update.where = new sql_1.ExpAnd(...this.buildWheres());
            update.cols = cols;
            if (update.cols.length > 0) {
                sqls.push(update);
            }
        }
        else {
            if (prev) {
                let declare = factory.createDeclare();
                let vSeq = 'seq_' + no;
                sqls.push(declare);
                declare.var(vSeq, new il_1.Int());
                let setSeq = factory.createSet();
                sqls.push(setSeq);
                let selectMaxSeq = factory.createSelect();
                selectMaxSeq.column(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField('seq')));
                selectMaxSeq.from(new statementWithFrom_1.EntityTable(name, hasUnit, alias));
                selectMaxSeq.where(new sql_1.ExpEQ(new sql_1.ExpField(i.name), this.context.convertExp(iVal)));
                setSeq.equ(vSeq, new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpSelect(selectMaxSeq), sql_1.ExpNum.num0), sql_1.ExpNum.num1));
            }
            this.buildUpsert(sqls);
        }
    }
    buildInsertCols() {
        let ret = super.buildInsertCols();
        let { no } = this.istatement;
        let { IX } = this.istatement.with;
        let { prev } = IX;
        if (prev) {
            let vSeq = 'prev_' + no;
            ret.push({
                col: 'prev', val: new sql_1.ExpVar(vSeq)
            });
        }
        return ret;
    }
}
exports.BWithIXSet = BWithIXSet;
class BWithIDDelOnId extends BWithIDOnId {
    body(sqls) {
        sqls.push(this.createDel());
    }
}
exports.BWithIDDelOnId = BWithIDDelOnId;
class BWithIDDelOnKeys extends BWithIDOnKeys {
    body(sqls) {
        sqls.push(this.createDel());
    }
}
exports.BWithIDDelOnKeys = BWithIDDelOnKeys;
class BWithIDXDel extends BWithIDX {
    body(sqls) {
        sqls.push(this.createDel());
    }
}
exports.BWithIDXDel = BWithIDXDel;
class BWithIXDel extends BWithIX {
    body(sqls) {
        sqls.push(this.createDel());
    }
}
exports.BWithIXDel = BWithIXDel;
class BWithTruncate extends BWithStatement {
    get entity() { return this.istatement.with.entity; }
    body(sqls) {
        sqls.push(this.createTruncate());
    }
}
exports.BWithTruncate = BWithTruncate;
//# sourceMappingURL=with.js.map