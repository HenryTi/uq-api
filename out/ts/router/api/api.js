"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApiRouter = void 0;
const express_1 = require("express");
const core_1 = require("../../core");
function buildApiRouter(rb) {
    let router = (0, express_1.Router)();
    router.get('/', async (req, res) => {
        let apiRunner = new core_1.ApiRunner();
        let ret = await apiRunner.hello();
        res.json({
            ok: true,
            res: {
                ret,
            }
        });
    });
    router.post('/', async (req, res) => {
        let apiRunner = new core_1.ApiRunner();
        console.log(req.header);
        let ret = await apiRunner.saveIOInQueue(req.body);
        res.json(ret);
    });
    return router;
}
exports.buildApiRouter = buildApiRouter;
function auth(userName, token) {
    if (Number.isNaN(Number(token)) === true) {
        return false;
    }
    return true;
}
//# sourceMappingURL=api.js.map