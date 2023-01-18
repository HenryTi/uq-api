export abstract class DbCaller {
    protected dbName: string;
    hasUnit: boolean;
    twProfix: string;

    constructor(dbName: string) {
        this.dbName = dbName;
        this.twProfix = '';
        //this.builder = this.createBuilder();
    }

    // protected abstract createBuilder(): Builder;
    // setBuilder() { this.builder = this.createBuilder(); }

    abstract loadTwProfix(): Promise<void>;
    abstract createProcObjs(db: string): Promise<void>;
    abstract reset(): void;
    abstract sql(sql: string, params: any[]): Promise<any>;
    abstract sqlProc(procName: string, procSql: string): Promise<any>;
    abstract buildProc(procName: string, procSql: string, isFunc: boolean): Promise<void>;
    abstract buildRealProcFrom$ProcTable(proc: string): Promise<void>;
    abstract sqlDropProc(procName: string, isFunc: boolean): Promise<any>;
    abstract call(proc: string, params: any[]): Promise<any>;
    abstract callEx(proc: string, params: any[]): Promise<any>;
    abstract buildTuidAutoId(): Promise<void>;
    abstract tableFromProc(proc: string, params: any[]): Promise<any[]>;
    abstract tablesFromProc(proc: string, params: any[]): Promise<any[][]>;
    abstract buildDatabase(): Promise<boolean>;
    /**
     * 判断db在服务器上是否存在
     * @param db db名称 
     * @returns 
     */
    abstract existsDatabase(): Promise<boolean>;
    abstract createDatabase(): Promise<void>;
    abstract setDebugJobs(): Promise<void>;
    abstract saveTextId(text: string): Promise<number>;
    abstract uqDbs(): Promise<any[]>;
    abstract isExistsProc(proc: string): boolean;
    abstract createProc(proc: string): Promise<void>;
    abstract execQueueAct(): Promise<number>;
    abstract removeAllScheduleEvents(): Promise<string>;
}
