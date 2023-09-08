"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BEntityBusable = exports.BEntity = void 0;
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
class BEntity {
    constructor(context, entity) {
        this.context = context;
        this.entity = entity;
    }
    log() { }
    buildTables() { }
    buildProcedures() { }
    buildSyncTuidField(field, idVal) {
        return this.context.buildPullTuidField(field, idVal);
    }
    get actionProcName() { return this.entity.name; }
    returnsDeclare(statements, returns) {
        if (returns === undefined)
            return;
        let retArr = returns.returns;
        let factory = this.context.factory;
        for (let r of retArr) {
            if (r.needTable === false)
                continue;
            let varTable = factory.createVarTable();
            varTable.name = r.name;
            varTable.fields = r.fields.map(v => {
                let f = new il_1.Field();
                f.name = v.name;
                f.dataType = v.dataType;
                f.nullable = true;
                return f;
            });
            let id = (0, il_1.intField)('$id');
            id.autoInc = true;
            varTable.fields.push(id);
            varTable.keys = [id];
            statements.push(varTable);
        }
    }
    buildSysFields(table, stampCreate, stampUpdate) {
        if (stampCreate === true) {
            let fieldCreate = (0, il_1.timeStampField)('$create');
            table.fields.push(fieldCreate);
        }
        if (stampUpdate === true) {
            let fieldUpdate = (0, il_1.timeStampField)('$update');
            fieldUpdate.defaultValue = [il_1.defaultStampOnUpdate];
            table.fields.push(fieldUpdate);
        }
    }
    returns(statements, returns) {
        let { factory } = this.context;
        if (returns === undefined)
            return;
        let retArr = returns.returns;
        for (let ret of retArr) {
            const { needTable, name, fields } = ret;
            if (needTable === false)
                continue;
            let select = factory.createSelect();
            select.from(new statementWithFrom_1.VarTable(name));
            if (fields.length === 0) {
                select.column(sql_1.ExpNum.num1, '_$_none_fields');
            }
            else {
                for (let f of fields) {
                    let { name, sName, dataType } = f;
                    let val = new sql_1.ExpField(name);
                    if (dataType.type === 'timestamp') {
                        val = new sql_1.ExpFuncCustom(factory.func_unix_timestamp, val);
                    }
                    select.column(val, sName);
                }
            }
            statements.push(select);
        }
    }
    buildBiz$User(stats) {
        let { isBiz } = this.entity;
        if (isBiz !== true)
            return;
        this.context.buildBiz$User(stats);
    }
    buildRoleCheck(statements) {
        /*
        let { role } = this.entity;
        if (role === undefined) return;
        let roles = role['$'];
        if (roles === undefined) return;
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('$roles', new Text());
        let select = factory.createSelect();
        select.toVar = true;
        select.column(new ExpField('roles', 'a'), '$roles');
        select.from(new EntityTable('$user_roles', hasUnit, 'a'));
        select.where(new ExpEQ(new ExpField('id', 'a'), new ExpVar('$user')));
        statements.push(select);
        let iff = factory.createIf();
        statements.push(iff);
        let ors: ExpCmp[] = roles.map(r => new ExpGT(
            new ExpFunc(factory.func_charindex, new ExpStr('|' + r + '|'), new ExpVar('$roles')),
            ExpNum.num0
        ));
        iff.cmp = new ExpNot(new ExpOr(...ors));
        let signal = factory.createSignal();
        signal.text = new ExpFunc(factory.func_concat, new ExpStr('$roles:'), new ExpVar('$roles'));
        iff.then(signal);
        */
    }
    declareInBusVars(declare, actioniHasInBus) {
        let { inBuses } = actioniHasInBus;
        if (inBuses === undefined)
            return;
        inBuses.forEach(v => {
            //let {busVar} = v;
            for (let arr of v.arrs) {
                let arrName = arr.name;
                for (let f of arr.fields) {
                    let fName = f.name;
                    let vName = `${arrName}_${fName}`;
                    declare.var(vName, f.dataType);
                }
            }
        });
    }
    buildInBusProcedures(actioniHasInBus) {
        let { inBuses } = actioniHasInBus;
        if (inBuses === undefined)
            return;
        inBuses.forEach(v => this.buildInBusProcdure(v));
    }
    dataParse(proc, statements, action, statsSetImportingBusVar, loopState) {
        this.context.dataParse(proc, statements, action, this.entity.sheet, statsSetImportingBusVar, loopState);
    }
    buildInBusDataParse(proc, statements, action) {
        this.dataParse(proc, statements, action);
    }
    buildInBusProcdure(inBus) {
        let { factory } = this.context;
        let { bus, faceName } = inBus;
        let procName = `${this.actionProcName}$bus$${bus.name}_${faceName}`;
        let proc = this.context.createAppProc(procName);
        proc.addUnitUserParameter();
        let stats = proc.statements;
        let dtText = new il_1.Text();
        dtText.size = 'medium';
        let data = new il_1.Field();
        data.name = '$data';
        data.dataType = dtText;
        proc.parameters.push(data);
        let declare = factory.createDeclare();
        stats.push(declare);
        stats.push(...this.buildInBusGetData());
        let { returns, statement } = inBus;
        let dataParseActionBase = this.getInBusDataParseActionBase();
        this.buildInBusDataParse(proc, stats, dataParseActionBase);
        this.returnsDeclare(stats, returns);
        let sqls = new bstatement_1.Sqls(this.context, stats);
        const { statements } = statement;
        sqls.head(statements);
        sqls.body(statements);
        sqls.foot(statements);
        this.returns(stats, returns);
        sqls.done(proc);
        return proc;
    }
    buildInBusGetData() {
        return [];
    }
    getInBusDataParseActionBase() {
        return this.entity;
    }
    buildProcProxyAuth(proc, actBase) {
        let { statements, parameters } = proc;
        let { proxy, auth } = actBase;
        let { factory } = this.context;
        let vOk;
        if (proxy) {
            vOk = (0, il_1.tinyIntField)('$ok');
            parameters.push((0, il_1.bigIntField)('$$user'));
            let iffProxyNotNull = factory.createIf();
            statements.push(iffProxyNotNull);
            iffProxyNotNull.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar('$$user'));
            let setOk = factory.createSet();
            iffProxyNotNull.then(setOk);
            setOk.equ('$ok', sql_1.ExpNum.num0);
            let call = factory.createCall();
            iffProxyNotNull.then(call);
            call.procName = this.context.twProfix + proxy.name;
            call.params.push({ value: new sql_1.ExpVar('$unit') }, { value: new sql_1.ExpVar('$user') }, { value: new sql_1.ExpVar('$$user') }, { value: new sql_1.ExpVar('$ok') });
            let iff = factory.createIf();
            iffProxyNotNull.then(iff);
            iff.cmp = new sql_1.ExpNot(new sql_1.ExpEQ(new sql_1.ExpVar('$ok'), sql_1.ExpNum.num1));
            let signal = factory.createSignal();
            iff.then(signal);
            signal.text = new sql_1.ExpStr('user proxy is not auth');
            let setUser = factory.createSet();
            setUser.equ('$user', new sql_1.ExpVar('$$user'));
            iff.else(setUser);
        }
        if (auth) {
            vOk = (0, il_1.tinyIntField)('$ok');
            let setOk = factory.createSet();
            statements.push(setOk);
            setOk.equ('$ok', sql_1.ExpNum.num0);
            let call = factory.createCall();
            statements.push(call);
            call.procName = this.context.twProfix + auth.name;
            call.params.push({ value: new sql_1.ExpVar('$unit') }, { value: new sql_1.ExpVar('$user') }, { value: new sql_1.ExpVar('$ok') });
            let iff = factory.createIf();
            statements.push(iff);
            iff.cmp = new sql_1.ExpNot(new sql_1.ExpEQ(new sql_1.ExpVar('$ok'), sql_1.ExpNum.num1));
            let signal = factory.createSignal();
            iff.then(signal);
            signal.text = new sql_1.ExpStr('user auth failed');
        }
        if (vOk) {
            let declare = factory.createDeclare();
            declare.vars(vOk);
            proc.statements.push(declare);
        }
    }
    convertTableFieldsValuesList(fieldsValuesList) {
        if (fieldsValuesList === undefined)
            return;
        let list = fieldsValuesList.map(v => {
            let { fields, fieldsInit, values, hasId } = v;
            let expVales;
            if (true /* hasId === true*/) {
                expVales = values.map(val => {
                    return val.map(v => (0, sql_1.convertExp)(this.context, v));
                });
            }
            else {
                // const id 改成自增1
                // fields = [this.entity.id, ...fields];
                // let idExp:ExpVal = new ExpFunc(TWProfix + '$id_local', ExpNum.num0, new ExpStr(name));
                //expVales = values.map(val => {
                //	return [idExp, ...val.map(v => convertExp(this.context, v) as ExpVal)];
                //});
            }
            return { fields, fieldsInit, values: expVales };
        });
        return list;
    }
}
exports.BEntity = BEntity;
class BEntityBusable extends BEntity {
    declareBusVar(declare, busFaces, statements) {
        if (busFaces === undefined)
            return;
        let { factory } = this.context;
        declare.var(consts_1.settingQueueSeed, new il_1.BigInt());
        for (let bf of busFaces) {
            for (let f of bf.faces) {
                let vFace = `$bus_${bf.bus.name}_${f.face}`;
                let vFaceInit = vFace + '_init';
                let vFaceStamp = vFace + '_stamp';
                let vFaceDefer = vFace + '_defer';
                declare.var(vFace, new il_1.Text());
                declare.var(vFaceInit, new il_1.Text());
                declare.var(vFaceStamp, new il_1.Int());
                declare.var(vFaceDefer, new il_1.TinyInt());
                let setInit = factory.createSet();
                statements.push(setInit);
                const sFaceInit = '#\\t' + bf.bus.shareSchema.version + '\\n';
                let expFaceInit = new sql_1.ExpStr(sFaceInit);
                setInit.equ(vFaceInit, expFaceInit);
                let set = factory.createSet();
                statements.push(set);
                set.equ(vFace, new sql_1.ExpVar(vFaceInit));
                let setDefer = factory.createSet();
                statements.push(setDefer);
                setDefer.equ(vFaceDefer, sql_1.ExpNum.num0);
            }
        }
    }
    buildSetImportingBusVar(declare, busFaces) {
        if (busFaces === undefined)
            return;
        let { factory } = this.context;
        declare.var(consts_1.settingQueueSeed, new il_1.BigInt());
        const vImportingCmd = new sql_1.ExpStr('\\r^\\r');
        let ifImporting = factory.createIf();
        ifImporting.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('$importing'), sql_1.ExpNum.num1);
        let hasBus = false;
        for (let bf of busFaces) {
            for (let f of bf.faces) {
                hasBus = true;
                let vFace = `$bus_${bf.bus.name}_${f.face}`;
                let vFaceInit = vFace + '_init';
                let vFaceDefer = vFace + '_defer';
                /*
                let vFaceStamp = vFace + '_stamp';
                declare.var(vFace, new Text());
                declare.var(vFaceInit, new Text());
                declare.var(vFaceStamp, new Int());
                let setInit = factory.createSet();
                statements.push(setInit);
                const sFaceInit = '#\\t' + bf.bus.shareSchema.version  + '\\n';
                let expFaceInit = new ExpStr(sFaceInit);
                setInit.equ(vFaceInit, expFaceInit);
                */
                let setInit = factory.createSet();
                ifImporting.then(setInit);
                setInit.equ(vFaceInit, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar(vFaceInit), vImportingCmd));
                let setFace = factory.createSet();
                ifImporting.then(setFace);
                setFace.equ(vFace, new sql_1.ExpVar(vFaceInit));
                let setDefer = factory.createSet();
                ifImporting.then(setDefer);
                setDefer.equ(vFaceDefer, sql_1.ExpNum.num1);
            }
        }
        if (hasBus === false)
            return [];
        return [ifImporting];
    }
    buildBusWriteQueueStatement(statements, busFaces) {
        if (busFaces === undefined)
            return;
        let { factory, hasUnit, unitField } = this.context;
        for (let bf of busFaces) {
            let { bus, faces } = bf;
            for (let f of faces) {
                let { face, local /*, defer*/ } = f;
                let { name } = bus;
                let faceName = '$bus_' + name + '_' + face;
                let vFaceInit = new sql_1.ExpVar(faceName + '_init');
                let vFace = new sql_1.ExpVar(faceName);
                let vStamp = new sql_1.ExpVar(faceName + '_stamp');
                let vDefer = new sql_1.ExpVar(faceName + '_defer');
                let memo = factory.createMemo();
                memo.text = 'bus into queue_out';
                statements.push(memo);
                let iff = factory.createIf();
                statements.push(iff);
                iff.cmp = new sql_1.ExpNE(vFace, vFaceInit);
                this.context.tableSeed(consts_1.settingQueueSeed, consts_1.settingQueueSeed).forEach(v => iff.then(v));
                let insert = factory.createInsert();
                iff.then(insert);
                insert.table = new sql_1.SqlSysTable(dbContext_1.EnumSysTable.messageQueue);
                if (local === true) {
                    vFace = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('+'), vFace);
                }
                let cols = insert.cols = [
                    { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
                    { col: 'action', val: new sql_1.ExpStr('bus') },
                    { col: 'subject', val: new sql_1.ExpStr(name + '/' + face) },
                    { col: 'content', val: vFace },
                    { col: 'stamp', val: vStamp },
                    { col: 'defer', val: vDefer },
                ];
                if (hasUnit === true)
                    cols.unshift({ col: '$unit', val: new sql_1.ExpVar('$unit') });
                let insertDefer = factory.createInsert();
                iff.then(insertDefer);
                insertDefer.table = new statementWithFrom_1.EntityTable('$queue_defer', false);
                insertDefer.cols = [
                    { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
                    { col: 'defer', val: vDefer },
                ];
            }
        }
    }
}
exports.BEntityBusable = BEntityBusable;
//# sourceMappingURL=entity.js.map