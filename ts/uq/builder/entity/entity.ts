import {
    Entity, ActionBase, BusFace, Field
    , Text, BigInt, Returns, InBusAction, intField, ActionHasInBus
    , Arr, bigIntField, tinyIntField, Int
    , timeStampField, defaultStampOnUpdate, TinyInt, FieldsValues
    , EnumSysTable
} from '../../il';
import { DbContext } from '../dbContext';
import {
    Procedure, Statement, Declare, While
    , ExpVal, ExpFunc, ExpVar, ExpField, ExpStr
    , SqlSysTable, ExpNE, ExpFuncCustom, ExpNot
    , ExpNum, ExpOr, ExpCmp, ExpEQ, ExpGT, ExpIsNotNull, Table, convertExp
} from '../sql';
import { EntityTable, VarTable } from '../sql/statementWithFrom';
import { Sqls } from '../bstatement';
import { settingQueueSeed } from '../consts';
import { TableFieldsValues } from '../sql/table';

export class BEntity<E extends Entity> {
    protected readonly context: DbContext;
    protected readonly entity: E;

    constructor(context: DbContext, entity: E) {
        this.context = context;
        this.entity = entity;
    }

    log() { }
    buildTables() { }
    buildProcedures() { }

    protected buildSyncTuidField(field: Field, idVal: ExpVal): Statement {
        return this.context.buildPullTuidField(field, idVal);
    }

    protected get actionProcName() { return this.entity.name; }

    protected returnsDeclare(statements: Statement[], returns: Returns) {
        if (returns === undefined) return;
        let retArr = returns.returns;
        let factory = this.context.factory;
        for (let r of retArr) {
            if (r.needTable === false) continue;
            let varTable = factory.createVarTable();
            varTable.name = r.name;
            varTable.fields = r.fields.map(v => {
                let f = new Field();
                f.name = v.name;
                f.dataType = v.dataType;
                f.nullable = true;
                return f;
            });
            let id = intField('$id');
            id.autoInc = true;
            varTable.fields.push(id);
            varTable.keys = [id];
            statements.push(varTable);
        }
    }

    protected buildSysFields(table: Table, stampCreate: boolean, stampUpdate: boolean) {
        if (stampCreate === true) {
            let fieldCreate = timeStampField('$create');
            table.fields.push(fieldCreate);
        }
        if (stampUpdate === true) {
            let fieldUpdate = timeStampField('$update');
            fieldUpdate.defaultValue = [defaultStampOnUpdate];
            table.fields.push(fieldUpdate);
        }
    }

    protected returns(statements: Statement[], returns: Returns) {
        let { factory } = this.context;
        if (returns === undefined) return;
        let retArr = returns.returns;
        for (let ret of retArr) {
            const { needTable, name, fields } = ret;
            if (needTable === false) continue;
            let select = factory.createSelect();
            select.from(new VarTable(name));
            if (fields.length === 0) {
                select.column(ExpNum.num1, '_$_none_fields');
            }
            else {
                for (let f of fields) {
                    let { name, sName, dataType } = f;
                    let val: ExpVal = new ExpField(name);
                    if (dataType.type === 'timestamp') {
                        val = new ExpFuncCustom(factory.func_unix_timestamp, val);
                    }
                    select.column(val, sName);
                }
            }
            statements.push(select);
        }
    }

    protected buildBiz$User(stats: Statement[]) {
        let { isBiz } = this.entity;
        if (isBiz !== true) return;
        this.context.buildBiz$User(stats);
    }

    protected buildRoleCheck(statements: Statement[]) {
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

    protected declareInBusVars(declare: Declare, actioniHasInBus: ActionHasInBus) {
        let { inBuses } = actioniHasInBus;
        if (inBuses === undefined) return;
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

    protected buildInBusProcedures(actioniHasInBus: ActionHasInBus) {
        let { inBuses } = actioniHasInBus;
        if (inBuses === undefined) return;
        inBuses.forEach(v => this.buildInBusProcdure(v));
    }

    protected dataParse(proc: Procedure, statements: Statement[]
        , action: { fields: Field[]; arrs: Arr[]; }
        , statsSetImportingBusVar?: Statement[]
        , loopState?: While) {
        this.context.dataParse(proc, statements, action, statsSetImportingBusVar, loopState);
    }

    protected buildInBusDataParse(proc: Procedure, statements: Statement[]
        , action: { fields: Field[]; arrs: Arr[]; }) {
        this.dataParse(proc, statements, action);
    }

    private buildInBusProcdure(inBus: InBusAction) {
        let { factory } = this.context;
        let { bus, faceName } = inBus;
        let procName = `${this.actionProcName}$bus$${bus.name}_${faceName}`;
        let proc = this.context.createAppProc(procName);
        proc.addUnitUserParameter();
        let stats = proc.statements;
        let dtText = new Text();
        dtText.size = 'medium';
        let data = new Field();
        data.name = '$data';
        data.dataType = dtText;
        proc.parameters.push(
            data,
        );
        let declare = factory.createDeclare();
        stats.push(declare);
        stats.push(...this.buildInBusGetData());
        let { returns, statement } = inBus;
        let dataParseActionBase = this.getInBusDataParseActionBase();
        this.buildInBusDataParse(proc, stats, dataParseActionBase);
        this.returnsDeclare(stats, returns);

        let sqls = new Sqls(this.context, stats);
        const { statements } = statement;
        sqls.head(statements);
        sqls.body(statements);
        sqls.foot(statements);

        this.returns(stats, returns);
        sqls.done(proc);
        return proc;
    }

    protected buildInBusGetData(): Statement[] {
        return [];
    }

    protected getInBusDataParseActionBase(): ActionBase {
        return this.entity as unknown as ActionBase;
    }

    protected buildProcProxyAuth(proc: Procedure, actBase: ActionBase) {
        let { statements, parameters } = proc;
        let { proxy, auth } = actBase;
        let { factory } = this.context;
        let vOk: Field;
        if (proxy) {
            vOk = tinyIntField('$ok');
            parameters.push(bigIntField('$$user'));
            let iffProxyNotNull = factory.createIf();
            statements.push(iffProxyNotNull);
            iffProxyNotNull.cmp = new ExpIsNotNull(new ExpVar('$$user'));
            let setOk = factory.createSet();
            iffProxyNotNull.then(setOk);
            setOk.equ('$ok', ExpNum.num0);
            let call = factory.createCall();
            iffProxyNotNull.then(call);
            call.procName = this.context.twProfix + proxy.name;
            call.params.push(
                { value: new ExpVar('$unit') },
                { value: new ExpVar('$user') },
                { value: new ExpVar('$$user') },
                { value: new ExpVar('$ok') }
            );
            let iff = factory.createIf();
            iffProxyNotNull.then(iff);
            iff.cmp = new ExpNot(new ExpEQ(new ExpVar('$ok'), ExpNum.num1));
            let signal = factory.createSignal();
            iff.then(signal);
            signal.text = new ExpStr('user proxy is not auth');
            let setUser = factory.createSet();
            setUser.equ('$user', new ExpVar('$$user'));
            iff.else(setUser);
        }
        if (auth) {
            vOk = tinyIntField('$ok');
            let setOk = factory.createSet();
            statements.push(setOk);
            setOk.equ('$ok', ExpNum.num0);
            let call = factory.createCall();
            statements.push(call);
            call.procName = this.context.twProfix + auth.name;
            call.params.push(
                { value: new ExpVar('$unit') },
                { value: new ExpVar('$user') },
                { value: new ExpVar('$ok') }
            );
            let iff = factory.createIf();
            statements.push(iff);
            iff.cmp = new ExpNot(new ExpEQ(new ExpVar('$ok'), ExpNum.num1));
            let signal = factory.createSignal();
            iff.then(signal);
            signal.text = new ExpStr('user auth failed');
        }
        if (vOk) {
            let declare = factory.createDeclare();
            declare.vars(vOk);
            proc.statements.push(declare);
        }
    }

    protected convertTableFieldsValuesList(fieldsValuesList: FieldsValues[]): TableFieldsValues[] {
        if (fieldsValuesList === undefined) return;
        let list = fieldsValuesList.map(v => {
            let { fields, fieldsInit, values, hasId } = v;
            let expVales: ExpVal[][];
            if (true/* hasId === true*/) {
                expVales = values.map(val => {
                    return val.map(v => convertExp(this.context, v) as ExpVal);
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

export class BEntityBusable<E extends Entity> extends BEntity<E> {
    declareBusVar(declare: Declare, busFaces: BusFace[], statements: Statement[]) {
        if (busFaces === undefined) return;
        let { factory } = this.context;
        declare.var(settingQueueSeed, new BigInt());
        for (let bf of busFaces) {
            for (let f of bf.faces) {
                let vFace = `$bus_${bf.bus.name}_${f.face}`;
                let vFaceInit = vFace + '_init';
                let vFaceStamp = vFace + '_stamp';
                let vFaceDefer = vFace + '_defer';
                declare.var(vFace, new Text());
                declare.var(vFaceInit, new Text());
                declare.var(vFaceStamp, new Int());
                declare.var(vFaceDefer, new TinyInt());
                let setInit = factory.createSet();
                statements.push(setInit);
                const sFaceInit = '#\\t' + bf.bus.shareSchema.version + '\\n';
                let expFaceInit = new ExpStr(sFaceInit);
                setInit.equ(vFaceInit, expFaceInit);
                let set = factory.createSet();
                statements.push(set);
                set.equ(vFace, new ExpVar(vFaceInit));
                let setDefer = factory.createSet();
                statements.push(setDefer);
                setDefer.equ(vFaceDefer, ExpNum.num0);
            }
        }
    }

    buildSetImportingBusVar(declare: Declare, busFaces: BusFace[]): Statement[] {
        if (busFaces === undefined) return;
        let { factory } = this.context;
        declare.var(settingQueueSeed, new BigInt());
        const vImportingCmd = new ExpStr('\\r^\\r');
        let ifImporting = factory.createIf();
        ifImporting.cmp = new ExpEQ(new ExpVar('$importing'), ExpNum.num1);
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
                setInit.equ(vFaceInit, new ExpFunc(factory.func_concat, new ExpVar(vFaceInit), vImportingCmd));
                let setFace = factory.createSet();
                ifImporting.then(setFace);
                setFace.equ(vFace, new ExpVar(vFaceInit));
                let setDefer = factory.createSet();
                ifImporting.then(setDefer);
                setDefer.equ(vFaceDefer, ExpNum.num1);
            }
        }
        if (hasBus === false) return [];
        return [ifImporting];
    }

    buildBusWriteQueueStatement(statements: Statement[], busFaces: BusFace[]) {
        if (busFaces === undefined) return;
        let { factory, hasUnit, unitField } = this.context;
        for (let bf of busFaces) {
            let { bus, faces } = bf;
            for (let f of faces) {
                let { face, local/*, defer*/ } = f;
                let { name } = bus;
                let faceName = '$bus_' + name + '_' + face
                let vFaceInit = new ExpVar(faceName + '_init');
                let vFace: ExpVal = new ExpVar(faceName);
                let vStamp: ExpVal = new ExpVar(faceName + '_stamp');
                let vDefer: ExpVal = new ExpVar(faceName + '_defer');
                let memo = factory.createMemo();
                memo.text = 'bus into queue_out';
                statements.push(memo);
                let iff = factory.createIf();
                statements.push(iff);
                iff.cmp = new ExpNE(vFace, vFaceInit);

                this.context.tableSeed(settingQueueSeed, settingQueueSeed).forEach(v => iff.then(v));

                let insert = factory.createInsert();
                iff.then(insert);
                insert.table = new SqlSysTable(EnumSysTable.messageQueue);
                if (local === true) {
                    vFace = new ExpFunc(factory.func_concat, new ExpStr('+'), vFace);
                }
                let cols = insert.cols = [
                    { col: 'id', val: new ExpVar(settingQueueSeed) },
                    { col: 'action', val: new ExpStr('bus') },
                    { col: 'subject', val: new ExpStr(name + '/' + face) },
                    { col: 'content', val: vFace },
                    { col: 'stamp', val: vStamp },
                    { col: 'defer', val: vDefer },
                ];
                if (hasUnit === true) cols.unshift({ col: '$unit', val: new ExpVar('$unit') });
                let insertDefer = factory.createInsert();
                iff.then(insertDefer);
                insertDefer.table = new EntityTable('$queue_defer', false);
                insertDefer.cols = [
                    { col: 'id', val: new ExpVar(settingQueueSeed) },
                    { col: 'defer', val: vDefer },
                ];
            }
        }
    }
}
