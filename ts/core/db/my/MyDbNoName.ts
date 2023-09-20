import { env } from "../../../tool";
import { DbNoName } from "../Db";
import { MyDbBase } from "./MyDbBase";
import { MyDbs } from "./MyDbs";

const oldTwProfix = 'tv_';  // will be changed to '';

export interface DbSqlsVersion {
    version: number;
    oldTwProfix: string;
    procLogExists: string;
    procLogErrorExists: string;
    performanceExists: string;
    uidExists: string;
    dateToUidExists: string;
    uidToDateExists: string;
    eventExists: string;
    tv$entityExists: string;
    unsupportProcs: string[];
}

const sqls_8: DbSqlsVersion = {
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

const sqls_5: DbSqlsVersion = {
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

export let sqlsVersion: DbSqlsVersion;

export class MyDbNoName extends MyDbBase implements DbNoName {
    constructor(myDbs: MyDbs) {
        super(myDbs, undefined);
    }

    protected override initConfig(dbName: string) { return env.connection; }

    private async checkSqlVersion() {
        let versionResults = await this.sql('use information_schema; select version() as v', []);
        let versionRows = versionResults[1];
        let ver = versionRows[0]['v'];
        let version = Number.parseFloat(ver);
        if (version >= 8.0) {
            sqlsVersion = sqls_8;
        }
        else {
            sqlsVersion = sqls_5;
        }
        sqlsVersion.version = version;
        return sqlsVersion;
    }

    private async savedUqApiVersion(): Promise<string> {
        try {
            let ret = await this.sql(`select value from $uq.setting where name='uqapi_version'`);
            if (ret.length === 0) return;
            return ret[0].value;
        }
        catch {
            return undefined;
        }
    }

    async versions() {
        return await Promise.all([
            this.checkSqlVersion(),
            this.savedUqApiVersion(),
        ]);
    }

    async saveUqVersion() {
        let version = this.myDbs.uq_api_version;
        await this.sql(`insert into $uq.setting (name, value) values ('uqapi_version', ?) on duplicate key update value=?;`, [version, version]);
    }
}
