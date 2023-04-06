import { Router } from 'express';
import { EntityRunner } from '../core';
import { RouterBuilder } from './routerBuilder';

const sqlResultProfix = 'sql-';
export function buildIDRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, 'acts', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.Acts(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });
    rb.entityPost(router, sqlResultProfix + 'acts', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.Acts(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'act-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.ActIX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.ActIX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'act-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.ActID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.ActID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'act-id-prop', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let { ID, id, name: propName, value } = body;
            let result = await runner.ActIDProp(unit, user, ID, id, propName, value);
            return result;
        });

    rb.entityPost(router, 'act-ix-sort', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.ActIXSort(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-ix-sort', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.ActIXSort(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'act-detail', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.ActDetail(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'act-detail', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.ActDetail(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'query-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.QueryID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'query-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.QueryID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    async function loadIDTypes(runner: EntityRunner, unit: number, user: number, id: number) {
        let IDTypes: string | (string[]);
        let idTypes: string[];

        let sqlBuilder = runner.sqlFactory.idTypes(id);
        let retIdTypes = await runner.IDSql(unit, user, sqlBuilder);
        // let retIdTypes = await this.dbCaller.idTypes(unit, user, id);
        let coll: { [id: number]: string } = {};
        for (let r of retIdTypes) {
            let { id, $type } = r;
            coll[id] = $type;
        }
        if (typeof (id) === 'number') {
            IDTypes = coll[id];
            idTypes = [IDTypes];
        }
        else {
            IDTypes = idTypes = [];
            for (let v of id as number[]) {
                idTypes.push(coll[v]);
            }
        }
        return IDTypes;
    }

    rb.entityPost(router, 'id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let { IDX } = body;
            if (IDX === undefined) {
                let { id } = body;
                let IDX = await loadIDTypes(runner, unit, user, id);
                if (IDX === undefined) {
                    console.error(`no id type found for id=${id}`);
                    return undefined;
                }
                body.IDX = IDX;
            }
            let sqlBuilder = runner.sqlFactory.ID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let { IDX } = body;
            if (IDX === undefined) {
                body.IDX = await loadIDTypes(runner, unit, user, body.id);
            }
            let sqlBuilder = runner.sqlFactory.ID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-tv', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDTv(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-tv', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDTv(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'key-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.KeyID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'key-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.KeyID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'ix-values', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IXValues(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'ix-values', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IXValues(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'ixr', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IXr(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'ixr', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IXr(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'key-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.KeyIX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'key-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.KeyIX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-log', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDLog(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-log', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDLog(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-sum', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDSum(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-sum', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDSum(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-no', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDNO(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-joins', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let { id } = body;
            let IDType = await loadIDTypes(runner, 0, 0, id);
            let results = await runner.dbUq.tablesFromProc(`${IDType}$joins`, [id]);
            let main = results[0];
            let main0 = main[0];
            if (main0 !== undefined) {
                main0.ID = IDType;
            }
            return results;
        });

    rb.entityPost(router, sqlResultProfix + 'id-no', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDNO(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-detail-get', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDDetailGet(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-detail-get', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDDetailGet(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-in-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDinIX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-in-ix', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDinIX(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-x-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDxID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-x-id', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDxID(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, 'id-tree', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let sqlBuilder = runner.sqlFactory.IDTree(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });

    rb.entityPost(router, sqlResultProfix + 'id-tree', '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            body.$sql = true;
            let sqlBuilder = runner.sqlFactory.IDTree(body);
            let result = await runner.IDSql(unit, user, sqlBuilder);
            return result;
        });
}
