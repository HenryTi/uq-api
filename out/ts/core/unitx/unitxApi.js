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
        try {
            let ret = await this.post('fetch-bus', {
                unit,
                msgStart: msgStart,
                faces: faces,
                defer,
            });
            return ret;
        }
        catch (err) {
            tool_1.logger.error(err, this.baseUrl + pathFetchBus, unit);
            return undefined;
        }
    }
}
exports.UnitxApi = UnitxApi;
//# sourceMappingURL=unitxApi.js.map