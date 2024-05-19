"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitxTest = exports.unitxProd = exports.Unitx = void 0;
const core_1 = require("../../core");
const tool_1 = require("../../tool");
const centerApi_1 = require("../centerApi");
// import { UnitxDbContainer, UnitxProdDbContainer, UnitxTestDbContainer } from '../db/UnitxDbContainer';
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
        this.unitUnitxApis = {};
    }
    get serverId() {
        if (this._serverId === undefined) {
            this._serverId = this.db.serverId;
        }
        return this._serverId;
    }
    async getUnitxApi(unit) {
        let unitxApi = this.unitUnitxApis[unit];
        if (unitxApi === undefined) {
            this.unitUnitxApis[unit] = unitxApi = await this.buildUnitxApi(unit);
        }
        return unitxApi;
    }
    async getPullUnitxApi(unit) {
        //let {prev, current} = await this.getUnitxApi(unit);
        //if (prev === undefined) return current;
        let unitxApi = await this.getUnitxApi(unit);
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
    }
    async getPushUnitxApi(unit) {
        let unitxApi = await this.getUnitxApi(unit);
        return unitxApi;
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
    async buildUnitxApi(unit) {
        let unitxUrls = await centerApi_1.centerApi.unitUnitx(unit);
        let uus = this.boxFromUrls(unitxUrls);
        if (uus === undefined) {
            // debugger;
            return undefined;
        }
        let { url, server, create } = uus;
        if (tool_1.env.isDevelopment === true) {
            if (Number(server) === this.serverId) {
                let urlDebug = await (0, getUrlDebug_1.getUrlDebug)();
                if (urlDebug !== undefined)
                    url = urlDebug;
            }
        }
        if (url.endsWith('/') === false) {
            url += '/';
        }
        let unitxUrl = this.unitxUrl(url);
        return new unitxApi_1.UnitxApi(unitxUrl, create);
    }
    async sendToUnitx(unit, msg) {
        let unitxApi = await this.getPushUnitxApi(unit);
        if (!unitxApi) {
            let err = `Center unit ${unit} not binding $unitx service!!!`;
            tool_1.logger.error(err);
            throw new Error(err);
        }
        else {
            tool_1.logger.debug('get unitx push url in sendToUnitx: ', unitxApi.url);
        }
        let toArr = await unitxApi.send(msg);
        return toArr;
    }
    async pullBus(unit, maxId, faces, defer) {
        let unitxApi = await this.getPullUnitxApi(unit);
        if (!unitxApi) {
            tool_1.logger.error(`getUnitxApi unit=${unit}, pull return nothing`);
            return;
        }
        let ret = await unitxApi.fetchBus(unit, maxId, faces, defer);
        if (ret === undefined) {
            tool_1.logger.error(`unitxApi.fetchBus  url=${unitxApi.url} unit=${unit}`);
            return;
        }
        return ret;
    }
}
exports.Unitx = Unitx;
class UnitxProd extends Unitx {
    get db() { return (0, core_1.getDbs)().db$UnitxProd; }
    unitxUrl(url) { return url + 'uq/unitx-prod/'; }
    ;
    boxFromUrls(unitxUrls) {
        let { prod, tv } = unitxUrls;
        return prod ?? tv;
    }
}
exports.unitxProd = new UnitxProd();
class UnitxTest extends Unitx {
    get db() { return (0, core_1.getDbs)().db$UnitxTest; }
    unitxUrl(url) { return url + 'uq/unitx-test/'; }
    ;
    boxFromUrls(unitxUrls) {
        let { test, tv } = unitxUrls;
        return test ?? tv;
    }
}
exports.unitxTest = new UnitxTest();
//# sourceMappingURL=unitx.js.map