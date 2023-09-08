"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDataType = void 0;
const element_1 = require("../element");
// token data type
class PDataType extends element_1.PElement {
    constructor(dataType, context) {
        super(dataType, context);
        this.ts = context.ts;
        this.context = context;
    }
    _parse() { }
}
exports.PDataType = PDataType;
//# sourceMappingURL=datatype.js.map