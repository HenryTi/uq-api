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
// import { DbLogger, SpanLog } from './dbLogger';
// import { $uqDb } from './$uqDb';
class MyDb extends MyDbBase_1.MyDbBase {
    //private readonly dbLogger: DbLogger;
    constructor(dbName) {
        super();
        this.name = dbName;
        //this.dbLogger = new DbLogger(dbs.$uqDb);
    }
    /**
     * 判断db在服务器上是否存在
     * @param db db名称
     * @returns
     */
    sqlExists(db) {
        return `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
    }
    /*
        async loadTwProfix(): Promise<void> {
            this.twProfix = await this.checkIsTwProfix() === true ? oldTwProfix : '';
        }
    
        private async checkIsTwProfix(): Promise<boolean> {
            return true;
        }
        */
    sqlDropProc(procName, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
            let sql = `DROP ${type} IF EXISTS  \`${this.name}\`.\`${procName}\``;
            yield this.exec(sql, []);
        });
    }
    buildCallProc(proc) {
        let c = 'call `' + this.name + '`.`' + proc + '`';
        return c;
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
            let ret = yield this.exec(sql, params);
            return ret;
        });
    }
    procWithLog(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let c = this.buildCallProc(proc);
            let sql = c + this.buildCallProcParameters(params);
            //let spanLog: SpanLog;
            if (this.name !== '$uq') {
                let log = c;
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
                // spanLog = await this.dbLogger.open(log);
            }
            return yield this.exec(sql, params /*, spanLog*/);
        });
    }
    // return exists
    buildDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let exists = this.sqlExists(this.name);
            let retExists = yield this.exec(exists, []);
            let ret = retExists.length > 0;
            if (ret === false) {
                try {
                    let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\``; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
                    yield this.exec(sql, undefined);
                }
                catch (err) {
                    console.error(err);
                }
            }
            let retTry = yield this.exec('select 1', undefined);
            yield this.insertInto$Uq(this.name);
            return ret;
        });
    }
    insertInto$Uq(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
            yield this.exec(insertUqDb, undefined);
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'CREATE DATABASE IF NOT EXISTS `' + this.name + '` default CHARACTER SET utf8 '; //COLLATE utf8_unicode_ci';
            yield this.exec(sql, undefined);
        });
    }
    existsDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.sqlExists(this.name);
            let rows = yield this.exec(sql, undefined);
            return rows.length > 0;
        });
    }
}
exports.MyDb = MyDb;
/*
const castField: TypeCast = (field: any, next) => {
    switch (field.type) {
        default: return next();
        case 'DATE': return castDate(field);
        case 'DATETIME': return castDateTime(field);
    }
}

// 确保服务器里面保存的时间是UTC时间
const timezoneOffset = new Date().getTimezoneOffset() * 60000;
function castDate(field: any) {
    // 这个地方也许有某种方法加速吧
    let text = field.string();
    return text;
}
function castDateTime(field: any) {
    // 这个地方也许有某种方法加速吧
    let text = field.string();;
    return text;
}
*/
//# sourceMappingURL=MyDb.js.map