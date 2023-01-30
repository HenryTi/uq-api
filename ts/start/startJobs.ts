import { env } from '../tool';
import { Jobs } from '../jobs';

/**
 * 所有Job运行的总入口点
 */
export async function startJobs() {
    try {
        if (env.isDevelopment === true) {
            // 只有在开发方式下，才可以屏蔽jobs
            return;
        }
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
