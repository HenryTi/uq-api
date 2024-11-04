import { Fetch } from "../fetch";
import { logger } from '../../tool';

export class UnitxApi extends Fetch {
    readonly tickCreate: number;
    constructor(url: string, tickCreate: number) {
        super(url);
        this.tickCreate = tickCreate;
    }

    async send(msg: any): Promise<number[]> {
        let ret: number[] = await this.post('', msg);
        return ret;
    }
    async fetchBus(unit: number, msgStart: number, faces: string, defer: number): Promise<any[][]> {
        const pathFetchBus = 'fetch-bus';
        const param = {
            unit,
            msgStart: msgStart,
            faces: faces,
            defer,
        };
        try {
            let ret = await this.post(pathFetchBus, param);
            return ret;
        }
        catch (err) {
            // logger.error(err, this.baseUrl + pathFetchBus, unit, param);
            return undefined;
        }
    }
}
