"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSchemaRouter = void 0;
function buildSchemaRouter(router, rb) {
    rb.get(router, '/schema/:name', async (runner, body, urlParams) => {
        let { name } = urlParams;
        let schema = runner.getSchema(name);
        return schema && schema.call;
    });
    rb.get(router, '/schema/:name/:version', async (runner, body, urlParams) => {
        let { name, version } = urlParams;
        let schemaVersion = await runner.loadSchemaVersion(name, version);
        return schemaVersion;
    });
}
exports.buildSchemaRouter = buildSchemaRouter;
//# sourceMappingURL=schema.js.map