import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, TuidWrite, BigInt, Tuid } from '../../il';
import {
    ExpVar, SqlEntityTable, convertExp, ExpVal, ExpCmp, ExpAnd, ExpEQ,
    ExpField, ExpNeg, ExpIsNotNull, ExpNE, ExpIsNull, ExpNull, Statement, ExpOr, ExpStr, ExpAdd
} from '../sql';
import { LockType } from '../sql/select';
import { EntityTable } from '../sql/statementWithFrom';
import { sysTable } from "../dbContext";

export class BTuidWrite extends BStatement {
    protected istatement: TuidWrite;
    body(sqls: Sqls) {
        let syncStats: Statement[] = [];
        let context = this.context;
        let { factory, hasUnit, unitField, unitFieldName } = context;
        let { tuid, div, of, set, id, unique, into, no, intoPointer, isFlagInto } = this.istatement;
        let tuidObj: Tuid;
        let tuidEntityName: string, tuidEntityDotName: string;
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
        if (global === true) hasUnit = false;
        let vInto: string;

        let bigInt = new BigInt();
        let vTuidFindId = '$_tuid' + no;
        let vTuidId = '$tuid' + no;
        let varTuidFindId = new ExpVar(vTuidFindId);
        let varTuidId = new ExpVar(vTuidId);
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
            if (ipno) vInto += '_' + ipno;
        }
        let idValueExp = convertExp(context, id) as ExpVal;
        let setNull = factory.createSet();
        sqls.push(setNull);
        setNull.equ(vTuidId, ExpVal.null);
        let createUpdateVId = (varVId: ExpVar) => {
            let updateVId = factory.createUpdate();
            updateVId.cols = [{
                col: 'tuidVId',
                val: new ExpAdd(varVId, ExpVal.num1)
            }]
            updateVId.table = sysTable(EnumSysTable.entity);
            updateVId.where = new ExpEQ(new ExpField('name'), new ExpStr(tuidEntityDotName));
            return updateVId;
        }
        let createUpsert = () => {
            let upsert = factory.createUpsert();
            upsert.table = new SqlEntityTable(tuidEntityName, undefined, hasUnit);
            let { cols, keys } = upsert;
            for (let s of set) {
                let val = convertExp(context, s.value) as ExpVal;
                cols.push({ col: s.col, val: val, setEqu: s.equ });
                syncStats.push(this.context.buildPullTuidField(s.field, val));
            }
            if (div !== undefined) {
                cols.push({ col: 'owner', val: convertExp(this.context, of) as ExpVal });
            }
            if (hasUnit == true)
                keys.push({ col: unitField.name, val: new ExpVar(unitField.name) });
            keys.push({ col: idFieldName, val: idValueExp })
            return upsert;
        }
        let createInsert = (): Statement[] => {
            let ret: Statement[] = [];
            let selectVId = this.context.buildSelectVID(tuid.name, vTuidId, div?.name);
            ret.push(selectVId);
            let insert = factory.createInsert();
            ret.push(insert);
            insert.table = new SqlEntityTable(tuidEntityName, undefined, hasUnit);
            let { cols } = insert;
            cols.push({
                col: idFieldName,
                val: varTuidId
            });
            if (div !== undefined) {
                cols.push({ col: 'owner', val: convertExp(this.context, of) as ExpVal });
            }
            if (hasUnit == true)
                cols.push({ col: unitField.name, val: new ExpVar(unitField.name) });
            for (let s of set) {
                let val = convertExp(context, s.value) as ExpVal
                cols.push({ col: s.col, val: val, setEqu: s.equ });
                syncStats.push(this.context.buildPullTuidField(s.field, val));
            }
            if (unique !== undefined) {
                let len = unique.length;
                let uniqueFields = tuid.unique.fields;
                for (let i = 0; i < len; i++) {
                    let u = unique[i];
                    let val = convertExp(this.context, unique[i]) as ExpVal
                    cols.push({ col: uniqueFields[i].name, val: val });
                }
            }
            let updateVId = createUpdateVId(varTuidId);
            ret.push(updateVId);
            return ret;
        }
        let createUpdateNoId = () => {
            let update = factory.createUpdate();
            update.table = new SqlEntityTable(tuidEntityName, undefined, hasUnit);
            let { cols } = update;
            if (div !== undefined) {
                cols.push({ col: 'owner', val: convertExp(this.context, of) as ExpVal });
            }
            for (let s of set) {
                let { col, value } = s;
                let val = convertExp(context, value) as ExpVal
                cols.push({
                    col: col,
                    val: val,
                    setEqu: s.equ
                });
                syncStats.push(this.context.buildPullTuidField(s.field, val));
            }

            let updateWhereUnique: ExpCmp[] = [];
            if (unique !== undefined && tuidUnique !== undefined) {
                for (let i = 0; i < unique.length; i++) {
                    let col = tuidUnique.fields[i].name;
                    let v = convertExp(this.context, unique[i]) as ExpVal;
                    cols.push({
                        col: col,
                        val: v
                    })
                    updateWhereUnique.push(new ExpOr(
                        new ExpIsNull(v),
                        new ExpEQ(new ExpField(col), v)
                    ));
                }
            }

            //let whereIdEqu = new ExpEQ(new ExpField(idFieldName), varTuidId);
            //let whereIdEqu = new ExpEQ(new ExpField(idFieldName), idValueExp);
            if (updateWhereUnique.length === 0) return;
            let whereNotUnit: ExpCmp = new ExpAnd(...updateWhereUnique);

            update.where = hasUnit === true ?
                new ExpAnd(
                    new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)),
                    whereNotUnit,
                )
                :
                whereNotUnit;
            return update;
        }
        let createUniqueInto = (vIntoTuid: string) => {
            let selInto = factory.createSelect();
            selInto.toVar = true;
            selInto.lock = LockType.update;
            selInto.column(new ExpField(idFieldName), vIntoTuid);
            selInto.from(new EntityTable(tuid.name, global === false && hasUnit === true));
            let wheres: ExpCmp[] = [];

            let uLen = unique.length;
            for (let i = 0; i < uLen; i++) {
                let uf = tuidUnique.fields[i];
                wheres.push(new ExpEQ(new ExpField(uf.name), convertExp(this.context, unique[i]) as ExpVal));
            }
            selInto.where(new ExpAnd(...wheres));
            return selInto;
        }
        if (id !== undefined) {
            // 修改tuid
            if (isPull === true) {
                let upsert = createUpsert();
                sqls.push(upsert);
            }
            else if (set.length === 0) {
                let insert = factory.createInsert();
                sqls.push(insert);
                insert.table = new EntityTable(tuid.name, global === false && hasUnit === true);
                insert.cols.push({ col: idFieldName, val: idValueExp });
                if (hasUnit === true) {
                    insert.cols.push({ col: unitFieldName, val: new ExpVar(unitFieldName) });
                }
            }
            else {
                if (unique !== undefined) {
                    let uniqueInto = createUniqueInto(vTuidFindId);
                    sqls.push(uniqueInto);
                }
                let wheres: ExpCmp[] = [];
                wheres.push(new ExpEQ(new ExpField(idFieldName), varTuidFindId));
                if (hasUnit === true) {
                    wheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
                }

                let upsert = createUpsert();

                let modifyQueue = this.context.buildModifyQueue(tuid, new ExpVar(vInto));
                if (unique !== undefined) {
                    let iff = factory.createIf();
                    sqls.push(iff);
                    let _setNeg = factory.createSet();
                    iff.then(_setNeg);
                    _setNeg.equ(vTuidId, new ExpNeg(varTuidFindId));
                    iff.else(upsert);
                    iff.cmp = new ExpAnd(
                        new ExpIsNotNull(varTuidFindId),
                        new ExpNE(varTuidFindId, varTuidId)
                    );
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
                    if (modifyQueue) sqls.push(...modifyQueue);
                }
            }
        }
        else if (unique === undefined) {
            // 如果没有id，也没有unique，直接插入新值
            let insert = createInsert();
            sqls.push(...insert);
            let tuidNewFrom = this.context.buildTuidPull(tuid, varTuidId);
            if (tuidNewFrom !== undefined) sqls.push(tuidNewFrom);
        }
        else {
            // if (unique !== undefined) 没有id的时候，一定要定义unique
            let uniqueInto = createUniqueInto(vTuidId);
            sqls.push(uniqueInto);
            let iff = factory.createIf();
            sqls.push(iff);
            let insert = createInsert();
            iff.cmp = new ExpIsNull(varTuidId);
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
                _setNeg.equ(vTuidId, new ExpNeg(varTuidId));
            }
            else {
                let update = createUpdateNoId();
                iff.else(update);
            }
        }
        if (into !== undefined) {
            let _set = factory.createSet();
            sqls.push(_set);
            _set.equ(vInto, new ExpVar(vTuidId));
        }
        sqls.addStatements(syncStats);
    }
}

