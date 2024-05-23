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
exports.MyDbNoName = exports.sqlsVersion = void 0;
const tool_1 = require("../../../tool");
const MyDbBase_1 = require("./MyDbBase");
const oldTwProfix = 'tv_'; // will be changed to '';
const sqls_8 = {
    version: 8,
    oldTwProfix,
    procLogExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log';`,
    procLogErrorExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log_error';`,
    performanceExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='performance';`,
    uidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uid';`,
    dateToUidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT EVENT_SCHEMA as db, EVENT_NAME as name FROM information_schema.events WHERE event_schema = ?;`,
    tv$entityExists: `SELECT 1 FROM information_schema.tables WHERE table_schema=? and TABLE_NAME='${oldTwProfix}$entity'`,
    unsupportProcs: [],
};
const sqls_5 = {
    version: 5,
    oldTwProfix,
    procLogExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log';`,
    procLogErrorExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log_error';`,
    performanceExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='performance';`,
    uidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='uid';`,
    dateToUidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT db, name FROM mysql.event WHERE db = ?;`,
    tv$entityExists: `SELECT 1 FROM information_schema.tables WHERE table_schema=? and TABLE_NAME='${oldTwProfix}$entity'`,
    unsupportProcs: ['$save_phrases'],
};
class MyDbNoName extends MyDbBase_1.MyDbBase {
    constructor(myDbs) {
        super(myDbs, undefined);
    }
    initConfig(dbName) { return tool_1.env.connection; }
    checkSqlVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            let versionResults = yield this.sql('use information_schema; select version() as v', []);
            let versionRows = versionResults[1];
            let ver = versionRows[0]['v'];
            let version = Number.parseFloat(ver);
            if (version >= 8.0) {
                exports.sqlsVersion = sqls_8;
            }
            else {
                exports.sqlsVersion = sqls_5;
            }
            exports.sqlsVersion.version = version;
            return exports.sqlsVersion;
        });
    }
    savedUqApiVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let ret = yield this.sql(`select value from $uq.setting where name='uqapi_version'`);
                if (ret.length === 0)
                    return;
                return ret[0].value;
            }
            catch (_a) {
                return undefined;
            }
        });
    }
    versions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all([
                this.checkSqlVersion(),
                this.savedUqApiVersion(),
            ]);
        });
    }
    saveUqVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            let version = this.myDbs.uq_api_version;
            yield this.sql(`insert into $uq.setting (name, value) values ('uqapi_version', ?) on duplicate key update value=?;`, [version, version]);
        });
    }
}
exports.MyDbNoName = MyDbNoName;
//# sourceMappingURL=MyDbNoName.js.map