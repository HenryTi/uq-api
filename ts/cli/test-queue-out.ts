import { logger } from '../tool';
import { create$UqDb, testNet } from "../core";
import { QueueOut } from "../jobs/queueOut";

(async function () {
    logger.debug('test-queue-out');

    // 停掉其它服务器操作消息队列
    //let db = Db.db(undefined);
    //await db.setDebugJobs();
    await create$UqDb();

    let dbName = 'joint-uq-platform'; //$test';
    let node_env = process.env.NODE_ENV;
    logger.debug('node_env=' + node_env + ', ' + 'db = ' + dbName);
    //let net = prodNet;
    let net = testNet;
    let runner = await net.getRunner(dbName);

    let { buses } = runner;
    if (buses !== undefined) {
        let { outCount, faces } = buses;
        if (outCount > 0 || runner.hasSheet === true) {
            let queueOut = new QueueOut(runner);
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
            }
            await queueOut.processOneRow(row, 0);
            // await queueOut.run();
        }
        if (faces !== undefined) {
            //await pullBus(runner);
            //await queueIn(runner);
        }
    }

})();
