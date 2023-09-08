import { Router, Request, Response } from 'express';
import { RouterBuilder } from './routerBuilder';
import { UqRunner } from '../uq';
import { EntityRunner, Net } from '../core';

const actionType = 'compile';

export function buildCompileRouter(router: Router, rb: RouterBuilder) {
    router.get('/compile/hello', async (req: Request, res: Response) => {
        res.json({
            ok: true,
            res: {
                route: 'compile',
                sub: 'hello',
            }
        });
    });

    rb.entityPost(router, actionType, '/source',
        async (unit: number, user: number, name: string, db: string, urlParams: any, runner: EntityRunner, body: any, schema: any, run: any, net: Net): Promise<any> => {
            let { source } = body;
            const msgs: string[] = [];
            function log(msg: string) {
                msgs.push(msg);
                return true;
            }
            const uqRunner = new UqRunner(undefined, log);
            const { uq } = uqRunner;
            const { biz } = uq;
            biz.bizArr.splice(0);
            uqRunner.parse(source, 'upload');
            uqRunner.scan();
            const phrases = biz.phrases.map(v => v.join('\t')).join('\n');
            await runner.unitUserCall('SaveBizMoniker', unit, user, phrases + '\n\n');
            return {
                source,
                schemas: uqRunner.uq.biz.bizArr.map(v => v.buildSchema()),
                logs: msgs,
                phrases,
            }
        });
}
