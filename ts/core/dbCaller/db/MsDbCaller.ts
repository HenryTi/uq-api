// import { MsBuilder } from '../builder';
import { DbCaller } from '../dbCaller';

export class MsDbCaller extends DbCaller {
    constructor(dbName: string, dbConfig: any) {
        super(dbName);
    }

    // protected createBuilder() { return new MsBuilder(this.dbName, this.hasUnit, this.twProfix); }

    loadTwProfix(): Promise<void> { return; }
    execQueueAct(): Promise<number> { return; }
    removeAllScheduleEvents(): Promise<string> { return; }
    createProcObjs(db: string): Promise<void> { return }
    reset(): void { };
    sql(sql: string, params: any[]): Promise<any> { return }
    sqlProc(procName: string, procSql: string): Promise<any> { return }
    buildProc(procName: string, procSql: string, isFunc: boolean): Promise<void> { return }
    buildRealProcFrom$ProcTable(proc: string): Promise<void> { return }
    sqlDropProc(procName: string, isFunc: boolean): Promise<any> { return }
    call(proc: string, params: any[]): Promise<any> { return }
    callEx(proc: string, params: any[]): Promise<any> { return }
    buildTuidAutoId(): Promise<void> { return }
    tableFromProc(proc: string, params: any[]): Promise<any[]> { return }
    tablesFromProc(proc: string, params: any[]): Promise<any[][]> { return }
    buildDatabase(): Promise<boolean> { return }
    createDatabase(): Promise<void> { return }
    existsDatabase(): Promise<boolean> { return }
    setDebugJobs(): Promise<void> { return }
    saveTextId(text: string): Promise<number> { return; }
    uqDbs(): Promise<any[]> { return }
    isExistsProc(proc: string): boolean { return false; }
    createProc(proc: string): Promise<void> { return; }
    getEvents(db: string): Promise<{ db: string; name: string; }[]> { return; }
}
