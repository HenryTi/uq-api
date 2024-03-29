import { Router, Request, Response, NextFunction } from "express";
import { logger } from '../../tool';
import { EntityRunner, busQueueSeed, SheetMessage, Message } from "../../core";
import { messageProcesser } from "./messageProcesser";
import { writeDataToBus } from "./processBusMessage";
import { RouterWebBuilder } from "../routerBuilder";

export function buildUnitxRouter(rb: RouterWebBuilder): Router {
    let router = Router();

    router.get('/hello',
        async function (req: Request, res: Response, next: NextFunction) {
            res.json({
                text: 'hello',
            });
        }
    );

    const pathIndex = '/';
    router.post(pathIndex,
        async function (req: Request, res: Response, next: NextFunction) {
            try {
                let msg: Message = req.body;
                let tos: number[] = undefined;
                let { type } = msg;
                let unitxRunner = await rb.getUnitxRunner(req);
                if (type === 'sheet') {
                    let sheetMessage = msg as SheetMessage;
                    let { from } = sheetMessage;
                    tos = await getSheetTos(unitxRunner, sheetMessage);
                    if (tos === undefined || tos.length === 0) tos = [from];
                    sheetMessage.to = tos;
                }
                if (type === 'bus') {
                    logger.error(msg);
                }
                let mp = messageProcesser(msg);
                await mp(unitxRunner, msg);
                res.json({
                    ok: true,
                    res: tos,
                });
            }
            catch (e) {
                let err = JSON.stringify(e);
                logger.error('unitx-error: ', err);
                res.json({
                    ok: false,
                    error: err,
                });
            }
        }
    );

    const pathFetchBus = '/fetch-bus';
    rb.post(router, pathFetchBus,
        async function (runner: EntityRunner, body: any): Promise<any[][]> {
            try {
                let { unit, msgStart, defer, faces } = body;
                if (unit === undefined || faces === undefined) {
                    throw new Error('unknown parameters');
                }
                let ret = await runner.unitUserTablesFromProc('GetBusMessages', unit, undefined, msgStart, defer ?? 0, faces);
                return ret;
            }
            catch (err) {
                console.error(pathFetchBus, err);
                throw err;
            }
        }
    );

    const pathJoinReadBus = '/joint-read-bus';
    rb.post(router, pathJoinReadBus,
        async function (runner: EntityRunner, body: any): Promise<any> {
            let { unit, face, queue, defer } = body;
            if (queue === undefined) queue = busQueueSeed();
            let ret = await runner.unitUserCall('BusMessageFromQueue', unit, undefined, face, defer ?? 0, queue);
            if (ret.length === 0) return;
            return ret[0];
        }
    );

    let pathJointWriteBus = '/joint-write-bus';
    rb.post(router, pathJointWriteBus,
        async function (runner: EntityRunner, body: any): Promise<any> {
            let { unit, face, defer, to, from, fromQueueId, version, body: message, stamp } = body;
            let ret = await writeDataToBus(runner, face, unit, to, from, fromQueueId, version, message, defer ?? 0, stamp);
            if (ret < 0) {
                logger.error('writeDataToBus message duplicated!', body, -ret);
            }
            return ret;
        })
        ;

    return router;
}

// 之前用 getSheetTo 查询，现在改名为 getEntityAccess
const uqGetSheetTo = 'getEntityAccess';
async function getSheetTos(unitxRunner: EntityRunner, sheetMessage: SheetMessage): Promise<number[]> {
    let { unit, body } = sheetMessage;
    let { state, user, name, no, discription, uq } = body;
    // 新单只能发给做单人
    if (state === '$') return;
    // 上句中的to removed，由下面调用unitx来计算
    let sheetName = name;
    let stateName = state;
    let paramsGetSheetTo: any[] = [uq, sheetName, stateName];
    let tos: { to: number }[] = await unitxRunner.query(uqGetSheetTo, unit, user, paramsGetSheetTo);
    return tos.map(v => v.to);
}
