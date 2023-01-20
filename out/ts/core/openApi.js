"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApi = void 0;
//import fetch from "node-fetch";
const _1 = require(".");
class OpenApi extends _1.Fetch {
    async fromEntity(unit, entity, key) {
        let ret = await this.post('open/from-entity', {
            unit: unit,
            entity: entity,
            key: key,
        });
        return ret;
    }
    async queueModify(unit, start, page, entities) {
        if (start === undefined || start === null)
            start = 0;
        let ret = await this.post('open/queue-modify', {
            unit: unit,
            start: start,
            page: page,
            entities: entities,
        });
        return ret;
    }
    async busQuery(unit, busOwner, busName, face, params) {
        let ret = await this.post('open/bus-query', {
            unit: unit,
            busOwner: busOwner,
            busName: busName,
            face: face,
            params: params
        });
        return ret;
    }
}
exports.OpenApi = OpenApi;
//# sourceMappingURL=openApi.js.map