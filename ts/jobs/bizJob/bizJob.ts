import { ApiRunner, Db$Uq, getDbs } from "../../core";

class BizJob {
    private readonly waitGap = 5000;
    private readonly yieldGap = 10;
    private readonly apiRunner: ApiRunner;
    private readonly db$Uq: Db$Uq;
    private queued: boolean;    // 也许可以在sheet act，或者in act，set queued=true，trigger the loop
    constructor() {
        this.db$Uq = getDbs().db$Uq;
        this.apiRunner = new ApiRunner();
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

    async runLoop(func: () => Promise<number>): Promise<number> {
        await this.db$Uq.setDebugJobs();
        for (; ;) {
            let timeGap: number = this.waitGap;
            try {
                if (await this.db$Uq.isDebugging() === false) {
                    if (this.queued === true) {
                        let rowCount = await func();
                        if (rowCount > 0) timeGap = this.yieldGap;
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

    private runIn = async () => {
        return await this.apiRunner.processIOIn(1);
    }

    private runOut = async () => {
        return await this.apiRunner.processIOOut(1);
    }

    private runAtomUnique = async () => {
        return await this.apiRunner.processAtomUnique(20);
    }
}

// gap seconds
async function wait(gap: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, gap);
    });
}

export const bizJob = new BizJob();
