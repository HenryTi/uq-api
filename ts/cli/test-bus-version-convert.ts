import { logger } from '../tool';
import { prodNet, testNet } from "../core";
import { PullBus } from '../jobs/pullBus';

(async function () {
	logger.debug('test-bus-version-convert');

	// 停掉其它服务器操作消息队列
	//let db = Db.db(undefined);
	//await db.setDebugJobs();

	let dbName = 'webuser';
	let node_env = process.env.NODE_ENV;
	logger.debug('node_env=' + node_env + ', ' + 'db = ' + dbName);
	let net = prodNet;
	//let net = testNet;
	let runner = await net.getRunner(dbName);

	let { buses } = runner;
	if (buses !== undefined) {
		let { faces } = buses;
		if (faces !== undefined) {
			//let pullBus = new PullBus(runner);
			//await pullBus.pullRun(24, 0, 0);
			let faceUrl = 'orderbus/order';
			let face = runner.buses.faceColl[faceUrl];
			if (face === undefined) return;
			let version = 17;
			let data = `1	32331896	20437	211116000030	68563		411543	22082	165096	165096	1	665040	12.00	0.00	74.00	5		0.00	0.00	0		1
32331897	66512	177771	1	62	62

`;
			if (face.version !== version) {
				// 也就是说，bus消息的version，跟runner本身的bus version有可能不同
				// 不同需要做数据转换
				// 但是，现在先不处理
				// 2019-07-23

				// 2021-11-14：实现bus间的版本转换
				// 针对不同version的bus做转换
				data = await face.convert(data, version);
			}
			else {
				let busData = await face.convert(data, version);
				if (busData === data) {
					console.error('converted is the same as original bus');
				}
				else {
					console.error(`converted is not the same as original bus
org: ${data}
new: ${busData}
					`);
				}
			}
		}
	}
})();
