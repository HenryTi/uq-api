import { Runner, consts, BusMessage, busQueuehour, busQueueSeedFromHour } from '../../core';

let faces:{[face:string]:number};
let froms:{[from:string]:number};
let lastHour: number = 0;

async function getFaceId(runner:Runner, unit:number, face:string):Promise<number> {
    if (faces === undefined) {
        faces = {};
        let ret = await runner.tuidGetAll(consts.Face, unit, undefined);
        for (let row of ret) {
            let {id, str} = row;
            faces[str] = id;
        }
    }
    let faceId = faces[face];
    if (faceId === undefined) {
         let ret = await runner.tuidSave(consts.Face, unit, undefined, [undefined, face]);
         if (ret === undefined) return;
         if (ret.length === 0) return;
         let {id} = ret[0];
         if (id<0) id = -id;
         faceId = id;
         faces[face] = faceId;
    }
    return faceId;
}

async function getFromId(runner:Runner, unit:number, from:string):Promise<number> {
    if (froms === undefined) {
        froms = {};
        let ret = await runner.tuidGetAll(consts.BusFrom, unit, undefined);
        for (let row of ret) {
            let {id, str} = row;
            froms[str] = id;
        }
    }
    let fromId = froms[from];
    if (fromId === undefined) {
         let ret = await runner.tuidSave(consts.BusFrom, unit, undefined, [undefined, from, undefined]);
         if (ret === undefined) return;
         if (ret.length === 0) return;
         let {id} = ret[0];
         if (id<0) id = -id;
         fromId = id;
         froms[from] = fromId;
    }
    return fromId;
}

export async function writeDataToBus(runner:Runner, face:string, unit:number, from:string, fromQueueId:number, version:number, body:string) {
    /*
    let faceId = await getFaceId(runner, unit, face);
    let fromId = await getFromId(runner, unit, from);
        
    await runner.tuidSave(consts.BusQueue, unit, undefined, 
        [undefined, faceId, fromId, fromQueueId, version, body]);
    */

    let hour = busQueuehour();
    if (hour > lastHour) {
        let seed = busQueueSeedFromHour(hour);
        let seedRet = await runner.call('$get_table_seed', ['busqueue']);
        let s = seedRet[0].seed;
        if (!s) s = 1;
        if (seed > s) {
            await runner.call('$set_bus_queue_seed', ['busqueue', seed]);
        }
        lastHour = hour;
    }

    await runner.actionDirect('writebusqueue', unit, undefined, face, from, fromQueueId, version, body);
}

export async function processBusMessage(unitxRunner:Runner, msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的uq服务器
    console.log('bus:', msg);
    //let unitxRunner = await getRunner(consts.$unitx);
    let {unit, body, from, queueId, busOwner, bus, face, version} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
    //await unitxRunner.log(unit, faceUrl, 'processBusMessage: before writeDateToBus');
    await writeDataToBus(unitxRunner, faceUrl, unit, from, queueId, version, body);
    //await unitxRunner.log(unit, faceUrl, 'processBusMessage: after writeDateToBus');
}
