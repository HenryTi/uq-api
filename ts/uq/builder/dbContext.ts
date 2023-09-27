import { log } from '../log';
import * as il from '../il';
import {
    Table, Procedure, ExpVal, ExpField, ExpEQ, ExpExists, ExpNot,
    ExpNum, ExpVar, Statement, ExpFunc, ExpAnd, ExpIsNotNull, ExpStr,
    ExpSelect, ExpLE, ExpAdd, SqlVarTable, ExpSub, ExpGE, ExpCmp,
    ExpGT, ExpLT, If, ExpNull, ExpIsNull, Declare, SqlSysTable, While, ExpDecDiv, ExpOr, ColVal, convertExp, ExpFuncInUq
} from './sql';
import { Factory } from './sql/factory';
import { unitFieldName, userParamName } from './sql/sqlBuilder';
import { MsFactory } from './sql/sqlMs';
import { MyFactory } from './sql/sqlMy';
import * as stat from './bstatement';
import * as ent from './entity';
import { Field, Tuid, Entity, Map, intField, bigIntField, charField, Arr, Int, Char, DateTime, Text, Sheet, IArr, IField, DataType, Expression, JoinType, ValueExpression, CompareExpression } from '../il';
import { EntityTable, VarTable, GlobalTable } from './sql/statementWithFrom';
import { Select, LockType } from './sql/select';
import { Sqls } from './bstatement';
import { BBiz } from './Biz';
import { EntityRunner } from '../../core';

export const max_promises_uq_api = 10;

export function createFactory(dbContext: DbContext, sqlType: string): Factory {
    switch (sqlType) {
        default: throw 'not supported sql type:' + sqlType;
        case 'mysql': return new MyFactory(dbContext);
        case 'mssql': return new MsFactory(dbContext);
    }
}

export interface ObjSchema {
    readonly dbName: string;
    readonly name: string;
}

export interface CompileOptions {
    uqIds: number[];
    user: number; // User;
    action: 'thoroughly' | 'inc-only' | 'sys-only';

    autoRemoveTableField?: boolean;          // 必须设置true，才操作
    autoRemoveTableIndex?: boolean;          // 必须设置true，才操作
}


export class DbObjs {
    private context: DbContext;
    readonly tables: Table[] = [];
    readonly procedures: Procedure[] = [];
    readonly sqls: string[] = [];
    constructor(context: DbContext) {
        this.context = context;
    }

    async updateDb(runner: EntityRunner, options: CompileOptions): Promise<boolean> {
        for (let t of this.tables) t.buildIdIndex();
        if (await this.updateTables(runner, options) === false) {
            return false;
        }
        if (await this.updateProcs(runner, options) === false) {
            return false;
        }
        let step = 100;
        for (let i = 0; ; i += step) {
            let sqls = this.sqls.slice(i, step);
            if (sqls.length === 0) break;
            await runner.sql(sqls, []);
        }
        return true;
    }

    private async afterPromises(objSchemas: ObjSchema[], promises: Promise<string>[]) {
        let log = this.context.log;
        let all = await Promise.all(promises);
        for (let i = 0; i < all.length; i++) {
            let ret = all[i];
            log(`///++++++${objSchemas[i].name}------///`);
            if (ret !== undefined) {
                log(ret);
                console.error(ret);
                debugger;
                return false;
            }
        }
        //promises = [];
        //tables = [];
        return true;
    }

    private async updateTables(runner: EntityRunner, options: CompileOptions): Promise<boolean> {
        let ok = true;
        let log = this.context.log;
        let promises: Promise<string>[] = [];
        let tables: Table[] = [];
        for (let t of this.tables) {
            let sb = this.context.createSqlBuilder();
            t.update(sb);
            log('///++++++' + t.name);  // 压缩界面显示
            log(sb.sql);
            log('------///'); // 结束压缩
            if (promises.length >= max_promises_uq_api) {
                if (await this.afterPromises(tables, promises) === false) return false;
                promises = [];
                tables = [];
            }
            promises.push(t.updateDb(this.context, runner, options));
            tables.push(t);
            log();
        }
        if (await this.afterPromises(tables, promises) === false) return false;
        return ok;
    }

    async updateTablesRows(runner: EntityRunner, options: CompileOptions): Promise<boolean> {
        let ok = true;
        let log = this.context.log;
        let promises: Promise<string>[] = [];
        let tables: Table[] = [];
        for (let t of this.tables) {
            if (t.fieldsValuesList === undefined) continue;
            let sb = this.context.createSqlBuilder();
            t.update(sb);
            log('///++++++' + t.name);  // 压缩界面显示
            log(sb.sql);
            log('------///'); // 结束压缩
            if (promises.length >= max_promises_uq_api) {
                if (await this.afterPromises(tables, promises) === false) return false;
                promises = [];
                tables = [];
            }
            promises.push(t.updateRows(this.context, runner, options));
            tables.push(t);
            log();
        }
        if (await this.afterPromises(tables, promises) === false) return false;
        return ok;
    }

    private async updateProcs(runner: EntityRunner, options: CompileOptions): Promise<boolean> {
        let log = this.context.log;
        let len = this.procedures.length;
        let promises: Promise<string>[] = [];
        let procs: Procedure[] = [];
        for (let i = 0; i < len; i++) {
            let p = this.procedures[i];

            let sbDrop = this.context.createSqlBuilder();
            p.drop(sbDrop);


            let sb = this.context.createSqlBuilder();
            p.to(sb);
            log('///++++++' + p.name);  // 压缩界面显示
            log(sb.sql);
            log('------///'); // 结束压缩
            if (promises.length >= max_promises_uq_api) {
                if (await this.afterPromises(procs, promises) === false) return false;
                promises = [];
                procs = [];
            }
            if (p.isCore === true) {
                promises.push(p.coreUpdateDb(runner, options));
            }
            else {
                promises.push(p.updateDb(runner, options))
            }
            procs.push(p);
            log();
        }
        if (await this.afterPromises(procs, promises) === false) return false;

        return true;
    }
}

export enum EnumSysTable {
    const = '$const_str',
    setting = '$setting',
    entity = '$entity',
    version = '$version',
    phrase = '$phrase',
    site = '$site',
    // sitePhrase = 'sitephrase',
    // ixPhrase = '$ixphrase',
    id_u = '$id_u',
    id_uu = '$id_uu',

    unit = '$unit',
    user = '$user',
    userSite = '$usersite',
    ixRole = '$ixrole',

    ixMy = 'ixmy',
    bud = 'bud',
    ixBud = 'ixbud',
    ixBudDec = 'ixbuddec',
    ixBudInt = 'ixbudint',
    ixBudStr = 'ixbudstr',
    bizDetail = 'detail',
    bizSheet = 'sheet',
    pend = 'pend',
    detailPend = 'detailpend',
    history = 'history',

    messageQueue = '$message_queue',
    messageQueueEnd = '$message_queue_end',
    messageQueueFailed = '$message_queue_failed',

    // obsolete
    admin = '$admin',
    sheet = '$sheet',
    sheetDetail = '$sheet_detail',
    sheetTo = '$sheet_to',
    archive = '$archive',
    archiveFlow = '$archive_flow',
    flow = '$flow',
    fromNew = '$from_new',
    fromNewBad = '$from_new_bad',

    importDataMap = '$import_data_map',
    importDataSourceEntity = '$import_data_source_entity',
}

export function sysTable(t: EnumSysTable, alias: string = undefined, hasUnit: boolean = false): EntityTable {
    return new EntityTable(t, hasUnit, alias);
}

export class DbContext implements il.Builder {
    readonly log: log;
    readonly hasUnit: boolean;
    readonly unitField: il.Field;
    readonly unitFieldName: string;
    readonly userParam: il.Field;
    readonly factory: Factory;
    readonly coreObjs: DbObjs;
    readonly sysObjs: DbObjs;
    readonly appObjs: DbObjs;
    readonly dbName: string;
    readonly twProfix: string;
    readonly compilerVersion: string;
    readonly varUnit: ExpVar;
    readonly varUser: ExpVar;
    readonly varSite: ExpVar;
    site: number;
    ownerDbName: string; // 在$site里面建存储过程，访问uq表的内容

    constructor(compilerVersion: string, sqlType: string
        , dbName: string, twProfix: string
        , log: log, hasUnit: boolean) {
        this.compilerVersion = compilerVersion;
        this.factory = createFactory(this, sqlType);
        this.log = log;
        this.dbName = dbName;
        this.twProfix = twProfix;
        this.coreObjs = new DbObjs(this);
        this.sysObjs = new DbObjs(this);
        this.appObjs = new DbObjs(this);
        this.hasUnit = hasUnit;
        this.unitField = new il.Field();
        this.unitFieldName = this.unitField.name = unitFieldName;
        this.unitField.nullable = false;
        this.unitField.dataType = new il.BigInt();
        this.varUnit = new ExpVar(unitFieldName);
        this.varSite = new ExpVar('$site');

        let userField = new il.Field();
        userField.name = userParamName;
        userField.nullable = true;
        userField.dataType = new il.BigInt();
        this.userParam = userField;
        this.varUser = new ExpVar(userParamName);
    }

    get objDbName(): string { return this.ownerDbName ?? this.dbName; }

    createTable(tblName: string): Table {
        return this.factory.createTable(this.objDbName, tblName);
    }

    createProcedure(procName: string, isCore: boolean = false): Procedure {
        return this.factory.createProcedure(this.objDbName, procName, isCore);
    }

    // isCore = true; function必须在编译时刻生成。运行时没有机会生成。
    createFunction(procName: string, returnType: DataType): Procedure {
        return this.factory.createFunction(this.objDbName, procName, returnType);
    }

    createSqlBuilder() {
        let sb = this.factory.createSqlBuilder();
        sb.hasUnit = this.hasUnit;
        sb.unit = this.unitField;
        return sb;
    }

    createAppProc(name: string, isCore: boolean = false): Procedure {
        let p = this.factory.createProcedure(this.objDbName, name, isCore);
        this.appObjs.procedures.push(p);
        return p;
    }

    createAppFunc(name: string, returnType: DataType): Procedure {
        let p = this.factory.createFunction(this.objDbName, name, returnType);
        this.appObjs.procedures.push(p);
        return p;
    }

    convertExp(exp: Expression) {
        return convertExp(this, exp);
    }
    expCmp(exp: CompareExpression) {
        return convertExp(this, exp) as ExpCmp;
    }
    expVal(exp: ValueExpression) {
        return convertExp(this, exp) as ExpVal;
    }

    arr(v: il.Arr) { return new ent.BArr(this, v) }
    role(v: il.Role) { return new ent.BRole(this, v) }
    import(v: il.Import) { return new ent.BImport(this, v) }
    enm(v: il.Enum) { return new ent.BEnum(this, v) }
    _const(v: il.Const) { return new ent.BConst(this, v) }
    dataTypeDefine(v: il.DataTypeDefine) { return new ent.BDataTypeDefine(this, v) }
    queue(v: il.Queue) { return new ent.BQueue(this, v) }
    bus(v: il.Bus) { return new ent.BBus(this, v) }
    book(v: il.Book) { return new ent.BBook(this, v) }
    map(v: il.Map) { return new ent.BMap(this, v) }
    history(v: il.History) { return new ent.BHistory(this, v) }
    pending(v: il.Pending) { return new ent.BPending(this, v) }
    action(v: il.Act) { return new ent.BAct(this, v) }
    func(v: il.Function) { return new ent.BFunction(this, v) }
    sysproc(v: il.SysProc) { return new ent.BSysProc(this, v) }
    proc(v: il.Proc) { return new ent.BProc(this, v) }
    query(v: il.Query) { return new ent.BQuery(this, v) }
    sheet(v: il.Sheet) { return new ent.BSheet(this, v) }
    sheetState(v: il.SheetState) { return new ent.BSheetState(this, v) }
    sheetAction(v: il.SheetAction) { return new ent.BSheetAction(this, v) }
    tuid(v: il.Tuid) { return ent.BTuid.create(this, v) }
    ID(v: il.ID) { return new ent.BID(this, v) }
    IX(v: il.IX) { return new ent.BIX(this, v) }
    IDX(v: il.IDX): ent.BIDX { return new ent.BIDX(this, v) };
    Biz(v: il.Biz): BBiz { return new BBiz(this, v) };

    varStatement(v: il.VarStatement) { return new stat.BVarStatement(this, v) }
    tableStatement(v: il.TableStatement) { return new stat.BTableStatement(this, v) }
    textStatement(v: il.TextStatement) { return new stat.BTextStatement(this, v) };
    setStatement(v: il.SetStatement) { return new stat.BSetStatement(this, v) }
    withIDDelOnId(v: il.WithStatement) { return new stat.BWithIDDelOnId(this, v) }
    withIDDelOnKeys(v: il.WithStatement) { return new stat.BWithIDDelOnKeys(this, v) }
    withIDXDel(v: il.WithStatement) { return new stat.BWithIDXDel(this, v) }
    withIXDel(v: il.WithStatement) { return new stat.BWithIXDel(this, v) }
    withIDSetOnId(v: il.WithStatement) { return new stat.BWithIDSetOnId(this, v) }
    withIDSetOnKeys(v: il.WithStatement) { return new stat.BWithIDSetOnKeys(this, v) }
    withIDXSet(v: il.WithStatement) { return new stat.BWithIDXSet(this, v) }
    withIXSet(v: il.WithStatement) { return new stat.BWithIXSet(this, v) }
    withTruncate(v: il.WithStatement) { return new stat.BWithTruncate(this, v) }

    bizDetailActStatement(v: il.BizDetailActStatement) { return new stat.BBizDetailActStatement(this, v); }
    bizDetailActSubPend(v: il.BizDetailActSubPend) { return new stat.BBizDetailActSubPend(this, v); }
    bizDetailActSubSubject(v: il.BizDetailActSubTab) { return new stat.BBizDetailActSubBud(this, v); }

    value(v: il.ValueStatement) { return new stat.BValueStatement(this, v); }
    settingStatement(v: il.SettingStatement) { return new stat.BSettingStatement(this, v) }
    ifStatement(v: il.If) { return new stat.BIfStatement(this, v) }
    whileStatement(v: il.While) { return new stat.BWhileStatement(this, v) }
    breakStatement(v: il.BreakStatement) { return new stat.BBreakStatement(this, v) }
    continueStatement(v: il.ContinueStatement) { return new stat.BContinueStatement(this, v) }
    returnStatement(v: il.ReturnStatement) { return new stat.BReturnStatement(this, v) }
    returnStartStatement() { return new stat.BReturnStartStatement(this, undefined); }
    returnEndStatement() { return new stat.BReturnEndStatement(this, undefined); }
    procStatement(v: il.ProcStatement) { return new stat.BProcStatement(this, v) }
    foreachArr(v: il.ForEach, forArr: il.ForArr) { return new stat.BForArr(this, v, forArr) }
    foreachSelect(v: il.ForEach, forSelect: il.ForSelect) { return new stat.BForSelect(this, v, forSelect) }
    foreachQueue(v: il.ForEach, forQueue: il.ForQueue) { return new stat.BForQueue(this, v, forQueue) }
    selectStatement(v: il.SelectStatement) { return new stat.BSelect(this, v) }
    deleteStatement(v: il.DeleteStatement) { return new stat.BDeleteStatement(this, v) }
    bookWrite(v: il.BookWrite) { return new stat.BBookWrite(this, v) }
    //pull(v: il.Pull) { return new stat.BPull(this, v) }
    historyWrite(v: il.HistoryWrite) { return new stat.BHistoryWrite(this, v) }
    pendingWrite(v: il.PendingWrite) { return new stat.BPendingWrite(this, v) }
    tuidWrite(v: il.TuidWrite) { return new stat.BTuidWrite(this, v) }
    sheetWrite(v: il.SheetWrite) {
        return new stat.BSheetWrite(this, v)
    }
    stateTo(v: il.StateToStatement) { return new stat.BStateTo(this, v) }
    fail(v: il.FailStatement) { return new stat.BFailStatement(this, v) }
    busStatement(v: il.BusStatement) { return new stat.BBusStatement(this, v) }
    sendMsgStatement(v: il.SendMsgStatement) { return new stat.BSendMsgStatement(this, v) }
    sendAppStatement(v: il.SendAppStatement) { return new stat.BSendAppStatement(this, v) }
    inlineStatement(v: il.InlineStatement) { return new stat.BInlineStatement(this, v) }
    schedule(v: il.ScheduleStatement) { return new stat.BScheduleStatement(this, v) }
    logStatement(v: il.LogStatement) { return new stat.BLogStatement(this, v) }
    execSqlStatement(v: il.ExecSqlStatement) { return new stat.BExecSqlStatement(this, v) }
    transactionStatement(v: il.TransactionStatement) { return new stat.BTransactionStatement(this, v); }
    pokeStatement(v: il.PokeStatement) { return new stat.BPokeStatement(this, v); }
    sleepStatement(v: il.SleepStatement) { return new stat.BSleepStatement(this, v); }
    roleStatement(v: il.RoleStatement) { return new stat.BRoleStatement(this, v); }
    queueStatement(v: il.QueueStatement) { return new stat.BQueueStatement(this, v); }

    add$UnitCol(cols: ColVal[]) {
        if (this.hasUnit == false) return;
        cols.push({ col: '$unit', val: new ExpVar('$unit') });
    }

    // 现在不需要自动的拉取tuid的操作了
    // 如果要拉取，直接写pull xxx at (key);
    // 实际上，很少tuid需要真正拉取，除非要做以名字为核心的查询。
    buildPullTuidField(field: Field, idVal: ExpVal): Statement {
        if (!field) return;
        let { tuid } = field;
        if (!tuid) return;
        return this.buildTuidPull(tuid, idVal);
    }

    buildModifyQueue(entity: Tuid | Map, key: ExpVal): Statement[] {
        if (!entity.isOpen) return; // 不能返回[]. 必须在函数外做判断
        let insertModifyQueue = this.factory.createInsert();
        let selectEntity = this.factory.createSelect();
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.col('id');
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(entity.name)));
        insertModifyQueue.table = new EntityTable('$modify_queue', this.hasUnit);
        insertModifyQueue.cols = [
            { col: 'entity', val: new ExpSelect(selectEntity) },
            { col: 'key', val: key }
        ];
        if (this.hasUnit === true) {
            insertModifyQueue.cols.push({
                col: '$unit', val: new ExpVar('$unit')
            });
        }
        let update = this.factory.createUpdate();
        update.table = sysTable(EnumSysTable.unit);
        update.cols = [
            { col: 'modifyQueueMax', val: new ExpFunc(this.factory.func_lastinsertid) }
        ];
        update.where = new ExpEQ(new ExpField('unit'), new ExpVar('$unit'));
        return [insertModifyQueue, update];
    }

    private insertNew(entity: Entity, cmp: ExpCmp, varKey: ExpVal): Statement {
        let iff = this.factory.createIf();
        iff.cmp = cmp;
        let insert = this.factory.createInsert();
        iff.then(insert);
        let selectEntity = this.factory.createSelect();
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.col('id');
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(entity.name)));
        insert.table = new EntityTable('$from_new', this.hasUnit)
        insert.cols = [
            { col: 'entity', val: new ExpSelect(selectEntity) },
            { col: 'key', val: varKey },
        ];
        if (this.hasUnit === true) insert.cols.push({
            col: '$unit', val: new ExpVar('$unit')
        });
        return iff;
    }

    buildTuidPull(entity: Tuid, varKey: ExpVal): Statement {
        let { from, sync: isPull, global, id } = entity;
        if (from === undefined) return;
        if (isPull === false) return;
        let idName = id.name;
        let selectExists = this.factory.createSelect();
        selectExists.lock = LockType.update;
        selectExists.column(new ExpField(idName));
        selectExists.from(new EntityTable(entity.name, this.hasUnit && global === false));
        selectExists.where(new ExpEQ(new ExpField(idName), varKey));
        let cmp = new ExpExists(selectExists);
        return this.insertNew(entity, cmp, varKey)
    }

    buildMapPull(entity: Map, varKeys: ExpVal[]): Statement {
        let { from, keys } = entity;
        if (from === undefined) return;
        let cmps: ExpCmp[] = [];
        for (let i = 0; i < keys.length; i++) {
            let v = varKeys[i];
            if (v === undefined) break;
            let exists = this.factory.createSelect();
            let field = keys[i];
            let { tuid } = field;
            let idName = tuid.id.name;
            exists.lock = LockType.update;
            exists.column(new ExpField(idName));
            exists.from(new EntityTable(tuid.name, this.hasUnit && tuid.global === false));
            exists.where(new ExpEQ(new ExpField(idName), v));
            cmps.push(new ExpExists(exists));
        }

        let cmp = new ExpAnd(...cmps);
        let varKey = new ExpFunc(this.factory.func_concat_ws, new ExpStr('\\t'), ...varKeys);
        return this.insertNew(entity, cmp, varKey);
    }

    buildSplitStringToTable(tblName: string, strFieldName: string, strVar: string, delimiter: string): Statement[] {
        let { factory } = this
        let ret: Statement[] = [];

        let c = '$c', p = '$p', len = '$len', int = new il.Int;
        let declare = factory.createDeclare();
        ret.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);

        let varTable = factory.createVarTable();
        ret.push(varTable);
        varTable.name = tblName;
        let strField = il.charField(strFieldName, 100);
        varTable.keys = [strField];
        varTable.fields = [strField];

        let set = factory.createSet();
        ret.push(set);
        set.equ(c, ExpVal.num1);
        set = factory.createSet();
        ret.push(set);
        set.equ(len, new ExpFunc(factory.func_length, new ExpVar(strVar)));

        let loop = factory.createWhile();
        ret.push(loop);
        loop.no = 1;
        loop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new ExpFunc(factory.func_charindex, new ExpStr(delimiter), new ExpVar(strVar), new ExpVar(c)));
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
            col: strFieldName,
            val: new ExpFunc(
                'SUBSTRING',
                new ExpVar(strVar),
                new ExpVar(c),
                new ExpSub(new ExpVar(p), new ExpVar(c))
            )
        });

        let iffEnd = factory.createIf();
        lstats.add(iffEnd);
        iffEnd.cmp = new ExpGE(new ExpVar(p), new ExpVar(len));
        let leave = factory.createBreak();
        iffEnd.then(leave);
        leave.no = loop.no;

        let setInc = factory.createSet();
        lstats.add(setInc);
        setInc.equ(c, new ExpAdd(new ExpVar(p), ExpVal.num1));
        return ret;
    }

    buildTextToTable(textVar: string, tableName: string, tableFields: Field[], statNo: number): Statement[] {
        let sqls: Statement[] = [];
        let name = tableName;
        let fields = tableFields;
        let factory = this.factory;
        let dec = factory.createDeclare();
        sqls.push(dec);
        let vp = name + '#p';
        let vc = name + '#c';
        let vLen = name + '#len';
        dec.vars(intField(vp), intField(vc), intField(vLen), intField('$row'));
        for (let f of fields) {
            dec.var(name + '##' + f.name, f.dataType);
        }

        let setP = factory.createSet();
        sqls.push(setP);
        setP.equ(vp, ExpVal.num1);
        let setLen = factory.createSet();
        sqls.push(setLen);
        setLen.equ(vLen, new ExpFunc(factory.func_length, new ExpVar(textVar)));

        let loop = factory.createWhile();
        sqls.push(loop);
        loop.no = statNo;
        loop.cmp = new ExpGT(new ExpVar(vLen), ExpVal.num0);

        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let sep: string;
            let iff: If = undefined;
            if (i === len - 1) {
                sep = '\\n';
                iff = factory.createIf();
                iff.cmp = new ExpLT(new ExpVar(vc), ExpVal.num1);
                let setPC = factory.createSet()
                iff.then(setPC);
                setPC.equ(vc, new ExpAdd(new ExpVar(vLen), ExpVal.num1));
            }
            else {
                sep = '\\t';
            }
            let setC = factory.createSet();
            loop.statements.add(setC);
            setC.equ(vc,
                new ExpFunc(factory.func_charindex, new ExpStr(sep), new ExpVar(textVar), new ExpVar(vp)));
            if (iff !== undefined) loop.statements.add(iff);
            let setF = factory.createSet();
            loop.statements.add(setF);
            let field = fields[i];
            setF.equ(name + '##' + field.name,
                new ExpFunc(factory.func_substr, new ExpVar(textVar), new ExpVar(vp), new ExpSub(new ExpVar(vc), new ExpVar(vp))));
            let setPAhead = factory.createSet();
            loop.statements.add(setPAhead);
            setPAhead.equ(vp, new ExpAdd(new ExpVar(vc), ExpVal.num1));
        }
        let insert = factory.createInsert();
        loop.statements.add(insert);
        insert.table = new VarTable(name);
        for (let f of fields) {
            insert.cols.push({
                col: f.name,
                val: new ExpVar(name + '##' + f.name)
            });
        }

        let iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new ExpGE(new ExpVar(vc), new ExpVar(vLen));
        let leave = factory.createBreak();
        iffExit.then(leave);
        leave.no = statNo;
        return sqls;
    }

    pullCheckProc(p: Procedure, entityName: string, type: 'tuid' | 'map') {
        let { factory } = this;
        p.addUnitParameter();
        p.parameters.push(
            il.charField('entity', 100),
            il.textField('modifies'),
        );

        let autoId = intField('$id');
        autoId.autoInc = true;
        autoId.nullable = false;

        let row = intField('row');
        let modifyId = bigIntField('modifyId');
        //let entity = charField('entity', 100);
        let key = charField('key', 100);
        let fields: Field[] = [modifyId, key];
        let allFields: Field[] = [autoId, ...fields];

        let table = factory.createVarTable();
        table.name = 'tbl';
        table.fields = allFields;
        table.keys = [autoId];
        p.statements.push(table);

        let retTable = factory.createVarTable();
        retTable.name = 'ret_tbl';
        retTable.fields = allFields;
        retTable.keys = [autoId];
        p.statements.push(retTable);

        let toTbl = this.buildTextToTable('modifies', 'tbl', fields, 1);
        p.statements.push(...toTbl);

        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.vars(autoId, modifyId, key, row);

        let set1 = factory.createSet();
        p.statements.push(set1);
        set1.equ(row.name, ExpVal.num1);

        let loop = factory.createWhile();
        p.statements.push(loop);
        loop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
        loop.no = 100;

        let setAutoIdNull = factory.createSet();
        loop.statements.add(setAutoIdNull);
        setAutoIdNull.equ(autoId.name, ExpVal.null);

        let select = factory.createSelect();
        loop.statements.add(select);
        select.toVar = true;
        allFields.forEach(v => select.col(v.name, v.name));
        select.from(new VarTable('tbl'));
        select.where(new ExpEQ(new ExpField(autoId.name), new ExpVar(row.name)));

        let iffNull = factory.createIf();
        loop.statements.add(iffNull);
        iffNull.cmp = new ExpIsNull(new ExpVar(autoId.name));
        let leave = factory.createBreak();
        iffNull.then(leave);
        leave.no = loop.no;

        let selectExists = factory.createSelect();
        if (type === 'map') {
            selectExists.col('keyCount', 'a');
            selectExists.from(new EntityTable('$map_pull', this.hasUnit, 'a'))
                .join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
                .on(new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')));
            selectExists.where(new ExpAnd(
                new ExpEQ(
                    new ExpField('keys', 'a'),
                    new ExpFunc(factory.func_substring_index,
                        new ExpVar(key.name),
                        new ExpStr('\\t'),
                        new ExpField('keyCount', 'a'))
                ),
                new ExpEQ(new ExpField('name', 'b'), new ExpVar('entity'))
            ));
        }
        else if (type === 'tuid') {
            selectExists.col('id');
            selectExists.from(new EntityTable(entityName, this.hasUnit))
            selectExists.where(new ExpEQ(new ExpField('id'), new ExpVar(key.name)));
        }

        let ifExists = factory.createIf();
        loop.statements.add(ifExists);
        ifExists.cmp = new ExpExists(selectExists);

        let colFields = [modifyId, key];
        let insert = factory.createInsert();
        ifExists.then(insert);
        insert.table = new VarTable('ret_tbl');
        insert.cols = colFields.map(v => {
            let vn = v.name;
            return { col: vn, val: new ExpVar(vn) }
        });

        let setAdd1 = factory.createSet();
        loop.statements.add(setAdd1);
        setAdd1.equ(row.name, new ExpAdd(new ExpVar(row.name), ExpVal.num1));

        let retSelect = factory.createSelect();
        p.statements.push(retSelect);
        colFields.forEach(v => retSelect.col(v.name));
        retSelect.from(new VarTable('ret_tbl'));
    }

    tableSeed(varName: string, seedSettingName: string): Statement[] {
        let select = this.factory.createSelect();
        select.toVar = true;
        select.column(new ExpAdd(new ExpField('big'), ExpVal.num1), varName);
        select.from(new EntityTable('$setting', false));
        let sqWheres = [new ExpEQ(new ExpField('name'), new ExpStr(seedSettingName))];
        if (this.hasUnit === true) {
            sqWheres.push(new ExpEQ(new ExpField(this.unitFieldName), ExpVal.num0));
        }
        select.where(new ExpAnd(...sqWheres));
        select.lock = LockType.update;
        let update = this.factory.createUpdate();
        update.cols = [
            { col: 'big', val: new ExpVar(varName) }
        ];
        update.table = new EntityTable('$setting', false);
        update.where = new ExpAnd(...sqWheres);
        return [select, update];
    }

    buildParam(field: Field, parameters: Field[], stats: Statement[], declare: Declare) {
        let { name, dataType, defaultValue } = field;
        switch (dataType.type) {
            default:
                parameters.push(field);
                if (defaultValue) {
                    let iff = this.factory.createIf();
                    stats.push(iff);
                    iff.cmp = new ExpIsNull(new ExpVar(name));
                    let setDefault = this.factory.createSet();
                    iff.then(setDefault);
                    setDefault.equ(name, new ExpStr(defaultValue));
                }
                break;
            case 'datetime':
                let pn = `_$${name}_`;
                parameters.push(bigIntField(pn));
                declare.vars(field);
                let iif = this.factory.createIf();
                stats.push(iif);
                iif.cmp = new ExpIsNotNull(new ExpVar(pn));
                let set = this.factory.createSet();
                iif.then(set);
                set.equ(name, new ExpFunc(this.factory.func_from_unixtime, new ExpVar(pn)));
                break;
        }
    }

    buildSelectVID(entityName: string, toVar: string, divName?: string): Select {
        let tableName: string, entDivName: string;
        if (divName !== undefined) {
            tableName = entityName + '_' + divName;
            entDivName = entityName + '.' + divName;
        }
        else {
            entDivName = tableName = entityName;
        }
        let selectVId = this.factory.createSelect();
        selectVId.toVar = true;
        let selectSeed = this.factory.createSelect();
        selectSeed.column(new ExpField('auto_increment'));
        selectSeed.from(new GlobalTable('information_schema', 'TABLES'));
        selectSeed.where(new ExpAnd(
            new ExpEQ(new ExpField('table_name'),
                new ExpFunc(this.factory.func_concat, new ExpStr(this.twProfix), new ExpStr(tableName))),
            new ExpEQ(new ExpField('TABLE_SCHEMA'), new ExpStr(this.dbName)),
        ));
        selectSeed.lock = LockType.none;
        let colVId = new ExpFunc(
            this.factory.func_greatest,
            new ExpFunc(
                this.factory.func_ifnull,
                new ExpSelect(selectSeed),
                ExpVal.num1),
            new ExpFunc(
                this.factory.func_ifnull,
                new ExpField('tuidVId'),
                ExpVal.num1)
        );
        selectVId.column(colVId, toVar);
        selectVId.from(sysTable(EnumSysTable.entity));
        selectVId.where(new ExpEQ(new ExpField('name'), new ExpStr(entDivName)));
        selectVId.lock = LockType.update;
        return selectVId;
    }

    // 如果是bus，数据main就是数组，所以需要loop。
    dataParse(proc: Procedure, statements: Statement[]
        , action: { fields: IField[]; arrs: IArr[]; }
        , sheet: Sheet
        , statsSetImportingBusVar: Statement[]
        , loopState?: While) {
        let loop: Statement[] = loopState === undefined ?
            statements : loopState.statements.statements;
        let factory = this.factory
        let declare = factory.createDeclare();
        statements.push(declare);
        let dtInt = new Int(), dtChar = new Char(), dtStr = new Char(3900);
        dtChar.size = 10;
        let p = '$p', c = '$c', d = '$d', sep = '$sep'
            , r = '$r'
            , rn = '$rn', arrn = '$arrn', pLoopEnd = '$pLoopEnd'
            , data = '$data', dataLen = '$dataLen'
            , date = '$date' //, historyDate='$historyDate'
            , sheetType = '$sheetType', row = '$row', sec = '$sec';

        declare.var(p, dtInt).var(c, dtInt).var(d, dtInt).var(sep, dtChar)
            .var(r, dtChar)
            .var(rn, dtChar).var(arrn, dtChar).var(pLoopEnd, dtChar)
            .var(dataLen, dtInt)
            .var(date, new DateTime(6))
            // .var(historyDate, new DateTime(6))
            .var(sheetType, dtInt).var(row, dtInt).var(sec, dtStr);
        let vSep = new ExpVar(sep), vData = new ExpVar(data),
            vC = new ExpVar(c), vD = new ExpVar(d), vP = new ExpVar(p),
            vR = new ExpVar(r),
            vRn = new ExpVar(rn), vArrn = new ExpVar(arrn),
            vPLoopEnd = new ExpVar(pLoopEnd);
        let { fields: actionFields, arrs: actionArrs } = action;
        if (actionFields !== undefined) {
            for (let f of actionFields) declare.var(f.name, f.dataType);
        }
        if (actionArrs) {
            let textType = new Text();
            for (let arr of actionArrs) {
                let fields = arr.fields;
                let len = fields.length;
                declare.var('$' + arr.name + '_', dtInt);
                declare.var('$' + arr.name + '$', dtInt);
                for (let i = 0; i < len; i++) {
                    let f = fields[i];
                    // 原本这个地方应该是原始的数据类型的
                    // 后来，在map add action中，如果那个值为\b, 则取原值。
                    // 如果是int类型，正好值是0的时候，\b直接就是0，比较的时候0=\b, 直接激发取原值。
                    // 所以只好把这个类型改成text
                    // declare.var(arr.name + '_' + f.name, dt.dataType);
                    declare.var(arr.name + '_' + f.name, textType);
                }
            }
        }
        statsAddSet(date, new ExpFunc(factory.func_now, new ExpNum(6)));
        // statsAddSet(historyDate, new ExpVar(date));
        let iifDataNull = factory.createIf();
        statements.push(iifDataNull);
        iifDataNull.cmp = new ExpIsNull(vData);
        iifDataNull.then(proc.createLeaveProc());

        statsAddSet(dataLen, new ExpFunc(factory.func_length, vData));

        //let sheet = (this.entity as any).sheet;
        if (sheet !== undefined) {
            let select = factory.createSelect();
            select.from(sysTable(EnumSysTable.entity));
            select.toVar = true;
            select.col('id', sheetType);
            select.where(new ExpEQ(new ExpField('name'), new ExpStr(sheet.name)));
            statements.push(select);
        }

        statsAddSet(c, ExpVal.num1);
        statsAddSet(p, ExpVal.num1);
        statsAddSet(sep, new ExpFunc('CHAR', new ExpNum(9)));
        statsAddSet(rn, new ExpFunc('CHAR', new ExpNum(10)));
        statsAddSet(arrn, new ExpFunc('CONCAT', vRn, vRn));

        // 处理第一个字符\r 13，则为数据escape序列
        if (statsSetImportingBusVar !== undefined) {
            let ifDataLen0 = factory.createIf();
            statements.push(ifDataLen0);
            ifDataLen0.cmp = new ExpEQ(new ExpVar(dataLen), ExpNum.num0);
            ifDataLen0.then(proc.createLeaveProc());

            let if13 = factory.createIf();
            statements.push(if13);
            if13.cmp = new ExpEQ(new ExpFunc('ascii', vData), new ExpNum(13));
            let setR = factory.createSet();
            if13.then(setR);
            setR.equ(r, new ExpFunc('CHAR', new ExpNum(13)));

            if (statsSetImportingBusVar.length > 0) {
                let ifImporting = factory.createIf();
                if13.then(ifImporting);
                ifImporting.cmp = new ExpEQ(new ExpFunc(factory.func_substr, vData, ExpNum.num2, ExpNum.num1), new ExpStr('^'));
                let setImporting = factory.createSet();
                ifImporting.then(setImporting);
                setImporting.equ('$importing', ExpNum.num1);
            }

            let setP = factory.createSet();
            if13.then(setP);
            setP.equ(p, new ExpFunc(factory.func_charindex, vR, vData, ExpNum.num2));
            let ifP0 = factory.createIf();
            if13.then(ifP0);
            ifP0.cmp = new ExpLE(vP, ExpNum.num0);
            ifP0.then(proc.createLeaveProc());
            let setPPlus1 = factory.createSet();
            if13.then(setPPlus1);
            setPPlus1.equ(p, new ExpAdd(vP, ExpNum.num1));
            let setCP = factory.createSet();
            if13.then(setCP);
            setCP.equ(c, vP);
            if13.then(...statsSetImportingBusVar);
        }

        /*
        pLoopEnd是每一个分节的结束。每一个分节自己找结尾，而不是一次找3个回车
        statsAddSet(
            pLoopEnd, 
            new ExpFunc(
                factory.func_charindex,
                new ExpFunc('CONCAT', vRn, vRn, vRn), 
                vData, vC),
        );
        let iffLoopEnd0 = factory.createIf();
        statements.push(iffLoopEnd0);
        iffLoopEnd0.cmp = new ExpLE(new ExpVar(pLoopEnd), ExpNum.num0);
        let loopEndDataLen = factory.createSet();
        iffLoopEnd0.then(loopEndDataLen);
        loopEndDataLen.equ(pLoopEnd, new ExpVar(dataLen));
        let loopEndAdd3 = factory.createSet();
        iffLoopEnd0.else(loopEndAdd3);
        loopEndAdd3.equ(pLoopEnd, new ExpAdd(new ExpVar(pLoopEnd), new ExpNum(3)));

        新代码改动如下：
        第一节，主表的结束回车。如果没有结束回车，直接pLoopEnd=dataLen;
        */

        /* 下面注释代码都要移到loop里面
        statsAddSet(
            pLoopEnd, 
            new ExpFunc(
                factory.func_charindex,
                vRn, 
                vData, vC),
        );
        let iffLoopEnd0 = factory.createIf();
        statements.push(iffLoopEnd0);
        iffLoopEnd0.cmp = new ExpLE(new ExpVar(pLoopEnd), ExpNum.num0);
        let loopEndDataLen = factory.createSet();
        iffLoopEnd0.then(loopEndDataLen);
        loopEndDataLen.equ(pLoopEnd, new ExpVar(dataLen));
        let loopEndAdd1 = factory.createSet();
        iffLoopEnd0.else(loopEndAdd1);
        loopEndAdd1.equ(pLoopEnd, new ExpAdd(new ExpVar(pLoopEnd), ExpNum.num1));
        let lenActionFields = actionFields.length;
        if (lenActionFields === 0) {
            statsAddSet(c, new ExpVar(pLoopEnd));
        }
        */
        let lenActionFields = actionFields.length;
        if (lenActionFields === 0) {
            let iffFirstCharN = factory.createIf();
            loop.push(iffFirstCharN);
            iffFirstCharN.cmp = new ExpEQ(new ExpFunc('ASCII', vData), new ExpNum(10));
            let setLoopEnd2 = factory.createSet();
            iffFirstCharN.then(setLoopEnd2);
            setLoopEnd2.equ(pLoopEnd, ExpNum.num2);
            let setLoopEnd1 = factory.createSet();
            iffFirstCharN.else(setLoopEnd1);
            setLoopEnd1.equ(pLoopEnd, ExpNum.num1);
            loopAddSet(c, new ExpVar(pLoopEnd));
        }
        else {
            loopAddSet(
                pLoopEnd,
                new ExpFunc(
                    factory.func_charindex,
                    vRn,
                    vData, vC),
            );
            let iffLoopEnd0 = factory.createIf();
            loop.push(iffLoopEnd0);
            iffLoopEnd0.cmp = new ExpLE(new ExpVar(pLoopEnd), ExpNum.num0);
            let loopEndDataLen = factory.createSet();
            iffLoopEnd0.then(loopEndDataLen);
            loopEndDataLen.equ(pLoopEnd, new ExpVar(dataLen));
            let loopEndAdd1 = factory.createSet();
            iffLoopEnd0.else(loopEndAdd1);
            loopEndAdd1.equ(pLoopEnd, new ExpAdd(new ExpVar(pLoopEnd), ExpNum.num1));
        }

        if (loopState !== undefined) statements.push(loopState);

        for (let i = 0; i < lenActionFields; i++) {
            let f = actionFields[i];
            let fn = f.name;
            // let dt = f.dataType.type;
            loopAddSet(p, new ExpFunc(factory.func_charindex, i === lenActionFields - 1 ? vRn : vSep, vData, vC));
            let select = factory.createSelect();
            loop.push(select);
            select.toVar = true;
            let val = new ExpFunc(
                'NULLIF',
                new ExpFunc('SUBSTR', vData, vC, new ExpSub(vP, vC)),
                new ExpStr('')
            );
            if (f.dataType.type === 'datetime') {
                val = new ExpFunc(factory.func_from_unixtime, val);
            }
            select.column(val, fn);
            select.column(new ExpAdd(vP, ExpVal.num1), c);
            select.column(new ExpDecDiv(ExpVal.num1, vP), d);
        }

        let arrEnd: string;
        for (let arr of actionArrs) {
            let arrStart = '$' + arr.name + '_';
            //let vArrStart = new ExpVar(arrStart);
            loopAddSet(arrStart, arrEnd === undefined ?
                new ExpVar(c) :
                new ExpAdd(new ExpVar(arrEnd), ExpVal.num2));
            arrEnd = '$' + arr.name + '$';
            loopAddSet(arrEnd, new ExpFunc(factory.func_charindex, vArrn, vData, vPLoopEnd));
            let ifArrEnd0 = factory.createIf();
            loop.push(ifArrEnd0);
            ifArrEnd0.cmp = new ExpEQ(new ExpVar(arrEnd), ExpNum.num0);
            let setArrEndLoopEnd = factory.createSet();
            ifArrEnd0.then(setArrEndLoopEnd);
            setArrEndLoopEnd.equ(arrEnd, vPLoopEnd);
            loopAddSet(pLoopEnd, new ExpAdd(new ExpVar(arrEnd), ExpVal.num2));
        }
        function statsAddSet(name: string, exp: ExpVal) {
            let s = factory.createSet();
            statements.push(s);
            s.equ(name, exp);
        }
        function loopAddSet(name: string, exp: ExpVal) {
            let s = factory.createSet();
            loop.push(s);
            s.equ(name, exp);
        }
    }

    forArr(arr: IArr, sqls: Sqls, no: number, bodyCallback: (statements: Statement[]) => void) {
        let factory = this.factory;
        let arrName = arr.name
        let c = '$c_' + no;
        let row = '$row_' + no;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars(intField(c), intField(row));
        if (arr !== undefined) {
            let start = '$' + arrName + '_';
            let end = '$' + arrName + '$';
            let set = factory.createSet();
            sqls.push(set);
            set.equ(row, ExpVal.num0);
            set = factory.createSet();
            sqls.push(set);
            set.equ(c, new ExpVar(start));
        }
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);

        if (arr !== undefined) {
            let incRow = factory.createSet();
            forS.push(incRow);
            incRow.equ(row, new ExpAdd(new ExpVar(row), ExpVal.num1));
        }

        if (arr !== undefined) {
            let iff = factory.createIf();
            forS.push(iff);
            let varArrName = new ExpVar('$' + arrName + '$');
            iff.cmp = new ExpGE(new ExpVar(c), varArrName);
            let set = factory.createSet();
            iff.then(set);
            set.equ('$c', new ExpAdd(varArrName, ExpNum.num2));
            let leave = factory.createBreak();
            leave.no = _for.no;
            iff.then(leave);
            let iffElseIf = factory.createIf();
            iff.else(iffElseIf);
            iffElseIf.cmp = new ExpIsNull(new ExpVar(c));
            iffElseIf.then(leave);
        }
        let vC = new ExpVar(c);
        let p = '$p', d = '$d', sep = '$sep', rn = '$rn', data = '$data', sec = '$sec';
        let vP = new ExpVar(p), vD = new ExpVar(d),
            vSep = new ExpVar(sep), vRn = new ExpVar(rn), vData = new ExpVar(data);
        let fields = arr.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let f = fields[i];
            //let dt = f.dataType.type;
            let set1 = factory.createSet();
            set1.equ(p, new ExpFunc(factory.func_charindex, i === len - 1 ? vRn : vSep, vData, vC));
            //let set2 = factory.createSet();
            //set2.equ(sec, new ExpFunc('SUBSTRING', vData, vC, new ExpSub(vP, vC)));
            let selectField = factory.createSelect();
            selectField.toVar = true;
            let val = new ExpFunc(
                'NULLIF',
                new ExpFunc('SUBSTR', vData, vC, new ExpSub(vP, vC)),
                new ExpStr('')
            );
            if (f.dataType.type === 'datetime') {
                val = new ExpFunc(factory.func_from_unixtime, val);
            }
            selectField.column(val, arrName + '_' + f.name);
            selectField.column(new ExpAdd(vP, ExpVal.num1), c);
            selectField.column(new ExpDecDiv(ExpVal.num1, vP), d);
            forS.push(set1, selectField);
        }
        bodyCallback(forS);
    }

    buildExpBudId(expBud: ExpVal): ExpVal {
        let { varUser, varSite } = this;
        let ret = new ExpFuncInUq(
            'bud$id',
            [
                varSite, varUser, ExpNum.num1,
                varSite, expBud
            ],
            true
        );
        return ret;
    }

    buildExpPhraseId(expPhrase: ExpVal): ExpVal {
        let { factory } = this;
        let selectPhraseId = factory.createSelect();
        selectPhraseId.col('id');
        selectPhraseId.from(sysTable(EnumSysTable.phrase));
        selectPhraseId.where(new ExpEQ(new ExpField('name'), expPhrase));
        return new ExpSelect(selectPhraseId);
    }

    buildBiz$User(stats: Statement[]) {
        let { factory } = this;
        const $user = '$user';
        const var$Unit = new ExpVar('$unit');
        const var$User = new ExpVar($user);
        let setUser = factory.createSet();
        stats.push(setUser);
        setUser.equ($user, new ExpFuncInUq('$user$id', [var$Unit, var$User, ExpNum.num1, var$User], true));
    }

    sysTable(enumSysTable: EnumSysTable, alias: string = undefined) {
        return sysTable(enumSysTable, alias, this.hasUnit);
    }
}
