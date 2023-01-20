import * as _ from 'lodash';
import { Db } from '../Db';
import { MyDbBase } from './MyDbBase';
import { DbLogger, SpanLog } from '../dbLogger';

export abstract class MyDb extends MyDbBase implements Db {
    readonly name: string;
    private readonly dbLogger: DbLogger;
    constructor(dbName: string) {
        super();
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

    async sqlDropProc(procName: string, isFunc: boolean): Promise<any> {
        let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
        let sql = `DROP ${type} IF EXISTS  \`${this.name}\`.\`${procName}\``;
        await this.exec(sql, []);
    }

    protected buildCallProc(proc: string) {
        let c = 'call `' + this.name + '`.`' + proc + '`';
        return c;
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
        let ret = await this.exec(sql, params);
        return ret;
    }

    async procWithLog(proc: string, params: any[]): Promise<any> {
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
        return await this.exec(sql, params, spanLog);
    }

    // return exists
    async buildDatabase(): Promise<boolean> {
        let exists = this.sqlExists(this.name);
        let retExists = await this.exec(exists, []);
        let ret = retExists.length > 0;
        if (ret === false) {
            try {
                let sql = `CREATE DATABASE IF NOT EXISTS \`${this.name}\``; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
                await this.exec(sql, undefined);
            }
            catch (err) {
                console.error(err);
            }
        }
        let retTry = await this.exec('select 1', undefined);
        await this.insertInto$Uq(this.name);
        return ret;
    }

    private async insertInto$Uq(db: string): Promise<void> {
        let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
        await this.exec(insertUqDb, undefined);
    }
    async createDatabase(): Promise<void> {
        let sql = 'CREATE DATABASE IF NOT EXISTS `' + this.name + '` default CHARACTER SET utf8 '; //COLLATE utf8_unicode_ci';
        await this.exec(sql, undefined);
    }
    async existsDatabase(): Promise<boolean> {
        let sql = this.sqlExists(this.name);
        let rows: any[] = await this.exec(sql, undefined);
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
