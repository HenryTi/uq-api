import { createHash, randomBytes } from "crypto";
import { startApi, startJobs } from './start';

/**
 * uq-api 运行的总入口点.
 */
(async function () {
    let s = 'ddd';
    for (let i = 0; i < 4000; i++) s += i;
    let ret = md5('da sfasfd asf asf as fd|dd afsd fasdf|ds fasfd as fd' + s);
    console.log(ret);
    for (let i = 0; i < 20; i++) {
        let rand = randomBytes(20).toString('base64').substring(0, 16);
        console.log(rand);
    }
    await startApi();
    setTimeout(startJobs, 5000);
})();

function md5(content: string) {
    return createHash('md5').update(content).digest('hex');
}