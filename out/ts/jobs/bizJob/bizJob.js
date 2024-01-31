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
            for (;;) {
                let result = await this.apiRunner.getIOOut(1);
                const { length } = result;
                if (length === 0)
                    return 0;
                for (let row of result) {
                    await this.apiRunner.doneIOOut(row.id, undefined);
                    console.log('Done out ', new Date().toLocaleTimeString(), '\n', row, '\n');
                }
                return length;
            }
        };
        this.apiRunner = new core_1.ApiRunner();
        this.queued = true;
    }
    triggerQueue() {
        this.queued = true;
    }
    async start() {
        this.runLoop(this.runIn);
        this.runLoop(this.runOut);
    }
    async runLoop(func) {
        for (;;) {
            let timeGap = this.waitGap;
            try {
                if (this.queued === true) {
                    let rowCount = await func();
                    if (rowCount > 0)
                        timeGap = this.yieldGap;
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                await wait(timeGap);
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