import { Router } from 'express';
import { EntityRunner } from '../core';
import { RouterBuilder } from './routerBuilder';

export function buildRoleRouter(router: Router, rb: RouterBuilder) {
    rb.entityGet(router, 'role-admins', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let roles = await runner.roleGetAdmins(unit, user);
            return roles;
        });

    rb.entityGet(router, 'role-set-me-admin', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            await runner.roleSetMeAdmin(unit, user);
        });

    rb.entityPost(router, 'role-set-admin', '',
        async (unit: number, $user: number, _name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let { user, role, assigned } = body;
            await runner.roleSetAdmin(unit, $user, user, role, assigned);
        });

    rb.entityGet(router, 'role-is-admin', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            return await runner.roleIsAdmin(unit, user);
        });

    rb.entityPost(router, 'role-get-my', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let roles = await runner.roleGetMy(unit, user);
            return roles;
        });

    rb.entityPost(router, 'role-get-all-users', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            // row 0 返回 ixOfUsers
            let roles = await runner.roleGetAllUsers(unit, user);
            return roles;
        })

    rb.entityPost(router, 'role-delete-user', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let { theUser } = body;
            await runner.roleDeleteUser(unit, user, theUser);
            return;
        })

    rb.entityPost(router, 'role-set-user', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let { theUser, roles } = body;
            await runner.roleSetUser(unit, user, theUser, roles);
            return;
        })
}
