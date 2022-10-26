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
const queueOut_1 = require("../jobs/queueOut");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        tool_1.logger.debug('test-queue-out');
        // 停掉其它服务器操作消息队列
        //let db = Db.db(undefined);
        //await db.setDebugJobs();
        yield (0, core_1.create$UqDb)();
        let dbName = 'joint-uq-platform'; //$test';
        let node_env = process.env.NODE_ENV;
        tool_1.logger.debug('node_env=' + node_env + ', ' + 'db = ' + dbName);
        //let net = prodNet;
        let net = core_1.testNet;
        let runner = yield net.getRunner(dbName);
        let { buses } = runner;
        if (buses !== undefined) {
            let { outCount, faces } = buses;
            if (outCount > 0 || runner.hasSheet === true) {
                let queueOut = new queueOut_1.QueueOut(runner);
                let row = {
                    $unit: 24,
                    id: -38,
                    to: -1,
                    action: 'bus',
                    subject: 'partnermappedbus/partnerordercreated',
                    content: `#	2
$		13	20220906091418173873	2022-09-06 09:14:18
`,
                    tries: 1,
                    update_time: '2021-1-1',
                    now: '2021-1-2',
                    stamp: null,
                };
                yield queueOut.processOneRow(row, 0);
                // await queueOut.run();
            }
            if (faces !== undefined) {
                //await pullBus(runner);
                //await queueIn(runner);
            }
        }
    });
})();
//# sourceMappingURL=test-queue-out.js.map