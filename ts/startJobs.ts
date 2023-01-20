import { startJobs } from './start';

/**
 * 所有Job运行的总入口点
 */
(async function () {
    await startJobs();
})();
