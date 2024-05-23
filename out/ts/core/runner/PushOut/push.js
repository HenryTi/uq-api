"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.push = void 0;
const Out1_1 = require("./Out1");
const Out2_1 = require("./Out2");
function push(type, outName, outUrl, outKey, outPassword, value) {
    return __awaiter(this, void 0, void 0, function* () {
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
        return yield out.push();
    });
}
exports.push = push;
//# sourceMappingURL=push.js.map