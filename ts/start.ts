import * as express from 'express';
import { Request, Response, NextFunction, Router } from 'express';
import * as config from 'config';
import { logger } from './tool';
import { buildOpenRouter, buildEntityRouter, buildUnitxRouter, buildBuildRouter } from './router';
import { createResDb, router as resRouter, initResPath } from './res';
import {
    authCheck, authUnitx, RouterBuilder,
    uqProdRouterBuilder, uqTestRouterBuilder,
    unitxTestRouterBuilder, unitxProdRouterBuilder,
    compileProdRouterBuilder, compileTestRouterBuilder, CompileRouterBuilder,
    create$UqDb, env
} from './core';
import { authJoint, authUpBuild } from './core/auth';
import { Jobs } from './jobs';
import { buildProcRouter } from './router/proc';

const { version: uq_api_version } = require('../package.json');

export async function init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            logger.debug("UQ-API init 1.1.5.1 ...\n");
            process.on('uncaughtException', function (err: any) {
                logger.error('uncaughtException', err);
                reject(err);
            });
            process.on('unhandledRejection', (err: any, promise: any) => {
                logger.debug('unhandledRejection', err);
                reject(err);
            });

            if (!process.env.NODE_ENV) {
                logger.error('NODE_ENV not defined, exit');
                process.exit();
            }

            logger.debug('process.env.NODE_ENV: ', process.env.NODE_ENV);

            //let connection = config.get<any>("connection");
            let connection = env.getConnection();
            if (connection === undefined || connection.host === '0.0.0.0') {
                logger.debug("mysql connection must defined in config/default.json or config/production.json");
                return;
            }
            initResPath();

            let app = express();
            var cors = require('cors')
            app.use(cors({
                origin: '*'
            }));
            app.use(express.static('public'));
            app.use((err: any, req: Request, res: Response, next: NextFunction) => {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
            app.use(express.json({ limit: '1mb' }));
            app.set('json replacer', (key: any, value: any) => {
                if (value === null) return undefined;
                return value;
            });

            app.use(async (req: Request, res: Response, next: NextFunction) => {
                let s = req.socket;
                let p = '';
                if (req.method !== 'GET') {
                    p = JSON.stringify(req.body);
                    if (p.length > 100) p = p.substr(0, 100);
                }
                let t = new Date();
                logger.debug(req.method, req.originalUrl, p);
                logger.debug('%s %s %s', req.method, req.originalUrl, p);
                try {
                    next();
                }
                catch (e) {
                    logger.error(e);
                }
            });

            app.use('/res', resRouter);
            app.use('/hello', dbHello);
            app.use('/uq/hello', dbHello);
            app.use('/proc/:db/:proc', buildProcRouter())

            app.use('/uq/prod/:db/', buildUqRouter(uqProdRouterBuilder, compileProdRouterBuilder));
            app.use('/uq/test/:db/', buildUqRouter(uqTestRouterBuilder, compileTestRouterBuilder));
            app.use('/uq/unitx-prod/', buildUnitxRouter(unitxProdRouterBuilder));
            app.use('/uq/unitx-test/', buildUnitxRouter(unitxTestRouterBuilder));

            let port = config.get<number>('port');

            app.listen(port, async () => {
                await createResDb();
                await create$UqDb();
                logger.debug('a', 'UQ-API ' + uq_api_version + ' listening on port ' + port);
                //let connection = config.get<any>("connection");
                let { host, user } = connection;
                logger.debug('DB host: %s, user: %s', host, user);
                logger.debug('Tonva uq-api started!');
                resolve();
            });
        }
        catch (err) {
            logger.error(err);
        }
    });
}

export async function start() {
    await init();
    await runJobsForever();
}

async function runJobsForever() {
    try {
        await runJobs();
    }
    catch (err) {
        console.error('runJobsForever error: ', err);
    }
    finally {
        // 如果发生错误，退出循环，60秒钟之后，重新启动
        setTimeout(runJobsForever, 60000);
    }
}

async function runJobs() {
    let jobs = new Jobs();
    if (env.isDevelopment === true) {
        let uqDbNames = env.configDebugging.uqs;
        await jobs.debugUqJob(uqDbNames);
    }
    await jobs.run();
}

function dbHello(req: Request, res: Response) {
    let { db } = req.params;
    let text = 'uq-api: hello';
    if (db) text += ', db is ' + db;
    res.json({ "hello": text });
}

function buildUqRouter(rb: RouterBuilder, rbCompile: CompileRouterBuilder): Router {
    // 正常的tonva uq接口 uqRouter
    let uqRouter = Router({ mergeParams: true });

    let openRouter = Router({ mergeParams: true });
    buildOpenRouter(openRouter, rb);
    uqRouter.use('/open', [authUnitx, openRouter]);

    let buildRouter = Router({ mergeParams: true });
    buildBuildRouter(buildRouter, rbCompile);
    uqRouter.use('/build', [authUpBuild, buildRouter]);

    let entityRouter = Router({ mergeParams: true });
    buildEntityRouter(entityRouter, rb);
    uqRouter.use('/tv', [authCheck, entityRouter]);
    uqRouter.use('/debug', [authCheck, entityRouter]);
    uqRouter.use('/joint', [authJoint, entityRouter]);

    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);

    return uqRouter;
}
