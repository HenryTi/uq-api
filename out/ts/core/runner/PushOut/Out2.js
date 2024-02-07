"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Out2 = void 0;
const Out_1 = require("./Out");
// push给倢科的机构
class Out2 extends Out_1.Out {
    isPushSuccess(retJson) {
        return retJson.success === true;
    }
}
exports.Out2 = Out2;
//# sourceMappingURL=Out2.js.map