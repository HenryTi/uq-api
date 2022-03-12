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
exports.buildIDRouter = void 0;
const sqlResultProfix = 'sql-';
function buildIDRouter(router, rb) {
    rb.entityPost(router, 'acts', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.Acts(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'acts', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.Acts(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'act-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.ActIX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.ActIX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'act-ix-sort', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.ActIXSort(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'act-id-prop', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.ActIDProp(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-ix-sort', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.ActIXSort(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'act-detail', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.ActDetail(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'act-detail', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.ActDetail(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'query-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.QueryID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'query-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.QueryID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.ID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.ID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-tv', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDTv(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-tv', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDTv(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'key-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.KeyID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'key-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.KeyID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'ix-values', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IXValues(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'ix-values', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IXValues(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'ixr', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IXr(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'ixr', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IXr(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'key-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.KeyIX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'key-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.KeyIX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-log', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDLog(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-log', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDLog(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-sum', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDSum(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-sum', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDSum(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-no', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDNO(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-no', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDNO(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-detail-get', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDDetailGet(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-detail-get', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDDetailGet(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-in-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDinIX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-in-ix', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDinIX(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-x-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDxID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-x-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDxID(unit, user, body);
        return result;
    }));
    rb.entityPost(router, 'id-tree', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDRunner.IDTree(unit, user, body);
        return result;
    }));
    rb.entityPost(router, sqlResultProfix + 'id-tree', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        body.$sql = true;
        let result = yield runner.IDRunner.IDTree(unit, user, body);
        return result;
    }));
}
exports.buildIDRouter = buildIDRouter;
//# sourceMappingURL=ID.js.map