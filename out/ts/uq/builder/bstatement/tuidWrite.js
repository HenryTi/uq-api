"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTuidWrite = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const dbContext_1 = require("../dbContext");
class BTuidWrite extends bstatement_1.BStatement {
    body(sqls) {
        let syncStats = [];
        let context = this.context;
        let { factory, hasUnit, unitField, unitFieldName } = context;
        let { tuid, div, of, set, id, unique, into, no, intoPointer, isFlagInto } = this.istatement;
        let tuidObj;
        let tuidEntityName, tuidEntityDotName;
        if (div !== undefined) {
            tuidObj = div;
            tuidEntityName = tuid.name + '_' + div.name;
            tuidEntityDotName = tuid.name + '.' + div.name;
        }
        else {
            tuidObj = tuid;
            tuidEntityDotName = tuidEntityName = tuid.name;
        }
        let { global, sync: isPull, id: idField, unique: tuidUnique } = tuidObj;
        let idFieldName = idField.name;
        if (global === true)
            hasUnit = false;
        let vInto;
        let bigInt = new il_1.BigInt();
        let vTuidFindId = '$_tuid' + no;
        let vTuidId = '$tuid' + no;
        let varTuidFindId = new sql_1.ExpVar(vTuidFindId);
        let varTuidId = new sql_1.ExpVar(vTuidId);
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(vTuidFindId, bigInt).var(vTuidId, bigInt);
        if (into === undefined) {
            vInto = into = '$_into_id';
            declare.var(vInto, bigInt);
        }
        else {
            vInto = into;
            let ipno = intoPointer.no;
            if (ipno)
                vInto += '_' + ipno;
        }
        let idValueExp = (0, sql_1.convertExp)(context, id);
        let setNull = factory.createSet();
        sqls.push(setNull);
        setNull.equ(vTuidId, sql_1.ExpVal.null);
        let createUpdateVId = (varVId) => {
            let updateVId = factory.createUpdate();
            updateVId.cols = [{
                    col: 'tuidVId',
                    val: new sql_1.ExpAdd(varVId, sql_1.ExpVal.num1)
                }];
            updateVId.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity);
            updateVId.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(tuidEntityDotName));
            return updateVId;
        };
        let createUpsert = () => {
            let upsert = factory.createUpsert();
            upsert.table = new sql_1.SqlEntityTable(tuidEntityName, undefined, hasUnit);
            let { cols, keys } = upsert;
            for (let s of set) {
                let val = (0, sql_1.convertExp)(context, s.value);
                cols.push({ col: s.col, val: val, setEqu: s.equ });
                syncStats.push(this.context.buildPullTuidField(s.field, val));
            }
            if (div !== undefined) {
                cols.push({ col: 'owner', val: (0, sql_1.convertExp)(this.context, of) });
            }
            if (hasUnit == true)
                keys.push({ col: unitField.name, val: new sql_1.ExpVar(unitField.name) });
            keys.push({ col: idFieldName, val: idValueExp });
            return upsert;
        };
        let createInsert = () => {
            let ret = [];
            let selectVId = this.context.buildSelectVID(tuid.name, vTuidId, div === null || div === void 0 ? void 0 : div.name);
            ret.push(selectVId);
            let insert = factory.createInsert();
            ret.push(insert);
            insert.table = new sql_1.SqlEntityTable(tuidEntityName, undefined, hasUnit);
            let { cols } = insert;
            cols.push({
                col: idFieldName,
                val: varTuidId
            });
            if (div !== undefined) {
                cols.push({ col: 'owner', val: (0, sql_1.convertExp)(this.context, of) });
            }
            if (hasUnit == true)
                cols.push({ col: unitField.name, val: new sql_1.ExpVar(unitField.name) });
            for (let s of set) {
                let val = (0, sql_1.convertExp)(context, s.value);
                cols.push({ col: s.col, val: val, setEqu: s.equ });
                syncStats.push(this.context.buildPullTuidField(s.field, val));
            }
            if (unique !== undefined) {
                let len = unique.length;
                let uniqueFields = tuid.unique.fields;
                for (let i = 0; i < len; i++) {
                    let u = unique[i];
                    let val = (0, sql_1.convertExp)(this.context, unique[i]);
                    cols.push({ col: uniqueFields[i].name, val: val });
                }
            }
            let updateVId = createUpdateVId(varTuidId);
            ret.push(updateVId);
            return ret;
        };
        let createUpdateNoId = () => {
            let update = factory.createUpdate();
            update.table = new sql_1.SqlEntityTable(tuidEntityName, undefined, hasUnit);
            let { cols } = update;
            if (div !== undefined) {
                cols.push({ col: 'owner', val: (0, sql_1.convertExp)(this.context, of) });
            }
            for (let s of set) {
                let { col, value } = s;
                let val = (0, sql_1.convertExp)(context, value);
                cols.push({
                    col: col,
                    val: val,
                    setEqu: s.equ
                });
                syncStats.push(this.context.buildPullTuidField(s.field, val));
            }
            let updateWhereUnique = [];
            if (unique !== undefined && tuidUnique !== undefined) {
                for (let i = 0; i < unique.length; i++) {
                    let col = tuidUnique.fields[i].name;
                    let v = (0, sql_1.convertExp)(this.context, unique[i]);
                    cols.push({
                        col: col,
                        val: v
                    });
                    updateWhereUnique.push(new sql_1.ExpOr(new sql_1.ExpIsNull(v), new sql_1.ExpEQ(new sql_1.ExpField(col), v)));
                }
            }
            //let whereIdEqu = new ExpEQ(new ExpField(idFieldName), varTuidId);
            //let whereIdEqu = new ExpEQ(new ExpField(idFieldName), idValueExp);
            if (updateWhereUnique.length === 0)
                return;
            let whereNotUnit = new sql_1.ExpAnd(...updateWhereUnique);
            update.where = hasUnit === true ?
                new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), new sql_1.ExpVar(unitFieldName)), whereNotUnit)
                :
                    whereNotUnit;
            return update;
        };
        let createUniqueInto = (vIntoTuid) => {
            let selInto = factory.createSelect();
            selInto.toVar = true;
            selInto.lock = select_1.LockType.update;
            selInto.column(new sql_1.ExpField(idFieldName), vIntoTuid);
            selInto.from(new statementWithFrom_1.EntityTable(tuid.name, global === false && hasUnit === true));
            let wheres = [];
            let uLen = unique.length;
            for (let i = 0; i < uLen; i++) {
                let uf = tuidUnique.fields[i];
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(uf.name), (0, sql_1.convertExp)(this.context, unique[i])));
            }
            selInto.where(new sql_1.ExpAnd(...wheres));
            return selInto;
        };
        if (id !== undefined) {
            // 修改tuid
            if (isPull === true) {
                let upsert = createUpsert();
                sqls.push(upsert);
            }
            else if (set.length === 0) {
                let insert = factory.createInsert();
                sqls.push(insert);
                insert.table = new statementWithFrom_1.EntityTable(tuid.name, global === false && hasUnit === true);
                insert.cols.push({ col: idFieldName, val: idValueExp });
                if (hasUnit === true) {
                    insert.cols.push({ col: unitFieldName, val: new sql_1.ExpVar(unitFieldName) });
                }
            }
            else {
                if (unique !== undefined) {
                    let uniqueInto = createUniqueInto(vTuidFindId);
                    sqls.push(uniqueInto);
                }
                let wheres = [];
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(idFieldName), varTuidFindId));
                if (hasUnit === true) {
                    wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), new sql_1.ExpVar(unitFieldName)));
                }
                let upsert = createUpsert();
                let modifyQueue = this.context.buildModifyQueue(tuid, new sql_1.ExpVar(vInto));
                if (unique !== undefined) {
                    let iff = factory.createIf();
                    sqls.push(iff);
                    let _setNeg = factory.createSet();
                    iff.then(_setNeg);
                    _setNeg.equ(vTuidId, new sql_1.ExpNeg(varTuidFindId));
                    iff.else(upsert);
                    iff.cmp = new sql_1.ExpAnd(new sql_1.ExpIsNotNull(varTuidFindId), new sql_1.ExpNE(varTuidFindId, varTuidId));
                    if (modifyQueue) {
                        for (let mq of modifyQueue) {
                            iff.else(mq);
                        }
                    }
                    let _set = factory.createSet();
                    iff.else(_set);
                    _set.equ(vTuidId, varTuidFindId);
                }
                else {
                    if (id !== undefined) {
                        let _set = factory.createSet();
                        _set.equ(vTuidFindId, idValueExp);
                        sqls.push(_set);
                    }
                    sqls.push(upsert);
                    if (modifyQueue)
                        sqls.push(...modifyQueue);
                }
            }
        }
        else if (unique === undefined) {
            // 如果没有id，也没有unique，直接插入新值
            let insert = createInsert();
            sqls.push(...insert);
            let tuidNewFrom = this.context.buildTuidPull(tuid, varTuidId);
            if (tuidNewFrom !== undefined)
                sqls.push(tuidNewFrom);
        }
        else {
            // if (unique !== undefined) 没有id的时候，一定要定义unique
            let uniqueInto = createUniqueInto(vTuidId);
            sqls.push(uniqueInto);
            let iff = factory.createIf();
            sqls.push(iff);
            let insert = createInsert();
            iff.cmp = new sql_1.ExpIsNull(varTuidId);
            iff.then(...insert);
            iff.then(this.context.buildTuidPull(tuid, varTuidId));
            // ?? 2019-12-13：愚蠢的代码，如果找到了id，不能neg
            // ?? let _setNeg = factory.createSet();
            // ?? iff.else(_setNeg);
            // ?? _setNeg.equ(vTuidId, new ExpNeg(varTuidId));
            // ?? 2020-05-14: 加了一个flag，如果找到id，设成负值into变量。这个是特定环境使用。
            // 2020-06-11: flag into 定义：
            // 如果有unique，则id返回负值
            // unique对应id不存在的时候，才更新
            if (isFlagInto === true) {
                let _setNeg = factory.createSet();
                iff.else(_setNeg);
                _setNeg.equ(vTuidId, new sql_1.ExpNeg(varTuidId));
            }
            else {
                let update = createUpdateNoId();
                iff.else(update);
            }
        }
        if (into !== undefined) {
            let _set = factory.createSet();
            sqls.push(_set);
            _set.equ(vInto, new sql_1.ExpVar(vTuidId));
        }
        sqls.addStatements(syncStats);
    }
}
exports.BTuidWrite = BTuidWrite;
//# sourceMappingURL=tuidWrite.js.map