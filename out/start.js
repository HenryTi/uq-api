"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.init = exports.debug_change = void 0;
const express = require("express");
const express_1 = require("express");
const config = require("config");
const tool_1 = require("./tool");
const res_1 = require("./res");
const core_1 = require("./core");
const router_1 = require("./router");
const auth_1 = require("./core/auth");
const jobs_1 = require("./jobs");
const proc_1 = require("./router/proc");
const { version: uq_api_version } = require('../package.json');
exports.debug_change = '1.0.8';
function init() {
    return __awaiter(this, void 0, void 0, function* () {
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
            let connection = core_1.env.getConnection();
            if (connection === undefined || connection.host === '0.0.0.0') {
                tool_1.logger.debug("mysql connection must defined in config/default.json or config/production.json");
                return;
            }
            (0, res_1.initResPath)();
            let app = express();
            var cors = require('cors');
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
            app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
            }));
            app.use('/res', res_1.router);
            app.use('/hello', dbHello);
            app.use('/uq/hello', dbHello);
            app.use('/proc/:db/:proc', (0, proc_1.buildProcRouter)());
            app.use('/uq/prod/:db/', buildUqRouter(router_1.uqProdRouterBuilder, router_1.compileProdRouterBuilder));
            app.use('/uq/test/:db/', buildUqRouter(router_1.uqTestRouterBuilder, router_1.compileTestRouterBuilder));
            app.use('/uq/unitx-prod/', (0, router_1.buildUnitxRouter)(router_1.unitxProdRouterBuilder));
            app.use('/uq/unitx-test/', (0, router_1.buildUnitxRouter)(router_1.unitxTestRouterBuilder));
            yield Promise.all([
                (0, res_1.createResDb)(),
                (0, core_1.create$UqDb)()
            ]);
            let port = config.get('port');
            app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
                tool_1.logger.debug('UQ-API ' + uq_api_version + ' listening on port ' + port);
                let { host, user } = connection;
                tool_1.logger.debug('DB host: %s, user: %s', host, user);
                tool_1.logger.debug('Tonwa uq-api started!');
            }));
            let localApp = express();
            let localPort = config.get('local-port');
            if (localPort) {
                localApp.use('/hello', dbHello);
                localApp.use('/prod/:db/', buildLocalRouter(router_1.uqProdRouterLocalBuilder));
                localApp.use('/test/:db/', buildLocalRouter(router_1.uqTestRouterLocalBuilder));
                localApp.listen(localPort, () => __awaiter(this, void 0, void 0, function* () {
                    tool_1.logger.debug('UQ-LOCAL ' + uq_api_version + ' listening on port ' + localPort);
                }));
            }
        }
        catch (err) {
            tool_1.logger.error(err);
        }
    });
}
exports.init = init;
/**
 * uq-api运行的总入口点
 */
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        // await forDebug();
        yield runJobsForever();
    });
}
exports.start = start;
/*
async function forDebug() {
    let net = testNet;
    let runner = await net.getRunner('workshop_bus_test');
}
*/
/**
 * 所有Job运行的总入口点
 */
function runJobsForever() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield runJobs();
        }
        catch (err) {
            console.error('runJobsForever error: ', err);
        }
        finally {
            // 如果发生错误，退出循环，60秒钟之后，重新启动
            setTimeout(runJobsForever, 60000);
        }
    });
}
/**
 * 运行job，在总入口点调用
 */
function runJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        let jobs = new jobs_1.Jobs();
        yield jobs.run();
    });
}
function dbHello(req, res) {
    let { db } = req.params;
    let text = 'uq-api: hello';
    if (db)
        text += ', db is ' + db;
    res.json({ "hello": text });
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
//# sourceMappingURL=start.js.map