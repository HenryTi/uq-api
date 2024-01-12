"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbContext = exports.sysTable = exports.DbObjs = exports.createFactory = exports.max_promises_uq_api = void 0;
const il = require("../il");
const sql_1 = require("./sql");
const sqlBuilder_1 = require("./sql/sqlBuilder");
const sqlMs_1 = require("./sql/sqlMs");
const sqlMy_1 = require("./sql/sqlMy");
const stat = require("./bstatement");
const ent = require("./entity");
const il_1 = require("../il");
const statementWithFrom_1 = require("./sql/statementWithFrom");
const select_1 = require("./sql/select");
const Biz_1 = require("./Biz");
exports.max_promises_uq_api = 10;
function createFactory(dbContext, sqlType) {
    switch (sqlType) {
        default: throw 'not supported sql type:' + sqlType;
        case 'mysql': return new sqlMy_1.MyFactory(dbContext);
        case 'mssql': return new sqlMs_1.MsFactory(dbContext);
    }
}
exports.createFactory = createFactory;
class DbObjs {
    constructor(context) {
        this.tables = [];
        this.procedures = [];
        this.sqls = [];
        this.context = context;
    }
    async updateDb(runner, options) {
        for (let t of this.tables)
            t.buildIdIndex();
        if (await this.updateTables(runner, options) === false) {
            return false;
        }
        if (await this.updateProcs(runner, options) === false) {
            return false;
        }
        let step = 100;
        for (let i = 0;; i += step) {
            let sqls = this.sqls.slice(i, step);
            if (sqls.length === 0)
                break;
            await runner.sql(sqls, []);
        }
        return true;
    }
    async afterPromises(objSchemas, promises) {
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
    async updateTables(runner, options) {
        let ok = true;
        let log = this.context.log;
        let promises = [];
        let tables = [];
        for (let t of this.tables) {
            let sb = this.context.createSqlBuilder();
            t.update(sb);
            log('///++++++' + t.name); // 压缩界面显示
            log(sb.sql);
            log('------///'); // 结束压缩
            if (promises.length >= exports.max_promises_uq_api) {
                if (await this.afterPromises(tables, promises) === false)
                    return false;
                promises = [];
                tables = [];
            }
            promises.push(t.updateDb(this.context, runner, options));
            tables.push(t);
            log();
        }
        if (await this.afterPromises(tables, promises) === false)
            return false;
        return ok;
    }
    async updateTablesRows(runner, options) {
        let ok = true;
        let log = this.context.log;
        let promises = [];
        let tables = [];
        for (let t of this.tables) {
            if (t.fieldsValuesList === undefined)
                continue;
            let sb = this.context.createSqlBuilder();
            t.update(sb);
            log('///++++++' + t.name); // 压缩界面显示
            log(sb.sql);
            log('------///'); // 结束压缩
            if (promises.length >= exports.max_promises_uq_api) {
                if (await this.afterPromises(tables, promises) === false)
                    return false;
                promises = [];
                tables = [];
            }
            promises.push(t.updateRows(this.context, runner, options));
            tables.push(t);
            log();
        }
        if (await this.afterPromises(tables, promises) === false)
            return false;
        return ok;
    }
    async updateProcs(runner, options) {
        let log = this.context.log;
        let len = this.procedures.length;
        let promises = [];
        let procs = [];
        for (let i = 0; i < len; i++) {
            let p = this.procedures[i];
            let sbDrop = this.context.createSqlBuilder();
            p.drop(sbDrop);
            let sb = this.context.createSqlBuilder();
            p.to(sb);
            log('///++++++' + p.name); // 压缩界面显示
            log(sb.sql);
            log('------///'); // 结束压缩
            if (promises.length >= exports.max_promises_uq_api) {
                if (await this.afterPromises(procs, promises) === false)
                    return false;
                promises = [];
                procs = [];
            }
            if (p.isCore === true) {
                promises.push(p.coreUpdateDb(runner, options));
            }
            else {
                promises.push(p.updateDb(runner, options));
            }
            procs.push(p);
            log();
        }
        if (await this.afterPromises(procs, promises) === false)
            return false;
        return true;
    }
}
exports.DbObjs = DbObjs;
function sysTable(t, alias = undefined, hasUnit = false) {
    return new statementWithFrom_1.EntityTable(t, hasUnit, alias);
}
exports.sysTable = sysTable;
class DbContext {
    constructor(compilerVersion, sqlType, dbName, twProfix, log, hasUnit) {
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
        this.unitFieldName = this.unitField.name = sqlBuilder_1.unitFieldName;
        this.unitField.nullable = false;
        this.unitField.dataType = new il.BigInt();
        this.varUnit = new sql_1.ExpVar(sqlBuilder_1.unitFieldName);
        this.varSite = new sql_1.ExpVar('$site');
        let userField = new il.Field();
        userField.name = sqlBuilder_1.userParamName;
        userField.nullable = true;
        userField.dataType = new il.BigInt();
        this.userParam = userField;
        this.varUser = new sql_1.ExpVar(sqlBuilder_1.userParamName);
    }
    get objDbName() { var _a; return (_a = this.ownerDbName) !== null && _a !== void 0 ? _a : this.dbName; }
    createTable(tblName) {
        return this.factory.createTable(this.objDbName, tblName);
    }
    createProcedure(procName, isCore = false) {
        return this.factory.createProcedure(this.objDbName, procName, isCore);
    }
    // isCore = true; function必须在编译时刻生成。运行时没有机会生成。
    createFunction(procName, returnType) {
        return this.factory.createFunction(this.objDbName, procName, returnType);
    }
    createSqlBuilder() {
        let sb = this.factory.createSqlBuilder();
        sb.hasUnit = this.hasUnit;
        sb.unit = this.unitField;
        return sb;
    }
    createClientBuilder() {
        let sb = this.factory.createClientBuilder();
        sb.hasUnit = this.hasUnit;
        sb.unit = this.unitField;
        return sb;
    }
    createAppProc(name, isCore = false) {
        let p = this.factory.createProcedure(this.objDbName, name, isCore);
        this.appObjs.procedures.push(p);
        return p;
    }
    createAppFunc(name, returnType) {
        let p = this.factory.createFunction(this.objDbName, name, returnType);
        this.appObjs.procedures.push(p);
        return p;
    }
    convertExp(exp) {
        let ret = (0, sql_1.convertExp)(this, exp);
        return ret;
    }
    expCmp(exp) {
        return (0, sql_1.convertExp)(this, exp);
    }
    expVal(exp) {
        return (0, sql_1.convertExp)(this, exp);
    }
    arr(v) { return new ent.BArr(this, v); }
    role(v) { return new ent.BRole(this, v); }
    import(v) { return new ent.BImport(this, v); }
    enm(v) { return new ent.BEnum(this, v); }
    _const(v) { return new ent.BConst(this, v); }
    dataTypeDefine(v) { return new ent.BDataTypeDefine(this, v); }
    queue(v) { return new ent.BQueue(this, v); }
    bus(v) { return new ent.BBus(this, v); }
    book(v) { return new ent.BBook(this, v); }
    map(v) { return new ent.BMap(this, v); }
    history(v) { return new ent.BHistory(this, v); }
    pending(v) { return new ent.BPending(this, v); }
    action(v) { return new ent.BAct(this, v); }
    func(v) { return new ent.BFunction(this, v); }
    sysproc(v) { return new ent.BSysProc(this, v); }
    proc(v) { return new ent.BProc(this, v); }
    query(v) { return new ent.BQuery(this, v); }
    tuid(v) { return ent.BTuid.create(this, v); }
    ID(v) { return new ent.BID(this, v); }
    IX(v) { return new ent.BIX(this, v); }
    IDX(v) { return new ent.BIDX(this, v); }
    ;
    Biz(v) { return new Biz_1.BBiz(this, v); }
    ;
    varStatement(v) { return new stat.BVarStatement(this, v); }
    tableStatement(v) { return new stat.BTableStatement(this, v); }
    textStatement(v) { return new stat.BTextStatement(this, v); }
    ;
    setStatement(v) { return new stat.BSetStatement(this, v); }
    putStatement(v) { return new stat.BPutStatement(this, v); }
    fromStatement(v) { return new stat.BFromStatement(this, v); }
    fromStatementInPend(v) { return new stat.BFromStatementInPend(this, v); }
    withIDDelOnId(v) { return new stat.BWithIDDelOnId(this, v); }
    withIDDelOnKeys(v) { return new stat.BWithIDDelOnKeys(this, v); }
    withIDXDel(v) { return new stat.BWithIDXDel(this, v); }
    withIXDel(v) { return new stat.BWithIXDel(this, v); }
    withIDSetOnId(v) { return new stat.BWithIDSetOnId(this, v); }
    withIDSetOnKeys(v) { return new stat.BWithIDSetOnKeys(this, v); }
    withIDXSet(v) { return new stat.BWithIDXSet(this, v); }
    withIXSet(v) { return new stat.BWithIXSet(this, v); }
    withTruncate(v) { return new stat.BWithTruncate(this, v); }
    bizBinActStatement(v) { return new stat.BBizBinActStatement(this, v); }
    bizInActStatement(v) { return new stat.BBizInActStatement(this, v); }
    // bizBinActSubPend(v: il.BizPendStatement<il.BizBinAct>) { return new stat.BBizBinActSubPend(this, v); }
    // bizBinActSubSubject(v: il.BizTitleStatement<il.BizBinAct>) { return new stat.BBizBinActTitle(this, v); }
    bizBinActSubPend(v) { return new stat.BBizBinActSubPend(this, v); }
    bizActSubTitle(v) { return new stat.BBizBinActTitle(this, v); }
    bizInActSubPend(v) { return new stat.BBizInActSubPend(this, v); }
    value(v) { return new stat.BValueStatement(this, v); }
    settingStatement(v) { return new stat.BSettingStatement(this, v); }
    ifStatement(v) { return new stat.BIfStatement(this, v); }
    whileStatement(v) { return new stat.BWhileStatement(this, v); }
    breakStatement(v) { return new stat.BBreakStatement(this, v); }
    continueStatement(v) { return new stat.BContinueStatement(this, v); }
    returnStatement(v) { return new stat.BReturnStatement(this, v); }
    returnStartStatement() { return new stat.BReturnStartStatement(this, undefined); }
    returnEndStatement() { return new stat.BReturnEndStatement(this, undefined); }
    procStatement(v) { return new stat.BProcStatement(this, v); }
    foreachArr(v, forArr) { return new stat.BForArr(this, v, forArr); }
    foreachBizInOutArr(v, forArr) { return new stat.BForBizInOutArr(this, v, forArr); }
    foreachSelect(v, forSelect) { return new stat.BForSelect(this, v, forSelect); }
    foreachQueue(v, forQueue) { return new stat.BForQueue(this, v, forQueue); }
    selectStatement(v) { return new stat.BSelect(this, v); }
    deleteStatement(v) { return new stat.BDeleteStatement(this, v); }
    bookWrite(v) { return new stat.BBookWrite(this, v); }
    //pull(v: il.Pull) { return new stat.BPull(this, v) }
    historyWrite(v) { return new stat.BHistoryWrite(this, v); }
    pendingWrite(v) { return new stat.BPendingWrite(this, v); }
    tuidWrite(v) { return new stat.BTuidWrite(this, v); }
    stateTo(v) { return new stat.BStateTo(this, v); }
    fail(v) { return new stat.BFailStatement(this, v); }
    busStatement(v) { return new stat.BBusStatement(this, v); }
    sendMsgStatement(v) { return new stat.BSendMsgStatement(this, v); }
    sendAppStatement(v) { return new stat.BSendAppStatement(this, v); }
    inlineStatement(v) { return new stat.BInlineStatement(this, v); }
    schedule(v) { return new stat.BScheduleStatement(this, v); }
    logStatement(v) { return new stat.BLogStatement(this, v); }
    execSqlStatement(v) { return new stat.BExecSqlStatement(this, v); }
    transactionStatement(v) { return new stat.BTransactionStatement(this, v); }
    pokeStatement(v) { return new stat.BPokeStatement(this, v); }
    sleepStatement(v) { return new stat.BSleepStatement(this, v); }
    roleStatement(v) { return new stat.BRoleStatement(this, v); }
    queueStatement(v) { return new stat.BQueueStatement(this, v); }
    useStatement(v) { return new stat.BUseStatement(this, v); }
    add$UnitCol(cols) {
        if (this.hasUnit == false)
            return;
        cols.push({ col: '$unit', val: new sql_1.ExpVar('$unit') });
    }
    // 现在不需要自动的拉取tuid的操作了
    // 如果要拉取，直接写pull xxx at (key);
    // 实际上，很少tuid需要真正拉取，除非要做以名字为核心的查询。
    buildPullTuidField(field, idVal) {
        if (!field)
            return;
        let { tuid } = field;
        if (!tuid)
            return;
        return this.buildTuidPull(tuid, idVal);
    }
    buildModifyQueue(entity, key) {
        if (!entity.isOpen)
            return; // 不能返回[]. 必须在函数外做判断
        let insertModifyQueue = this.factory.createInsert();
        let selectEntity = this.factory.createSelect();
        selectEntity.from(sysTable(il.EnumSysTable.entity));
        selectEntity.col('id');
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(entity.name)));
        insertModifyQueue.table = new statementWithFrom_1.EntityTable('$modify_queue', this.hasUnit);
        insertModifyQueue.cols = [
            { col: 'entity', val: new sql_1.ExpSelect(selectEntity) },
            { col: 'key', val: key }
        ];
        if (this.hasUnit === true) {
            insertModifyQueue.cols.push({
                col: '$unit', val: new sql_1.ExpVar('$unit')
            });
        }
        let update = this.factory.createUpdate();
        update.table = sysTable(il.EnumSysTable.unit);
        update.cols = [
            { col: 'modifyQueueMax', val: new sql_1.ExpFunc(this.factory.func_lastinsertid) }
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('$unit'));
        return [insertModifyQueue, update];
    }
    insertNew(entity, cmp, varKey) {
        let iff = this.factory.createIf();
        iff.cmp = cmp;
        let insert = this.factory.createInsert();
        iff.then(insert);
        let selectEntity = this.factory.createSelect();
        selectEntity.from(sysTable(il.EnumSysTable.entity));
        selectEntity.col('id');
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(entity.name)));
        insert.table = new statementWithFrom_1.EntityTable('$from_new', this.hasUnit);
        insert.cols = [
            { col: 'entity', val: new sql_1.ExpSelect(selectEntity) },
            { col: 'key', val: varKey },
        ];
        if (this.hasUnit === true)
            insert.cols.push({
                col: '$unit', val: new sql_1.ExpVar('$unit')
            });
        return iff;
    }
    buildTuidPull(entity, varKey) {
        let { from, sync: isPull, global, id } = entity;
        if (from === undefined)
            return;
        if (isPull === false)
            return;
        let idName = id.name;
        let selectExists = this.factory.createSelect();
        selectExists.lock = select_1.LockType.update;
        selectExists.column(new sql_1.ExpField(idName));
        selectExists.from(new statementWithFrom_1.EntityTable(entity.name, this.hasUnit && global === false));
        selectExists.where(new sql_1.ExpEQ(new sql_1.ExpField(idName), varKey));
        let cmp = new sql_1.ExpExists(selectExists);
        return this.insertNew(entity, cmp, varKey);
    }
    buildMapPull(entity, varKeys) {
        let { from, keys } = entity;
        if (from === undefined)
            return;
        let cmps = [];
        for (let i = 0; i < keys.length; i++) {
            let v = varKeys[i];
            if (v === undefined)
                break;
            let exists = this.factory.createSelect();
            let field = keys[i];
            let { tuid } = field;
            let idName = tuid.id.name;
            exists.lock = select_1.LockType.update;
            exists.column(new sql_1.ExpField(idName));
            exists.from(new statementWithFrom_1.EntityTable(tuid.name, this.hasUnit && tuid.global === false));
            exists.where(new sql_1.ExpEQ(new sql_1.ExpField(idName), v));
            cmps.push(new sql_1.ExpExists(exists));
        }
        let cmp = new sql_1.ExpAnd(...cmps);
        let varKey = new sql_1.ExpFunc(this.factory.func_concat_ws, new sql_1.ExpStr('\\t'), ...varKeys);
        return this.insertNew(entity, cmp, varKey);
    }
    buildSplitStringToTable(tblName, strFieldName, strVar, delimiter) {
        let { factory } = this;
        let ret = [];
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
        set.equ(c, sql_1.ExpVal.num1);
        set = factory.createSet();
        ret.push(set);
        set.equ(len, new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar(strVar)));
        let loop = factory.createWhile();
        ret.push(loop);
        loop.no = 1;
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpStr(delimiter), new sql_1.ExpVar(strVar), new sql_1.ExpVar(c)));
        let iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql_1.ExpLE(new sql_1.ExpVar(p), sql_1.ExpVal.num0);
        set = factory.createSet();
        iff.then(set);
        set.equ(p, new sql_1.ExpAdd(new sql_1.ExpVar(len), sql_1.ExpVal.num1));
        let insert = factory.createInsert();
        lstats.add(insert);
        insert.table = new sql_1.SqlVarTable(varTable.name);
        insert.cols.push({
            col: strFieldName,
            val: new sql_1.ExpFunc('SUBSTRING', new sql_1.ExpVar(strVar), new sql_1.ExpVar(c), new sql_1.ExpSub(new sql_1.ExpVar(p), new sql_1.ExpVar(c)))
        });
        let iffEnd = factory.createIf();
        lstats.add(iffEnd);
        iffEnd.cmp = new sql_1.ExpGE(new sql_1.ExpVar(p), new sql_1.ExpVar(len));
        let leave = factory.createBreak();
        iffEnd.then(leave);
        leave.no = loop.no;
        let setInc = factory.createSet();
        lstats.add(setInc);
        setInc.equ(c, new sql_1.ExpAdd(new sql_1.ExpVar(p), sql_1.ExpVal.num1));
        return ret;
    }
    buildTextToTable(textVar, tableName, tableFields, statNo) {
        let sqls = [];
        let name = tableName;
        let fields = tableFields;
        let factory = this.factory;
        let dec = factory.createDeclare();
        sqls.push(dec);
        let vp = name + '#p';
        let vc = name + '#c';
        let vLen = name + '#len';
        dec.vars((0, il_1.intField)(vp), (0, il_1.intField)(vc), (0, il_1.intField)(vLen), (0, il_1.intField)('$row'));
        for (let f of fields) {
            dec.var(name + '##' + f.name, f.dataType);
        }
        let setP = factory.createSet();
        sqls.push(setP);
        setP.equ(vp, sql_1.ExpVal.num1);
        let setLen = factory.createSet();
        sqls.push(setLen);
        setLen.equ(vLen, new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar(textVar)));
        let loop = factory.createWhile();
        sqls.push(loop);
        loop.no = statNo;
        loop.cmp = new sql_1.ExpGT(new sql_1.ExpVar(vLen), sql_1.ExpVal.num0);
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let sep;
            let iff = undefined;
            if (i === len - 1) {
                sep = '\\n';
                iff = factory.createIf();
                iff.cmp = new sql_1.ExpLT(new sql_1.ExpVar(vc), sql_1.ExpVal.num1);
                let setPC = factory.createSet();
                iff.then(setPC);
                setPC.equ(vc, new sql_1.ExpAdd(new sql_1.ExpVar(vLen), sql_1.ExpVal.num1));
            }
            else {
                sep = '\\t';
            }
            let setC = factory.createSet();
            loop.statements.add(setC);
            setC.equ(vc, new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpStr(sep), new sql_1.ExpVar(textVar), new sql_1.ExpVar(vp)));
            if (iff !== undefined)
                loop.statements.add(iff);
            let setF = factory.createSet();
            loop.statements.add(setF);
            let field = fields[i];
            setF.equ(name + '##' + field.name, new sql_1.ExpFunc(factory.func_substr, new sql_1.ExpVar(textVar), new sql_1.ExpVar(vp), new sql_1.ExpSub(new sql_1.ExpVar(vc), new sql_1.ExpVar(vp))));
            let setPAhead = factory.createSet();
            loop.statements.add(setPAhead);
            setPAhead.equ(vp, new sql_1.ExpAdd(new sql_1.ExpVar(vc), sql_1.ExpVal.num1));
        }
        let insert = factory.createInsert();
        loop.statements.add(insert);
        insert.table = new statementWithFrom_1.VarTable(name);
        for (let f of fields) {
            insert.cols.push({
                col: f.name,
                val: new sql_1.ExpVar(name + '##' + f.name)
            });
        }
        let iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new sql_1.ExpGE(new sql_1.ExpVar(vc), new sql_1.ExpVar(vLen));
        let leave = factory.createBreak();
        iffExit.then(leave);
        leave.no = statNo;
        return sqls;
    }
    pullCheckProc(p, entityName, type) {
        let { factory } = this;
        p.addUnitParameter();
        p.parameters.push(il.charField('entity', 100), il.textField('modifies'));
        let autoId = (0, il_1.intField)('$id');
        autoId.autoInc = true;
        autoId.nullable = false;
        let row = (0, il_1.intField)('row');
        let modifyId = (0, il_1.bigIntField)('modifyId');
        //let entity = charField('entity', 100);
        let key = (0, il_1.charField)('key', 100);
        let fields = [modifyId, key];
        let allFields = [autoId, ...fields];
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
        set1.equ(row.name, sql_1.ExpVal.num1);
        let loop = factory.createWhile();
        p.statements.push(loop);
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        loop.no = 100;
        let setAutoIdNull = factory.createSet();
        loop.statements.add(setAutoIdNull);
        setAutoIdNull.equ(autoId.name, sql_1.ExpVal.null);
        let select = factory.createSelect();
        loop.statements.add(select);
        select.toVar = true;
        allFields.forEach(v => select.col(v.name, v.name));
        select.from(new statementWithFrom_1.VarTable('tbl'));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField(autoId.name), new sql_1.ExpVar(row.name)));
        let iffNull = factory.createIf();
        loop.statements.add(iffNull);
        iffNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(autoId.name));
        let leave = factory.createBreak();
        iffNull.then(leave);
        leave.no = loop.no;
        let selectExists = factory.createSelect();
        if (type === 'map') {
            selectExists.col('keyCount', 'a');
            selectExists.from(new statementWithFrom_1.EntityTable('$map_pull', this.hasUnit, 'a'))
                .join(il_1.JoinType.join, sysTable(il.EnumSysTable.entity, 'b'))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')));
            selectExists.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('keys', 'a'), new sql_1.ExpFunc(factory.func_substring_index, new sql_1.ExpVar(key.name), new sql_1.ExpStr('\\t'), new sql_1.ExpField('keyCount', 'a'))), new sql_1.ExpEQ(new sql_1.ExpField('name', 'b'), new sql_1.ExpVar('entity'))));
        }
        else if (type === 'tuid') {
            selectExists.col('id');
            selectExists.from(new statementWithFrom_1.EntityTable(entityName, this.hasUnit));
            selectExists.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(key.name)));
        }
        let ifExists = factory.createIf();
        loop.statements.add(ifExists);
        ifExists.cmp = new sql_1.ExpExists(selectExists);
        let colFields = [modifyId, key];
        let insert = factory.createInsert();
        ifExists.then(insert);
        insert.table = new statementWithFrom_1.VarTable('ret_tbl');
        insert.cols = colFields.map(v => {
            let vn = v.name;
            return { col: vn, val: new sql_1.ExpVar(vn) };
        });
        let setAdd1 = factory.createSet();
        loop.statements.add(setAdd1);
        setAdd1.equ(row.name, new sql_1.ExpAdd(new sql_1.ExpVar(row.name), sql_1.ExpVal.num1));
        let retSelect = factory.createSelect();
        p.statements.push(retSelect);
        colFields.forEach(v => retSelect.col(v.name));
        retSelect.from(new statementWithFrom_1.VarTable('ret_tbl'));
    }
    tableSeed(varName, seedSettingName) {
        let select = this.factory.createSelect();
        select.toVar = true;
        select.column(new sql_1.ExpAdd(new sql_1.ExpField('big'), sql_1.ExpVal.num1), varName);
        select.from(new statementWithFrom_1.EntityTable('$setting', false));
        let sqWheres = [new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(seedSettingName))];
        if (this.hasUnit === true) {
            sqWheres.push(new sql_1.ExpEQ(new sql_1.ExpField(this.unitFieldName), sql_1.ExpVal.num0));
        }
        select.where(new sql_1.ExpAnd(...sqWheres));
        select.lock = select_1.LockType.update;
        let update = this.factory.createUpdate();
        update.cols = [
            { col: 'big', val: new sql_1.ExpVar(varName) }
        ];
        update.table = new statementWithFrom_1.EntityTable('$setting', false);
        update.where = new sql_1.ExpAnd(...sqWheres);
        return [select, update];
    }
    buildParam(field, parameters, stats, declare) {
        let { name, dataType, defaultValue } = field;
        switch (dataType.type) {
            default:
                parameters.push(field);
                if (defaultValue) {
                    let iff = this.factory.createIf();
                    stats.push(iff);
                    iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(name));
                    let setDefault = this.factory.createSet();
                    iff.then(setDefault);
                    setDefault.equ(name, new sql_1.ExpStr(defaultValue));
                }
                break;
            case 'datetime':
                let pn = `_$${name}_`;
                parameters.push((0, il_1.bigIntField)(pn));
                declare.vars(field);
                let iif = this.factory.createIf();
                stats.push(iif);
                iif.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(pn));
                let set = this.factory.createSet();
                iif.then(set);
                set.equ(name, new sql_1.ExpFunc(this.factory.func_from_unixtime, new sql_1.ExpVar(pn)));
                break;
        }
    }
    buildSelectVID(entityName, toVar, divName) {
        let tableName, entDivName;
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
        selectSeed.column(new sql_1.ExpField('auto_increment'));
        selectSeed.from(new statementWithFrom_1.GlobalTable('information_schema', 'TABLES'));
        selectSeed.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('table_name'), new sql_1.ExpFunc(this.factory.func_concat, new sql_1.ExpStr(this.twProfix), new sql_1.ExpStr(tableName))), new sql_1.ExpEQ(new sql_1.ExpField('TABLE_SCHEMA'), new sql_1.ExpStr(this.dbName))));
        selectSeed.lock = select_1.LockType.none;
        let colVId = new sql_1.ExpFunc(this.factory.func_greatest, new sql_1.ExpFunc(this.factory.func_ifnull, new sql_1.ExpSelect(selectSeed), sql_1.ExpVal.num1), new sql_1.ExpFunc(this.factory.func_ifnull, new sql_1.ExpField('tuidVId'), sql_1.ExpVal.num1));
        selectVId.column(colVId, toVar);
        selectVId.from(sysTable(il.EnumSysTable.entity));
        selectVId.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(entDivName)));
        selectVId.lock = select_1.LockType.update;
        return selectVId;
    }
    // 如果是bus，数据main就是数组，所以需要loop。
    dataParse(proc, statements, action, statsSetImportingBusVar, loopState) {
        let loop = loopState === undefined ?
            statements : loopState.statements.statements;
        let factory = this.factory;
        let declare = factory.createDeclare();
        statements.push(declare);
        let dtInt = new il_1.Int(), dtChar = new il_1.Char(), dtStr = new il_1.Char(3900);
        dtChar.size = 10;
        let p = '$p', c = '$c', d = '$d', sep = '$sep', r = '$r', rn = '$rn', arrn = '$arrn', pLoopEnd = '$pLoopEnd', data = '$data', dataLen = '$dataLen', date = '$date' //, historyDate='$historyDate'
        , sheetType = '$sheetType', row = '$row', sec = '$sec';
        declare.var(p, dtInt).var(c, dtInt).var(d, dtInt).var(sep, dtChar)
            .var(r, dtChar)
            .var(rn, dtChar).var(arrn, dtChar).var(pLoopEnd, dtChar)
            .var(dataLen, dtInt)
            .var(date, new il_1.DateTime(6))
            // .var(historyDate, new DateTime(6))
            .var(sheetType, dtInt).var(row, dtInt).var(sec, dtStr);
        let vSep = new sql_1.ExpVar(sep), vData = new sql_1.ExpVar(data), vC = new sql_1.ExpVar(c), vD = new sql_1.ExpVar(d), vP = new sql_1.ExpVar(p), vR = new sql_1.ExpVar(r), vRn = new sql_1.ExpVar(rn), vArrn = new sql_1.ExpVar(arrn), vPLoopEnd = new sql_1.ExpVar(pLoopEnd);
        let { fields: actionFields, arrs: actionArrs } = action;
        if (actionFields !== undefined) {
            for (let f of actionFields)
                declare.var(f.name, f.dataType);
        }
        if (actionArrs) {
            let textType = new il_1.Text();
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
        statsAddSet(date, new sql_1.ExpFunc(factory.func_now, new sql_1.ExpNum(6)));
        // statsAddSet(historyDate, new ExpVar(date));
        let iifDataNull = factory.createIf();
        statements.push(iifDataNull);
        iifDataNull.cmp = new sql_1.ExpIsNull(vData);
        iifDataNull.then(proc.createLeaveProc());
        statsAddSet(dataLen, new sql_1.ExpFunc(factory.func_length, vData));
        /*
        //let sheet = (this.entity as any).sheet;
        if (sheet !== undefined) {
            let select = factory.createSelect();
            select.from(sysTable(il.EnumSysTable.entity));
            select.toVar = true;
            select.col('id', sheetType);
            select.where(new ExpEQ(new ExpField('name'), new ExpStr(sheet.name)));
            statements.push(select);
        }
        */
        statsAddSet(c, sql_1.ExpVal.num1);
        statsAddSet(p, sql_1.ExpVal.num1);
        statsAddSet(sep, new sql_1.ExpFunc('CHAR', new sql_1.ExpNum(9)));
        statsAddSet(rn, new sql_1.ExpFunc('CHAR', new sql_1.ExpNum(10)));
        statsAddSet(arrn, new sql_1.ExpFunc('CONCAT', vRn, vRn));
        // 处理第一个字符\r 13，则为数据escape序列
        if (statsSetImportingBusVar !== undefined) {
            let ifDataLen0 = factory.createIf();
            statements.push(ifDataLen0);
            ifDataLen0.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(dataLen), sql_1.ExpNum.num0);
            ifDataLen0.then(proc.createLeaveProc());
            let if13 = factory.createIf();
            statements.push(if13);
            if13.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc('ascii', vData), new sql_1.ExpNum(13));
            let setR = factory.createSet();
            if13.then(setR);
            setR.equ(r, new sql_1.ExpFunc('CHAR', new sql_1.ExpNum(13)));
            if (statsSetImportingBusVar.length > 0) {
                let ifImporting = factory.createIf();
                if13.then(ifImporting);
                ifImporting.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_substr, vData, sql_1.ExpNum.num2, sql_1.ExpNum.num1), new sql_1.ExpStr('^'));
                let setImporting = factory.createSet();
                ifImporting.then(setImporting);
                setImporting.equ('$importing', sql_1.ExpNum.num1);
            }
            let setP = factory.createSet();
            if13.then(setP);
            setP.equ(p, new sql_1.ExpFunc(factory.func_charindex, vR, vData, sql_1.ExpNum.num2));
            let ifP0 = factory.createIf();
            if13.then(ifP0);
            ifP0.cmp = new sql_1.ExpLE(vP, sql_1.ExpNum.num0);
            ifP0.then(proc.createLeaveProc());
            let setPPlus1 = factory.createSet();
            if13.then(setPPlus1);
            setPPlus1.equ(p, new sql_1.ExpAdd(vP, sql_1.ExpNum.num1));
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
            iffFirstCharN.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc('ASCII', vData), new sql_1.ExpNum(10));
            let setLoopEnd2 = factory.createSet();
            iffFirstCharN.then(setLoopEnd2);
            setLoopEnd2.equ(pLoopEnd, sql_1.ExpNum.num2);
            let setLoopEnd1 = factory.createSet();
            iffFirstCharN.else(setLoopEnd1);
            setLoopEnd1.equ(pLoopEnd, sql_1.ExpNum.num1);
            loopAddSet(c, new sql_1.ExpVar(pLoopEnd));
        }
        else {
            loopAddSet(pLoopEnd, new sql_1.ExpFunc(factory.func_charindex, vRn, vData, vC));
            let iffLoopEnd0 = factory.createIf();
            loop.push(iffLoopEnd0);
            iffLoopEnd0.cmp = new sql_1.ExpLE(new sql_1.ExpVar(pLoopEnd), sql_1.ExpNum.num0);
            let loopEndDataLen = factory.createSet();
            iffLoopEnd0.then(loopEndDataLen);
            loopEndDataLen.equ(pLoopEnd, new sql_1.ExpVar(dataLen));
            let loopEndAdd1 = factory.createSet();
            iffLoopEnd0.else(loopEndAdd1);
            loopEndAdd1.equ(pLoopEnd, new sql_1.ExpAdd(new sql_1.ExpVar(pLoopEnd), sql_1.ExpNum.num1));
        }
        if (loopState !== undefined)
            statements.push(loopState);
        for (let i = 0; i < lenActionFields; i++) {
            let f = actionFields[i];
            let fn = f.name;
            // let dt = f.dataType.type;
            loopAddSet(p, new sql_1.ExpFunc(factory.func_charindex, i === lenActionFields - 1 ? vRn : vSep, vData, vC));
            let select = factory.createSelect();
            loop.push(select);
            select.toVar = true;
            let val = new sql_1.ExpFunc('NULLIF', new sql_1.ExpFunc('SUBSTR', vData, vC, new sql_1.ExpSub(vP, vC)), new sql_1.ExpStr(''));
            if (f.dataType.type === 'datetime') {
                val = new sql_1.ExpFunc(factory.func_from_unixtime, val);
            }
            select.column(val, fn);
            select.column(new sql_1.ExpAdd(vP, sql_1.ExpVal.num1), c);
            select.column(new sql_1.ExpDecDiv(sql_1.ExpVal.num1, vP), d);
        }
        let arrEnd;
        for (let arr of actionArrs) {
            let arrStart = '$' + arr.name + '_';
            //let vArrStart = new ExpVar(arrStart);
            loopAddSet(arrStart, arrEnd === undefined ?
                new sql_1.ExpVar(c) :
                new sql_1.ExpAdd(new sql_1.ExpVar(arrEnd), sql_1.ExpVal.num2));
            arrEnd = '$' + arr.name + '$';
            loopAddSet(arrEnd, new sql_1.ExpFunc(factory.func_charindex, vArrn, vData, vPLoopEnd));
            let ifArrEnd0 = factory.createIf();
            loop.push(ifArrEnd0);
            ifArrEnd0.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(arrEnd), sql_1.ExpNum.num0);
            let setArrEndLoopEnd = factory.createSet();
            ifArrEnd0.then(setArrEndLoopEnd);
            setArrEndLoopEnd.equ(arrEnd, vPLoopEnd);
            loopAddSet(pLoopEnd, new sql_1.ExpAdd(new sql_1.ExpVar(arrEnd), sql_1.ExpVal.num2));
        }
        function statsAddSet(name, exp) {
            let s = factory.createSet();
            statements.push(s);
            s.equ(name, exp);
        }
        function loopAddSet(name, exp) {
            let s = factory.createSet();
            loop.push(s);
            s.equ(name, exp);
        }
    }
    forArr(arr, sqls, no, bodyCallback) {
        let factory = this.factory;
        let arrName = arr.name;
        let c = '$c_' + no;
        let row = '$row_' + no;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars((0, il_1.intField)(c), (0, il_1.intField)(row));
        if (arr !== undefined) {
            let start = '$' + arrName + '_';
            let end = '$' + arrName + '$';
            let set = factory.createSet();
            sqls.push(set);
            set.equ(row, sql_1.ExpVal.num0);
            set = factory.createSet();
            sqls.push(set);
            set.equ(c, new sql_1.ExpVar(start));
        }
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        if (arr !== undefined) {
            let incRow = factory.createSet();
            forS.push(incRow);
            incRow.equ(row, new sql_1.ExpAdd(new sql_1.ExpVar(row), sql_1.ExpVal.num1));
        }
        if (arr !== undefined) {
            let iff = factory.createIf();
            forS.push(iff);
            let varArrName = new sql_1.ExpVar('$' + arrName + '$');
            iff.cmp = new sql_1.ExpGE(new sql_1.ExpVar(c), varArrName);
            let set = factory.createSet();
            iff.then(set);
            set.equ('$c', new sql_1.ExpAdd(varArrName, sql_1.ExpNum.num2));
            let leave = factory.createBreak();
            leave.no = _for.no;
            iff.then(leave);
            let iffElseIf = factory.createIf();
            iff.else(iffElseIf);
            iffElseIf.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(c));
            iffElseIf.then(leave);
        }
        let vC = new sql_1.ExpVar(c);
        let p = '$p', d = '$d', sep = '$sep', rn = '$rn', data = '$data', sec = '$sec';
        let vP = new sql_1.ExpVar(p), vD = new sql_1.ExpVar(d), vSep = new sql_1.ExpVar(sep), vRn = new sql_1.ExpVar(rn), vData = new sql_1.ExpVar(data);
        let fields = arr.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let f = fields[i];
            //let dt = f.dataType.type;
            let set1 = factory.createSet();
            set1.equ(p, new sql_1.ExpFunc(factory.func_charindex, i === len - 1 ? vRn : vSep, vData, vC));
            //let set2 = factory.createSet();
            //set2.equ(sec, new ExpFunc('SUBSTRING', vData, vC, new ExpSub(vP, vC)));
            let selectField = factory.createSelect();
            selectField.toVar = true;
            let val = new sql_1.ExpFunc('NULLIF', new sql_1.ExpFunc('SUBSTR', vData, vC, new sql_1.ExpSub(vP, vC)), new sql_1.ExpStr(''));
            if (f.dataType.type === 'datetime') {
                val = new sql_1.ExpFunc(factory.func_from_unixtime, val);
            }
            selectField.column(val, arrName + '_' + f.name);
            selectField.column(new sql_1.ExpAdd(vP, sql_1.ExpVal.num1), c);
            selectField.column(new sql_1.ExpDecDiv(sql_1.ExpVal.num1, vP), d);
            forS.push(set1, selectField);
        }
        bodyCallback(forS);
    }
    forBizInOutArr(arr, sqls, no, bodyCallback) {
        const { factory } = this;
        let setRowId0 = factory.createSet();
        sqls.push(setRowId0);
        setRowId0.equ('$rowId', sql_1.ExpNum.num0);
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let setId = factory.createSet();
        forS.push(setId);
        setId.equ('$id', new sql_1.ExpNull());
        let select = factory.createSelect();
        forS.push(select);
        select.from(new statementWithFrom_1.VarTable(arr.name));
        select.toVar = true;
        select.col('$id', '$id');
        for (let [name,] of arr.props) {
            select.col(name, name);
        }
        select.where(new sql_1.ExpGT(new sql_1.ExpField('$id'), new sql_1.ExpVar('$rowId')));
        select.order(new sql_1.ExpField('$id'), 'asc');
        select.limit(sql_1.ExpNum.num1);
        let iff = factory.createIf();
        forS.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('$id'));
        let leave = factory.createBreak();
        leave.no = _for.no;
        iff.then(leave);
        let setRowId = factory.createSet();
        iff.else(setRowId);
        setRowId.equ('$rowId', new sql_1.ExpVar('$id'));
        bodyCallback(forS);
    }
    buildExpBudId(expBud) {
        let { varUser, varSite } = this;
        let ret = new sql_1.ExpFuncInUq('bud$id', [
            varSite, varUser, sql_1.ExpNum.num1,
            varSite, expBud
        ], true);
        return ret;
    }
    buildExpPhraseId(expPhrase) {
        let { factory } = this;
        let selectPhraseId = factory.createSelect();
        selectPhraseId.col('id');
        selectPhraseId.from(sysTable(il.EnumSysTable.phrase));
        selectPhraseId.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), expPhrase));
        return new sql_1.ExpSelect(selectPhraseId);
    }
    buildBiz$User(stats) {
        let { factory } = this;
        const $user = '$user';
        const var$Unit = new sql_1.ExpVar('$unit');
        const var$User = new sql_1.ExpVar($user);
        let setUser = factory.createSet();
        stats.push(setUser);
        setUser.equ($user, new sql_1.ExpFuncInUq('$user$id', [var$Unit, var$User, sql_1.ExpNum.num1, var$User], true));
    }
    sysTable(enumSysTable, alias = undefined) {
        return sysTable(enumSysTable, alias, this.hasUnit);
    }
}
exports.DbContext = DbContext;
//# sourceMappingURL=dbContext.js.map