"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deferQueueCounts = exports.deferMax = exports.Finish = void 0;
var Finish;
(function (Finish) {
    Finish[Finish["done"] = 1] = "done";
    Finish[Finish["retry"] = 2] = "retry";
    Finish[Finish["bad"] = 3] = "bad";
})(Finish = exports.Finish || (exports.Finish = {}));
exports.deferMax = 2;
exports.deferQueueCounts = [100, 50];
//# sourceMappingURL=consts.js.map