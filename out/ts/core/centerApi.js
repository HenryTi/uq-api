"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centerApi = exports.urlSetCenterHost = void 0;
const config = require("config");
const fetch_1 = require("./fetch");
const centerHost = config.get('centerhost');
const centerUrl = urlSetCenterHost(config.get('center'));
function urlSetCenterHost(url) {
    return url.replace('://centerhost/', '://' + centerHost + '/');
}
exports.urlSetCenterHost = urlSetCenterHost;
class CenterApi extends fetch_1.Fetch {
    constructor() {
        super(centerUrl);
    }
    async busSchema(owner, bus, version) {
        let ret = await this.get('open/bus', { owner, bus, version });
        return ret?.schema;
    }
    async serviceBus(serviceUID, serviceBuses) {
        await this.post('open/save-service-bus', {
            service: serviceUID,
            bus: serviceBuses,
        });
    }
    async unitUnitx(unit) {
        let items = await this.get('open/unit-unitx', { unit });
        let ret = {};
        for (let item of items) {
            let { type } = item;
            ret[type] = item;
        }
        return ret;
    }
    async uqUrl(unit, uq) {
        return await this.get('open/uq-url', { unit: unit, uq: uq });
    }
    async serviceUnit(service) {
        return await this.get('open/service-unit', { service });
    }
    async IDSectionApply(service, type, sectionMax, sectionCount) {
        return await this.get('open/id-section-apply', { service, type, sectionMax, sectionCount });
    }
    async urlFromUq(unit, uqFullName) {
        return await this.post('open/url-from-uq', { unit: unit, uq: uqFullName });
    }
    async unitFaceUrl(unit, busOwner, busName, face) {
        return await this.post('open/unit-face-url', { unit: unit, busOwner: busOwner, busName: busName, face: face });
    }
    async uqDb(name) {
        return await this.get('open/uqdb', { name: name });
    }
    async pushTo(msg) {
        return await this.post('push', msg);
    }
    async userIdFromName(user) {
        return await this.get('open/user-id-from-name', { user: user });
    }
    async userFromId(id) {
        return await this.get('user/user-name-nick-icon-from-id', { userId: id });
    }
    async send(param) {
        return await this.post('send', param);
    }
    async queueOut(start, page) {
        return await this.get('open/queue-out', { start: start, page: page });
    }
    async appRoles(unit, app, user) {
        return await this.post('open/app-roles', { unit, app, user });
    }
    async userxBusFace(user, busOwner, busName, face) {
        return await this.post('open/userx-bus-face', { user, busOwner, busName, face });
    }
}
;
exports.centerApi = new CenterApi();
//# sourceMappingURL=centerApi.js.map