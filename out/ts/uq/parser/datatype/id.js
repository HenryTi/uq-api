"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTextId = exports.PId = void 0;
const tokens_1 = require("../tokens");
const datatype_1 = require("./datatype");
class PId extends datatype_1.PDataType {
    constructor(id, context) {
        super(id, context);
        this.id = id;
    }
    _parse() {
        switch (this.ts.token) {
            default: return true;
            case tokens_1.Token.VAR:
                if (this.ts.isKeywords('of', 'desc', 'asc') === true) {
                    return true;
                }
                this.id.idType = this.ts.lowerVar;
                break;
            case tokens_1.Token.DOLLARVAR:
                this.id.idType = this.ts.lowerVar;
                break;
        }
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('id arr name');
            }
            this.id.arrName = this.ts.lowerVar;
            this.ts.readToken();
        }
        return true;
    }
    scanReturnMessage(space) {
        let { tuid, idType } = this.id;
        if (tuid !== undefined)
            return;
        if (idType === undefined)
            return;
        let entity = space.getEntityTable(idType);
        if (entity === undefined)
            return idType + ' 不存在';
        switch (entity.type) {
            default: return idType + ' 必须是ID or Tuid';
            case 'id': /*this.id.idType = undefined; */ return;
            case 'tuid': break;
        }
        let t = entity;
        this.id.tuid = t;
        this.id.idSize = t.id.dataType.idSize;
    }
}
exports.PId = PId;
class PTextId extends datatype_1.PDataType {
    _parse() {
        return true;
    }
}
exports.PTextId = PTextId;
//# sourceMappingURL=id.js.map