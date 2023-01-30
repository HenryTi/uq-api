import { Db$Unitx, getDbs } from '../../core';
import { logger, env } from '../../tool';
import { centerApi, CenterUnitxUrls, UnitxUrlServer } from '../centerApi';
// import { UnitxDbContainer, UnitxProdDbContainer, UnitxTestDbContainer } from '../db/UnitxDbContainer';
import { getUrlDebug } from '../getUrlDebug';
import { Message } from '../model';
import { UnitxApi } from "./unitxApi";

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
export abstract class Unitx {
    // readonly db: Db$Unitx; // DbContainer;
    /*
    constructor() {
        this.db = this.createDb();
    }
    */
    // protected abstract createDb(): Db$Unitx; // UnitxDbContainer;
    private _serverId: number;
    get serverId(): number {
        if (this._serverId === undefined) {
            this._serverId = this.db.serverId;
        }
        return this._serverId;
    }
    protected abstract get db(): Db$Unitx;

    private unitUnitxApis: { [unit: number]: UnitxApi } = {};
    private async getUnitxApi(unit: number): Promise<UnitxApi> {
        let unitxApi = this.unitUnitxApis[unit];
        if (unitxApi === undefined) {
            this.unitUnitxApis[unit] = unitxApi = await this.buildUnitxApi(unit);
        }
        return unitxApi;
    }

    private async getPullUnitxApi(unit: number): Promise<UnitxApi> {
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

    private async getPushUnitxApi(unit: number): Promise<UnitxApi> {
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

    private async buildUnitxApi(unit: number): Promise<UnitxApi> {
        let unitxUrls = await centerApi.unitUnitx(unit);
        let uus: UnitxUrlServer = this.boxFromUrls(unitxUrls);
        if (uus === undefined) {
            // debugger;
            return undefined;
        }
        let { url, server, create } = uus;
        if (env.isDevelopment === true) {
            if (Number(server) === this.serverId) {
                let urlDebug = await getUrlDebug();
                if (urlDebug !== undefined) url = urlDebug;
            }
        }
        if (url.endsWith('/') === false) {
            url += '/';
        }
        let unitxUrl = this.unitxUrl(url);
        return new UnitxApi(unitxUrl, create);
    }

    async sendToUnitx(unit: number, msg: Message): Promise<number[] | string> {
        let unitxApi = await this.getPushUnitxApi(unit);
        if (!unitxApi) {
            let err = `Center unit ${unit} not binding $unitx service!!!`;
            logger.error(err);
            throw new Error(err);
        }
        else {
            logger.debug('get unitx push url in sendToUnitx: ', unitxApi.url);
        }
        let toArr: number[] = await unitxApi.send(msg);
        return toArr;
    }

    async pullBus(unit: number, maxId: number, faces: string, defer: number): Promise<any[][]> {
        let unitxApi = await this.getPullUnitxApi(unit);
        if (!unitxApi) {
            logger.error(`getUnitxApi unit=${unit}, pull return nothing`);
            return;
        }
        let ret = await unitxApi.fetchBus(unit, maxId, faces, defer);
        if (ret === undefined) {
            logger.error(`unitxApi.fetchBus  url=${unitxApi.url} unit=${unit}`);
            return;
        }
        return ret;
    }

    protected abstract unitxUrl(url: string): string;
    protected abstract boxFromUrls(unitxUrls: CenterUnitxUrls): UnitxUrlServer;
}

class UnitxProd extends Unitx {
    protected get db(): Db$Unitx { return getDbs().db$UnitxProd; }
    protected unitxUrl(url: string): string { return url + 'uq/unitx-prod/' };
    protected boxFromUrls(unitxUrls: CenterUnitxUrls): UnitxUrlServer {
        let { prod, tv } = unitxUrls;
        return prod ?? tv;
    }
}

export const unitxProd = new UnitxProd();

class UnitxTest extends Unitx {
    protected get db(): Db$Unitx { return getDbs().db$UnitxTest; }
    protected unitxUrl(url: string): string { return url + 'uq/unitx-test/' };
    protected boxFromUrls(unitxUrls: CenterUnitxUrls): UnitxUrlServer {
        let { test, tv } = unitxUrls;
        return test ?? tv;
    }
}

export const unitxTest = new UnitxTest();