"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProcRouter = void 0;
const express_1 = require("express");
const core_1 = require("../core");
function buildProcRouter() {
    const router = (0, express_1.Router)({ mergeParams: true });
    const dbs = (0, core_1.getDbs)();
    router.get('/', async (req, res) => {
        let { db, proc } = req.params;
        async function buildProc(dbName) {
            try {
                let db = await dbs.getDbUq(dbName);
                let runner = new core_1.BuildRunner(db);
                await runner.buildProc(proc);
                return;
            }
            catch (err) {
                return err;
            }
        }
        let dbProd = db;
        let dbTest = db + core_1.consts.$test;
        let errProd = await buildProc(dbProd);
        let errTest = await buildProc(dbTest);
        let message;
        if (!errProd && !errTest) {
            message = `${dbProd} and ${dbTest}`;
        }
        else if (!errProd) {
            message = dbTest;
        }
        else if (!errTest) {
            message = dbProd;
        }
        else {
            message = undefined;
        }
        if (message) {
            message += ` stored procedure ${proc} built successfully`;
        }
        else {
            message = `faild to build ${proc} in ${dbProd} and ${dbTest}`;
        }
        res.json({
            message
        });
    });
    return router;
}
exports.buildProcRouter = buildProcRouter;
//# sourceMappingURL=proc.js.map