import { DbUq } from '../db';
import { centerApi } from '../centerApi';
import { Net } from '../net';
// import { DbContainer } from '../db';

export class Runner {
    readonly net: Net;
    protected readonly dbUq: DbUq;

    constructor(dbUq: DbUq, net: Net) {
        this.net = net;
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