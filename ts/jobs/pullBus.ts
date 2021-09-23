import { logger } from '../tool';
import { EntityRunner, Buses, Net, Face } from "../core";
import { getErrorString } from "../tool";
import { deferMax, deferQueueCounts } from './consts';

export class PullBus {
	private readonly runner: EntityRunner;
	private readonly net: Net;
	private readonly buses: Buses;
	private readonly faces: string;
	private readonly coll: {[url:string]:Face};
	private hasError:boolean;


	constructor(runner: EntityRunner) {
		this.runner = runner;
		this.net = runner.net;
		this.buses = runner.buses;
		this.faces = this.buses.faces;
		this.coll = this.buses.coll;
		this.hasError = this.buses.hasError;
	}

	async run() {
		try {
			let unitMaxIds:{unit:number; maxId:number; maxId1:number;}[] = await this.getSyncUnits();
			for (let row of unitMaxIds) {
				if (this.hasError === true) break;
				let {unit, maxId, maxId1} = row;
				let pullIds:number[] = [maxId, maxId1];
				for (let defer=0; defer<deferMax; defer++) {
					if (this.hasError as any === true) break;
					let count = deferQueueCounts[defer];
					let pullId = pullIds[defer];
					await this.pullFromUnitx(unit, pullId??0, defer, count);
				}
			}
		}
		catch (err) {
			logger.error(err);
			await this.runner.log(0, 'jobs pullBus loop error: ', getErrorString(err));
		}
	}

	private async pullFromUnitx(unit:number, pullId:number, defer:number, count:number) {
		for (let i=0; i<count;) {
			if (this.hasError === true) break;
			let ret = await this.net.pullBus(unit, pullId, this.faces, defer);
			if (!ret) break;

			let {maxMsgId, maxRows} = ret[0][0];
			if (maxMsgId === 0) break;
			let messages = ret[1];
			let {length: messagesLen} = messages;
			let maxPullId:number = 0;
			if (messagesLen > 0) {
				// 新版：bus读来，直接写入queue_in。然后在队列里面处理
				logger.debug(`total ${messagesLen} arrived from unitx`);
				for (let row of messages) {
					await this.processMessage(unit, defer, row);
					maxPullId = row.id;
					++i;
				}
				if (this.hasError as any === true) break;
			}
			if (messagesLen < maxRows && maxPullId < maxMsgId) {
				// 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
				await this.runner.call('$queue_in_add', [unit, undefined, defer, maxMsgId, undefined, undefined, undefined]);
				break;
			}
			if (messagesLen === 0) break;
		}
	}

	private async processMessage(unit:number, defer:number, message:any) {
		let {to, face:faceUrl, id:msgId, body, version} = message;
		let face = this.coll[(faceUrl as string).toLowerCase()];
		if (face === undefined) return;
		let {bus, faceName, version:runnerBusVersion} = face;
		try {
			if (runnerBusVersion !== version) {
				// 也就是说，bus消息的version，跟runner本身的bus version有可能不同
				// 不同需要做数据转换
				// 但是，现在先不处理
				// 2019-07-23
			}
			await this.runner.call('$queue_in_add', [unit, to, defer, msgId, bus, faceName, body]);
		}
		catch (toQueueInErr) {
			this.hasError = this.buses.hasError = true;
			logger.error(toQueueInErr);
			await this.runner.log(unit, 'jobs pullBus loop to QueueInErr msgId='+msgId, getErrorString(toQueueInErr));
		}
	}

	private async getSyncUnits(): Promise<any[]> {
		let syncUnits = await this.runner.call('$sync_units', []);
		return syncUnits;
	}
}
