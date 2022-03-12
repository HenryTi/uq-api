import { Router } from 'express';
import { EntityRunner } from '../core';
import { RouterBuilder } from "./routerBuilder";

export function buildSchemaRouter(router: Router, rb: RouterBuilder) {
    rb.get(router, '/schema/:name',
        async (runner: EntityRunner, body: any, urlParams: any) => {
            let { name } = urlParams;
            let schema = runner.getSchema(name);
            return schema && schema.call;
        });
    rb.get(router, '/schema/:name/:version',
        async (runner: EntityRunner, body: any, urlParams: any) => {
            let { name, version } = urlParams;
            let schemaVersion = await runner.loadSchemaVersion(name, version);
            return schemaVersion;
        });
}
