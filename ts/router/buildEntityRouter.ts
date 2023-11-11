import { Router } from 'express';
import { buildAccessRouter } from './access';
import { buildActionRouter } from './action';
import { buildBookRouter } from './book';
import { buildHistoryRouter } from './history';
import { buildQueryRouter } from './query';
import { buildSchemaRouter } from './schema';
import { buildTuidRouter } from './tuid';
import { buildImportRouter } from './import';
import { buildMapRouter } from './map';
import { buildIDRouter } from './ID';
import { RouterBuilder } from './routerBuilder';
import { buildRoleRouter } from './role';
import { buildBizRouter, buildBizSheetActRouter } from './biz';
import { buildSyncUserRouter } from './syncUser';
import { buildCompileRouter } from './compile';

export function buildEntityRouter(router: Router, rb: RouterBuilder) {
    buildBizSheetActRouter(router, rb);
    buildSyncUserRouter(router, rb);
    buildBizRouter(router, rb);
    buildAccessRouter(router, rb);
    buildActionRouter(router, rb);
    buildBookRouter(router, rb);
    buildHistoryRouter(router, rb);
    buildQueryRouter(router, rb);
    buildSchemaRouter(router, rb);
    buildTuidRouter(router, rb);
    buildImportRouter(router, rb);
    buildMapRouter(router, rb);
    buildIDRouter(router, rb);
    buildRoleRouter(router, rb);
    buildCompileRouter(router, rb);
}
