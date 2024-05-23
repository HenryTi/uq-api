"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitxApi = void 0;
const fetch_1 = require("../fetch");
const tool_1 = require("../../tool");
class UnitxApi extends fetch_1.Fetch {
    constructor(url, tickCreate) {
        super(url);
        this.tickCreate = tickCreate;
    }
    send(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('', msg);
            return ret;
        });
    }
    fetchBus(unit, msgStart, faces, defer) {
        return __awaiter(this, void 0, void 0, function* () {
            const pathFetchBus = 'fetch-bus';
            const param = {
                unit,
                msgStart: msgStart,
                faces: faces,
                defer,
            };
            try {
                let ret = yield this.post('fetch-bus', param);
                return ret;
            }
            catch (err) {
                tool_1.logger.error(err, this.baseUrl + pathFetchBus, unit, param);
                return undefined;
            }
        });
    }
}
exports.UnitxApi = UnitxApi;
//# sourceMappingURL=unitxApi.js.map