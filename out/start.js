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
exports.start = exports.init = void 0;
const express = require("express");
const express_1 = require("express");
const config = require("config");
const tool_1 = require("./tool");
const router_1 = require("./router");
const res_1 = require("./res");
const core_1 = require("./core");
const auth_1 = require("./core/auth");
const jobs_1 = require("./jobs");
const proc_1 = require("./router/proc");
const { version: uq_api_version } = require('../package.json');
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                tool_1.logger.debug("UQ-API init 1.1.5 ...\n");
                process.on('uncaughtException', function (err) {
                    tool_1.logger.error('uncaughtException', err);
                    reject(err);
                });
                process.on('unhandledRejection', (err, promise) => {
                    tool_1.logger.debug('unhandledRejection', err);
                    reject(err);
                });
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
                            p = p.substr(0, 100);
                    }
                    let t = new Date();
                    tool_1.logger.debug(req.method, req.originalUrl, p);
                    tool_1.logger.debug('%s %s %s', req.method, req.originalUrl, p);
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
                app.use('/uq/prod/:db/', buildUqRouter(core_1.uqProdRouterBuilder, core_1.compileProdRouterBuilder));
                app.use('/uq/test/:db/', buildUqRouter(core_1.uqTestRouterBuilder, core_1.compileTestRouterBuilder));
                app.use('/uq/unitx-prod/', (0, router_1.buildUnitxRouter)(core_1.unitxProdRouterBuilder));
                app.use('/uq/unitx-test/', (0, router_1.buildUnitxRouter)(core_1.unitxTestRouterBuilder));
                let port = config.get('port');
                app.listen(port, () => __awaiter(this, void 0, void 0, function* () {
                    yield (0, res_1.createResDb)();
                    yield (0, core_1.create$UqDb)();
                    tool_1.logger.debug('a', 'UQ-API ' + uq_api_version + ' listening on port ' + port);
                    //let connection = config.get<any>("connection");
                    let { host, user } = connection;
                    tool_1.logger.debug('DB host: %s, user: %s', host, user);
                    tool_1.logger.debug('Tonva uq-api started!');
                    resolve();
                }));
            }
            catch (err) {
                tool_1.logger.error(err);
            }
        });
    });
}
exports.init = init;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        yield runJobsForever();
    });
}
exports.start = start;
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
function runJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        let jobs = new jobs_1.Jobs();
        if (core_1.env.isDevelopment === true) {
            let uqDbNames = core_1.env.configDebugging.uqs;
            yield jobs.debugUqJob(uqDbNames);
        }
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
    // 正常的tonva uq接口 uqRouter
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
//# sourceMappingURL=start.js.map