"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constQueueSizeArr = exports.constDeferMax = exports.Finish = void 0;
var Finish;
(function (Finish) {
    Finish[Finish["done"] = 1] = "done";
    Finish[Finish["retry"] = 2] = "retry";
    Finish[Finish["bad"] = 3] = "bad";
})(Finish || (exports.Finish = Finish = {}));
exports.constDeferMax = 2;
exports.constQueueSizeArr = [100, 50];
//# sourceMappingURL=consts.js.map