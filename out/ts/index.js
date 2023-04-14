"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const start_1 = require("./start");
/**
 * uq-api 运行的总入口点.
 */
(async function () {
    await (0, start_1.startApi)();
    await (0, start_1.startJobs)();
})();
//# sourceMappingURL=index.js.map