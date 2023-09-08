import {
    ID, Index, BigInt, tinyIntField, bigIntField
    , intField, charField, textField, Text, EnumRole, SmallInt
} from "../../il";
import { EnumIdType } from "../../il";
import { minteIdOf2020_01_01 } from "../consts";
import { EnumSysTable, sysTable } from "../dbContext";
import {
    ExpDatePart, ExpAnd, ExpEQ, ExpField, ExpFunc, ExpGE, ExpGT, ExpIsNull, ExpNum
    , ExpSelect, ExpStr, ExpVal, ExpVar, Procedure, Statement, ExpFuncCustom
    , ExpBitLeft, ExpSub, ExpDiv, ExpAdd, ExpLT, ExpNeg, Statements, ExpFuncInUq, ExpCmp, ExpIsNotNull, ExpKey, ExpLE, ExpBitRight, ExpNE
} from "../sql";
import { LockType } from "../sql/select";
import { unitFieldName } from "../sql/sqlBuilder";
import { EntityTable } from "../sql/statementWithFrom";
import { BEntity } from "./entity";

export class BID extends BEntity<ID> {
    protected entity: ID;

    buildTables() {
        if (this.entity.onlyForSyntax === true) return;
        this.buildMainTable();
    }

    buildProcedures() {
        if (this.entity.onlyForSyntax === true) return;
        let { id, name, version, joins } = this.entity;
        if (!id) return;
        let returnTypeId = new BigInt();
        let funcId = this.context.createAppFunc(`${name}$id`, returnTypeId);
        this.buildIdFunc(funcId);
        if (version !== undefined) {
            this.buildIdPrevFunc(this.context.createAppFunc(`${name}$prev`, returnTypeId));
        }
        let returnTypeValue = new Text();
        let funcValue = this.context.createAppFunc(`${name}$value`, returnTypeValue);
        this.buildValueFunc(funcValue);
        let procSetProp = this.context.createAppProc(`${name}$prop`);
        this.buildSetProp(procSetProp);
        if (joins !== undefined) {
            this.buildJoinsProc(this.context.createAppProc(`${name}$joins`));
        }
    }

    private buildMainTable() {
        let { id, name, stampCreate, stampUpdate, keys, version
            , indexes, fieldsValuesList, idIsKey
            , isConst, isMinute } = this.entity;
        if (!id) return;
        let table = this.context.createTable(name);
        table.hasUnit = false; // global === false && hasUnit === true;
        if (id.autoInc === true) table.autoIncId = id;
        table.id = id;
        table.isMinuteId = isMinute;
        table.idKeys = [...keys];
        table.keys = this.entity.getKeys();
        table.fields = [...this.entity.getFields()];
        if (version !== undefined) {
            table.idKeys.push(version);
            table.fields.push(version);
        }
        if (isConst === true) {
            let validField = tinyIntField('$valid');
            validField.defaultValue = 2;
            table.fields.push(validField);
        }
        this.buildSysFields(table, stampCreate, stampUpdate);
        if (indexes) {
            table.indexes.push(...indexes);
        }
        if (keys.length > 0) {
            let index = new Index('key');
            index.unique = true;
            index.fields = [...keys];
            if (version !== undefined) index.fields.push(version);
            if (idIsKey === true) {
                index.fields.push(id);
            }
            table.indexes.push(index);
        }
        table.fieldsValuesList = this.convertTableFieldsValuesList(fieldsValuesList);
        this.context.appObjs.tables.push(table);
    }

    private buildIdFunc(p: Procedure) {
        let { name, keys, idType, isConst, isMinute, version, idIsKey } = this.entity;
        let { unitField, userParam, factory, hasUnit } = this.context;
        hasUnit = false;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
            tinyIntField('$new'),
        );
        const idVersion = '$id$version';
        const varIdVersion = new ExpVar(idVersion);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('$id', new BigInt());

        if (idIsKey === true) {
            let iffStampNull = factory.createIf();
            statements.push(iffStampNull);
            iffStampNull.cmp = new ExpIsNull(new ExpVar('$stamp'));
            let setStamp = factory.createSet();
            iffStampNull.then(setStamp);
            setStamp.equ('$stamp', new ExpFuncCustom(factory.func_unix_timestamp));
        }

        if (keys.length > 0) {
            let keyCompares = keys.map(v => {
                let fName = v.name;
                return new ExpEQ(new ExpField(fName), new ExpVar(fName))
            });
            let select = factory.createSelect();
            statements.push(select);
            select.toVar = true;
            select.col('id', '$id');
            select.from(new EntityTable(name, hasUnit));
            select.lock = LockType.update;
            if (version !== undefined) {
                declare.var('$id$version', new SmallInt());
                select.col('version', idVersion);
                select.order(new ExpField('version'), 'desc');
                select.limit(ExpNum.num1);
            }
            if (idIsKey === true) {
                select.order(new ExpField('id'), 'desc');
                select.limit(ExpNum.num1);
                keyCompares.push(new ExpLE(
                    new ExpField('id'),
                    new ExpBitLeft(new ExpDiv(new ExpVar('$stamp'), new ExpNum(60)), new ExpNum(20))
                ));
            }
            select.where(new ExpAnd(...keyCompares));
        }

        // 如果是仅仅取id值
        let ifGet = factory.createIf();
        statements.push(ifGet);
        ifGet.cmp = new ExpEQ(new ExpVar('$new'), ExpNum.num0);
        let retId = factory.createReturn();
        retId.returnVar = '$id';
        ifGet.then(retId);

        let iff = factory.createIf();
        statements.push(iff);
        let ifCmps: ExpCmp[] = [
            new ExpIsNotNull(new ExpVar('$id')),
        ];
        if (version !== undefined) {
            ifCmps.push(new ExpEQ(new ExpVar('$new'), ExpNum.num2));
        }
        if (idIsKey === true) {
            ifCmps.push(new ExpNE(new ExpVar('$new'), ExpNum.num3));
        }
        iff.cmp = new ExpAnd(...ifCmps);
        iff.then(retId);

        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(name)));
        selectEntity.lock = LockType.update;
        if (idType === EnumIdType.MinuteId) {
            parameters.push(intField('$stamp'));
            statements.push(...this.build$MinuteId());
        }
        else if (isConst === false || idType === EnumIdType.ULocal /*UConst*/) {
            let setId = factory.createSet();
            statements.push(setId);
            let idFunc: string;
            let idFuncParams: ExpVal[] = [
                new ExpSelect(selectEntity)
            ];
            if (isMinute === true) {
                switch (idType) {
                    case EnumIdType.UUID:
                        idFunc = '$iduum';
                        parameters.push(charField('$uuid', 100));
                        idFuncParams.push(new ExpVar('$uuid'));
                        break;
                    case EnumIdType.ULocal:
                        idFunc = '$idmu';
                        break;
                    case EnumIdType.Minute:
                        idFuncParams.unshift(new ExpVar(unitFieldName));
                        idFunc = '$id_minute';
                        break;
                }
                parameters.push(intField('$stamp'));
                idFuncParams.push(new ExpVar('$stamp'));
            }
            else {
                switch (idType) {
                    case EnumIdType.UUID:
                        idFunc = '$iduu';
                        parameters.push(charField('$uuid', 100));
                        idFuncParams.push(new ExpVar('$uuid'));
                        break;
                    case EnumIdType.ULocal:
                        idFunc = '$idnu';
                        break;
                    default:
                    case EnumIdType.Local:
                        idFuncParams.unshift(new ExpVar(unitFieldName));
                        idFunc = '$id_local';
                        break;
                    case EnumIdType.Global:
                        idFuncParams.unshift(new ExpVar(unitFieldName));
                        idFunc = '$id';
                        break;
                    case EnumIdType.Minute:
                        idFuncParams.unshift(new ExpVar(unitFieldName));
                        idFunc = '$id_minute';
                        parameters.push(intField('$stamp'));
                        idFuncParams.push(new ExpVar('$stamp'));
                        break;
                }
            }
            setId.equ('$id',
                new ExpFunc(this.context.twProfix + idFunc, ...idFuncParams)
            );
        }
        parameters.push(...keys);

        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = new EntityTable(name, hasUnit);
        insert.cols = [{ col: 'id', val: new ExpVar('$id') }];
        let { cols } = insert;
        cols.push(...keys.map(k => ({ col: k.name, val: new ExpVar(k.name) })));
        if (version !== undefined) {
            cols.push({ col: 'version', val: new ExpAdd(new ExpFunc(factory.func_ifnull, varIdVersion, ExpNum.num0), ExpNum.num1) });
        }
        if (isConst === true && idType !== EnumIdType.ULocal) {
            let setConstId = factory.createSet();
            statements.push(setConstId);
            setConstId.equ('$id', new ExpFunc(factory.func_lastinsertid));
        }
        let insertOwner = this.buildInsertOwner();
        if (insertOwner) {
            statements.push(...insertOwner);
        }
        statements.push(retId);
    }

    private buildIdPrevFunc(p: Procedure) {
        let { name } = this.entity;
        let { factory, hasUnit } = this.context;
        hasUnit = false;
        let { parameters, statements } = p;
        parameters.push(
            bigIntField('$id'),
        );
        let selectPrev = factory.createSelect();
        selectPrev.col('id');
        selectPrev.from(new EntityTable(name, hasUnit));
        selectPrev.where(new ExpAnd(
            new ExpLT(new ExpField('id'), new ExpVar('$id')),
        ));
        selectPrev.lock = LockType.update;
        selectPrev.order(new ExpField('version'), 'desc');
        selectPrev.limit(ExpNum.num1);
        let returnPrev = factory.createReturn();
        statements.push(returnPrev);
        returnPrev.expVal = new ExpSelect(selectPrev);
    }

    private buildInsertOwner() {
        let { permit } = this.entity;
        if (permit === undefined) return;
        let { factory } = this.context;
        let iff = factory.createIf();
        iff.cmp = new ExpGT(new ExpVar('$user'), ExpNum.num0);
        let declare = factory.createDeclare();
        iff.then(declare);
        const vUserUnitId = 'userUnitId';
        declare.var(vUserUnitId, new BigInt());
        let set = factory.createSet();
        iff.then(set);
        set.equ(
            vUserUnitId,
            new ExpFuncInUq(
                '$UserSite$id',
                [ExpNum.num0, new ExpVar('$user'), ExpNum.num1, new ExpVar('$id'), new ExpVar('$user')],
                true
            )
        );
        let updateOwner = factory.createUpdate();
        iff.then(updateOwner);
        updateOwner.table = sysTable(EnumSysTable.userSite);
        updateOwner.cols = [
            { col: 'admin', val: new ExpNum(EnumRole.Owner + EnumRole.Admin) }
        ];
        updateOwner.where = new ExpEQ(new ExpField('id'), new ExpVar(vUserUnitId));
        return [iff];
    }

    private build$MinuteId(): Statement[] {
        let ret: Statement[] = [];
        let { factory } = this.context;
        let declare = factory.createDeclare();
        ret.push(declare);
        const idminute = '$idminute';
        const idminute0 = idminute + '0';
        declare.vars(bigIntField(idminute), bigIntField(idminute0));
        let iffStampNull = factory.createIf();
        ret.push(iffStampNull);
        iffStampNull.cmp = new ExpIsNull(new ExpVar('$stamp'));
        let setStamp = factory.createSet();
        iffStampNull.then(setStamp);
        setStamp.equ('$stamp', new ExpFuncCustom(factory.func_unix_timestamp));

        let setMinStamp = factory.createSet();
        ret.push(setMinStamp);
        setMinStamp.equ('$stamp', new ExpSub(
            new ExpDiv(new ExpVar('$stamp'), new ExpNum(60)),
            new ExpNum(minteIdOf2020_01_01)	// 2020-1-1 0:0:0 utc的分钟数
        ));

        let setIdMinute0 = factory.createSet();
        ret.push(setIdMinute0);
        setIdMinute0.equ(idminute0, new ExpFunc(factory.func_if,
            new ExpLT(new ExpVar('$stamp'), ExpNum.num0),
            new ExpNeg(new ExpBitLeft(new ExpNeg(new ExpVar('$stamp')), new ExpNum(20))),
            new ExpBitLeft(new ExpVar('$stamp'), new ExpNum(20)),
        ));
        const idName = this.entity.id.name;
        const idField = new ExpField(idName);
        const idHasUnit = false; // this.context.hasUnit && !this.entity.global;
        let selectMaxId = factory.createSelect();
        ret.push(selectMaxId);
        selectMaxId.column(
            new ExpAdd(
                new ExpFunc(factory.func_max, idField),
                ExpNum.num1
            ),
            idminute
        );
        selectMaxId.toVar = true;
        selectMaxId.lock = LockType.update;
        selectMaxId.from(new EntityTable(this.entity.name, idHasUnit));
        let wheres = [
            new ExpGE(idField, new ExpVar(idminute0)),
            new ExpLT(idField,
                new ExpAdd(
                    new ExpVar(idminute0),
                    new ExpFuncCustom(factory.func_cast, new ExpBitLeft(ExpNum.num1, new ExpNum(20)), new ExpDatePart('signed'))
                )
            ),
        ];
        selectMaxId.where(new ExpAnd(...wheres));
        let set$Id = factory.createSet();
        ret.push(set$Id);
        set$Id.equ('$id', new ExpFunc(factory.func_ifnull, new ExpVar(idminute), new ExpVar(idminute0)));
        return ret;
    }

    private buildSetProp(p: Procedure) {
        let { name, fields, id } = this.entity;
        let { factory, hasUnit, unitField, userParam } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
            bigIntField('id'),
            charField('name', 100),
            textField('value')
        );
        let iff = factory.createIf();
        statements.push(iff);
        let first = true;
        for (let field of fields) {
            if (field === id/* || field === main*/) continue;
            let cmp = new ExpEQ(new ExpVar('name'), new ExpStr(field.name));
            let update = factory.createUpdate();
            update.table = new EntityTable(name, hasUnit);
            update.where = new ExpEQ(new ExpField('id'), new ExpVar('id'));
            update.cols = [
                { col: field.name, val: new ExpVar('value') }
            ];
            if (first === true) {
                iff.cmp = cmp;
                iff.then(update);
                first = false;
            }
            else {
                let elseStats = new Statements();
                elseStats.add(update);
                iff.elseIf(cmp, elseStats);
            }
        }
    }

    private buildValueFunc(p: Procedure) {
        let { factory, hasUnit } = this.context;
        hasUnit = false;
        let { name, fields, version } = this.entity;
        let { parameters, statements } = p;
        parameters.push(bigIntField('id'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('ret', new Text());

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        let exp = new ExpFunc(
            factory.func_concat_ws,
            new ExpFunc('char', new ExpNum(12)),
            ...fields.map(v => new ExpFunc(factory.func_ifnull, new ExpField(v.name), new ExpStr('')))
        );
        select.column(exp, 'ret');
        select.from(new EntityTable(name, hasUnit));
        select.where(new ExpEQ(new ExpField('id'), new ExpVar('id')));
        if (version !== undefined) {
            select.order(new ExpField(version.name), 'desc');
            select.limit(ExpNum.num1);
        }
        select.lock = LockType.update;

        let ret = factory.createReturn();
        ret.returnVar = 'ret';
        statements.push(ret);
    }

    private buildJoinsProc(p: Procedure) {
        let { name, fields, id, joins } = this.entity;
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            bigIntField('id'),
        );

        const a = 'a';
        const sep = new ExpFunc('char', new ExpNum(12));
        let select = factory.createSelect();
        statements.push(select);
        let vals: ExpVal[] = fields.map(f => new ExpFunc(factory.func_ifnull, new ExpField(f.name, a), new ExpStr('')));
        select.column(
            new ExpFuncCustom(
                factory.func_cast,
                new ExpFunc(factory.func_concat_ws, sep, ...vals),
                new ExpKey('CHAR'),
            ),
            'value'
        );
        select.from(new EntityTable(name, hasUnit, a));
        select.where(new ExpEQ(new ExpField('id', a), new ExpVar('id')));

        for (let { ID, field } of joins) {
            let { name, id, fields } = ID;
            let selectJoin = factory.createSelect();
            statements.push(selectJoin);
            let vals: ExpVal[] = [new ExpField(id.name, a)];
            for (let f of fields) {
                if (f === id) continue;
                if (f === field) continue;
                vals.push(new ExpFunc(factory.func_ifnull, new ExpField(f.name, a), new ExpStr('')));
            }
            selectJoin.column(
                new ExpFuncCustom(
                    factory.func_cast,
                    new ExpFunc(factory.func_concat_ws, sep, ...vals),
                    new ExpKey('CHAR'),
                ),
                'value'
            );
            selectJoin.from(new EntityTable(name, hasUnit, a));
            selectJoin.where(new ExpEQ(new ExpField(field.name, a), new ExpVar('id')));
        }
    }
}
