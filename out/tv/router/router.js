"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const runner_1 = require("../runner");
const apiErrors_1 = require("../apiErrors");
;
exports.router = express_1.Router();
function checkRunner(db, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner(db);
        if (runner !== undefined)
            return runner;
        res.json({
            error: {
                no: apiErrors_1.apiErrors.databaseNotExists,
                message: 'Database ' + db + ' 不存在'
            }
        });
    });
}
exports.checkRunner = checkRunner;
function unknownEntity(res, name) {
    res.json({ error: 'unknown entity: ' + name });
}
exports.unknownEntity = unknownEntity;
function validEntity(res, schema, type) {
    if (schema.type === type)
        return true;
    res.json({ error: schema.name + ' is not ' + type });
    return false;
}
exports.validEntity = validEntity;
function validTuidArr(res, schema, arrName) {
    let { name, type, arr } = schema;
    if (type !== 'tuid') {
        res.json({ error: name + ' is not tuid' });
        return;
    }
    let schemaArr = arr[arrName];
    if (schemaArr !== undefined)
        return schemaArr;
    res.json({ error: name + ' does not have arr ' + arrName });
    return;
}
exports.validTuidArr = validTuidArr;
//# sourceMappingURL=router.js.map