"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHistoryRouter = void 0;
const core_1 = require("../core");
function buildHistoryRouter(router, rb) {
    //router.post('/history/:name', async (req:Request, res:Response) => {
    rb.entityPost(router, 'history', '/:name', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            pageStart = new Date(pageStart);
        }
        let params = [pageStart, body['$pageSize']];
        let fields = schema.keys;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = await runner.query(name, unit, user, params);
        let data = (0, core_1.packReturn)(schema, result);
        return data;
    });
}
exports.buildHistoryRouter = buildHistoryRouter;
//# sourceMappingURL=history.js.map