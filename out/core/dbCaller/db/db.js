"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitxTestDb = exports.UnitxProdDb = exports.UnitxDb = exports.UqDb = exports.NoNameDb = exports.Db = void 0;
const _ = require("lodash");
const MsDbCaller_1 = require("./MsDbCaller");
const MyDbCaller_1 = require("./MyDbCaller");
const tool_1 = require("../../../tool");
class Db {
    /**
     * Db: 对应某个数据库，提供调用该数据库中存储过程等的一般功能
     * @param dbName  uq(即数据库)的名称
     */
    constructor(dbName) {
        this.isExists = false;
        this.dbName = dbName;
        this.dbCaller = this.createDbServer();
    }
    getDbName() { return this.dbName; }
    createDbServer() {
        let dbConfig = this.getDbConfig();
        // if (dbConfig === undefined) throw 'dbConfig not defined';
        // this.serverId = dbConfig['server-id'];
        // delete dbConfig['server-id'];
        this.serverId = tool_1.env.serverId;
        switch (tool_1.env.sqlType) {
            case tool_1.SqlType.mysql: return new MyDbCaller_1.MyDbCaller(this.dbName, dbConfig);
            case tool_1.SqlType.mssql: return new MsDbCaller_1.MsDbCaller(this.dbName, dbConfig);
        }
    }
    reset() {
        this.dbCaller.reset();
    }
    /**
     * 判断本db在服务器上是否存在
     * @returns
     */
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExists === true)
                return true;
            return this.isExists = yield this.dbCaller.existsDatabase();
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.loadTwProfix();
        });
    }
    buildTuidAutoId() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.buildTuidAutoId();
        });
    }
    createProcObjs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.createProcObjs(this.dbName);
        });
    }
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog('sql', params);
            return yield this.dbCaller.sql(sql, params);
        });
    }
    sqlDropProc(procName, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.sqlDropProc(procName, isFunc);
        });
    }
    sqlProc(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.sqlProc(procName, procSql);
        });
    }
    buildProc(procName, procSql, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.buildProc(procName, procSql, isFunc);
        });
    }
    buildRealProcFrom$ProcTable(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.buildRealProcFrom$ProcTable(proc);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.call(proc, params);
        });
    }
    callEx(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.callEx(proc, params);
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.tableFromProc(proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.tablesFromProc(proc, params);
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.createDatabase();
        });
    }
    buildDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.buildDatabase();
        });
    }
    setDebugJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.setDebugJobs();
        });
    }
    saveTextId(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.saveTextId(text);
        });
    }
    execQueueAct() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbCaller.execQueueAct();
        });
    }
    isExistsProc(proc) {
        return this.dbCaller.isExistsProc(proc);
    }
    createProc(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbCaller.createProc(proc);
        });
    }
}
exports.Db = Db;
class NoNameDb extends Db {
    constructor() {
        super(undefined);
    }
    getDbConfig() {
        let ret = tool_1.env.connection;
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
}
exports.NoNameDb = NoNameDb;
class UqDb extends Db {
    getDbConfig() {
        let ret = tool_1.env.connection;
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
}
exports.UqDb = UqDb;
class UnitxDb extends Db {
    getDbConfig() {
        let ret = this.getUnitxConnection();
        return ret;
    }
    getUnitxConnection() {
        var _a, _b;
        if (this.unitxConn)
            return this.unitxConn;
        let conn;
        if (tool_1.env.isDevelopment === true) {
            let unitx = (_a = tool_1.env.configDebugging) === null || _a === void 0 ? void 0 : _a['unitx'];
            if (unitx) {
                let debugConfigName = this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = (_b = tool_1.env.configServers) === null || _b === void 0 ? void 0 : _b[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = tool_1.env.connection;
        }
        return this.unitxConn = _.clone(conn);
    }
}
exports.UnitxDb = UnitxDb;
class UnitxProdDb extends UnitxDb {
    getDebugConfigName(unitx) { return unitx.prod; }
}
exports.UnitxProdDb = UnitxProdDb;
class UnitxTestDb extends UnitxDb {
    getDebugConfigName(unitx) { return unitx.test; }
}
exports.UnitxTestDb = UnitxTestDb;
//# sourceMappingURL=db.js.map