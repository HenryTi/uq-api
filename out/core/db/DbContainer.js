"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { createDb } from './createEngine';
/*
export abstract class DbContainer {
    // 数据库名称对照表
    //private static dbCollection:{[name:string]:string} = {}
    
    //private static getDbName(name:string): string {
    //    return Db.dbCollection[name] || name;
    //}

    protected dbName: string;
    private isExists: boolean = false;
    db: Db;
    isTesting: boolean;

    constructor(dbName: string) {
        this.dbName = dbName;
        this.init();
    }

    protected init() {
        this.db = this.createDb();
    }

    getDbName(): string { return this.dbName }
    protected abstract getDbConfig(): any;
    protected createDb() {
        let dbConfig = this.getDbConfig();
        // if (dbConfig === undefined) throw 'dbConfig not defined';
        // this.serverId = dbConfig['server-id'];
        // delete dbConfig['server-id'];
        return createDb(env.sqlType, this.dbName, dbConfig);
    }

    reset() {
        this.db.reset();
    }

    async exists(): Promise<boolean> {
        if (this.isExists === true) return true;
        return this.isExists = await this.db.existsDatabase();
    }

    async initLoad(): Promise<void> {
        await this.initLoad(); // .db.loadTwProfix();
    }

    async buildTuidAutoId(): Promise<void> {
        await this.db.buildTuidAutoId();
    }
    async createProcObjs(): Promise<void> {
        await this.db.createProcObjs();
    }
    async sql(sql: string, params: any[]): Promise<any> {
        //this.devLog('sql', params);
        return await this.db.sql(sql, params);
    }
    async sqlDropProc(procName: string, isFunc: boolean): Promise<any> {
        return await this.db.sqlDropProc(procName, isFunc);
    }
    async sqlProc(procName: string, procSql: string): Promise<any> {
        return await this.db.sqlProc(procName, procSql);
    }
    async buildProc(procName: string, procSql: string, isFunc: boolean): Promise<void> {
        await this.db.buildProc(procName, procSql, isFunc);
    }
    async buildRealProcFrom$ProcTable(proc: string): Promise<void> {
        await this.db.buildRealProcFrom$ProcTable(proc);
    }
    async call(proc: string, params: any[]): Promise<any> {
        return await this.db.call(proc, params);
    }
    async callEx(proc: string, params: any[]): Promise<any> {
        return await this.db.callEx(proc, params);
    }
    async tableFromProc(proc: string, params: any[]): Promise<any[]> {
        return await this.db.tableFromProc(proc, params);
    }
    async tablesFromProc(proc: string, params: any[]): Promise<any[][]> {
        return await this.db.tablesFromProc(proc, params);
    }
    async createDatabase(): Promise<void> {
        return await this.db.createDatabase();
    }
    async buildDatabase(): Promise<boolean> {
        return await this.db.buildDatabase();
    }
    async saveTextId(text: string): Promise<number> {
        return await this.db.saveTextId(text);
    }

    async execQueueAct(): Promise<number> {
        return await this.db.execQueueAct();
    }

    isExistsProc(proc: string): boolean {
        return this.db.isExistsProc(proc);
    }

    async createProc(proc: string) {
        await this.db.createProc(proc);
    }
}

export class NoNameDb extends DbContainer {
    constructor() {
        super(undefined);
    }

    protected getDbConfig() { return env.connection; }
}
*/ 
//# sourceMappingURL=DbContainer.js.map