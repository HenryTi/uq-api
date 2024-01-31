"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const start_1 = require("./start");
/**
 * uq-api 运行的总入口点.
 */
(async function () {
    let s = 'ddd';
    for (let i = 0; i < 4000; i++)
        s += i;
    let ret = md5('da sfasfd asf asf as fd|dd afsd fasdf|ds fasfd as fd' + s);
    console.log(ret);
    for (let i = 0; i < 20; i++) {
        let rand = (0, crypto_1.randomBytes)(20).toString('base64').substring(0, 16);
        console.log(rand);
    }
    await (0, start_1.startApi)();
    setTimeout(start_1.startJobs, 5000);
})();
function md5(content) {
    return (0, crypto_1.createHash)('md5').update(content).digest('hex');
}
//# sourceMappingURL=index.js.map