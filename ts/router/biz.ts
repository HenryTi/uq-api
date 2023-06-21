import { Router } from 'express';
import { logger } from '../tool';
import { EntityRunner } from '../core';
import { RouterBuilder } from './routerBuilder';

const bizType = 'biz';
export function buildBizRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, bizType, '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            try {
                let { id, act } = body;
                let ret = await runner.unitUserCall('$biz.sheet', unit, user, id, act);
                // 如果真正的biz sheet act重新编译了，则返回proc的名字。
                // 下面的调用，会重新生成proc存储过程。
                if (ret) {
                    if (ret.length > 0) {
                        let { proc } = ret[0];
                        await runner.unitUserCall(proc, unit, user, id)
                    }
                }
            }
            catch (err) {
                logger.error('POST /biz &db=', db, err);
                debugger;
            }
        });
}

const bizSheetActType = 'biz-sheet-act';
export function buildBizSheetActRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, bizSheetActType, '',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any) => {
            try {
                let { id, detail, act } = body;
                await runner.confirmProc(`${detail}.${act}`);
                let ret = await runner.unitUserCall('$biz.sheet.act', unit, user, id, detail, act);
                /*
                // 如果真正的biz sheet act重新编译了，则返回proc的名字。
                // 下面的调用，会重新生成proc存储过程。
                if (ret) {
                    if (ret.length > 0) {
                        let { proc } = ret[0];
                        await runner.unitUserCall(proc, unit, user, id, detail, act)
                    }
                }
                */
                return ret;
            }
            catch (err) {
                logger.error('POST /biz-sheet-act &db=', db, err);
                debugger;
            }
        });
}

