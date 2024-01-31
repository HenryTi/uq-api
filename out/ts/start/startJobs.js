"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startJobs = void 0;
const tool_1 = require("../tool");
const jobs_1 = require("../jobs");
/**
 * 所有Job运行的总入口点
 */
async function startJobs() {
    try {
        if (tool_1.env.isDevelopment === true) {
            // 只有在开发方式下，才可以屏蔽jobs
            // return;
        }
        jobs_1.bizJob.start();
        let jobs = new jobs_1.Jobs();
        await jobs.run();
    }
    catch (err) {
        console.error('runJobsForever error: ', err);
    }
    finally {
        // 如果发生错误，退出循环，60秒钟之后，重新启动
        setTimeout(startJobs, 60000);
    }
}
exports.startJobs = startJobs;
//# sourceMappingURL=startJobs.js.map