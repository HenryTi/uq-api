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
exports.MyDb = void 0;
const MyDbBase_1 = require("./MyDbBase");
const dbLogger_1 = require("../dbLogger");
const consts_1 = require("../../consts");
class MyDb extends MyDbBase_1.MyDbBase {
    constructor(myDbs, dbName) {
        super(myDbs, dbName);
        this.name = dbName;
        this.dbLogger = new dbLogger_1.DbLogger();
    }
    /**
     * 判断db在服务器上是否存在
     * @param db db名称
     * @returns
     */
    sqlExists(db) {
        return `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
    }
    buildCallProc(proc) {
        return `call \`${this.name}\`.\`${proc}\``;
    }
    buildCallProcParameters(params) {
        let sql = '(';
        if (params !== undefined) {
            let len = params.length;
            if (len > 0) {
                sql += '?';
                for (let i = 1; i < len; i++)
                    sql += ',?';
            }
        }
        sql += ')';
        return sql;
    }
    proc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.buildCallProc(proc) + this.buildCallProcParameters(params);
            let ret = yield this.sql(sql, params);
            return ret;
        });
    }
    procWithLog(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let c = this.buildCallProc(proc);
            let sql = c + this.buildCallProcParameters(params);
            let spanLog = this.openSpaceLog(c, params);
            return yield this.sql(sql, params, spanLog);
        });
    }
    openSpaceLog(callProc, params) {
        let log = callProc;
        if (params !== undefined) {
            let len = params.length;
            for (let i = 0; i < len; i++) {
                if (i > 0)
                    log += ',';
                let v = params[i];
                if (v === undefined)
                    log += 'null';
                else if (v === null)
                    log += 'null';
                else {
                    log += '\'' + v + '\'';
                }
            }
        }
        log += ')';
        let spanLog = this.dbLogger.open(log);
        return spanLog;
    }
    // return exists
    buildDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let exists = this.sqlExists(this.name);
            let retExists = yield this.sql(exists);
            let ret = retExists.length > 0;
            if (ret === false) {
                try {
                    let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\``;
                    yield this.sql(sql);
                }
                catch (err) {
                    console.error(err);
                }
            }
            // let retTry = await this.sql('select 1');
            yield this.insertInto$Uq(this.name);
            return ret;
        });
    }
    insertInto$Uq(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
            yield this.sql(insertUqDb);
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const { charset, collation } = consts_1.consts;
            let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\` default CHARACTER SET ${charset} COLLATE ${collation}`;
            yield this.sql(sql);
        });
    }
    existsDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.sqlExists(this.name);
            let rows = yield this.sql(sql);
            return rows.length > 0;
        });
    }
}
exports.MyDb = MyDb;
//# sourceMappingURL=MyDb.js.map