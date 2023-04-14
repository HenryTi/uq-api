import { startApi, startJobs } from './start';

/**
 * uq-api 运行的总入口点.
 */
(async function () {
    await startApi();
    await startJobs();
})();
