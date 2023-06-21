import { Router } from 'express';
import { EntityRunner, centerApi } from '../core';
import { RouterBuilder } from './routerBuilder';

const syncUserType = '/sync-user';
export function buildSyncUserRouter(router: Router, rb: RouterBuilder) {
    rb.post(router, syncUserType,
        async (runner: EntityRunner, body: any): Promise<any> => {
            let { user: theUser } = body;
            let ret = await runner.getUser(theUser);
            if (ret !== undefined) {
                let retUser = await centerApi.userFromId(ret.tonwaUser);
                if (retUser !== undefined) {
                    let { id, name, nick, icon } = retUser;
                    await runner.saveUser(id, name, nick, icon);
                    Object.assign(ret, { name, nick, icon });
                }
            }
            return ret;
        });
}
