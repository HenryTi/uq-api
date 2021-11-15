import { logger } from '../tool';
import { testNet } from "../core";
import { PullBus } from '../jobs/pullBus';

(async function() {
	logger.debug('test-bus-version-convert');

	// 停掉其它服务器操作消息队列
	//let db = Db.db(undefined);
	//await db.setDebugJobs();

	let dbName = 'me';
	let node_env = process.env.NODE_ENV;
	logger.debug('node_env=' + node_env + ', ' + 'db = ' + dbName);
	//let net = prodNet;
	let net = testNet;
	let runner = await net.getRunner(dbName);
	
	let {buses} = runner;
	if (buses !== undefined) {
		let {faces} = buses;
		if (faces !== undefined) {
			let pullBus = new PullBus(runner);
            await pullBus.pullRun(24, 0, 0);
		}
	}
})();
