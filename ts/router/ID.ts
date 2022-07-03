import { Router } from 'express';
import * as _ from 'lodash';
import { EntityRunner } from '../core';
import { RouterBuilder } from './routerBuilder';

const sqlResultProfix = 'sql-';
export function buildIDRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, 'acts', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.Acts(unit, user, body);
            return result;
        });
    rb.entityPost(router, sqlResultProfix + 'acts', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.Acts(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'act-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.ActIX(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.ActIX(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'act-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.ActID(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.ActID(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'act-ix-sort', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.ActIXSort(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'act-id-prop', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.ActIDProp(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-ix-sort', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.ActIXSort(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'act-detail', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.ActDetail(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-detail', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.ActDetail(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'query-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.QueryID(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'query-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.QueryID(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.ID(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.ID(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-tv', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDTv(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-tv', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDTv(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'key-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.KeyID(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'key-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.KeyID(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IX(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IX(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'ix-values', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IXValues(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'ix-values', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IXValues(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'ixr', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IXr(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'ixr', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IXr(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'key-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.KeyIX(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'key-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.KeyIX(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-log', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDLog(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-log', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDLog(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-sum', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDSum(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-sum', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDSum(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-no', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDNO(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-no', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDNO(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-detail-get', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDDetailGet(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-detail-get', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDDetailGet(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-in-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDinIX(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-in-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDinIX(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-x-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDxID(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-x-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDxID(unit, user, body);
            return result;
        });

    rb.entityPost(router, 'id-tree', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let result = await runner.IDRunner.IDTree(unit, user, body);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-tree', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let result = await runner.IDRunner.IDTree(unit, user, body);
            return result;
        });
}
