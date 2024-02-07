"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Out1 = void 0;
const Out_1 = require("./Out");
// bz机构之间的push
class Out1 extends Out_1.Out {
    isPushSuccess(retJson) {
        return (retJson.ok === true);
    }
}
exports.Out1 = Out1;
//# sourceMappingURL=Out1.js.map