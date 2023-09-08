"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PEnumDataType = void 0;
const tokens_1 = require("../tokens");
const datatype_1 = require("./datatype");
class PEnumDataType extends datatype_1.PDataType {
    constructor(enumDataType, context) {
        super(enumDataType, context);
        this.enumDataType = enumDataType;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('定义的enum');
        }
        this.enumName = this.ts.lowerVar;
        this.ts.readToken();
        return true;
    }
    scan(space) {
        let enm = space.getEnum(this.enumName);
        if (enm === undefined) {
            this.log(`${this.enumName} is not ENUM`);
            return false;
        }
        this.enumDataType.enm = enm;
        return true;
    }
    scanReturnMessage(space) {
        let enm = space.getEnum(this.enumName);
        if (enm === undefined) {
            return `${this.enumName} is not ENUM`;
        }
        this.enumDataType.enm = enm;
    }
}
exports.PEnumDataType = PEnumDataType;
//# sourceMappingURL=enum.js.map