"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonTrans = void 0;
const sql_1 = require("../../sql");
const JsonVal_1 = require("./JsonVal");
class JsonTrans {
    constructor(jsonContext, ioPeers) {
        this.jsonContext = jsonContext;
        this.props = ioPeers.bizIOBuds;
        this.ioPeers = ioPeers;
    }
    build() {
        let objParams = [];
        let jsonVal = new JsonVal_1.JsonValInMain(this.jsonContext, this.ioPeers);
        for (let [, bud] of this.props) {
            let { peerName, val } = jsonVal.build(bud);
            objParams.push(new sql_1.ExpStr(peerName), val);
        }
        return new sql_1.ExpFunc('JSON_OBJECT', ...objParams);
    }
}
exports.JsonTrans = JsonTrans;
//# sourceMappingURL=JsonTrans.js.map