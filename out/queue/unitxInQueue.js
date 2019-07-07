"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bull = require("bull");
const processMessage_1 = require("./processMessage");
const unitxInQueueName = 'unitx-in-queue';
let unitxInQueue;
function queueUnitxIn(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxInQueue.add(msg);
    });
}
exports.queueUnitxIn = queueUnitxIn;
function startUnitxInQueue(redis) {
    unitxInQueue = bull(unitxInQueueName, redis);
    unitxInQueue.on("error", (error) => {
        console.log(unitxInQueueName, error);
    });
    unitxInQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { data } = job;
                yield processMessage_1.processMessage(data);
                done();
            }
            catch (err) {
                console.error(err);
                done(new Error(err));
            }
        });
    });
    console.log('QUEUE: ' + unitxInQueueName);
}
exports.startUnitxInQueue = startUnitxInQueue;
//# sourceMappingURL=unitxInQueue.js.map