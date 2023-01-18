import * as _ from 'lodash';
import { NoNameDb } from './db';

export interface DbSqlsVersion {
    procLogExists: string;
    procLogErrorExists: string;
    performanceExists: string;
    uidExists: string;
    dateToUidExists: string;
    uidToDateExists: string;
    eventExists: string;
}

const sqls_8: DbSqlsVersion = {
    procLogExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log';`,
    procLogErrorExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log_error';`,
    performanceExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='performance';`,
    uidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uid';`,
    dateToUidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT EVENT_SCHEMA as db, EVENT_NAME as name FROM information_schema.events WHERE event_schema = ?;`,
};

const sqls_5: DbSqlsVersion = {
    procLogExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log';`,
    procLogErrorExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log_error';`,
    performanceExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='performance';`,
    uidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='uid';`,
    dateToUidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT db, name FROM mysql.event WHERE db = ?;`,
};

let sqls: DbSqlsVersion;
export function dbSqlsVersion(): DbSqlsVersion {
    return sqls;
}

export async function dbStart() {
    let db = new NoNameDb();
    let versionResults = await db.sql('use information_schema; select version() as v', []);
    let versionRows = versionResults[1];
    let version = versionRows[0]['v'];
    if (version >= '8.0') {
        sqls = sqls_8;
    }
    else {
        sqls = sqls_5;
    }
}
