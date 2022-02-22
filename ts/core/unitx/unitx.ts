import { logger } from '../../tool';
import { centerApi, CenterUnitxUrls, UnitxUrlServer } from '../centerApi';
import { consts } from '../consts';
import { env, UnitxDb, UnitxProdDb, UnitxTestDb } from "../db";
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
	readonly db: UnitxDb;

	constructor() {
		this.db = this.createDb();
	}
	protected abstract createDb(): UnitxDb;
	// get db(): UnitxDb { return this._db };

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
			if (server === this.db.serverId) {
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
			//return ret;
			logger.error(err);
			throw new Error(err);
		}
		else {
			logger.error('get unitx push url in sendToUnitx: ', unitxApi.url);
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

export class UnitxProd extends Unitx {
	protected createDb(): UnitxDb {
		let dbName = consts.$unitx;
		return new UnitxProdDb(dbName)
	}
	protected unitxUrl(url: string): string { return url + 'uq/unitx-prod/' };
	protected boxFromUrls(unitxUrls: CenterUnitxUrls): UnitxUrlServer {
		let { prod, tv } = unitxUrls;
		return prod ?? tv;
	}
}

export class UnitxTest extends Unitx {
	protected createDb(): UnitxDb {
		let dbName = consts.$unitx + '$test';
		return new UnitxTestDb(dbName);
	}
	protected unitxUrl(url: string): string { return url + 'uq/unitx-test/' };
	protected boxFromUrls(unitxUrls: CenterUnitxUrls): UnitxUrlServer {
		let { test, tv } = unitxUrls;
		return test ?? tv;
	}
}
