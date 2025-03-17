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
exports.centerApi = exports.urlSetCenterHost = void 0;
const config = require("config");
const fetch_1 = require("./fetch");
const tool_1 = require("../tool");
const centerHost = config.get('centerhost');
const centerUrl = urlSetCenterHost(config.get('center'));
//const centerUrl = 'http://localhost:3000/tv';
function urlSetCenterHost(url) {
    return url.replace('://centerhost/', '://' + centerHost + '/');
}
exports.urlSetCenterHost = urlSetCenterHost;
class CenterApi extends fetch_1.Fetch {
    constructor() {
        super(centerUrl);
    }
    innerFetchLog(url, method) {
        let fullUrl = this.baseUrl + url;
        tool_1.logger.error('???? CenterApi innerFetch ' + method + '  ' + fullUrl);
    }
    busSchema(owner, bus, version) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.get('open/bus', { owner, bus, version });
            return ret === null || ret === void 0 ? void 0 : ret.schema;
        });
    }
    serviceBus(serviceUID, serviceBuses) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.post('open/save-service-bus', {
                service: serviceUID,
                bus: serviceBuses,
            });
        });
    }
    unitUnitx(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('center base url', this.baseUrl, unit);
            let items = yield this.get('open/unit-unitx', { unit });
            let ret = {};
            for (let item of items) {
                let { type } = item;
                ret[type] = item;
            }
            return ret;
        });
    }
    uqUrl(unit, uq) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/uq-url', { unit: unit, uq: uq });
        });
    }
    serviceUnit(service) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/service-unit', { service });
        });
    }
    IDSectionApply(service, type, sectionMax, sectionCount) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/id-section-apply', { service, type, sectionMax, sectionCount });
        });
    }
    urlFromUq(unit, uqFullName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('open/url-from-uq', { unit: unit, uq: uqFullName });
        });
    }
    unitFaceUrl(unit, busOwner, busName, face) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('open/unit-face-url', { unit: unit, busOwner: busOwner, busName: busName, face: face });
        });
    }
    uqDb(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/uqdb', { name: name });
        });
    }
    pushTo(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('push', msg);
        });
    }
    userIdFromName(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/user-id-from-name', { user: user });
        });
    }
    userFromId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('user/user-name-nick-icon-from-id', { userId: id });
        });
    }
    send(param) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('send', param);
        });
    }
    queueOut(start, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/queue-out', { start: start, page: page });
        });
    }
    appRoles(unit, app, user) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Center Api: ', this.baseUrl);
            return yield this.post('open/app-roles', { unit, app, user });
        });
    }
    userxBusFace(user, busOwner, busName, face) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('open/userx-bus-face', { user, busOwner, busName, face });
        });
    }
}
;
exports.centerApi = new CenterApi();
//# sourceMappingURL=centerApi.js.map