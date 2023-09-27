import * as _ from 'lodash';
import { BEntityBusable } from './entity';
import {
    Procedure, Select, ExpEQ, ExpAnd, ExpField, Statement,
    ExpVar, ExpStr, ColVal, ExpNum, ExpAdd, ExpCmp, ExpFunc, ExpGT, ExpSub,
    SqlEntityTable, ExpIsNull, ExpIsNotNull, ExpLE, ExpGE, ExpNE,
    ExpLT, ExpOr, ExpNeg, SqlVarTable, ExpExists, Upsert, ExpParam, ExpVal, Commit, ExpNull, Statements, ExpFuncCustom
} from '../sql';
import { EntityTable, VarTable } from '../sql/statementWithFrom';
import { LockType } from '../sql/select';
import { DbContext, EnumSysTable, sysTable } from '..';
import { Entity, Field, SmallInt, Tuid, TuidArr, BigInt, Int, timeStampField, TinyInt, idField, charField, Text, defaultStampOnUpdate, Char, bigIntField, IdDataType, JoinType } from '../../il';
import { Sqls } from '../bstatement';
import { unitFieldName } from '../sql/sqlBuilder';

function selectCols(context: DbContext, sel: Select, fields: Field[], tbl?: string) {
    if (fields === undefined) return;
    for (let f of fields) {
        let { name, sName, dataType } = f;
        switch (dataType.type) {
            default:
                sel.col(name, sName, tbl);
                break;
            case 'bin':
                sel.column(new ExpFunc(context.factory.func_hex, new ExpField(name, tbl)), sName);
                break;
        }
    }
}

export class BTuid extends BEntityBusable<Tuid> {
    static create(context: DbContext, entity: Tuid): BTuid {
        switch (entity.name) {
            default: return new BTuid(context, entity);
            case '$user':
                // 如果要$user相关重新编译，修改这里
                //entity.source = 'version 2021-09-28';
                return new BTuidUser(context, entity);
            case '$sheet':
                // 如果要$sheet相关重新编译，修改这里
                //entity.source = 'version 2020-08-27';
                return new BTuidSheet(context, entity);
        }
    }

    protected entity: Tuid;
    protected hasUnit: boolean;
    protected eqUnit: ExpCmp;

    constructor(context: DbContext, entity: Tuid) {
        super(context, entity);
        this.hasUnit = this.entity.global === false && this.context.hasUnit;
        if (this.hasUnit === true) {
            this.eqUnit = new ExpEQ(new ExpField('$unit'), new ExpVar('$unit'));
        }
    }

    buildTables() {
        let { id, name, unique, stampCreate, stampUpdate } = this.entity;
        let table = this.context.createTable(name);
        if (id.autoInc === true) table.autoIncId = id;
        table.hasUnit = this.hasUnit;
        table.keys = _.clone(this.entity.getKeys());
        table.fields = _.clone(this.entity.getFields());
        if (stampCreate === true) {
            let fieldCreate = timeStampField('$create');
            table.fields.push(fieldCreate);
        }
        if (stampUpdate === true) {
            let fieldUpdate = timeStampField('$update');
            fieldUpdate.defaultValue = [defaultStampOnUpdate];
            table.fields.push(fieldUpdate);
        }
        let indexes = this.entity.indexes;
        if (indexes !== undefined) table.indexes.push(...indexes);
        if (unique !== undefined) table.indexes.push(unique);
        this.context.appObjs.tables.push(table);
        this.buildArrTables();
    }

    private buildArrTables() {
        let { name, arrs, from } = this.entity;
        if (arrs === undefined) return;
        for (let taProp of arrs) {
            let { ownerField, orderField, id, main, fields } = taProp;
            let table = this.context.createTable(name + '_' + taProp.name);
            table.hasUnit = false;
            if (id.autoInc === true) {
                table.autoIncId = id;
            }
            table.keys = [ownerField, id];
            table.fields = _.clone([ownerField, id, ...main, ...fields, orderField]);
            if (from !== undefined) {
                for (let f of table.fields) f.nullable = true;
            }
            this.context.appObjs.tables.push(table);
        }
    }

    buildProcedures() {
        let { from } = this.entity;
        this.save();
        this.saveArr();
        this.setArrPos();

        if (from === undefined) {
            this.saveProp();
            this.selectAll();
            this.selectMainFromId();
            this.selectAllFieldsFromId();
            this.selectMainFromIds();
            this.selectArrAll();
            this.selectArrAllFieldsFromId();
            this.selectArrMainFromIds();
            this.vid();
            this.vidArr();
            this.search();
        }
        else {
            this.checkPull();
        }
    }

    private saveProp() {
        let { id, name: tuidName, main, fields } = this.entity;
        //if (main === undefined || main.length === 0) return;
        let { } = this.entity;
        let { factory, appObjs } = this.context;
        let { procedures } = appObjs;

        let proc = this.context.createProcedure(tuidName + '$prop');
        procedures.push(proc);
        proc.addUnitUserParameter();
        let paramId = idField('id', (id.dataType as IdDataType).idSize);
        let paramValue = new Field();
        paramValue.name = 'value';
        paramValue.dataType = new Text();
        proc.parameters.push(
            paramId,
            charField('prop', 100),
            paramValue
        );
        let iff = factory.createIf();
        proc.statements.push(iff);
        let n = 0;
        let saveProp = (field: Field) => {
            let { name: fieldName, dataType } = field;
            let update = factory.createUpdate();
            update.cols = [
                { col: fieldName, val: new ExpVar(paramValue.name) }
            ];
            update.table = new EntityTable(tuidName, this.hasUnit);
            let wheres: ExpCmp[] = [];
            wheres.push(new ExpEQ(new ExpField(id.name), new ExpVar(paramId.name)));
            wheres.push(this.eqUnit);
            update.where = (new ExpAnd(...wheres));
            let ifCmp = new ExpEQ(new ExpVar('prop'), new ExpStr(fieldName));
            if (n > 0) {
                let stats = new Statements();
                stats.add(update);
                iff.elseIf(ifCmp, stats);
            }
            else {
                iff.cmp = ifCmp;
                iff.then(update);
            }
            ++n;
        }
        if (main) {
            for (let mainField of main) saveProp(mainField);
        }
        for (let f of fields) saveProp(f);
    }

    private createSelect(): Select {
        let { factory } = this.context;
        let { name, id, stampCreate, stampUpdate } = this.entity;
        let sel = factory.createSelect();
        let tbl0 = 't0';
        sel.col(id.name, id.name, tbl0);
        if (stampCreate === true) {
            sel.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('$create', 't0')), '$create');
        }
        if (stampUpdate === true) {
            sel.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('$update', 't0')), '$update');
        }
        sel.from(new EntityTable(name, this.hasUnit, tbl0));
        return sel;
    }

    private selCols(tuid: Tuid, sel: Select, cols: (tuid: Tuid) => Field[]) {
        let fields = cols(tuid);
        selectCols(this.context, sel, fields, 't0');
    }

    private selMain(tuid: Tuid, sel: Select) {
        this.selCols(tuid, sel, (tuid: Tuid) => tuid.main);
    }

    private selFields(tuid: Tuid, sel: Select) {
        this.selCols(tuid, sel, (tuid: Tuid) => tuid.fields);
    }

    private selectMainFromId() {
        let { name, id/*, base, main, fields, global*/ } = this.entity;
        let proc = this.context.createProcedure(name + '$main');
        proc.addUnitUserParameter();
        let paramId = new Field();
        paramId.name = '$id';
        paramId.dataType = new BigInt();
        proc.parameters.push(
            paramId
        );
        let sel = this.createSelect();
        proc.statements.push(sel);
        this.selMain(this.entity, sel);

        let wheres: ExpCmp[] = [];
        wheres.push(new ExpEQ(new ExpField(id.name, 't0'), new ExpVar(paramId.name)));
        sel.where(new ExpAnd(...wheres));
        this.context.appObjs.procedures.push(proc);
    }

    private selectAll() {
        let { name, id } = this.entity;
        let proc = this.context.createProcedure(name + '$all');
        proc.addUnitUserParameter();
        let idVar = new ExpVar(id.name);
        let sel = this.createSelect();
        proc.statements.push(sel);
        //this.selBase(this.entity, sel);
        this.selMain(this.entity, sel);

        let wheres: ExpCmp[] = [];
        sel.where(new ExpAnd(...wheres));
        wheres.push(new ExpEQ(new ExpField(id.name), idVar));
        sel.limit(new ExpNum(100));
        this.context.appObjs.procedures.push(proc);
    }

    private selectArrAll() {
        let { name, id, arrs } = this.entity;
        if (arrs === undefined) return;
        let factory = this.context.factory;
        for (let ar of arrs) {
            let { ownerField, main: arrMain, fields: arrFields, orderField } = ar;
            let proc = this.context.createProcedure(name + '_' + ar.name + '$all');
            proc.addUnitUserParameter();
            let idVar = new ExpVar(id.name);
            proc.parameters.push(
                ownerField,
            );
            let sel = factory.createSelect();
            proc.statements.push(sel);
            sel.col(id.name);
            sel.col(orderField.name);
            for (let field of arrMain) sel.col(field.name);
            for (let field of arrFields) sel.col(field.name);
            sel.from(new EntityTable(name + '_' + ar.name, false));
            sel.where(new ExpAnd(
                new ExpEQ(new ExpField(ownerField.name), new ExpVar(ownerField.name)),
            ));
            sel.order(new ExpField(orderField.name), 'asc');
            sel.limit(new ExpNum(100));
            this.context.appObjs.procedures.push(proc);
        }
    }

    private selectAllFieldsFromId() {
        let { name, id, arrs } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createProcedure(name);
        proc.addUnitUserParameter();
        let paramId = new Field();
        paramId.name = '$id';
        paramId.dataType = new BigInt();
        proc.parameters.push(
            paramId
        );
        let sel = this.createSelect();
        proc.statements.push(sel);
        this.selMain(this.entity, sel);
        this.selFields(this.entity, sel);
        let wheres: ExpCmp[] = [];
        wheres.push(new ExpEQ(new ExpField(id.name, 't0'), new ExpVar(paramId.name)));
        sel.where(new ExpAnd(...wheres));

        if (arrs !== undefined) {
            for (let taProp of arrs) {
                let { ownerField, orderField, id, main, fields } = taProp;
                let selArrProp = factory.createSelect();
                proc.statements.push(selArrProp);
                selArrProp.col(ownerField.name);
                selArrProp.col(id.name);
                for (let f of main) selArrProp.col(f.name);
                for (let f of fields) selArrProp.col(f.name);
                selArrProp.col(orderField.name);
                selArrProp.where(new ExpEQ(
                    new ExpField(ownerField.name),
                    new ExpVar(paramId.name)));
                selArrProp.from(new EntityTable(taProp.getTableName(), false));
            }
        }

        this.context.appObjs.procedures.push(proc);
    }

    private selectArrAllFieldsFromId() {
        let { name, id, arrs } = this.entity;
        if (arrs === undefined) return;
        let factory = this.context.factory;
        for (let ar of arrs) {
            let { ownerField, main: arrMain, fields: arrFields, orderField } = ar;
            let proc = this.context.createProcedure(name + '_' + ar.name + '$id');
            proc.addUnitUserParameter();
            let idVar = new ExpVar(id.name);
            proc.parameters.push(
                ownerField,
                id,
            );
            let sel = factory.createSelect();
            proc.statements.push(sel);
            sel.from(new EntityTable(name + '_' + ar.name, false));
            sel.col(id.name);
            sel.col(orderField.name);
            for (let field of arrMain) sel.col(field.name);
            for (let field of arrFields) sel.col(field.name);

            let wheres: ExpCmp[] = [];
            wheres.push(
                new ExpEQ(new ExpField(ownerField.name), new ExpVar(ownerField.name)),
                new ExpEQ(new ExpField(id.name), idVar),
            );
            sel.where(new ExpAnd(...wheres));
            sel.order(new ExpField(orderField.name), 'asc');
            this.context.appObjs.procedures.push(proc);
        }
    }

    private selectMainFromIds() {
        let { name, id, stampCreate, stampUpdate } = this.entity;
        let factory = this.context.factory;
        let ids = '$ids';
        let proc = this.context.createProcedure(name + '$ids');
        let stats = proc.statements;
        proc.addUnitUserParameter();
        let paramIds = new Field();
        paramIds.name = ids;
        paramIds.dataType = new Text();
        proc.parameters.push(
            paramIds
        );
        let c = '$c', p = '$p', len = '$len', int = new Int;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);
        let varTable = factory.createVarTable()
        stats.push(varTable);
        varTable.name = 'ids$tbl';
        let vtId = new Field();
        vtId.name = 'id'
        vtId.dataType = new BigInt();
        varTable.fields = [vtId];
        varTable.keys = [vtId];

        let set = factory.createSet();
        stats.push(set);
        set.equ(c, ExpVal.num1);
        set = factory.createSet();
        stats.push(set);
        set.equ(len, new ExpFunc(factory.func_length, new ExpVar(ids)));

        let loop = factory.createWhile();
        stats.push(loop);
        loop.no = 1;
        loop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new ExpFunc(factory.func_charindex, new ExpStr(','), new ExpVar(ids), new ExpVar(c)));
        let iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new ExpLE(new ExpVar(p), ExpVal.num0);
        set = factory.createSet();
        iff.then(set);
        set.equ(p, new ExpAdd(new ExpVar(len), ExpVal.num1));

        let insert = factory.createInsert();
        lstats.add(insert);
        insert.table = new SqlVarTable(varTable.name);
        insert.cols.push({
            col: vtId.name,
            val: new ExpFunc('SUBSTRING', new ExpVar(ids), new ExpVar(c), new ExpSub(
                new ExpVar(p), new ExpVar(c)
            ))
        });

        iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new ExpGE(new ExpVar(p), new ExpVar(len));
        let leave = factory.createBreak();
        iff.then(leave);
        leave.no = loop.no;
        set = factory.createSet();
        lstats.add(set);
        set.equ(c, new ExpAdd(new ExpVar(p), ExpVal.num1));

        let sel = this.createSelect();
        let t0 = 't0', tbIds = 'ids';
        stats.push(sel);
        sel.join(JoinType.inner, new VarTable(varTable.name, tbIds));
        sel.on(new ExpEQ(new ExpField(id.name, t0), new ExpField(vtId.name, tbIds)));

        this.selMain(this.entity, sel);

        let wheres: ExpCmp[] = [];
        if (wheres.length > 0) sel.where(new ExpAnd(...wheres));
        this.context.appObjs.procedures.push(proc);
    }

    private selectArrMainFromIds() {
        let { name, arrs, owner } = this.entity;
        if (arrs === undefined) return;
        let factory = this.context.factory;
        let ids = '$ids';
        let paramIds = new Field();
        paramIds.name = ids;
        paramIds.dataType = new Text();
        for (let tuidArr of arrs) {
            let { id, main, fields, ownerField } = tuidArr;
            let proc = this.context.createProcedure(name + '_' + tuidArr.name + '$ids');
            proc.addUnitUserParameter();
            let stats = proc.statements;
            proc.parameters.push(
                paramIds
            );
            let c = '$c', p = '$p', len = '$len', int = new Int;
            let declare = factory.createDeclare();
            stats.push(declare);
            declare.var(c, int);
            declare.var(p, int);
            declare.var(len, int);
            let varTable = factory.createVarTable()
            stats.push(varTable);
            varTable.name = 'ids$tbl';
            let vtId = new Field();
            vtId.name = 'id'
            vtId.dataType = new BigInt();
            varTable.fields = [vtId];
            varTable.keys = [vtId];

            let set = factory.createSet();
            stats.push(set);
            set.equ(c, ExpVal.num1);
            set = factory.createSet();
            stats.push(set);
            set.equ(len, new ExpFunc(factory.func_length, new ExpVar(ids)));

            let loop = factory.createWhile();
            stats.push(loop);
            loop.no = 1;
            loop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
            let lstats = loop.statements;
            set = factory.createSet();
            lstats.add(set);
            set.equ(p, new ExpFunc(factory.func_charindex, new ExpStr(','), new ExpVar(ids), new ExpVar(c)));
            let iff = factory.createIf();
            lstats.add(iff);
            iff.cmp = new ExpLE(new ExpVar(p), ExpVal.num0);
            set = factory.createSet();
            iff.then(set);
            set.equ(p, new ExpAdd(new ExpVar(len), ExpVal.num1));

            let insert = factory.createInsert();
            lstats.add(insert);
            insert.table = new SqlVarTable(varTable.name);
            insert.cols.push({
                col: vtId.name,
                val: new ExpFunc('SUBSTRING', new ExpVar(ids), new ExpVar(c), new ExpSub(
                    new ExpVar(p), new ExpVar(c)
                ))
            });

            iff = factory.createIf();
            lstats.add(iff);
            iff.cmp = new ExpGE(new ExpVar(p), new ExpVar(len));
            let leave = factory.createBreak();
            iff.then(leave);
            leave.no = loop.no;
            set = factory.createSet();
            lstats.add(set);
            set.equ(c, new ExpAdd(new ExpVar(p), ExpVal.num1));

            let sel = factory.createSelect();
            let t0 = 't0', tbIds = 'ids';
            stats.push(sel);
            sel.from(new EntityTable(name + '_' + tuidArr.name, false, t0));
            sel.join(JoinType.inner, new VarTable(varTable.name, tbIds));
            sel.on(new ExpEQ(new ExpField(id.name, t0), new ExpField(vtId.name, tbIds)));
            sel.col(ownerField.name, ownerField.name, t0);
            sel.col(id.name, undefined, t0);
            if (main.length > 0)
                for (let f of main) sel.col(f.name, undefined, t0);
            else
                for (let f of fields) sel.col(f.name, undefined, t0);
            this.context.appObjs.procedures.push(proc);
        }
    }

    private addCols(cols: ColVal[], fields: Field[], syncStats: Statement[]) {
        if (fields === undefined) return;
        for (let f of fields) {
            let val = new ExpVar(f.name);
            cols.push({ col: f.name, val: val });
            syncStats.push(this.buildSyncTuidField(f, val));
        }
    }

    private setArrPos() {
        let { name, arrs } = this.entity;
        if (arrs === undefined) return;
        let factory = this.context.factory;
        for (let taProp of arrs) {
            let { name: taName, ownerField, id, orderField, fields } = taProp;
            let tblName = name + '_' + taName;
            let proc = this.context.createProcedure(tblName + '$pos');
            proc.addUnitUserParameter();
            this.context.appObjs.procedures.push(proc);
            let vId = '$id';
            let varSId = new ExpVar(vId);
            let varId = new ExpVar(id.name);
            let expOrderField = new ExpField(orderField.name);
            let expOrderVar = new ExpVar(orderField.name);
            let stats = proc.statements;
            proc.parameters.push(
                ownerField,
                id,
                orderField,
            );
            let declare = factory.createDeclare();
            stats.push(declare);
            declare.var('orgOrder', new SmallInt());
            declare.var('maxOrder', new SmallInt());
            declare.var('order0', new SmallInt());
            declare.var('order1', new SmallInt());
            declare.var('delta', new SmallInt());

            stats.push(proc.createTransaction());

            let selectOrder = factory.createSelect();
            stats.push(selectOrder);
            selectOrder.lock = LockType.update;
            selectOrder.toVar = true;
            selectOrder.col(orderField.name, 'orgOrder', 'a');
            selectOrder.from(new EntityTable(tblName, false, 'a'));
            selectOrder
                .join(JoinType.join, new EntityTable(name, this.hasUnit, 'b'))
                .on(new ExpEQ(new ExpField(ownerField.name, 'a'), new ExpField(id.name, 'b')));
            selectOrder.where(new ExpEQ(new ExpField(id.name, 'a'), new ExpVar(id.name)));
            let iffExit = factory.createIf();
            stats.push(iffExit);
            iffExit.cmp = new ExpIsNull(new ExpVar('orgOrder'));
            let exit = proc.createLeaveProc();
            iffExit.then(exit);

            let selectMax = factory.createSelect();
            stats.push(selectMax);
            selectMax.lock = LockType.update;
            selectMax.toVar = true;
            selectMax.column(new ExpFunc(factory.func_max, expOrderField), 'maxOrder');
            selectMax.from(new EntityTable(tblName, false));
            selectMax.where(new ExpEQ(new ExpField(ownerField.name), new ExpVar(ownerField.name)));

            let iff = factory.createIf();
            stats.push(iff);
            iff.cmp = new ExpAnd(
                new ExpGE(expOrderVar, ExpVal.num1),
                new ExpLE(expOrderVar, new ExpVar('maxOrder')),
                new ExpNE(expOrderVar, new ExpVar('orgOrder'))
            );
            let setPos0 = factory.createUpdate();
            stats.push(setPos0);
            setPos0.table = new SqlEntityTable(tblName, undefined, false);
            setPos0.cols = [{
                col: orderField.name,
                val: ExpVal.num0
            }];
            setPos0.where = new ExpEQ(new ExpField(id.name), new ExpVar(id.name));

            let iffX = factory.createIf();
            iffX.cmp = new ExpLT(expOrderVar, new ExpVar('orgOrder'));
            iff.then(iffX);
            let setOrder0 = factory.createSet();
            iffX.then(setOrder0);
            setOrder0.equ('order0', expOrderVar);
            let setOrder1 = factory.createSet();
            iffX.then(setOrder1);
            setOrder1.equ('order1', new ExpVar('orgOrder'));
            let setDelta = factory.createSet();
            iffX.then(setDelta);
            setDelta.equ('delta', ExpVal.num1);

            let setOrder0X = factory.createSet();
            iffX.else(setOrder0X);
            setOrder0X.equ('order0', new ExpVar('orgOrder'));
            let setOrder1X = factory.createSet();
            iffX.else(setOrder1X);
            setOrder1X.equ('order1', expOrderVar);
            let setDeltaX = factory.createSet();
            iffX.else(setDeltaX);
            setDeltaX.equ('delta', new ExpNum(-1));

            let move = factory.createUpdate();
            stats.push(move);
            move.table = new SqlEntityTable(tblName, undefined, false);
            move.cols = [{
                col: orderField.name,
                val: new ExpAdd(expOrderVar, new ExpVar('delta'))
            }];
            move.where = new ExpAnd(
                new ExpGE(expOrderField, new ExpVar('order0')),
                new ExpLE(expOrderField, new ExpVar('order1')),
            );

            let setPosAt = factory.createUpdate();
            stats.push(setPosAt);
            setPosAt.table = new SqlEntityTable(tblName, undefined, false);
            setPosAt.cols = [{
                col: orderField.name,
                val: new ExpVar(orderField.name)
            }];
            setPosAt.where = new ExpEQ(new ExpField(id.name), new ExpVar(id.name));

            stats.push(proc.createCommit());
        }
    }

    private saveArr() {
        let { name, arrs, from, isOpen, global } = this.entity;
        if (arrs === undefined) return;
        let hasUnit = this.hasUnit && !global;
        let { unitField } = this.context;
        let factory = this.context.factory;
        for (let taProp of arrs) {
            let { name: taName, ownerField, id, orderField, main, fields } = taProp;
            let tblName = name + '_' + taName;
            let proc = this.context.createProcedure(tblName + '$save');
            let { parameters } = proc;
            proc.addUnitUserParameter();
            let syncStats: Statement[] = [];
            this.context.appObjs.procedures.push(proc);
            //let vId = '$id';
            let vOrder = orderField.name;
            //let varSId = new ExpVar(vId);
            let varId = new ExpVar(id.name);
            let stats = proc.statements;
            let declare = factory.createDeclare();
            stats.push(declare);
            parameters.push(
                ownerField,
                id,
            );
            let buildParam = (field: Field) => { this.context.buildParam(field, parameters, stats, declare) }
            main.forEach(buildParam);
            fields.forEach(buildParam);

            if (from !== undefined) parameters.push(orderField);

            if (from === undefined) declare.var(vOrder, new SmallInt());

            stats.push(proc.createTransaction());

            // 利用select owner for update 锁住arr的操作
            let selectLock = factory.createSelect();
            stats.push(selectLock);
            selectLock.toVar = true;
            selectLock.col('id', ownerField.name);
            selectLock.from(new EntityTable(name, hasUnit));
            selectLock.where(new ExpEQ(new ExpField('id'), new ExpVar(ownerField.name)));
            selectLock.lock = LockType.update;

            let iff = factory.createIf();
            stats.push(iff);
            iff.cmp = new ExpIsNull(varId);
            let selectVId = this.context.buildSelectVID(name, id.name, taName);
            iff.then(selectVId);

            let updateVId = factory.createUpdate();
            iff.then(updateVId);
            updateVId.cols = [{
                col: 'tuidVId',
                val: new ExpAdd(varId, ExpVal.num1)
            }]
            updateVId.table = sysTable(EnumSysTable.entity);
            updateVId.where = new ExpEQ(new ExpField('name'), new ExpStr(name + '.' + taName));

            let insert = factory.createInsert();
            iff.then(insert);
            insert.table = new SqlEntityTable(tblName, undefined, false);
            insert.cols = [
                { col: id.name, val: varId },
                { col: ownerField.name, val: new ExpVar(ownerField.name) },
            ];
            let buildColVal = (f: Field): ColVal => {
                let fn = f.name;
                let val = new ExpVar(fn);
                syncStats.push(this.buildSyncTuidField(f, val));
                return { col: fn, val: val }
            }
            main.forEach(buildColVal);
            fields.forEach(buildColVal);

            let orderMax = factory.createSelect();
            iff.then(orderMax);
            orderMax.lock = LockType.update;
            orderMax.toVar = true;
            orderMax.column(new ExpAdd(
                new ExpFunc(factory.func_max, new ExpField(orderField.name)),
                ExpVal.num1
            ), vOrder);
            orderMax.from(new EntityTable(tblName, false));
            orderMax.where(new ExpEQ(new ExpField(ownerField.name), new ExpVar(ownerField.name)));
            let iffOrderMax = factory.createIf();
            iff.then(iffOrderMax);
            iffOrderMax.cmp = new ExpIsNull(new ExpVar(vOrder));
            let setOrder = factory.createSet();
            iffOrderMax.then(setOrder);
            setOrder.equ(vOrder, ExpVal.num1);

            let updateOrder = factory.createUpdate();
            iff.then(updateOrder);
            updateOrder.table = new SqlEntityTable(tblName, undefined, false);
            updateOrder.cols = [{
                col: orderField.name,
                val: new ExpVar(vOrder)
            }];
            updateOrder.where = new ExpAnd(
                new ExpEQ(new ExpField(ownerField.name), new ExpVar(ownerField.name)),
                new ExpEQ(new ExpField(id.name), new ExpVar('id'))
            );

            let upsert = factory.createUpsert();
            stats.push(upsert);
            upsert.table = new SqlEntityTable(tblName, undefined, false);
            upsert.cols = main.map(f => {
                let fn = f.name;
                let val = new ExpVar(fn);
                syncStats.push(this.buildSyncTuidField(f, val));
                return { col: fn, val: val }
            });
            upsert.cols.push(...fields.map(f => {
                let fn = f.name;
                let val = new ExpVar(fn);
                syncStats.push(this.buildSyncTuidField(f, val));
                return { col: fn, val: val }
            }));

            // 如果有id，不需要修改$order
            if (from !== undefined) {
                upsert.cols.push({
                    col: vOrder,
                    val: new ExpVar(vOrder)
                });
            }
            upsert.keys.push(
                {
                    col: ownerField.name,
                    val: new ExpVar(ownerField.name)
                },
                {
                    col: id.name,
                    val: varId
                }
            );

            let retSel = factory.createSelect();
            retSel.column(varId, 'id')
                .column(varId, 'inId');
            stats.push(retSel);
            for (let s of syncStats) if (s !== undefined) stats.push(s);

            stats.push(proc.createCommit());
        }
    }

    private vid() {
        let { id, name, unique } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createProcedure(name + '$vid');
        proc.addUnitParameter();
        this.context.appObjs.procedures.push(proc);
        let uniqueParam = charField('unique', 100);
        proc.parameters.push(
            uniqueParam
        );
        let stats = proc.statements;
        let vInc = 'inc', vTuidType = 'tuidType';
        let dec = factory.createDeclare();
        stats.push(dec);
        dec.var(vInc, new BigInt());
        //dec.var(vIncSeed, new BigInt());
        dec.var(vTuidType, new Int());

        if (unique !== undefined && unique.fields.length === 1) {
            let selectIdFromUnique = factory.createSelect();
            stats.push(selectIdFromUnique);
            selectIdFromUnique.lock = LockType.update;
            selectIdFromUnique.toVar = true;
            selectIdFromUnique.column(new ExpField(id.name), vInc);
            selectIdFromUnique.from(new EntityTable(name, this.hasUnit));
            selectIdFromUnique.where(
                new ExpEQ(new ExpField(unique.fields[0].name), new ExpParam(uniqueParam.name))
            );
            let ifUnique = factory.createIf();
            stats.push(ifUnique);
            ifUnique.cmp = new ExpIsNotNull(new ExpVar(vInc));
            let returnId = factory.createSelect();
            ifUnique.then(returnId);
            returnId.column(new ExpVar(vInc), 'id');
            let leave = proc.createLeaveProc();
            ifUnique.then(leave);
        }

        stats.push(proc.createTransaction());
        let selectEntity = factory.createSelect();
        stats.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(new ExpField('id'), vTuidType);
        selectEntity.column(new ExpField('tuidVId'), vInc);
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(name)));
        selectEntity.lock = LockType.update;

        let set = factory.createSet();
        stats.push(set);
        set.equ(vInc,
            new ExpAdd(
                new ExpFunc(factory.func_ifnull, new ExpVar(vInc), ExpVal.num1),
                ExpVal.num1
            )
        );
        let update = factory.createUpdate();
        stats.push(update);
        update.table = sysTable(EnumSysTable.entity);
        update.cols.push({
            col: 'tuidVId',
            val: new ExpVar(vInc),
        });
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(vTuidType));

        let select = factory.createSelect();
        stats.push(select);
        select.column(new ExpSub(new ExpVar(vInc), ExpVal.num1), 'id');

        stats.push(proc.createCommit());

        // 极端情况下，会出错。
        // 获取$vid之后，已经commit，还没有写table seed。如果有人创建新id，会冲掉$vid
        // 但是这种情况及其罕见。除非在commit之后的瞬间断电。
        /*
        let setSeed = factory.createSetTableSeed();
        stats.push(setSeed)
        setSeed.seed = new ExpVar(vInc);
        setSeed.table = new ExpStr(name);
        */
    }

    private vidArr() {
        let { name, arrs } = this.entity;
        if (arrs === undefined) return;
        let factory = this.context.factory;
        for (let arr of arrs) {
            let { name: arrName } = arr;
            let tblName = `${name}_${arrName}`;
            let proc = this.context.createProcedure(`${tblName}$vid`);
            proc.addUnitParameter();
            this.context.appObjs.procedures.push(proc);
            let uniqueParam = bigIntField('unique');
            proc.parameters.push(
                uniqueParam
            );
            let stats = proc.statements;
            let vInc = 'inc', vTuidType = 'tuidType';
            let dec = factory.createDeclare();
            stats.push(dec);
            dec.var(vInc, new BigInt());
            dec.var(vTuidType, new Int());
            stats.push(proc.createTransaction());

            let selectEntity = factory.createSelect();
            stats.push(selectEntity);
            selectEntity.lock = LockType.update;
            selectEntity.toVar = true;
            selectEntity.column(new ExpField('id'), vTuidType);
            selectEntity.column(new ExpField('tuidVId'), vInc);
            selectEntity.from(sysTable(EnumSysTable.entity));
            selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(name + '_' + arrName)));

            let set = factory.createSet();
            stats.push(set);
            set.equ(vInc,
                new ExpAdd(
                    new ExpFunc(factory.func_ifnull, new ExpVar(vInc), ExpVal.num1),
                    ExpVal.num1
                )
            );
            let update = factory.createUpdate();
            stats.push(update);
            update.table = sysTable(EnumSysTable.entity);
            update.cols.push({
                col: 'tuidVId',
                val: new ExpVar(vInc),
            });
            update.where = new ExpEQ(new ExpField('id'), new ExpVar(vTuidType));
            let select = factory.createSelect();
            stats.push(select);
            select.column(new ExpSub(new ExpVar(vInc), ExpVal.num1), 'id');

            stats.push(proc.createCommit());

            // 极端情况下，会出错。
            // 获取$vid之后，已经commit，还没有写table seed。如果有人创建新id，会冲掉$vid
            // 但是这种情况及其罕见。除非在commit之后的瞬间断电。
            /*
            let setSeed = factory.createSetTableSeed();
            stats.push(setSeed)
            setSeed.seed = new ExpVar(vInc);
            setSeed.table = new ExpStr(tblName);
            */
        }
    }

    protected save() {
        let { name, id, global, from } = this.entity;
        let { factory, unitFieldName } = this.context;
        let proc = this.context.createProcedure(name + '$save');
        proc.addUnitUserParameter();
        this.context.appObjs.procedures.push(proc);
        let stats = proc.statements;
        let declare = factory.createDeclare();
        stats.push(declare);

        declare.var('$idParam', new BigInt);
        declare.var('$id_u', new BigInt);
        let setIdParam = factory.createSet();
        stats.push(setIdParam);
        setIdParam.equ('$idParam', new ExpVar(id.name));

        if (from === undefined) {
            declare.var('$isVId', new TinyInt());
            let tuidHasUnit = this.hasUnit === true && global === false;
            let selectId = factory.createSelect();
            selectId.col(id.name);
            selectId.from(new EntityTable(name, tuidHasUnit));
            let eqId = new ExpEQ(new ExpField(id.name), new ExpVar(id.name));
            selectId.where(eqId);
            let iff = factory.createIf();
            stats.push(iff);
            iff.cmp = new ExpExists(selectId);
            let setIsNotVId = factory.createSet();
            setIsNotVId.equ('$isVId', ExpVal.num0);
            let setIsVId = factory.createSet();
            setIsVId.equ('$isVId', ExpVal.num1);
            iff.then(setIsNotVId);
            iff.else(setIsVId);
        }

        stats.push(proc.createTransaction());
        this.buildSaveProc(proc, this.entity);
        let retSel = factory.createSelect();
        let vId = '$id';
        let varSId = new ExpVar(vId);
        let varId = new ExpVar(id.name);
        retSel.column(varSId, 'id')
            .column(new ExpVar('$idParam'), 'inId');
        stats.push(retSel);

        stats.push(proc.createCommit());
    }

    private buildSaveProc(proc: Procedure, tuid: Tuid) {
        let { name, id, main, fields, from, onSaveStatement } = tuid;
        let { factory } = this.context;
        let stats = proc.statements;
        let declare = factory.createDeclare();
        stats.push(declare);
        let parameters = proc.parameters;
        parameters.push(
            id,
        );

        let buildParam = (field: Field) => { this.context.buildParam(field, parameters, stats, declare) }
        main.forEach(buildParam);
        fields.forEach(buildParam);

        let setParam = (field: Field) => {
            let { dataType } = field;
            if (dataType.isId === true) {
                let idDataType = dataType as IdDataType;
                if (idDataType.idType === '$user') {
                    let iif = factory.createIf();
                    stats.push(iif);
                    iif.cmp = new ExpIsNull(new ExpVar(field.name));
                    let set = factory.createSet();
                    iif.then(set);
                    set.equ(field.name, new ExpVar('$user'));
                }
                return;
            }
            if (dataType.type === 'timestamp') {
                let iif = factory.createIf();
                stats.push(iif);
                iif.cmp = new ExpIsNull(new ExpVar(field.name));
                let set = factory.createSet();
                iif.then(set);
                set.equ(field.name, new ExpFuncCustom(factory.func_current_timestamp));
                return;
            }
        }
        main.forEach(setParam);
        fields.forEach(setParam);

        let vId = '$id';
        declare.var(vId, new BigInt);
        this.declareBusVar(declare, this.entity.buses, stats);

        let syncStats: Statement[] = [];
        this.buildTuidUpsert(stats, tuid, syncStats, proc.createCommit());
        if (onSaveStatement !== undefined) {
            let sqls = new Sqls(this.context, stats);
            const { statements } = onSaveStatement;
            sqls.head(statements);
            sqls.body(statements);
            sqls.foot(statements);
        }
        this.buildBusWriteQueueStatement(stats, this.entity.buses);
        stats.push(...syncStats);
    }

    protected buildTuidUpsert(stats: Statement[], tuid: Tuid, syncStats: Statement[], commit: Commit) {
        let { id, from, main, fields, name, isOpen, global, unique } = tuid;
        let varId = new ExpVar(id.name);
        let dollarId = '$id';
        let varDollarId = new ExpVar(dollarId);
        if (id.autoInc === false) {
            // 暂时没有select id back
            let upsert = this.buildNoAutoIdTuidUpsert(tuid, syncStats);
            stats.push(upsert);
            let set = this.context.factory.createSet();
            stats.push(set);
            set.equ(dollarId, varId);
            return;
        }
        let { factory } = this.context;
        let tuidHasUnit = this.hasUnit === true && global === false;
        function fieldColVal(f: Field) {
            let fn = f.name;
            return { col: fn, val: new ExpVar(fn) }
        }
        let cols: ColVal[] = [
            ...main.map(fieldColVal),
            ...fields.map(fieldColVal)
        ];
        let colUnit = { col: unitFieldName, val: new ExpVar(unitFieldName) };

        let updateWhereUnique: ExpCmp[] = [];

        let idu = '$id_u';
        let varIdU = new ExpVar(idu);
        if (unique !== undefined) {
            let selectId = factory.createSelect();
            stats.push(selectId);
            selectId.toVar = true;
            selectId.col(id.name, idu);
            selectId.from(new EntityTable(name, tuidHasUnit));
            selectId.lock = LockType.update;
            let wheres: ExpCmp[] = [];
            for (let f of unique.fields) {
                let { name } = f;
                wheres.push(new ExpEQ(new ExpField(name), new ExpVar(name)));
            }
            selectId.where(new ExpAnd(...wheres));

            let iffUNotNUll = factory.createIf();
            stats.push(iffUNotNUll);
            iffUNotNUll.cmp = new ExpIsNotNull(varIdU);
            let iffRet = factory.createIf();
            iffUNotNUll.then(iffRet);
            iffRet.cmp = new ExpOr(
                new ExpLE(varId, ExpNum.num0),
                new ExpAnd(
                    new ExpGT(varId, ExpNum.num0),
                    new ExpNE(varId, varIdU)
                )
            );
            let selectRet = factory.createSelect();
            iffRet.then(selectRet);
            selectRet.column(new ExpNum(0), 'id');
            iffRet.then(commit);
            let leave = factory.createLeaveProc();
            iffRet.then(leave);

            let iffIdNeg = factory.createIf();
            stats.push(iffIdNeg);
            iffIdNeg.cmp = new ExpLE(varId, ExpNum.num0);
            let setIdNull = factory.createSet();
            iffIdNeg.then(setIdNull);
            setIdNull.equ(id.name, ExpVal.null);
        }

        let selectVId = this.context.buildSelectVID(name, dollarId); // factory.createSelect();
        stats.push(selectVId);

        let updateVId = factory.createUpdate();
        updateVId.cols = [{
            col: 'tuidVId',
            val: new ExpAdd(varDollarId, ExpVal.num1)
        }]
        updateVId.table = sysTable(EnumSysTable.entity);
        updateVId.where = new ExpEQ(new ExpField('name'), new ExpStr(name));

        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new ExpIsNull(varId);

        if (unique === undefined) {
            iff.then(updateVId);
            let insert = factory.createInsert();
            iff.then(insert);
            insert.table = new EntityTable(name, tuidHasUnit);
            insert.cols = [{
                col: id.name, val: varDollarId
            }, ...cols];
            if (tuidHasUnit === true) insert.cols.push(colUnit);
        }
        else {
            let iffUniqueIdNull = factory.createIf();
            iff.then(iffUniqueIdNull);
            iffUniqueIdNull.cmp = new ExpIsNull(varIdU);

            iffUniqueIdNull.then(updateVId);
            let setDIdFromU = factory.createSet();
            setDIdFromU.equ(dollarId, varIdU);
            iffUniqueIdNull.else(setDIdFromU);
            for (let f of unique.fields) {
                let fn = f.name;
                let v = new ExpVar(fn);
                updateWhereUnique.push(
                    //new ExpOr( 如果id null的时候，unique必须有值。所以得去掉这里的null判断。否则，有可能把整个表的字段改写了
                    // 这是一个恐怖错误
                    //    new ExpIsNull(v),
                    new ExpEQ(new ExpField(fn), v)
                    //)
                );
            }

            let upsert = factory.createUpsert();
            iff.then(upsert);
            let upsertCols: ColVal[] = [{
                col: id.name, val: varDollarId
            }],
                upsertKeys: ColVal[] = [];
            upsert.table = new EntityTable(name, tuidHasUnit);
            upsert.cols = upsertCols;
            upsert.keys = upsertKeys;
            function eachFields(fieldArr: Field[]) {
                for (let f of fieldArr) {
                    let fn = f.name;
                    let columns: ColVal[] = unique.fields.findIndex(v => v.name === fn) < 0 ?
                        upsertCols : upsertKeys;
                    columns.push({ col: fn, val: new ExpVar(fn) });
                }
            }
            eachFields(main);
            eachFields(fields);
            if (tuidHasUnit === true) {
                upsertKeys.push(colUnit);
            }
        }

        let setId = factory.createSet();
        setId.equ(dollarId, varId);
        let iffBiggerVId = factory.createIf();
        iff.else(iffBiggerVId);
        iffBiggerVId.cmp = new ExpGT(varId, varDollarId);
        iffBiggerVId.then(setId);
        iffBiggerVId.then(updateVId);
        iffBiggerVId.else(setId);
        let ifIsVId = factory.createIf();
        iff.else(ifIsVId);
        ifIsVId.cmp = new ExpEQ(new ExpVar('$isVId'), ExpVal.num1);
        let insertId = factory.createInsert();
        ifIsVId.then(insertId);
        insertId.table = new EntityTable(name, tuidHasUnit);
        insertId.cols = [
            { col: id.name, val: new ExpVar(id.name) },
            ...cols
        ];
        if (tuidHasUnit === true) insertId.cols.push(colUnit);


        let update = factory.createUpdate();
        ifIsVId.else(update);
        update.table = new EntityTable(name, tuidHasUnit);
        update.cols = cols;
        /*
        let updateWheres:ExpCmp[] = [new ExpEQ(new ExpField(id.name), varId)];
        if (tuidHasUnit === true) {
            updateWheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        }
        update.where = new ExpAnd(...updateWheres);
        */
        let updateIdEqu = new ExpEQ(new ExpField(id.name), varId);
        let updateNoUnitWhere: ExpCmp;
        if (updateWhereUnique.length > 0) {
            updateNoUnitWhere = new ExpOr(
                updateIdEqu,
                new ExpAnd(
                    new ExpIsNull(new ExpVar(id.name)),
                    ...updateWhereUnique,
                )
            )
        }
        else {
            updateNoUnitWhere = updateIdEqu;
        }

        update.where = (tuidHasUnit === true) ?
            new ExpAnd(
                new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)),
                updateNoUnitWhere,
            )
            :
            updateNoUnitWhere;

        let iffUpdateRowCount = factory.createIf();
        ifIsVId.else(iffUpdateRowCount);
        iffUpdateRowCount.cmp = new ExpEQ(new ExpFunc(factory.func_rowCount), ExpVal.num0);
        let setNetId = factory.createSet();
        iffUpdateRowCount.then(setNetId);
        setNetId.equ(dollarId, new ExpNeg(varId));

        // 非导入tuid，id参数有值，不是vid
        if (from === undefined) {
            let varIdParam = new ExpVar('$idParam');
            let statModifyQueue = this.context.buildModifyQueue(tuid, varIdParam);
            if (statModifyQueue) {
                let iffModified = factory.createIf();
                stats.push(iffModified);
                iffModified.cmp = new ExpAnd(
                    new ExpGT(varIdParam, ExpNum.num0),
                    new ExpEQ(new ExpVar('$isVId'), ExpVal.num0)
                );
                iffModified.then(...statModifyQueue);
            }
        }

        let syncField = (f: Field) => {
            syncStats.push(this.buildSyncTuidField(f, new ExpVar(f.name)));
        }
        main.forEach(syncField);
        fields.forEach(syncField);
    }

    private buildNoAutoIdTuidUpsert(tuid: Tuid, syncStats: Statement[]): Upsert {
        let { id, fields, main, from } = tuid;
        let factory = this.context.factory;
        let upsert = factory.createUpsert();
        let { unitField } = this.context;
        upsert.table = new SqlEntityTable(tuid, undefined, this.hasUnit);
        let { cols, keys } = upsert;
        for (let f of fields) {
            let val = new ExpVar(f.name);
            cols.push({ col: f.name, val: val });
            syncStats.push(this.buildSyncTuidField(f, val));
        }
        for (let f of main) {
            let val = new ExpVar(f.name);
            cols.push({ col: f.name, val: val });
            syncStats.push(this.buildSyncTuidField(f, val));
        }
        if (this.hasUnit == true) {
            let col = { col: unitField.name, val: new ExpVar(unitField.name) };
            keys.push(col);
        }
        let idCol = { col: id.name, val: new ExpVar(id.name) };
        keys.push(idCol);
        return upsert;
    }

    private buildSearchProc(tuid: Tuid): Procedure {
        let { name, owner } = tuid;
        let factory = this.context.factory;
        let proc = this.context.createProcedure((owner === undefined ? '' : owner.name + '_') + name + '$search');
        proc.addUnitUserParameter();
        let { parameters, statements } = proc;
        let key = new Field();
        key.name = '$key';
        key.dataType = new Text();
        let pageStart = new Field();
        pageStart.name = '$pageStart';
        pageStart.dataType = new BigInt();
        let pageSize = new Field();
        pageSize.name = '$pageSize';
        pageSize.dataType = new Int();
        if (tuid.owner !== undefined) {
            parameters.push(bigIntField((tuid as TuidArr).ownerField.name));
        }
        parameters.push(
            key, pageStart, pageSize,
        );
        let declare = factory.createDeclare();
        statements.push(declare);
        let dtChar = new Char(), dtInt = new Int;
        dtChar.size = 50;
        let varKey = new ExpVar(key.name);
        let space = new ExpStr(' ');
        let percent = new ExpStr('%');
        let key1 = '$key1', key2 = '$key2', c = '$c', p = '$p', s1 = '$s1', s2 = '$s2', len = '$len';
        let varKey1 = new ExpVar(key1);
        let varKey2 = new ExpVar(key2);
        let varC = new ExpVar(c);
        let varP = new ExpVar(p);
        let varS1 = new ExpVar(s1);
        let varS2 = new ExpVar(s2);
        let varLen = new ExpVar(len);
        declare.var(key1, dtChar).var(key2, dtChar)
            .var(c, dtInt).var(p, dtInt)
            .var(s1, dtInt).var(s2, dtInt).var(len, dtInt);

        let num0 = ExpVal.num0;
        let num1 = ExpVal.num1;
        let s11 = new ExpAdd(varS1, num1);
        let s1n1 = new ExpSub(varS1, num1);
        let set = factory.createSet();
        statements.push(set);
        set.equ(pageSize.name, new ExpAdd(new ExpVar(pageSize.name), num1));
        set = factory.createSet();
        statements.push(set);
        set.equ(len, new ExpFunc(factory.func_length, varKey));
        set = factory.createSet();
        statements.push(set);
        set.equ(s1, new ExpFunc(factory.func_charindex, space, varKey));
        set = factory.createSet();
        statements.push(set);
        set.equ(s2, new ExpFunc(factory.func_charindex, space, varKey, s11));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpEQ(varS1, ExpVal.num0);
        set = factory.createSet();
        iff.then(set);
        set.equ(key1, new ExpFunc('CONCAT', percent, varKey, percent));
        set = factory.createSet();
        iff.then(set);
        set.equ(key2, new ExpFunc('CONCAT', percent, varKey, percent));

        let key1Part = new ExpFunc('SUBSTRING', varKey, num1, s1n1);
        let key2Part = new ExpFunc('SUBSTRING', varKey, s11, new ExpSub(varS2, s11));
        let key2End = new ExpFunc('SUBSTRING', varKey, s11, new ExpSub(varLen, varS1));
        let iff2 = factory.createIf();
        iff.else(iff2);
        iff2.cmp = new ExpEQ(varS2, ExpVal.num0);
        set = factory.createSet();
        iff2.then(set);
        set.equ(key1, new ExpFunc('CONCAT', percent, key1Part, percent, key2End, percent));
        set = factory.createSet();
        iff2.then(set);
        set.equ(key2, new ExpFunc('CONCAT', percent, key2End, percent, key1Part, percent));
        set = factory.createSet();
        iff2.else(set);
        set.equ(key1, new ExpFunc('CONCAT', percent, key1Part, percent, key2Part, percent));
        set = factory.createSet();
        iff2.else(set);
        set.equ(key2, new ExpFunc('CONCAT', percent, key2Part, percent, key1Part, percent));

        set = factory.createSet();
        iff2.else(set);
        set.equ(p, new ExpAdd(varS2, num1));
        let loop = factory.createWhile();
        iff2.else(loop);
        loop.no = 1;
        loop.cmp = new ExpEQ(num1, num1);
        set = factory.createSet();
        loop.statements.add(set);
        set.equ(c, new ExpFunc(factory.func_charindex, space, varKey, new ExpAdd(varP, num1)));
        let iff3 = factory.createIf();
        loop.statements.add(iff3);
        iff3.cmp = new ExpEQ(varC, num0);
        let p1 = new ExpAdd(varP, num1);
        let p1n1 = new ExpSub(varP, num1);
        let pEnd = new ExpFunc('SUBSTRING', varKey, varP, new ExpSub(varLen, p1n1));
        set = factory.createSet();
        iff3.then(set);
        set.equ(key1, new ExpFunc('CONCAT', varKey1, pEnd, percent));
        set = factory.createSet();
        iff3.then(set);
        set.equ(key2, new ExpFunc('CONCAT', varKey2, pEnd, percent));
        let leave = factory.createBreak();
        iff3.then(leave);
        leave.no = 1;
        let pToC = new ExpFunc('SUBSTRING', varKey, varP, new ExpSub(varC, varP));
        set = factory.createSet();
        iff3.else(set);
        set.equ(key1, new ExpFunc('CONCAT', varKey1, pToC, percent));
        set = factory.createSet();
        iff3.else(set);
        set.equ(key2, new ExpFunc('CONCAT', varKey2, pToC, percent));
        set = factory.createSet();
        iff3.else(set);
        set.equ(p, new ExpAdd(varC, num1));
        return proc;
    }

    protected search() {
        let proc = this.buildSearchProc(this.entity);
        let { id } = this.entity;
        let sel = this.createSelect();
        proc.statements.push(sel);
        this.selMain(this.entity, sel);

        let wheres: ExpCmp[] = [];
        wheres.push(new ExpGT(new ExpField(id.name, 't0'), new ExpVar('$pageStart')));
        sel.where(new ExpAnd(...wheres));
        sel.order(new ExpField(id.name, 't0'), 'asc');
        sel.limit(new ExpVar('$pageSize'));
        let tn = 0;
        let p = this.entity;
        let s = p.search;
        if (s !== undefined) {
            let tbl = 't' + tn;
            sel.search(s, '$key1', tbl);
            sel.search(s, '$key2', tbl);
        }
        let { procedures } = this.context.appObjs;
        procedures.push(proc);

        let { arrs } = this.entity;
        if (arrs === undefined) return;
        for (let arr of arrs) {
            procedures.push(this.buildArrSearch(arr));
        }
    }

    private buildArrSearch(arr: TuidArr): Procedure {
        let proc = this.buildSearchProc(arr);
        let { id, owner, ownerField } = arr;
        let sel = this.context.factory.createSelect();
        proc.statements.push(sel);
        let tbl0 = 't0';
        sel.col(id.name, id.name, tbl0);
        sel.col(ownerField.name, ownerField.name, tbl0);
        this.selMain(arr, sel);
        this.selFields(arr, sel);
        sel.from(new EntityTable(this.entity.name + '_' + arr.name, false, tbl0));
        let wheres: ExpCmp[] = [];
        wheres.push(
            new ExpGT(new ExpField(id.name, 't0'), new ExpVar('$pageStart'))
        );
        wheres.push(
            new ExpOr(
                new ExpEQ(new ExpVar(ownerField.name), ExpVal.num0),
                new ExpIsNull(new ExpVar(ownerField.name)),
                new ExpEQ(new ExpField(ownerField.name, tbl0), new ExpVar(ownerField.name))
            )
        );
        sel.where(new ExpAnd(...wheres));
        sel.limit(new ExpVar('$pageSize'));

        let p = arr as Tuid;
        let s = p.search;
        if (s !== undefined) {
            let tbl = 't0';
            sel.search(s, '$key1', tbl);
            sel.search(s, '$key2', tbl);
        }
        return proc;
    }

    private checkPull() {
        let { name } = this.entity;
        let p = this.context.createProcedure(name + '$pull_check');
        this.context.pullCheckProc(p, name, 'tuid');
        this.context.appObjs.procedures.push(p);
    }
}

class BTuidUser extends BTuid {
    search() { }
    save() {
        let { name, id, /*base, */main, fields } = this.entity;
        let factory = this.context.factory;
        let proc = this.context.createProcedure(name + '$save');
        proc.addUnitUserParameter();
        let { appObjs, userParam } = this.context;
        appObjs.procedures.push(proc);
        let stats = proc.statements;
        proc.parameters.push(
            id,
            ...main,
            ...fields
        );

        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new ExpEQ(new ExpVar(userParam.name), new ExpVar('id'));
        iff.then(proc.createTransaction());

        let dollarId = '$id';
        let varDollarId = new ExpVar(dollarId);
        let varId = new ExpVar(id.name);

        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(dollarId, new BigInt());

        let syncStats: Statement[] = [];
        this.buildTuidUpsert(iff._then.statements, this.entity, syncStats, proc.createCommit());

        iff.then(proc.createCommit());

        let retSel = factory.createSelect();
        stats.push(retSel);
        retSel.column(varDollarId, 'id')
            .column(varId, 'inId');
    }
}

class BTuidSheet extends BTuid {
    search() { }
    save() { }
}
