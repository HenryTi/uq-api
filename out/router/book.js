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
exports.buildBookRouter = void 0;
const core_1 = require("../core");
//import { entityPost } from './entityProcess';
function buildBookRouter(router, rb) {
    rb.entityPost(router, 'book', '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let pageStart = body['$pageStart'];
        let params = [pageStart, body['$pageSize']];
        let fields = schema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.query(name, unit, user, params);
        let data = (0, core_1.packReturn)(schema, result);
        return data;
    }));
}
exports.buildBookRouter = buildBookRouter;
//# sourceMappingURL=book.js.map