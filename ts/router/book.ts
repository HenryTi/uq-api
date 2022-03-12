import { Router } from 'express';
import { EntityRunner, packReturn } from '../core';
import { RouterBuilder } from './routerBuilder';

export function buildBookRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, 'book', '/:name',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            let pageStart = body['$pageStart'];
            let params: any[] = [pageStart, body['$pageSize']];
            let fields = schema.fields;
            let len = fields.length;
            for (let i = 0; i < len; i++) {
                params.push(body[fields[i].name]);
            }
            let result = await runner.query(name, unit, user, params);
            let data = packReturn(schema, result);
            return data;
        });
}