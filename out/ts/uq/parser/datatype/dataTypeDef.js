"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDataTypeDef = void 0;
const datatype_1 = require("./datatype");
class PDataTypeDef extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
    _parse() {
    }
    scan(space) {
        let ret = this.internalScan(space);
        if (ret === undefined)
            return true;
        this.log(ret);
        return false;
    }
    internalScan(space) {
        const { typeName } = this.dt;
        let dt = space.getDataType(typeName);
        if (dt === undefined) {
            return `unknown data type '${typeName}'`;
        }
        this.dt.dataType = dt;
        return;
    }
    scanReturnMessage(space) {
        return this.internalScan(space);
    }
}
exports.PDataTypeDef = PDataTypeDef;
//# sourceMappingURL=dataTypeDef.js.map