"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startJobs = void 0;
const jobs_1 = require("../jobs");
/**
 * 所有Job运行的总入口点
 */
function startJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            jobs_1.bizJob.start();
            let jobs = new jobs_1.Jobs();
            yield jobs.run();
        }
        catch (err) {
            console.error('runJobsForever error: ', err);
        }
        finally {
            // 如果发生错误，退出循环，60秒钟之后，重新启动
            setTimeout(startJobs, 60000);
        }
    });
}
exports.startJobs = startJobs;
//# sourceMappingURL=startJobs.js.map