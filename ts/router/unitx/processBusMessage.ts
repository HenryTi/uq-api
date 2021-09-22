import { logger } from '../../tool';
import { EntityRunner, BusMessage } from '../../core';

export async function writeDataToBus(runner:EntityRunner, face:string, unit:number, to:number
    , from:string, fromQueueId:number, version:number, body:string, defer:number):Promise<number>
{
	let ret = await runner.actionDirect('writebusqueue', unit, undefined, face, defer, to, from, fromQueueId, version, body);
	if (ret && ret.length > 0) {
		return ret[0]['queueid'];
	}
}

export async function processBusMessage(unitxRunner:EntityRunner, msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的uq服务器
    let {unit, body, defer, to, from, queueId, busOwner, bus, face, version} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
	let ret = await writeDataToBus(unitxRunner, faceUrl, unit, to, from, queueId, version, body, defer);
	if (ret < 0) {
		logger.error('writeDataToBus message duplicated!', msg, -ret);
	}
}
