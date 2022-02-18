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
exports.UnitxTest = exports.UnitxProd = exports.Unitx = void 0;
const tool_1 = require("../../tool");
const centerApi_1 = require("../centerApi");
const consts_1 = require("../consts");
const db_1 = require("../db");
const getUrlDebug_1 = require("../getUrlDebug");
const unitxApi_1 = require("./unitxApi");
/*
interface UnitxApiBox {
    prev: UnitxApi;
    current: UnitxApi;
}

interface UnitxUrlServerBox {
    prev: UnitxUrlServer;
    current: UnitxUrlServer;
}
*/
class Unitx {
    constructor() {
        // get db(): UnitxDb { return this._db };
        this.unitUnitxApis = {};
        this.db = this.createDb();
    }
    getUnitxApi(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxApi = this.unitUnitxApis[unit];
            if (unitxApi === undefined) {
                this.unitUnitxApis[unit] = unitxApi = yield this.buildUnitxApi(unit);
            }
            return unitxApi;
        });
    }
    getPullUnitxApi(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            //let {prev, current} = await this.getUnitxApi(unit);
            //if (prev === undefined) return current;
            let unitxApi = yield this.getUnitxApi(unit);
            //if (env.isDevelopment === true) {
            //}
            return unitxApi;
            /*
            // 2021-9-23：我没有很明白。只是强行用localhost来取bus
            if (env.isDevelopment === true) {
                return prev;
            }
            // 小于10分钟
            let delta = Date.now()/1000 - current.tickCreate;
            let minutes = delta / 60;
            if (minutes < 10) {
                // 用老的unitx拉
                return prev ;
            }
            else {
                // 用新的unitx拉
                return current;
            }
            */
        });
    }
    getPushUnitxApi(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxApi = yield this.getUnitxApi(unit);
            return unitxApi;
        });
    }
    /*
    private async buildUnitxApiBox(unit:number): Promise<UnitxApiBox> {
        let unitxUrls = await centerApi.unitUnitx(unit);
        let {prev, current} = this.boxFromUrls(unitxUrls);
        return {
            prev: await this.buildUnitxApi(prev),
            current: await this.buildUnitxApi(current),
        }
    }
    */
    buildUnitxApi(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxUrls = yield centerApi_1.centerApi.unitUnitx(unit);
            let uus = this.boxFromUrls(unitxUrls);
            if (uus === undefined) {
                // debugger;
                return undefined;
            }
            let { url, server, create } = uus;
            if (db_1.env.isDevelopment === true) {
                if (server === this.db.serverId) {
                    let urlDebug = yield (0, getUrlDebug_1.getUrlDebug)();
                    if (urlDebug !== undefined)
                        url = urlDebug;
                }
            }
            let unitxUrl = this.unitxUrl(url);
            return new unitxApi_1.UnitxApi(unitxUrl, create);
        });
    }
    sendToUnitx(unit, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxApi = yield this.getPushUnitxApi(unit);
            if (!unitxApi) {
                let err = `Center unit ${unit} not binding $unitx service!!!`;
                //return ret;
                tool_1.logger.error(err);
                throw new Error(err);
            }
            else {
                tool_1.logger.error('get unitx push url in sendToUnitx: ', unitxApi.url);
            }
            let toArr = yield unitxApi.send(msg);
            return toArr;
        });
    }
    pullBus(unit, maxId, faces, defer) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxApi = yield this.getPullUnitxApi(unit);
            if (!unitxApi) {
                tool_1.logger.error(`getUnitxApi unit=${unit}, pull return nothing`);
                return;
            }
            let ret = yield unitxApi.fetchBus(unit, maxId, faces, defer);
            if (ret === undefined) {
                tool_1.logger.error(`unitxApi.fetchBus  url=${unitxApi.url} unit=${unit}`);
                return;
            }
            return ret;
        });
    }
}
exports.Unitx = Unitx;
class UnitxProd extends Unitx {
    createDb() {
        let dbName = consts_1.consts.$unitx;
        return new db_1.UnitxProdDb(dbName);
    }
    unitxUrl(url) { return url + 'uq/unitx-prod/'; }
    ;
    boxFromUrls(unitxUrls) {
        let { prod } = unitxUrls;
        return prod;
    }
}
exports.UnitxProd = UnitxProd;
class UnitxTest extends Unitx {
    createDb() {
        let dbName = consts_1.consts.$unitx + '$test';
        return new db_1.UnitxTestDb(dbName);
    }
    unitxUrl(url) { return url + 'uq/unitx-test/'; }
    ;
    boxFromUrls(unitxUrls) {
        let { test } = unitxUrls;
        return test;
    }
}
exports.UnitxTest = UnitxTest;
//# sourceMappingURL=unitx.js.map