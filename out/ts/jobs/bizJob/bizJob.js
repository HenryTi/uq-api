"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bizJob = void 0;
const core_1 = require("../../core");
class BizJob {
    constructor() {
        this.waitGap = 5000;
        this.yieldGap = 10;
        this.runIn = async () => {
            return await this.apiRunner.processIOIn(1);
        };
        this.runOut = async () => {
            return await this.apiRunner.processIOOut(1);
        };
        this.runAtomUnique = async () => {
            return await this.apiRunner.processAtomUnique(20);
        };
        this.db$Uq = (0, core_1.getDbs)().db$Uq;
        this.apiRunner = new core_1.ApiRunner();
        this.queued = true;
    }
    triggerQueue() {
        this.queued = true;
    }
    async start() {
        // { console.error('BizJob not started'); return; }
        this.runLoop(this.runIn);
        this.runLoop(this.runOut);
    }
    async runLoop(func) {
        await this.db$Uq.setDebugJobs();
        for (;;) {
            let timeGap = this.waitGap;
            try {
                if (await this.db$Uq.isDebugging() === false) {
                    if (this.queued === true) {
                        let rowCount = await func();
                        if (rowCount > 0)
                            timeGap = this.yieldGap;
                    }
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                await wait(timeGap);
                await this.db$Uq.setDebugJobs();
            }
        }
    }
}
// gap seconds
async function wait(gap) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, gap);
    });
}
exports.bizJob = new BizJob();
//# sourceMappingURL=bizJob.js.map