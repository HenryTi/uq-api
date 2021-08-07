import { logger } from '../tool';
import { EntityRunner, centerApi, SheetQueueData, BusMessage, env } from "../core";
import { Finish } from "./finish";
import { getErrorString } from "../tool";
import { getUserX } from "../core/unitx";

export async function queueOut(runner: EntityRunner): Promise<void> {
    try {
        let start = 0;
        let count = 0;
        for (;count<200;) {
            let ret = await runner.call('$message_queue_get',  [start]);
            if (ret.length === 0) break;
            let procMessageQueueSet = 'tv_$message_queue_set';
            for (let row of ret) {
                // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
                let {$unit, id, to, action, subject, content, tries, update_time, now} = row;
                logger.log('queueOut 1: ', action, subject, content, update_time);
                start = id;
                if (!$unit) $unit = runner.uniqueUnit;
                if (tries > 0) {
                    // 上次尝试之后十分钟内不尝试，按次数，时间递增
                    if (now - update_time < tries * 10 * 60) continue;
                }
                let finish:Finish;
                if (!content) {
                    // 如果没有内容，直接进入failed
                    finish = Finish.bad;
                }
                else {
                    try {
                        switch (action) {
                            default:
                                await processItem(runner, $unit, id, action, subject, content, update_time);
                                break;
                            case 'app':
                                await app(runner, $unit, id, content);
                                finish = Finish.done;
                                break;
                            case 'email':
                                await email(runner, $unit, id, content);
                                finish = Finish.done;
                                break;
                            case 'bus':
                                await bus(runner, $unit, id, to, subject, content);
                                finish = Finish.done;
                                break;
                            case 'sheet':
                                await sheet(runner, content);
								await runner.log($unit, 'sheet-action', content);
                                finish = Finish.done;
                                break;
                        }
                        ++count;
                    }
                    catch (err) {
                        if (tries < 5) {
                            finish = Finish.retry; // retry
                        }
                        else {
                            finish = Finish.bad;  // fail
                        }
						let errSubject = `error on ${action}:  ${subject}`;
						/*
                        let error = typeof(err)==='object'?
							err.message : err; */
						let error = getErrorString(err);
                        await runner.log($unit, errSubject, error);
                    }
                }
                if (finish !== undefined) await runner.unitCall(procMessageQueueSet, $unit, id, finish); 
            }
        }
    }
    catch (err) {
        await runner.log(0, 'jobs queueOut loop', getErrorString(err));
        if (env.isDevelopment===true) logger.error(err);
    }
}

async function processItem(runner:EntityRunner, unit:number, id:number, action:string, subject:string, content:string, update_time:Date): Promise<void> {
    let json:any = {};
    let items = content.split('\n\t\n');
    for (let item of items) {
        let parts = item.split('\n');
        json[parts[0]] = parts[1];
    }
    logger.log('queue item: ', unit, id, action, subject, json);
}

function jsonValues(content:string):any {
    let json:any = {};
    let items = content.split('\n\t\n');
    for (let item of items) {
        let parts = item.split('\n');
        json[parts[0]] = parts[1];
    }
    return json;
}

async function app(runner:EntityRunner, unit:number, id:number, content:string):Promise<void> {
    await centerApi.send({
        type: 'app',
        unit: unit,
        body: content,
    });
}

async function email(runner:EntityRunner, unit:number, id:number, content:string): Promise<void> {
    let values = jsonValues(content);
    let {$isUser, $to, $cc, $bcc, $templet} = values;
    if (!$to) return;
    let schema = runner.getSchema($templet);
    if (schema === undefined) {
        debugger;
        throw 'something wrong';
    }
    let {subjectSections, sections} = schema.call;
    let mailSubject = stringFromSections(subjectSections, values);
    let mailBody = stringFromSections(sections, values);

    await centerApi.send({
        isUser: $isUser === '1',
        type: 'email',
        subject: mailSubject,
        body: mailBody,
        to: $to,
        cc: $cc,
        bcc: $bcc
    });
}

// bus参数，调用的时候，就是project
async function bus(runner:EntityRunner, unit:number, id:number, to:number, bus:string, content:string): Promise<void> {
    if (!unit && !to) return;
    
    let parts = bus.split('/');
    let busEntityName = parts[0];
    let face = parts[1];

    let schema = runner.getSchema(busEntityName);
    if (schema === undefined) {
        let err = `schema ${busEntityName} not exists`;
        logger.error(err);
        debugger;
        throw err;
    }
    let {schema:busSchema, busOwner, busName} = schema.call;

    let {uqOwner, uq} = runner;

	let {body, version, local} = toBusMessage(busSchema, face, content);
	
	function buildMessage(u:number):BusMessage {
		let message: BusMessage = {
			unit: u,
			type: 'bus',
			queueId: id,
			to,
			from: uqOwner + '/' + uq,           // from uq
			busOwner,
			bus: busName,
			face,
			version,
			body,
		};
		return message;
	}

	if (to > 0) {
		let unitXArr:number[] = await getUserX(runner, to, bus, busOwner, busName, face);
		if (!unitXArr || unitXArr.length === 0) return;
		let promises = unitXArr.map(async (v) => {
			let message: BusMessage = buildMessage(v);
			await runner.net.sendToUnitx(v, message);
            if (local === true) {
                let msgId = 0;
                await runner.call('$queue_in_add', [v, to, msgId, bus, face, body]);
            }
        });
		await Promise.all(promises);
	}
	else {
		let message: BusMessage = buildMessage(unit);
		await runner.net.sendToUnitx(unit, message);
        if (local === true) {
            let msgId = 0;
            await runner.call('$queue_in_add', [unit, to, msgId, bus, face, body]);
        }
    }
}

async function sheet(runner: EntityRunner, content:string):Promise<void> {
    let sheetQueueData:SheetQueueData = JSON.parse(content);
    let {id, sheet, state, action, unit, user, flow} = sheetQueueData;
    let result = await runner.sheetAct(sheet, state, action, unit, user, id, flow);
}

function stringFromSections(sections:string[], values: any):string {
    if (sections === undefined) return;
    let ret:string[] = [];
    let isValue:boolean = false;
    for (let section of sections) {
        if (isValue === true) {
            ret.push(values[section] || '');
            isValue = false;
        }
        else {
            ret.push(section);
            isValue = true;
        }
    }
    return ret.join('');
}

function toBusMessage(busSchema:any, face:string, content:string):{
    body:string; version:number; local:boolean;
} {
    if (!content) return undefined;
    let faceSchema = busSchema[face];
    if (faceSchema === undefined) {
        debugger;
        throw 'toBusMessage something wrong';
    }
    let data:{[key:string]: string[]}[] = [];
    let p = 0;
    let part:{[key:string]: string[]};
    let busVersion:number;
    let local = false;
    for (;;) {
        let t = content.indexOf('\t', p);
        if (t<0) break;
        let key = content.substring(p, t);
        ++t;
        let n = content.indexOf('\n', t);
        let sec = content.substring(t, n<0? undefined: n);
        switch (key) {
            case '#':
                busVersion = Number(sec);
                break;
            case '+#':
                busVersion = Number(sec);
                local = true;
                break;
            case '$':
                if (part !== undefined) data.push(part);
                part = {$: [sec]};
                break;
            default:
                if (part !== undefined) {
                    let arr = part[key];
                    if (arr === undefined) {
                        part[key] = arr = [];
                    }
                    arr.push(sec);
                }
                break;
        }
        if (n<0) break;
        p = n+1;
    }
    if (part !== undefined) data.push(part);

    let {fields, arrs} = faceSchema;
    let ret:string = '';
    for (let item of data) {
        ret += item['$'] + '\n';
        if (arrs === undefined) continue;
        for (let arr of arrs) {
            let arrRows = item[arr.name];
            if (arrRows !== undefined) {
                for (let ar of arrRows) {
                    ret += ar + '\n';
                }
            }
            ret += '\n';
        }
        // ret += '\n'; 
        // 多个bus array，不需要三个回车结束。自动取完，超过长度，自动结束。这样便于之后附加busQuery
    }

    return {body:ret, version:busVersion, local};
}
