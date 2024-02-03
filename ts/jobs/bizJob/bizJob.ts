import { ApiRunner } from "../../core";

class BizJob {
    private readonly waitGap = 5000;
    private readonly yieldGap = 10;
    private readonly apiRunner: ApiRunner;
    private queued: boolean;
    constructor() {
        this.apiRunner = new ApiRunner();
        this.queued = true;
    }

    triggerQueue() {
        this.queued = true;
    }

    async start() {
        this.runLoop(this.runIn);
        this.runLoop(this.runOut);
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
        // let url = 'http://localhost:3015/api/';
        for (; ;) {
            // let ret = await fetch(url);
            // let retJson = await ret.json();
            // console.log(url, retJson);
            let result = await this.apiRunner.getIOOut(1);
            const { length } = result;
            if (length === 0) return 0;
            for (let row of result) {
                await this.apiRunner.doneIOOut(row.id, undefined);
                console.log('Done out ', new Date().toLocaleTimeString(), '\n', row, '\n');
            }
            return length;
        }
    }
}

// gap seconds
async function wait(gap: number) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, gap);
    });
}

export const bizJob = new BizJob();
