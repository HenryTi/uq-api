import { Router } from 'express';
import * as _ from 'lodash';
import { EntityRunner, RouterBuilder } from '../core';

const sqlResultProfix = 'sql-';
export function buildIDRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, 'acts', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.Acts(unit, user, body);
        return result;
    });
    rb.entityPost(router, sqlResultProfix + 'acts', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.Acts(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'act-ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ActIX(unit, user, body);
        return result;
    });

	rb.entityPost(router, sqlResultProfix + 'act-ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.ActIX(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'act-ix-sort', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ActIXSort(unit, user, body);
        return result;
    });

	rb.entityPost(router, sqlResultProfix + 'act-ix-sort', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.ActIXSort(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'act-detail', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ActDetail(unit, user, body);
        return result;
    });

	rb.entityPost(router, sqlResultProfix + 'act-detail', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.ActDetail(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'query-id', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.QueryID(unit, user, body);
        return result;
    });

	rb.entityPost(router, sqlResultProfix + 'query-id', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.QueryID(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'id', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ID(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.ID(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'id-tv', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDTv(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id-tv', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDTv(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'key-id', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.KeyID(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'key-id', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.KeyID(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IX(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IX(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'ixr', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IXr(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'ixr', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IXr(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'key-ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.KeyIX(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'key-ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.KeyIX(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'id-log', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDLog(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id-log', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDLog(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'id-sum', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDSum(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id-sum', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDSum(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'id-no', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDNO(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id-no', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDNO(unit, user, body);
        return result;
    });

    rb.entityPost(router, 'id-detail-get', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDDetailGet(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id-detail-get', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDDetailGet(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'id-in-ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDinIX(unit, user, body);
        return result;
    });

	rb.entityPost(router, sqlResultProfix + 'id-in-ix', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDinIX(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'id-x-id', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDxID(unit, user, body);
        return result;
    });

	rb.entityPost(router, sqlResultProfix + 'id-x-id', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDxID(unit, user, body);
        return result;
    });

	rb.entityPost(router, 'id-tree', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDTree(unit, user, body);
        return result;
    });

    rb.entityPost(router, sqlResultProfix + 'id-tree', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        body.$sql = true;
        let result = await runner.IDTree(unit, user, body);
        return result;
    });
}
