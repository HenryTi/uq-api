import * as _ from 'lodash';
import { logger } from '../tool';
import { Net, Db, prodNet, testNet, env, consts } from '../core';
import { pullEntities } from './pullEntities';
import { pullBus } from './pullBus';
import { queueIn } from './queueIn';
import { queueOut } from './queueOut';
import { execQueueAct } from './execQueueAct';

const firstRun: number = env.isDevelopment === true? 3000 : 30*1000;
const runGap: number = env.isDevelopment === true? 15*1000 : 30*1000;
const waitForOtherStopJobs = 1*1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';

function sleep(ms: number):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

let loopWait: boolean = true;

export async function startJobsLoop(): Promise<void> {
	let $uqDb = Db.db(consts.$uq);
    if (env.isDevelopment === true) {
		// 只有在开发状态下，才可以屏蔽jobs
		//logger.log('jobs loop: developing, no loop!');
		//return;
		if (env.isDevdo === true) return;
        logger.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
		await $uqDb.setDebugJobs();
		logger.log('========= set debugging jobs =========');
        await sleep(waitForOtherStopJobs);
    }
    else {
        await sleep(firstRun);
    }

	logger.log('\n');
	logger.log('\n');
    logger.error('====== Jobs loop started! ======');
    for (;;) {
        logger.log('\n');
        logger.info(`====== ${process.env.NODE_ENV} one loop at ${new Date().toLocaleString()} ======`);
        try {
            await uqsJob($uqDb);
            /*
			let uqs = await $uqDb.uqDbs();
			if (uqs.length === 0) {
				logger.error('debugging_jobs=yes, stop jobs loop');
				continue;
			}
			for (let uqRow of uqs) {
                let {db:uqDb, compile_tick} = uqRow;
                let net:Net;
                let dbName:string;;
                if (uqDb.endsWith($test) === true) {
                    dbName = uqDb.substr(0, uqDb.length - $test.length);
                    net = testNet;
                }
                else {
                    dbName = uqDb;
                    net = prodNet;
				}
				// 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
				// if (dbName !== 'bi') continue;

                if (env.isDevelopment === true) {
					switch (dbName) {
						case 'deliver':
						case 'collectpayment':
						case 'order':
						case 'warehouse':
							break;
					
						default:
							continue;
					}
						//return;
					//if (dbName === 'deliver') debugger;
					await $uqDb.setDebugJobs();
					logger.info('========= set debugging jobs =========');
					//if (dbName !== 'collectpayment') continue;
                }
                logger.info('====== loop for ' + uqDb + '======');

                let runner = await net.getRunner(dbName);
				if (runner === undefined) continue;
				await runner.setCompileTick(compile_tick);
				let {buses} = runner;
                if (buses !== undefined) {
					let {outCount, faces} = buses;
                    if (outCount > 0 || runner.hasSheet === true) {
						logger.info(`==== in loop ${uqDb}: queueOut out bus number=${outCount} ====`);
                        await queueOut(runner);
                    }
                    if (faces !== undefined) {
						logger.info(`==== in loop ${uqDb}: pullBus faces: ${faces} ====`);
                        await pullBus(runner);
						logger.info(`==== in loop ${uqDb}: queueIn faces: ${faces} ====`);
                        await queueIn(runner);
                    }
                }
				logger.info(`==== in loop ${uqDb}: pullEntities ====`);
				if (env.isDevelopment === false) {
					await pullEntities(runner);
				}
				else {
					logger.error('为了调试程序，pullEntities暂时屏蔽');
				}
				logger.info(`==== in loop ${uqDb}: execQueueAct ====`);
				await execQueueAct(runner);
				logger.info(`###### end loop ${uqDb} ######`);
            }
            */
        }
        catch (err) {
            logger.error('jobs loop error!!!!');
            logger.error(err);
            let errText:string = '';
            if (err === null) {
                errText = 'null';
            }
            else {
                switch (typeof err) {
                    default: errText = err; break;
                    case 'string': errText = err; break;
                    case 'undefined': errText = 'undefined'; break;
                    case 'object': errText = 'object: ' + err.messsage; break;
                }
            }
            await $uqDb.log(0, '$jobs', '$jobs loop error', errText);
        }
        finally {
            if (loopWait === true) {
				try {
					// 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
					// 执行这个sleep的时候，出现问题，从而跳出loop
					await sleep(runGap);
				}
				catch (errSleep) {
					logger.error('=========================');
					logger.error('===== sleep error =======');
					logger.error(errSleep);
					logger.error('=========================');
				}
            }
            else {
                loopWait = true;
            }
        }
        logger.info(`###### one loop end at ${new Date().toLocaleString()} ######`);
    }
}

async function uqsJob($uqDb: Db) {
    try {
        let uqs = await $uqDb.uqDbs();
        if (uqs.length === 0) {
            logger.error('debugging_jobs=yes, stop jobs loop');
            return;
        }
        for (let uqRow of uqs) {
            let {db:uqDbName, compile_tick} = uqRow;
            await uqJob($uqDb, uqDbName, compile_tick);
            /*
            let net:Net;
            let dbName:string;;
            if (uqDbName.endsWith($test) === true) {
                dbName = uqDbName.substr(0, uqDbName.length - $test.length);
                net = testNet;
            }
            else {
                dbName = uqDbName;
                net = prodNet;
            }
            // 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
            // if (dbName !== 'bi') continue;

            if (env.isDevelopment === true) {
                switch (dbName) {
                    case 'deliver':
                    case 'collectpayment':
                    case 'order':
                    case 'warehouse':
                        break;
                
                    default:
                        continue;
                }
                    //return;
                //if (dbName === 'deliver') debugger;
                await $uqDb.setDebugJobs();
                logger.info('========= set debugging jobs =========');
                //if (dbName !== 'collectpayment') continue;
            }
            logger.info('====== loop for ' + uqDbName + '======');

            let runner = await net.getRunner(dbName);
            if (runner === undefined) continue;
            await runner.setCompileTick(compile_tick);
            let {buses} = runner;
            if (buses !== undefined) {
                let {outCount, faces} = buses;
                if (outCount > 0 || runner.hasSheet === true) {
                    logger.info(`==== in loop ${uqDbName}: queueOut out bus number=${outCount} ====`);
                    await queueOut(runner);
                }
                if (faces !== undefined) {
                    logger.info(`==== in loop ${uqDbName}: pullBus faces: ${faces} ====`);
                    await pullBus(runner);
                    logger.info(`==== in loop ${uqDbName}: queueIn faces: ${faces} ====`);
                    await queueIn(runner);
                }
            }
            logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
            if (env.isDevelopment === false) {
                await pullEntities(runner);
            }
            else {
                logger.error('为了调试程序，pullEntities暂时屏蔽');
            }
            logger.info(`==== in loop ${uqDbName}: execQueueAct ====`);
            await execQueueAct(runner);
            logger.info(`###### end loop ${uqDbName} ######`);
            */
        }
    }
    catch (err) {
        logger.error('jobs loop error!!!!');
        logger.error(err);
        let errText:string = '';
        if (err === null) {
            errText = 'null';
        }
        else {
            switch (typeof err) {
                default: errText = err; break;
                case 'string': errText = err; break;
                case 'undefined': errText = 'undefined'; break;
                case 'object': errText = 'object: ' + err.messsage; break;
            }
        }
        await $uqDb.log(0, '$jobs', '$jobs loop error', errText);
    }
    finally {
        if (loopWait === true) {
            try {
                // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                // 执行这个sleep的时候，出现问题，从而跳出loop
                await sleep(runGap);
            }
            catch (errSleep) {
                logger.error('=========================');
                logger.error('===== sleep error =======');
                logger.error(errSleep);
                logger.error('=========================');
            }
        }
        else {
            loopWait = true;
        }
    }
}

// uqDbName可能包含$test，以此区分测试库或者生产库
async function uqJob($uqDb: Db, uqDbName: string, compile_tick: number) {
    let net:Net;
    let dbName:string;;
    if (uqDbName.endsWith($test) === true) {
        dbName = uqDbName.substr(0, uqDbName.length - $test.length);
        net = testNet;
    }
    else {
        dbName = uqDbName;
        net = prodNet;
    }
    // 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
    // if (dbName !== 'bi') continue;

    if (env.isDevelopment === true) {
        /*
        switch (dbName) {
            case 'deliver':
            case 'collectpayment':
            case 'order':
            case 'warehouse':
                break;
        
            default:
                return;
        }
        */
        //return;
        //if (dbName === 'deliver') debugger;
        await $uqDb.setDebugJobs();
        logger.info('========= set debugging jobs =========');
        //if (dbName !== 'collectpayment') continue;
    }
    logger.info('====== loop for ' + uqDbName + '======');

    let runner = await net.getRunner(dbName);
    if (runner === undefined) return;
    await runner.setCompileTick(compile_tick);
    let {buses} = runner;
    if (buses !== undefined) {
        let {outCount, faces} = buses;
        if (outCount > 0 || runner.hasSheet === true) {
            logger.info(`==== in loop ${uqDbName}: queueOut out bus number=${outCount} ====`);
            await queueOut(runner);
        }
        if (faces !== undefined) {
            logger.info(`==== in loop ${uqDbName}: pullBus faces: ${faces} ====`);
            await pullBus(runner);
            logger.info(`==== in loop ${uqDbName}: queueIn faces: ${faces} ====`);
            await queueIn(runner);
        }
    }
    logger.info(`==== in loop ${uqDbName}: pullEntities ====`);
    if (env.isDevelopment === false) {
        await pullEntities(runner);
    }
    else {
        logger.error('为了调试程序，pullEntities暂时屏蔽');
    }
    logger.info(`==== in loop ${uqDbName}: execQueueAct ====`);
    await execQueueAct(runner);
    logger.info(`###### end loop ${uqDbName} ######`);
}

export async function debugUqJob(uqDbNames: string[]) {
    if (!uqDbNames) return;
    if (uqDbNames.length === 0) return;
	let $uqDb = Db.db(consts.$uq);
    for (let uqDbName of uqDbNames) {
        await uqJob($uqDb, uqDbName, undefined);
    }
}
