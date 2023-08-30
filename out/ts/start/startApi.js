"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startApi = void 0;
const express = require("express");
const express_1 = require("express");
const cors = require("cors");
const tool_1 = require("../tool");
const res_1 = require("../res");
const core_1 = require("../core");
const router_1 = require("../router");
const auth_1 = require("../core/auth");
const proc_1 = require("../router/proc");
const { version: uq_api_version } = require('../../package.json');
async function startApi() {
    process.on('uncaughtException', function (err) {
        tool_1.logger.error('uncaughtException', err);
        throw err;
    });
    process.on('unhandledRejection', (err, promise) => {
        tool_1.logger.debug('unhandledRejection', err);
        throw err;
    });
    try {
        if (!process.env.NODE_ENV) {
            tool_1.logger.error('NODE_ENV not defined, exit');
            process.exit();
        }
        tool_1.logger.debug('process.env.NODE_ENV: ', process.env.NODE_ENV);
        //let connection = config.get<any>("connection");
        //let connection = env.connection;
        //if (connection === undefined || connection.host === '0.0.0.0') {
        if (tool_1.env.connection === null) {
            tool_1.logger.debug("mysql connection must defined in config/default.json or config/production.json");
            return;
        }
        (0, res_1.initResPath)();
        let app = express();
        app.use(cors({
            origin: '*'
        }));
        app.use(express.static('public'));
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
        app.use(express.json({ limit: '1mb' }));
        app.set('json replacer', (key, value) => {
            if (value === null)
                return undefined;
            return value;
        });
        app.use(async (req, res, next) => {
            let s = req.socket;
            let p = '';
            if (req.method !== 'GET') {
                p = JSON.stringify(req.body);
                if (p.length > 100)
                    p = p.substring(0, 100);
            }
            const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
            tool_1.logger.debug(req.method, ipAddress, req.originalUrl, p);
            try {
                next();
            }
            catch (e) {
                tool_1.logger.error(e);
            }
        });
        app.use('/res', res_1.router);
        app.use('/hello', dbHello);
        app.use('/uq/hello', dbHello);
        app.use('/proc/:db/:proc', (0, proc_1.buildProcRouter)());
        let net = (0, core_1.getNet)();
        const uqProdRouterBuilder = new router_1.RouterWebBuilder(net);
        const uqProdRouterLocalBuilder = new router_1.RouterLocalBuilder(net);
        const uqTestRouterBuilder = new router_1.RouterWebBuilder(net);
        const uqTestRouterLocalBuilder = new router_1.RouterLocalBuilder(net);
        const unitxProdRouterBuilder = new router_1.UnitxRouterBuilder(net);
        const unitxTestRouterBuilder = new router_1.UnitxRouterBuilder(net);
        let compileNet = (0, core_1.getCompileNet)();
        const compileProdRouterBuilder = new router_1.CompileRouterBuilder(compileNet);
        const compileTestRouterBuilder = new router_1.CompileRouterBuilder(compileNet);
        app.use('/uq/prod/:db/', buildUqRouter(uqProdRouterBuilder, compileProdRouterBuilder));
        app.use('/uq/test/:db/', buildUqRouter(uqTestRouterBuilder, compileTestRouterBuilder));
        app.use('/uq/unitx-prod/', (0, router_1.buildUnitxRouter)(unitxProdRouterBuilder));
        app.use('/uq/unitx-test/', (0, router_1.buildUnitxRouter)(unitxTestRouterBuilder));
        let dbs = (0, core_1.getDbs)();
        await dbs.start();
        /*
        await Promise.all([
            create$ResDb(),
            create$UqDb()
        ]);
        */
        let { port, localPort, connection } = tool_1.env;
        app.listen(port, async () => {
            tool_1.logger.debug('UQ-API ' + uq_api_version + ' listening on port ' + port);
            let { host, user } = connection;
            let sql = `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'jksoft_mini_jxc_trial'`;
            let ret = await (0, core_1.getDbs)().dbNoName.sql(sql);
            console.log(ret);
            tool_1.logger.debug('DB host: %s, user: %s', host, user);
            tool_1.logger.debug('Tonwa uq-api started!');
            (0, tool_1.expressListRoutes)(app, {});
        });
        let localApp = express();
        if (localPort) {
            localApp.use('/hello', dbHello);
            localApp.use('/prod/:db/', buildLocalRouter(uqProdRouterLocalBuilder));
            localApp.use('/test/:db/', buildLocalRouter(uqTestRouterLocalBuilder));
            localApp.listen(localPort, async () => {
                tool_1.logger.debug('UQ-LOCAL ' + uq_api_version + ' listening on port ' + localPort);
            });
        }
    }
    catch (err) {
        tool_1.logger.error(err);
    }
}
exports.startApi = startApi;
async function dbHello(req, res) {
    let { db } = req.params;
    let text = 'uq-api: hello';
    if (db)
        text += ', db is ' + db;
    let uqs = await (0, core_1.getDbs)().db$Uq.uqDbs();
    res.json({
        "hello": text,
        uqs
    });
}
function buildUqRouter(rb, rbCompile) {
    // 正常的tonwa uq接口 uqRouter
    let uqRouter = (0, express_1.Router)({ mergeParams: true });
    let openRouter = (0, express_1.Router)({ mergeParams: true });
    (0, router_1.buildOpenRouter)(openRouter, rb);
    uqRouter.use('/open', [core_1.authUnitx, openRouter]);
    let buildRouter = (0, express_1.Router)({ mergeParams: true });
    (0, router_1.buildBuildRouter)(buildRouter, rbCompile);
    uqRouter.use('/build', [auth_1.authUpBuild, buildRouter]);
    let entityRouter = (0, express_1.Router)({ mergeParams: true });
    (0, router_1.buildEntityRouter)(entityRouter, rb);
    uqRouter.use('/tv', [core_1.authCheck, entityRouter]);
    uqRouter.use('/debug', [core_1.authCheck, entityRouter]);
    uqRouter.use('/joint', [auth_1.authJoint, entityRouter]);
    uqRouter.use('/', dbHello);
    uqRouter.use('/hello', dbHello);
    return uqRouter;
}
function buildLocalRouter(rb) {
    let uqRouter = (0, express_1.Router)({ mergeParams: true });
    let entityRouter = (0, express_1.Router)({ mergeParams: true });
    (0, router_1.buildEntityRouter)(entityRouter, rb);
    uqRouter.use('/', entityRouter);
    uqRouter.use('/hello', dbHello);
    return uqRouter;
}
//# sourceMappingURL=startApi.js.map