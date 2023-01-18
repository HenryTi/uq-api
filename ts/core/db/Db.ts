export interface DbBase {
    sql(sql: string, params: any[]): Promise<any>;
}

export interface Db extends DbBase {
    /*
    protected dbName: string;
    hasUnit: boolean;
    twProfix: string;

    constructor(dbName: string) {
        this.dbName = dbName;
        this.twProfix = '';
        //this.builder = this.createBuilder();
    }
    */
    // protected abstract createBuilder(): Builder;
    // setBuilder() { this.builder = this.createBuilder(); }

    // get twProfix(): string;
    // loadTwProfix(): Promise<void>;
    get name(): string;
    sqlDropProc(procName: string, isFunc: boolean): Promise<any>;
    proc(proc: string, params: any[]): Promise<any>;
    buildDatabase(): Promise<boolean>;
    /**
     * 判断db在服务器上是否存在
     * @param db db名称 
     * @returns 
     */
    existsDatabase(): Promise<boolean>;
    createDatabase(): Promise<void>;
}

export interface DbNoName extends DbBase {
}

export interface DbUq extends Db {
    initLoad(): Promise<void>;
    get twProfix(): string;
    createProcObjs(): Promise<void>;
    reset(): void;
    buildTuidAutoId(): Promise<void>;
    uqProc(procName: string, procSql: string): Promise<any>;
    buildUqProc(procName: string, procSql: string, isFunc: boolean): Promise<void>;
    buildUqRealProcFrom$ProcTable(proc: string): Promise<void>;
    saveTextId(text: string): Promise<number>;
    isExistsProc(proc: string): boolean;
    createProc(proc: string): Promise<void>;
    execQueueAct(): Promise<number>;
    removeAllScheduleEvents(): Promise<string>;
    call(proc: string, params: any[]): Promise<any>;
    callEx(proc: string, params: any[]): Promise<any>;
    tableFromProc(proc: string, params: any[]): Promise<any[]>;
    tablesFromProc(proc: string, params: any[]): Promise<any[][]>;
}

export interface Db$Uq extends Db {
    uqDbs(): Promise<any[]>;
    setDebugJobs(): Promise<void>;
    logPerformance(tick: number, log: string, ms: number): Promise<void>;
    uqLog(unit: number, uq: string, subject: string, content: string): Promise<void>;
    uqLogError(unit: number, uq: string, subject: string, content: string): Promise<void>;
}

export interface Db$Res extends Db {
}

export interface Db$Unitx extends Db {
    readonly serverId: number;
}