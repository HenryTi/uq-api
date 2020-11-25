import * as config from 'config';
import {Fetch} from './fetch';

const centerHost = config.get<string>('centerhost');
const centerUrl = urlSetCenterHost(config.get<string>('center'));

export function urlSetCenterHost(url:string):string {
    return url.replace('://centerhost/', '://'+centerHost+'/');
}

class CenterApi extends Fetch {
    constructor() {
        super(centerUrl);
    }

    async busSchema(owner:string, bus:string):Promise<string> {
        let ret = await this.get('open/bus', {owner: owner, bus: bus});
        return ret.schema;
    }

    async serviceBus(serviceUID:string, serviceBuses:string):Promise<void> {
        await this.post('open/save-service-bus', {
            service: serviceUID,
            bus: serviceBuses,
        });
    }

    async unitx(unit:number):Promise<any> {
        return await this.get('open/unitx', {unit:unit});
    }

    async uqUrl(unit:number, uq:number):Promise<any> {
        return await this.get('open/uq-url', {unit:unit, uq:uq});
    }

    async urlFromUq(unit:number, uqFullName:string):Promise<{db:string, url:string, urlTest:string}> {
        return await this.post('open/url-from-uq', {unit:unit, uq:uqFullName});
    }

    async unitFaceUrl(unit:number, busOwner:string, busName:string, face:string):Promise<any[]> {
        return await this.post('open/unit-face-url', {unit:unit, busOwner:busOwner, busName:busName, face:face});
    }

    async uqDb(name:string):Promise<any> {
        return await this.get('open/uqdb', {name:name});
    }

    async pushTo(msg:any):Promise<void> {
        return await this.post('push', msg);
    }

    async userIdFromName(user:string):Promise<number> {
        return await this.get('open/user-id-from-name', {user: user});
    }

    async send(param: SendParameter):Promise<void> {
        return await this.post('send', param);
    }

    async queueOut(start:number, page:number):Promise<any> {
        return await this.get('open/queue-out', {start:start, page:page});
    }

    async appRoles(unit:number, app:any, user:number): Promise<{roles:number, version:number}> {
        return await this.post('open/app-roles', {unit, app, user});
	}
	
	async userxBusFace(user:number, bus:string, face:string): Promise<{service:number, unitxUrl: string}[]> {
		return await this.post('open/userx-bus-face', {user, bus, face});
	}
}

interface SendParameter {
    isUser?:boolean;
    type: string;
    unit?: number;
    subject?:string;
    body:string;
    to?:string;
    cc?:string; 
    bcc?:string
};


export const centerApi = new CenterApi();
