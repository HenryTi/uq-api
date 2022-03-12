import * as express from 'express';
import { Request, Response, NextFunction, Router } from 'express';
import * as config from 'config';
import { logger } from './tool';
import { createResDb, router as resRouter, initResPath } from './res';
import { authCheck, authUnitx, create$UqDb, env, testNet } from './core';
import {
    buildOpenRouter, buildEntityRouter, buildUnitxRouter, buildBuildRouter,
    uqProdRouterBuilder, uqTestRouterBuilder,
    unitxTestRouterBuilder, unitxProdRouterBuilder,
    compileProdRouterBuilder, compileTestRouterBuilder, CompileRouterBuilder
    , uqProdRouterLocalBuilder, uqTestRouterLocalBuilder, RouterBuilder
} from './router';
import { authJoint, authUpBuild } from './core/auth';
import { Jobs } from './jobs';
import { buildProcRouter } from './router/proc';

const { version: uq_api_version } = require('../package.json');

export async function init(): Promise<void> {
    process.on('uncaughtException', function (err: any) {
        logger.error('uncaughtException', err);
        throw err;
    });
    process.on('unhandledRejection', (err: any, promise: any) => {
        logger.debug('unhandledRejection', err);
        throw err;
    });
    try {
        logger.debug("UQ-API init 1.1.5.3 ...\n");

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

        await Promise.all([
            createResDb(),
            create$UqDb()
        ]);

        let port = config.get<number>('port');
        app.listen(port, async () => {
            logger.debug('UQ-API ' + uq_api_version + ' listening on port ' + port);
            //let connection = config.get<any>("connection");
            let { host, user } = connection;
            logger.debug('DB host: %s, user: %s', host, user);
            logger.debug('Tonva uq-api started!');
        });

        let localApp = express();
        let localPort = config.get<number>('local-port');
        localApp.use('/prod/:db/', buildLocalRouter(uqProdRouterLocalBuilder));
        localApp.use('/test/:db/', buildLocalRouter(uqTestRouterLocalBuilder));
        localApp.listen(localPort, async () => {
            logger.debug('UQ-LOCAL ' + uq_api_version + ' listening on port ' + localPort);
        });
    }
    catch (err) {
        logger.error(err);
    }
}

export async function start() {
    await init();
    await forDebug();
    await runJobsForever();
}

async function forDebug() {
    let net = testNet;
    let runner = await net.getRunner('workshop_bus_test');
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

function buildLocalRouter(rb: RouterBuilder) {
    let uqRouter = Router({ mergeParams: true });
    let entityRouter = Router({ mergeParams: true });
    buildEntityRouter(entityRouter, rb);
    uqRouter.use('/', entityRouter);
    uqRouter.use('/hello', dbHello);
    return uqRouter;
}
