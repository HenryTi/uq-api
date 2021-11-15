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
const tool_1 = require("../tool");
const core_1 = require("../core");
const pullBus_1 = require("../jobs/pullBus");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        tool_1.logger.debug('test-bus-version-convert');
        // 停掉其它服务器操作消息队列
        //let db = Db.db(undefined);
        //await db.setDebugJobs();
        let dbName = 'me';
        let node_env = process.env.NODE_ENV;
        tool_1.logger.debug('node_env=' + node_env + ', ' + 'db = ' + dbName);
        //let net = prodNet;
        let net = core_1.testNet;
        let runner = yield net.getRunner(dbName);
        let { buses } = runner;
        if (buses !== undefined) {
            let { faces } = buses;
            if (faces !== undefined) {
                let pullBus = new pullBus_1.PullBus(runner);
                yield pullBus.pullRun(24, 0, 0);
            }
        }
    });
})();
//# sourceMappingURL=test-bus-version-convert.js.map