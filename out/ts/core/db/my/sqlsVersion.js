"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSqlVersion = exports.sqlsVersion = void 0;
const Dbs_1 = require("../Dbs");
const sqls_8 = {
    procLogExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log';`,
    procLogErrorExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log_error';`,
    performanceExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='performance';`,
    uidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uid';`,
    dateToUidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT EVENT_SCHEMA as db, EVENT_NAME as name FROM information_schema.events WHERE event_schema = ?;`,
    tv$entityExists: `SELECT 1 FROM information_schema.tables WHERE table_schema=? and TABLE_NAME='tv_$entity'`,
};
const sqls_5 = {
    procLogExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log';`,
    procLogErrorExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log_error';`,
    performanceExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='performance';`,
    uidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='uid';`,
    dateToUidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT db, name FROM mysql.event WHERE db = ?;`,
    tv$entityExists: `SELECT 1`,
};
async function checkSqlVersion() {
    let db = (0, Dbs_1.getDbs)().dbNoName;
    let versionResults = await db.sql('use information_schema; select version() as v', []);
    let versionRows = versionResults[1];
    let version = versionRows[0]['v'];
    if (version >= '8.0') {
        exports.sqlsVersion = sqls_8;
    }
    else {
        exports.sqlsVersion = sqls_5;
    }
}
exports.checkSqlVersion = checkSqlVersion;
//# sourceMappingURL=sqlsVersion.js.map