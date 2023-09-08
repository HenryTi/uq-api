import * as express from 'express';
import { Request, Response, NextFunction, Router } from 'express';
import * as cors from 'cors';
import { env, expressListRoutes, logger } from '../tool';
import { router as resRouter, initResPath } from '../res';
import { authCheck, authUnitx, getCompileNet, getDbs, getNet } from '../core';
import {
    buildOpenRouter, buildEntityRouter, buildUnitxRouter, buildBuildRouter,
    CompileRouterBuilder, RouterBuilder, RouterWebBuilder, RouterLocalBuilder, UnitxRouterBuilder
} from '../router';
import { authJoint, authUpBuild } from '../core/auth';
import { buildProcRouter } from '../router/proc';
import { buildCompileRouter } from '../router/compile';
const { version: uq_api_version } = require('../../package.json');

export async function startApi(): Promise<void> {
    process.on('uncaughtException', function (err: any) {
        logger.error('uncaughtException', err);
        throw err;
    });
    process.on('unhandledRejection', (err: any, promise: any) => {
        logger.debug('unhandledRejection', err);
        throw err;
    });
    try {
        if (!process.env.NODE_ENV) {
            logger.error('NODE_ENV not defined, exit');
            process.exit();
        }

        logger.debug('process.env.NODE_ENV: ', process.env.NODE_ENV);

        //let connection = config.get<any>("connection");
        //let connection = env.connection;
        //if (connection === undefined || connection.host === '0.0.0.0') {
        if (env.connection === null) {
            logger.debug("mysql connection must defined in config/default.json or config/production.json");
            return;
        }
        initResPath();

        let app = express();
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
                if (p.length > 100) p = p.substring(0, 100);
            }
            const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
            logger.debug(req.method, ipAddress, req.originalUrl, p);
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

        let net = getNet();
        const uqProdRouterBuilder = new RouterWebBuilder(net);
        const uqProdRouterLocalBuilder = new RouterLocalBuilder(net);
        const uqTestRouterBuilder = new RouterWebBuilder(net);
        const uqTestRouterLocalBuilder = new RouterLocalBuilder(net);
        const unitxProdRouterBuilder = new UnitxRouterBuilder(net);
        const unitxTestRouterBuilder = new UnitxRouterBuilder(net);
        let compileNet = getCompileNet();
        const compileProdRouterBuilder = new CompileRouterBuilder(compileNet);
        const compileTestRouterBuilder = new CompileRouterBuilder(compileNet);

        app.use('/uq/prod/:db/', buildUqRouter(uqProdRouterBuilder, compileProdRouterBuilder));
        app.use('/uq/test/:db/', buildUqRouter(uqTestRouterBuilder, compileTestRouterBuilder));
        app.use('/uq/unitx-prod/', buildUnitxRouter(unitxProdRouterBuilder));
        app.use('/uq/unitx-test/', buildUnitxRouter(unitxTestRouterBuilder));

        let dbs = getDbs();
        await dbs.start();
        /*
        await Promise.all([
            create$ResDb(),
            create$UqDb()
        ]);
        */
        let { port, localPort, connection } = env;
        app.listen(port, async () => {
            logger.debug('UQ-API ' + uq_api_version + ' listening on port ' + port);
            let { host, user } = connection;

            let sql = `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'jksoft_mini_jxc_trial'`;
            let ret = await getDbs().dbNoName.sql(sql);
            console.log(ret);

            logger.debug('DB host: %s, user: %s', host, user);
            logger.debug('Tonwa uq-api started!');
            expressListRoutes(app, {});
        });

        let localApp = express();
        if (localPort) {
            localApp.use('/hello', dbHello);
            localApp.use('/prod/:db/', buildLocalRouter(uqProdRouterLocalBuilder));
            localApp.use('/test/:db/', buildLocalRouter(uqTestRouterLocalBuilder));
            localApp.listen(localPort, async () => {
                logger.debug('UQ-LOCAL ' + uq_api_version + ' listening on port ' + localPort);
            });
        }
    }
    catch (err) {
        logger.error(err);
    }
}

async function dbHello(req: Request, res: Response) {
    let { db } = req.params;
    let text = 'uq-api: hello';
    if (db) text += ', db is ' + db;
    let uqs = await getDbs().db$Uq.uqDbs();
    res.json({
        "hello": text,
        uqs
    });
}

function buildUqRouter(rb: RouterBuilder, rbCompile: CompileRouterBuilder): Router {
    // 正常的tonwa uq接口 uqRouter
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
