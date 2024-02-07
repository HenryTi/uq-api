"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.push = void 0;
const Out1_1 = require("./Out1");
const Out2_1 = require("./Out2");
async function push(type, outName, outUrl, outKey, outPassword, value) {
    let out;
    switch (type) {
        default:
            debugger;
            throw new Error('unknown push out type ' + type);
        case 1:
            out = new Out1_1.Out1(outName, outUrl, outKey, outPassword, value);
            break;
        case 2:
            out = new Out2_1.Out2(outName, outUrl, outKey, outPassword, value);
            break;
    }
    return await out.push();
}
exports.push = push;
//# sourceMappingURL=push.js.map