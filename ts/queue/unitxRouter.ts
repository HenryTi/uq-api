import {Router, Request, Response, NextFunction} from 'express';
import { Message, SheetMessage } from './model';
import { getRunner } from '../tv/runner';
import { queueUnitxIn } from './unitxInQueue';

export const unitxRouter: Router = Router();

unitxRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let msg:Message = req.body;
        let tos:number[] = undefined;
        let {type} = msg;
        if (type === 'sheet') {
            let sheetMessage = msg as SheetMessage;
            let {from} = sheetMessage;
            tos = await getSheetTos(sheetMessage);
            if (tos.length === 0) tos = [from];
            sheetMessage.to = tos;
        }        
        await queueUnitxIn(msg);
        res.json({
            ok: true,
            res: tos,
        });
    }
    catch (e) {
        res.json({
            ok: false,
            error: JSON.stringify(e),
        });
    }
});

const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlGetSheetTo = 'getSheetTo';
async function getSheetTos(sheetMessage:SheetMessage):Promise<number[]> {
    let runner = await getRunner($unitx);
    let {unit, body} = sheetMessage;
    let {state, user, name, no, discription, usq } = body;
    // 上句中的to removed，由下面调用unitx来计算
    let sheetName = name;
    let stateName = state;
    let paramsGetSheetTo:any[] = [usq, sheetName, stateName];
    let tos:{to:number}[] = await runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
    return tos.map(v=>v.to);
}