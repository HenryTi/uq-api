"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTinyInt = void 0;
const datatype_1 = require("./datatype");
class PTinyInt extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
}
exports.PTinyInt = PTinyInt;
//# sourceMappingURL=tinyint.js.map