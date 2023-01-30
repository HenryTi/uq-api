import { Db } from '../Db';

export class MsDb implements Db {
    readonly name: string;
    constructor(dbName: string, dbConfig: any) {
        this.name = dbName;
    }
    sql(sql: string, params: any[]): Promise<any> {
        throw new Error('Method not implemented.');
    }
    proc(proc: string, params: any[]): Promise<any> {
        throw new Error('Method not implemented.');
    }
    buildDatabase(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    existsDatabase(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    createDatabase(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // protected createBuilder() { return new MsBuilder(this.dbName, this.hasUnit, this.twProfix); }

    get twProfix(): string { return; }
    loadTwProfix(): Promise<void> { return; }
}
