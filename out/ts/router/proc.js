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
exports.buildProcRouter = void 0;
const express_1 = require("express");
const core_1 = require("../core");
function buildProcRouter() {
    const router = (0, express_1.Router)({ mergeParams: true });
    const dbs = (0, core_1.getDbs)();
    router.get('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
        let { db, proc } = req.params;
        function buildProc(dbName) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let db = yield dbs.getDbUq(dbName);
                    let runner = new core_1.BuildRunner(db);
                    yield runner.buildProc(proc);
                    return;
                }
                catch (err) {
                    return err;
                }
            });
        }
        let dbProd = db;
        let dbTest = db + core_1.consts.$test;
        let errProd = yield buildProc(dbProd);
        let errTest = yield buildProc(dbTest);
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
    }));
    return router;
}
exports.buildProcRouter = buildProcRouter;
//# sourceMappingURL=proc.js.map