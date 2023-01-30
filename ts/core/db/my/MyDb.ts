import * as _ from 'lodash';
import { Db } from '../Db';
import { MyDbBase } from './MyDbBase';
import { DbLogger, SpanLog } from '../dbLogger';

export abstract class MyDb extends MyDbBase implements Db {
    readonly name: string;
    private readonly dbLogger: DbLogger;
    constructor(dbName: string) {
        super(dbName);
        this.name = dbName;
        this.dbLogger = new DbLogger();
    }

    /**
     * 判断db在服务器上是否存在
     * @param db db名称 
     * @returns 
     */
    private sqlExists(db: string): string {
        return `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
    }

    protected buildCallProc(proc: string) {
        if (proc === '$exec_queue_act') {
            console.error('protected MyDb.buildCallProc(proc: string)', proc);
        }
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
        let spanLog: SpanLog;
        if (this.name !== '$uq') {
            let log = c;
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
            spanLog = await this.dbLogger.open(log);
        }
        return await this.sql(sql, params, spanLog);
    }

    // return exists
    async buildDatabase(): Promise<boolean> {
        let exists = this.sqlExists(this.name);
        let retExists = await this.sql(exists);
        let ret = retExists.length > 0;
        if (ret === false) {
            try {
                let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\``; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
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
        let sql = 'CREATE DATABASE IF NOT EXISTS `' + this.name + '` default CHARACTER SET utf8 '; //COLLATE utf8_unicode_ci';
        await this.sql(sql);
    }
    async existsDatabase(): Promise<boolean> {
        let sql = this.sqlExists(this.name);
        let rows: any[] = await this.sql(sql);
        return rows.length > 0;
    }
}
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
