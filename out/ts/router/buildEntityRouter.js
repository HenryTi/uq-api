"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEntityRouter = void 0;
const access_1 = require("./access");
const action_1 = require("./action");
const book_1 = require("./book");
const history_1 = require("./history");
const query_1 = require("./query");
const schema_1 = require("./schema");
const tuid_1 = require("./tuid");
const import_1 = require("./import");
const map_1 = require("./map");
const ID_1 = require("./ID");
const role_1 = require("./role");
const biz_1 = require("./biz");
const syncUser_1 = require("./syncUser");
const compile_1 = require("./compile");
function buildEntityRouter(router, rb) {
    (0, biz_1.buildBizSheetActRouter)(router, rb);
    (0, syncUser_1.buildSyncUserRouter)(router, rb);
    (0, biz_1.buildBizRouter)(router, rb);
    (0, access_1.buildAccessRouter)(router, rb);
    (0, action_1.buildActionRouter)(router, rb);
    (0, book_1.buildBookRouter)(router, rb);
    (0, history_1.buildHistoryRouter)(router, rb);
    (0, query_1.buildQueryRouter)(router, rb);
    (0, schema_1.buildSchemaRouter)(router, rb);
    (0, tuid_1.buildTuidRouter)(router, rb);
    (0, import_1.buildImportRouter)(router, rb);
    (0, map_1.buildMapRouter)(router, rb);
    (0, ID_1.buildIDRouter)(router, rb);
    (0, role_1.buildRoleRouter)(router, rb);
    (0, compile_1.buildCompileRouter)(router, rb);
}
exports.buildEntityRouter = buildEntityRouter;
//# sourceMappingURL=buildEntityRouter.js.map