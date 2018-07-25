import * as bull from 'bull';
import * as config from 'config';
import fetch from 'node-fetch';
import { centerApi, UnitxApi } from "../core";

const unitxColl: {[id:number]: string} = {};

const outQueueName = 'unitx-out-queue';
let redis = config.get<any>('redis');

const unitxOutQueue = bull(outQueueName, redis);

unitxOutQueue.on("error", (error: Error) => {
    console.log('queue server: ', error);
});

unitxOutQueue.process(async function(job, done) {
    try {
        let data = job.data;
        if (data !== undefined) {
            await toUnitx(data);
        }
        done();
    }
    catch (e) {
        console.error(e);
    }
});

export async function toUnitx(msg:any): Promise<void> {
    //let {unit, busOwner, bus, face, data} = jobData;
    let {$unit} = msg;
    let unitxUrl = await getUnitxUrl($unit);
    if (unitxUrl === null) {
        console.log('unit %s not have unitx', $unit);
        return;
    }
    let unitx = new UnitxApi(unitxUrl);
    await unitx.send(msg);
    console.log('toUnitx', msg);
}

async function getUnitxUrl(unit:number):Promise<string> {
    let unitxUrl = unitxColl[unit];
    if (unitxUrl !== undefined) return unitxUrl;
    let unitx = await centerApi.unitx(unit);
    if (unitx === undefined) return unitxColl[unit] = null;
    let {url, urlDebug} = unitx;
    if (urlDebug !== undefined) {
        try {
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            url = urlDebug;
        }
        catch (err) {
        }
    }
    return unitxColl[unit] = url;
}

export async function addUnitxOutQueue(msg:any):Promise<bull.Job> {
    return await unitxOutQueue.add(msg);
}

// 试试redis server，报告是否工作
export async function tryUnitxOutQueue() {
    try {
        let job = await unitxOutQueue.add({job: undefined});
        try {
            await job.remove();
            console.log('redis server ok!');
        }
        catch (err) {
            console.log('redis server job.remove error: ' + err);
        }
    }
    catch (reason) {
        console.log('redis server error: ', reason);
    };
}
