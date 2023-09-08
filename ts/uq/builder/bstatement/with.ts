import { Entity, ID, IX, IDX, WithActSet, WithID, WithIX, WithIDX, WithStatement, ValueExpression, SetValue, Int, BigInt } from "../../il";
// import { EnumIdType } from "../../il";
import {
    ColVal, ColValUpdate, convertExp, ExpAdd, ExpAnd, ExpCmp, ExpEQ,
    ExpField, ExpFunc, ExpNum, ExpSub, ExpVal, ExpVar, ExpNull,
    Insert, ExpAtVar,
    InsertOnDuplicate, Set, Update, SqlSysTable, ExpSelect, ExpFuncDb, ExpLT
} from "../sql";
import { DeleteStatement, TruncateStatement } from "../sql/deleteStatement";
import { LockType } from "../sql/select";
// import { LockType } from "../sql/select";
import { EntityTable } from "../sql/statementWithFrom";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export abstract class BWithStatement extends BStatement {
    protected istatement: WithStatement;
    abstract get entity(): Entity;
    protected buildWheresBase(): ExpCmp[] {
        let { where } = this.istatement;
        //let {hasUnit, unitFieldName} = this.context;
        let wheres: ExpCmp[] = [
        ];
        //if (hasUnit === true) {
        //	wheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        //}
        if (where) {
            wheres.push(convertExp(this.context, where) as ExpCmp);
        }
        return wheres;
    }
    protected buildWheres(alias?: string): ExpCmp[] {
        let ret = this.buildWheresBase();
        return ret;
    }

    protected get alias(): string {
        let { alias } = this.istatement;
        return alias;
    }

    protected createDel(): DeleteStatement {
        let { name } = this.entity;
        let { factory } = this.context;
        let hasUnit = false;
        let del = factory.createDelete();
        let alias = this.alias ?? 'a';
        del.tables = [alias]
        del.from(new EntityTable(name, hasUnit, alias));
        del.where(new ExpAnd(...this.buildWheres(alias)));
        return del;
    }
    protected createTruncate(): TruncateStatement {
        let { name } = this.entity;
        let { factory } = this.context;
        let hasUnit = false;
        let truncate = factory.createTruncate();
        truncate.table = new EntityTable(name, hasUnit)
        return truncate;
    }
    protected buildInsertIdCol(): ColValUpdate {
        return undefined;
    }
    protected buildInsertCols(): ColValUpdate[] {
        let { with: _with, act } = this.istatement;
        let ret: ColValUpdate[] = [];
        //let {hasUnit, unitFieldName} = this.context;
        let hasUnit = false;
        let idCol = this.buildInsertIdCol();
        if (idCol) ret.push(idCol);
        let { sets, setsOnNew } = act as WithActSet;
        this.buildSets(sets, ret);
        if (setsOnNew !== undefined) {
            this.buildSets(setsOnNew, ret);
        }
        return ret;
    }
    private buildSets(sets: { [name: string]: SetValue }, ret: ColValUpdate[]) {
        for (let i in sets) {
            let s = sets[i];
            let { name, equ, value } = s;
            let expValue = convertExp(this.context, value) as ExpVal;
            let val: ExpVal;
            let expField = new ExpField(name/*, alias*/);
            switch (equ) {
                case '=':
                    val = expValue;
                    break;
                case '+':
                    val = new ExpAdd(expField, expValue);
                    break;
                case '-':
                    val = new ExpSub(expField, expValue);
                    break;
            }
            ret.push({ col: name, val, update: new ExpFunc('VALUES', expField) });
        }
    }

    protected createInsertOnDuplicate(): InsertOnDuplicate {
        let { name } = this.entity;
        //let {alias} = this.istatement;
        let { factory } = this.context;
        let hasUnit = false;
        let insert = factory.createInsertOnDuplicate();
        insert.table = new EntityTable(name, hasUnit); //, alias);
        insert.cols = this.buildInsertCols();
        return insert;
    }
    protected createInsertIgnore(): Insert {
        let { name } = this.entity;
        //let {alias} = this.istatement;
        let { factory } = this.context;
        let hasUnit = false;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new EntityTable(name, hasUnit);
        insert.cols = this.buildInsertCols();
        return insert;
    }
    protected buildUpdateCols(): ColVal[] {
        let { factory } = this.context;
        let { act, alias } = this.istatement;
        let ret: ColVal[] = [];
        let { sets } = act as WithActSet;
        for (let i in sets) {
            let s = sets[i];
            let { name, equ, value } = s;
            let expValue = convertExp(this.context, value) as ExpVal;
            let val: ExpVal;
            let expField = new ExpFunc(factory.func_ifnull, new ExpField(name, alias), ExpNum.num0);
            switch (equ) {
                case '=':
                    val = expValue;
                    break;
                case '+':
                    val = new ExpAdd(expField, expValue);
                    break;
                case '-':
                    val = new ExpSub(expField, expValue);
                    break;
            }
            ret.push({ col: name, val });
        }
        return ret;
    }
    protected createUpdate(): Update {
        let { name } = this.entity;
        let { alias } = this.istatement;
        let { factory } = this.context;
        let hasUnit = false;
        let update = factory.createUpdate();
        update.table = new EntityTable(name, hasUnit, alias);
        update.where = new ExpAnd(...this.buildWheres());
        update.cols = this.buildUpdateCols();
        if (update.cols.length === 0) return;
        return update;
    }
    protected buildUpsert(sqls: Sqls) {
        let update = this.createUpdate();
        let insert = this.createInsertIgnore();
        if (update) {
            sqls.push(update);
            let { factory } = this.context;
            let iff = factory.createIf();
            sqls.push(iff);
            iff.cmp = new ExpEQ(new ExpFunc(factory.func_rowCount), ExpNum.num0);
            iff.then(insert);
        }
        else {
            sqls.push(insert);
        }
    }
}

export abstract class BWithIDOnId extends BWithStatement {
    get entity(): ID { return (this.istatement.with as WithID).ID; }
    protected buildWheres(alias?: string): ExpCmp[] {
        let ret = super.buildWheresBase();
        let { idVal } = this.istatement.with as WithID;
        alias = alias ?? this.alias;
        ret.push(new ExpEQ(
            new ExpField('id', alias),
            convertExp(this.context, idVal) as ExpVal
        ));
        return ret;
    }
}

export abstract class BWithIDOnKeys extends BWithStatement {
    get entity(): ID { return (this.istatement.with as WithID).ID; }
    protected buildWheres(alias?: string): ExpCmp[] {
        let ret = super.buildWheresBase();
        let { keys } = this.entity;
        let { keyVals } = this.istatement.with as WithID;
        alias = alias ?? this.alias;
        let len = keys.length;
        for (let i = 0; i < len; i++) {
            let key = keys[i];
            let keyVal = keyVals[i];
            ret.push(new ExpEQ(
                new ExpField(key.name, alias), convertExp(this.context, keyVal) as ExpVal
            ));
        }
        return ret;
    }
}

export abstract class BWithIDX extends BWithStatement {
    get entity(): IDX { return (this.istatement.with as WithIDX).IDX; }
    protected buildWheres(alias?: string): ExpCmp[] {
        let { idVal } = this.istatement.with as WithIDX;
        alias = alias ?? this.alias;
        let ret = this.buildWheresBase();
        if (idVal) {
            ret.push(new ExpEQ(
                new ExpField('id', alias),
                convertExp(this.context, idVal) as ExpVal
            ));
        }
        return ret;
    }
    protected buildInsertIdCol(): ColValUpdate {
        return { col: 'id', val: convertExp(this.context, (this.istatement.with as WithIDX).idVal) as ExpVal }
    }
}

abstract class BWithIX extends BWithStatement {
    get entity(): IX { return (this.istatement.with as WithIX).IX; }
    protected buildWheres(alias?: string): ExpCmp[] {
        let { i, x } = this.entity;
        let { ixxVal, iVal, xVal } = this.istatement.with as WithIX;
        // delete 语句的时候，需要这个
        alias = alias ?? this.alias;
        let ret = this.buildWheresBase();
        if (ixxVal) {
            ret.push(new ExpEQ(new ExpField('ixx', alias), convertExp(this.context, ixxVal) as ExpVal));
        }
        if (iVal) {
            ret.push(new ExpEQ(
                new ExpField(i.name, alias),
                convertExp(this.context, iVal) as ExpVal
            ));
        }
        if (xVal) {
            ret.push(new ExpEQ(
                new ExpField(x.name, alias),
                convertExp(this.context, xVal) as ExpVal
            ));
        }
        return ret;
    }
    protected buildInsertCols(): ColValUpdate[] {
        let { i, x } = this.entity;
        let ret = super.buildInsertCols();
        let { ixxVal, iVal, xVal } = this.istatement.with as WithIX;
        if (ixxVal) {
            ret.push({
                col: 'ixx', val: convertExp(this.context, ixxVal) as ExpVal
            });
        }
        if (iVal) {
            ret.push({
                col: i.name, val: convertExp(this.context, iVal) as ExpVal
            });
        }
        if (xVal) {
            ret.push({
                col: x.name, val: convertExp(this.context, xVal) as ExpVal
            });
        }
        return ret;
    }
}

export class BWithIDSetOnId extends BWithIDOnId {
    body(sqls: Sqls) {
        this.buildUpsert(sqls);
    }
    protected buildInsertIdCol(): ColValUpdate {
        let { idVal } = this.istatement.with as WithID;
        let expIdVal: ExpVal = convertExp(this.context, idVal) as ExpVal;
        return { col: 'id', val: expIdVal }
    }
}

export class BWithIDSetOnKeys extends BWithIDOnKeys {
    body(sqls: Sqls) {
        let { factory } = this.context;
        let { entity, keyVals, idToVar, prevToVar, stampVal, newType } = this.istatement.with as WithID;
        let { keys } = entity as ID;
        if (keyVals === undefined) keyVals = [];
        if (keyVals.length === keys.length) {
            let vId = `id_$${this.istatement.no}`;
            let setId = factory.createSet();
            sqls.push(setId);
            setId.isAtVar = true;
            let { unitFieldName, userParam } = this.context;
            let expKeys: ExpVal[];
            if (keyVals && keyVals.length > 0) {
                expKeys = keyVals.map(v => convertExp(this.context, v) as ExpVal);
            }
            else {
                expKeys = [];
            }
            let ID: ID = entity as ID;
            if (ID.isMinute === true) {
                let expStamp: ExpVal;
                if (stampVal === undefined) {
                    expStamp = new ExpNull();
                }
                else {
                    expStamp = this.context.convertExp(stampVal) as ExpVal;
                }
                expKeys.unshift(expStamp); // $stamp
            }

            let expIdVal = new ExpFuncDb(
                this.context.dbName,
                this.context.twProfix + `${entity.name}$id`,
                new ExpVar(unitFieldName),
                new ExpVar(userParam.name),
                new ExpNum(newType),
                ...expKeys,
            );
            setId.equ(vId, expIdVal);
            if (idToVar !== undefined) {
                let setVar = factory.createSet();
                sqls.push(setVar);
                let varIdToVar = idToVar.pointer.varName(idToVar.name);
                setVar.equ(varIdToVar, new ExpAtVar(vId));

                if (prevToVar !== undefined) {
                    let varPrevTo = prevToVar.pointer.varName(prevToVar.name)
                    let select = factory.createSelect();
                    sqls.push(select);
                    select.from(new EntityTable(entity.name, false));
                    select.toVar = true;
                    select.col('id', varPrevTo);
                    select.where(new ExpLT(new ExpField('id'), new ExpAtVar(vId)));
                    select.order(new ExpField('version'), 'desc');
                    select.limit(ExpNum.num1);
                    select.lock = LockType.update;
                }
            }
        }
        let update = this.createUpdate();
        if (update) {
            sqls.push(update);
        }
    }

    protected buildWheres(alias?: string): ExpCmp[] {
        let ret = super.buildWheresBase();
        alias = alias ?? this.alias;
        ret.push(new ExpEQ(
            new ExpField('id', alias),
            new ExpAtVar(`id_$${this.istatement.no}`),
        ));
        return ret;
    }
}

export class BWithIDXSet extends BWithIDX {
    body(sqls: Sqls) {
        this.buildUpsert(sqls);
    }
}

export class BWithIXSet extends BWithIX {
    body(sqls: Sqls) {
        let { factory } = this.context;
        let { no } = this.istatement;
        let { IX, ixxVal, iVal, xVal } = this.istatement.with as WithIX;
        let { prev, i, x } = IX;
        let everyX: boolean = true;
        if (IX.ixx && !ixxVal) everyX = false;
        if (IX.i && !iVal) everyX = false;
        if (IX.x && !xVal) everyX = false;

        let { name } = this.entity;
        let { alias } = this.istatement;
        let hasUnit = false;
        if (everyX === false) {
            let cols = this.buildUpdateCols();
            let update = factory.createUpdate();
            update.table = new EntityTable(name, hasUnit, alias);
            update.where = new ExpAnd(...this.buildWheres());
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
                declare.var(vSeq, new Int());
                let setSeq = factory.createSet();
                sqls.push(setSeq);
                let selectMaxSeq = factory.createSelect();
                selectMaxSeq.column(new ExpFunc(factory.func_max, new ExpField('seq')));
                selectMaxSeq.from(new EntityTable(name, hasUnit, alias));
                selectMaxSeq.where(new ExpEQ(new ExpField(i.name), this.context.convertExp(iVal) as ExpVal));
                setSeq.equ(vSeq, new ExpAdd(
                    new ExpFunc(factory.func_ifnull, new ExpSelect(selectMaxSeq), ExpNum.num0),
                    ExpNum.num1
                ));
            }
            this.buildUpsert(sqls);
        }
    }

    protected buildInsertCols(): ColValUpdate[] {
        let ret = super.buildInsertCols();
        let { no } = this.istatement;
        let { IX } = this.istatement.with as WithIX;
        let { prev } = IX;
        if (prev) {
            let vSeq = 'prev_' + no;
            ret.push({
                col: 'prev', val: new ExpVar(vSeq)
            });
        }
        return ret;
    }
}

export class BWithIDDelOnId extends BWithIDOnId {
    body(sqls: Sqls) {
        sqls.push(this.createDel());
    }
}

export class BWithIDDelOnKeys extends BWithIDOnKeys {
    body(sqls: Sqls) {
        sqls.push(this.createDel());
    }
}

export class BWithIDXDel extends BWithIDX {
    body(sqls: Sqls) {
        sqls.push(this.createDel());
    }
}

export class BWithIXDel extends BWithIX {
    body(sqls: Sqls) {
        sqls.push(this.createDel());
    }
}

export class BWithTruncate extends BWithStatement {
    get entity() { return this.istatement.with.entity }
    body(sqls: Sqls) {
        sqls.push(this.createTruncate());
    }
}