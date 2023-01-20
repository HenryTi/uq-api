import { DbUq } from '../db';
import { centerApi } from '../centerApi';
// import { DbContainer } from '../db';

export class Runner {
    readonly dbUq: DbUq;

    constructor(dbUq: DbUq) {
        this.dbUq = dbUq;
    }

    // protected readonly dbContainer: DbContainer;
    /*
    constructor(db: DbContainer) {
        this.dbContainer = db;
    }
    */

    // getDb(): string { return this.db.getDbName() }

    async syncCenterUser(userId: number) {
        let user = await centerApi.userFromId(userId);
        let { id, name, nick, icon } = user;
        await this.dbUq.call('$set_user', [id, name, nick, icon]);
        return user;
    }
}