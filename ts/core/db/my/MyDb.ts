import * as _ from 'lodash';
import { Db } from '../Db';
import { MyDbBase } from './MyDbBase';
import { DbLogger, SpanLog } from '../dbLogger';
import { MyDbs } from './MyDbs';
import { consts } from '../../consts';

export abstract class MyDb extends MyDbBase implements Db {
    readonly name: string;
    private readonly dbLogger: DbLogger;
    constructor(myDbs: MyDbs, dbName: string) {
        super(myDbs, dbName);
        this.name = dbName;
        this.dbLogger = new DbLogger();
    }

    /**
     * 判断db在服务器上是否存在
     * @param db db名称 
     * @returns 
     */
    protected sqlExists(db: string): string {
        return `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
    }

    protected buildCallProc(proc: string) {
        return `call \`${this.name}\`.\`${proc}\``;
    }

    private buildCallProcParameters(params: any[]): string {
        let sql = '(';
        if (params !== undefined) {
            let len = params.length;
            if (len > 0) {
                sql += '?';
                for (let i = 1; i < len; i++) sql += ',?';
            }
        }
        sql += ')';
        return sql;
    }
    async proc(proc: string, params: any[]): Promise<any> {
        let sql = this.buildCallProc(proc) + this.buildCallProcParameters(params);
        let ret = await this.sql(sql, params);
        return ret;
    }

    protected async procWithLog(proc: string, params: any[]): Promise<any> {
        let c = this.buildCallProc(proc);
        let sql = c + this.buildCallProcParameters(params);
        let spanLog = this.openSpaceLog(c, params);
        return await this.sql(sql, params, spanLog);
    }

    protected openSpaceLog(callProc: string, params: any[]): SpanLog {
        let log = callProc;
        if (params !== undefined) {
            let len = params.length;
            for (let i = 0; i < len; i++) {
                if (i > 0) log += ',';
                let v = params[i];
                if (v === undefined) log += 'null';
                else if (v === null) log += 'null';
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
    async buildDatabase(): Promise<boolean> {
        let exists = this.sqlExists(this.name);
        let retExists = await this.sql(exists);
        let ret = retExists.length > 0;
        if (ret === false) {
            try {
                let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\``;
                await this.sql(sql);
            }
            catch (err) {
                console.error(err);
            }
        }
        // let retTry = await this.sql('select 1');
        await this.insertInto$Uq(this.name);
        return ret;
    }

    private async insertInto$Uq(db: string): Promise<void> {
        let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
        await this.sql(insertUqDb);
    }
    async createDatabase(): Promise<void> {
        const { charset, collation } = consts;
        let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\` default CHARACTER SET ${charset} COLLATE ${collation}`;
        await this.sql(sql);
    }
    async existsDatabase(): Promise<boolean> {
        let sql = this.sqlExists(this.name);
        let rows: any[] = await this.sql(sql);
        return rows.length > 0;
    }
}
