import { ApiRunner } from "../../core";

class BizJob {
    private readonly waitGap = 5000;
    private readonly yieldGap = 10;
    private readonly apiRunner: ApiRunner;
    private queued: boolean;    // 也许可以在sheet act，或者in act，set queued=true，trigger the loop
    constructor() {
        this.apiRunner = new ApiRunner();
        this.queued = true;
    }

    triggerQueue() {
        this.queued = true;
    }

    async start() {
        this.runLoop(this.runIn);
        // this.runLoop(this.runOut);
    }

    async runLoop(func: () => Promise<number>): Promise<number> {
        for (; ;) {
            let timeGap: number = this.waitGap;
            try {
                if (this.queued === true) {
                    let rowCount = await func();
                    if (rowCount > 0) timeGap = this.yieldGap;
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

    private runIn = async () => {
        return await this.apiRunner.processIOIn(1);
    }

    private runOut = async () => {
        debugger;
        let length = await this.apiRunner.processIOOut(1);
        debugger;
        return length;
    }
}

// gap seconds
async function wait(gap: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, gap);
    });
}

export const bizJob = new BizJob();
