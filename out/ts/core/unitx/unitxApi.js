"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitxApi = void 0;
const fetch_1 = require("../fetch");
const tool_1 = require("../../tool");
class UnitxApi extends fetch_1.Fetch {
    constructor(url, tickCreate) {
        super(url);
        this.tickCreate = tickCreate;
    }
    async send(msg) {
        let ret = await this.post('', msg);
        return ret;
    }
    async fetchBus(unit, msgStart, faces, defer) {
        const pathFetchBus = 'fetch-bus';
        const param = {
            unit,
            msgStart: msgStart,
            faces: faces,
            defer,
        };
        try {
            let ret = await this.post('fetch-bus', param);
            return ret;
        }
        catch (err) {
            tool_1.logger.error(err, this.baseUrl + pathFetchBus, unit, param);
            return undefined;
        }
    }
}
exports.UnitxApi = UnitxApi;
//# sourceMappingURL=unitxApi.js.map