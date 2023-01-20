import { Jobs } from '../jobs';

/**
 * 所有Job运行的总入口点
 */
export async function startJobs() {
    try {
        let jobs = new Jobs();
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
