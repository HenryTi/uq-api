import { centerApi } from '../centerApi';
import { Db } from '../dbCaller';

export class Runner {
    protected readonly db: Db;

    constructor(db: Db) {
        this.db = db;
    }

    // getDb(): string { return this.db.getDbName() }

    async syncCenterUser(userId: number) {
        let user = await centerApi.userFromId(userId);
        let { id, name, nick, icon } = user;
        await this.db.call('$set_user', [id, name, nick, icon]);
        return user;
    }
}