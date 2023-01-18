import * as config from 'config';
import * as _ from 'lodash';
import { DbCaller } from '../dbCaller';
import { MsDbCaller } from './MsDbCaller';
import { MyDbCaller } from './MyDbCaller';
import { env, SqlType } from '../../../tool';

export abstract class Db {
    /*
    // 数据库名称对照表
    private static dbCollection:{[name:string]:string} = {}
	
    private static getDbName(name:string): string {
        return Db.dbCollection[name] || name;
    }
    */

    protected dbName: string;
    private isExists: boolean = false;
    readonly dbCaller: DbCaller;
    serverId: number;
    isTesting: boolean;

    /**
     * Db: 对应某个数据库，提供调用该数据库中存储过程等的一般功能 
     * @param dbName  uq(即数据库)的名称
     */
    constructor(dbName: string) {
        this.dbName = dbName;
        this.dbCaller = this.createDbServer();
    }

    getDbName(): string { return this.dbName }
    protected abstract getDbConfig(): any;
    protected createDbServer() {
        let dbConfig = this.getDbConfig();
        // if (dbConfig === undefined) throw 'dbConfig not defined';
        // this.serverId = dbConfig['server-id'];
        // delete dbConfig['server-id'];
        this.serverId = env.serverId;
        switch (env.sqlType) {
            case SqlType.mysql: return new MyDbCaller(this.dbName, dbConfig);
            case SqlType.mssql: return new MsDbCaller(this.dbName, dbConfig);
        }
    }

    reset() {
        this.dbCaller.reset();
    }

    /**
     * 判断本db在服务器上是否存在
     * @returns 
     */
    async exists(): Promise<boolean> {
        if (this.isExists === true) return true;
        return this.isExists = await this.dbCaller.existsDatabase();
    }

    async init(): Promise<void> {
        await this.dbCaller.loadTwProfix();
    }

    async buildTuidAutoId(): Promise<void> {
        await this.dbCaller.buildTuidAutoId();
    }
    async createProcObjs(): Promise<void> {
        await this.dbCaller.createProcObjs(this.dbName);
    }
    async sql(sql: string, params: any[]): Promise<any> {
        //this.devLog('sql', params);
        return await this.dbCaller.sql(sql, params);
    }
    async sqlDropProc(procName: string, isFunc: boolean): Promise<any> {
        return await this.dbCaller.sqlDropProc(procName, isFunc);
    }
    async sqlProc(procName: string, procSql: string): Promise<any> {
        return await this.dbCaller.sqlProc(procName, procSql);
    }
    async buildProc(procName: string, procSql: string, isFunc: boolean): Promise<void> {
        await this.dbCaller.buildProc(procName, procSql, isFunc);
    }
    async buildRealProcFrom$ProcTable(proc: string): Promise<void> {
        await this.dbCaller.buildRealProcFrom$ProcTable(proc);
    }
    async call(proc: string, params: any[]): Promise<any> {
        return await this.dbCaller.call(proc, params);
    }
    async callEx(proc: string, params: any[]): Promise<any> {
        return await this.dbCaller.callEx(proc, params);
    }
    async tableFromProc(proc: string, params: any[]): Promise<any[]> {
        return await this.dbCaller.tableFromProc(proc, params);
    }
    async tablesFromProc(proc: string, params: any[]): Promise<any[][]> {
        return await this.dbCaller.tablesFromProc(proc, params);
    }
    async createDatabase(): Promise<void> {
        return await this.dbCaller.createDatabase();
    }
    async buildDatabase(): Promise<boolean> {
        return await this.dbCaller.buildDatabase();
    }
    async setDebugJobs(): Promise<void> {
        await this.dbCaller.setDebugJobs();
    }
    async saveTextId(text: string): Promise<number> {
        return await this.dbCaller.saveTextId(text);
    }

    async execQueueAct(): Promise<number> {
        return await this.dbCaller.execQueueAct();
    }

    isExistsProc(proc: string): boolean {
        return this.dbCaller.isExistsProc(proc);
    }

    async createProc(proc: string) {
        await this.dbCaller.createProc(proc);
    }
}

export class NoNameDb extends Db {
    constructor() {
        super(undefined);
    }

    protected getDbConfig() {
        let ret = env.connection;
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
}

export class UqDb extends Db {
    protected getDbConfig() {
        let ret = env.connection;
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
}

export abstract class UnitxDb extends Db {
    protected getDbConfig() {
        let ret = this.getUnitxConnection();
        return ret;
    }

    private unitxConn: any;
    getUnitxConnection(): any {
        if (this.unitxConn) return this.unitxConn;
        let conn: any;
        if (env.isDevelopment === true) {
            let unitx = env.configDebugging?.['unitx'];
            if (unitx) {
                let debugConfigName = this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = env.configServers?.[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = env.connection;
        }
        return this.unitxConn = _.clone(conn);
    }

    protected abstract getDebugConfigName(unitx: any): string;
}

export class UnitxProdDb extends UnitxDb {
    protected getDebugConfigName(unitx: any): string { return unitx.prod }
}

export class UnitxTestDb extends UnitxDb {
    protected getDebugConfigName(unitx: any): string { return unitx.test }
}
