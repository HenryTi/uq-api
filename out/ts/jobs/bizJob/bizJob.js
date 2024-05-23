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
exports.bizJob = void 0;
const core_1 = require("../../core");
class BizJob {
    constructor() {
        this.waitGap = 5000;
        this.yieldGap = 10;
        this.runIn = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.apiRunner.processIOIn(1);
        });
        this.runOut = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.apiRunner.processIOOut(1);
        });
        this.runAtomUnique = () => __awaiter(this, void 0, void 0, function* () {
            return yield this.apiRunner.processAtomUnique(20);
        });
        this.db$Uq = (0, core_1.getDbs)().db$Uq;
        this.apiRunner = new core_1.ApiRunner();
        this.queued = true;
    }
    triggerQueue() {
        this.queued = true;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // { console.error('BizJob not started'); return; }
            this.runLoop(this.runIn);
            this.runLoop(this.runOut);
        });
    }
    runLoop(func) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db$Uq.setDebugJobs();
            for (;;) {
                let timeGap = this.waitGap;
                try {
                    if ((yield this.db$Uq.isDebugging()) === false) {
                        if (this.queued === true) {
                            let rowCount = yield func();
                            if (rowCount > 0)
                                timeGap = this.yieldGap;
                        }
                    }
                }
                catch (err) {
                    console.error(err);
                }
                finally {
                    yield wait(timeGap);
                    yield this.db$Uq.setDebugJobs();
                }
            }
        });
    }
}
// gap seconds
function wait(gap) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, gap);
        });
    });
}
exports.bizJob = new BizJob();
//# sourceMappingURL=bizJob.js.map