"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBookRouter = void 0;
const core_1 = require("../core");
function buildBookRouter(router, rb) {
    rb.entityPost(router, 'book', '/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let pageStart = body['$pageStart'];
        let params = [pageStart, body['$pageSize']];
        let fields = schema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = await runner.query(name, unit, user, params);
        let data = (0, core_1.packReturn)(schema, result);
        return data;
    });
}
exports.buildBookRouter = buildBookRouter;
//# sourceMappingURL=book.js.map