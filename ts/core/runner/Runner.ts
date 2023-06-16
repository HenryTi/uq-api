import { DbUq } from '../db';
// import { centerApi } from '../centerApi';
// import { DbContainer } from '../db';

export class Runner {
    readonly dbUq: DbUq;

    constructor(dbUq: DbUq) {
        this.dbUq = dbUq;
    }

    protected async procCall(proc: string, params: any[]): Promise<any> {
        return await this.dbUq.call(proc, params);
    }
}