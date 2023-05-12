import { SpanLog } from "./dbLogger";

export interface DbBase {
    sql(sql: string, params?: any[], spanLog?: SpanLog): Promise<any>;
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

export enum ProcType {
    proc, core, func
}
export interface DbUq extends Db {
    get twProfix(): string;
    get isTesting(): boolean;
    initLoad(): Promise<void>;
    reset(): void;

    createProcObjs(): Promise<void>;
    confirmProc(proc: string): Promise<void>;
    uqProc(procName: string, procSql: string, procType: ProcType): Promise<any>;
    buildUqStoreProcedure(proc: string): Promise<void>;
    buildUqStoreProcedureIfNotExists(...procNames: string[]): Promise<void>
    execQueueAct(): Promise<number>;
    removeAllScheduleEvents(): Promise<string>;
    call(proc: string, params: any[]): Promise<any>;
    callEx(proc: string, params: any[]): Promise<any>;
    tableFromProc(proc: string, params: any[]): Promise<any[]>;
    tablesFromProc(proc: string, params: any[]): Promise<any[][]>;

    saveTextId(text: string): Promise<number>;
    buildTuidAutoId(): Promise<void>;
}

export interface Db$Uq extends Db {

    /**
     * 从$uq.uq表中获取（服务器上配置的） 所有的uq（即DB）名称
     * @returns 
     */
    uqDbs(): Promise<any[]>;
    setDebugJobs(): Promise<void>;
    logPerformance(tick: number, log: string, ms: number): Promise<void>;
    uqLog(unit: number, uq: string, subject: string, content: string): Promise<void>;
    uqLogError(unit: number, uq: string, subject: string, content: string): Promise<void>;
    isExists(dbName: string): Promise<boolean>;
}

export interface Db$Res extends Db {
}

export interface Db$Unitx extends Db {
    readonly serverId: number;
}
