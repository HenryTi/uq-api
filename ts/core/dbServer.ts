export abstract class DbServer {
    abstract sql(db:string, sql:string, params:any[]): Promise<any>;
    abstract call(db:string, proc:string, params:any[]): Promise<any>;
    abstract callEx(db:string, proc:string, params:any[]): Promise<any>;
    abstract tableFromProc(db:string, proc:string, params:any[]): Promise<any[]>;
    abstract tablesFromProc(db:string, proc:string, params:any[]): Promise<any[][]>;
    abstract buildDatabase(db:string): Promise<boolean>;
    abstract existsDatabase(db:string): Promise<boolean>;
    abstract createDatabase(db:string): Promise<void>;
    abstract uqDbs():Promise<any[]>;
    abstract initResDb(resDbName:string):Promise<void>;
    abstract init$UqDb():Promise<void>;
}
