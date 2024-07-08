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
exports.buildApiRouter = void 0;
const express_1 = require("express");
const core_1 = require("../../core");
function buildApiRouter(rb) {
    let router = (0, express_1.Router)();
    router.get('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
        let apiRunner = new core_1.BizApiRunner();
        let ret = yield apiRunner.hello();
        res.json({
            ok: true,
            res: {
                ret,
            }
        });
    }));
    router.post('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
        let apiRunner = new core_1.BizApiRunner();
        console.log(req.headers);
        let ret = yield apiRunner.saveIOInQueue(req.body);
        res.json(ret);
    }));
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