"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEntityRouter = void 0;
//export * from './setting';
__exportStar(require("./open"), exports);
__exportStar(require("./unitx"), exports);
__exportStar(require("./build"), exports);
const access_1 = require("./access");
const action_1 = require("./action");
const book_1 = require("./book");
const history_1 = require("./history");
const query_1 = require("./query");
const schema_1 = require("./schema");
const tuid_1 = require("./tuid");
const sheet_1 = require("./sheet");
const import_1 = require("./import");
const map_1 = require("./map");
const tag_1 = require("./tag");
const ID_1 = require("./ID");
function buildEntityRouter(router, rb) {
    (0, access_1.buildAccessRouter)(router, rb);
    (0, action_1.buildActionRouter)(router, rb);
    (0, book_1.buildBookRouter)(router, rb);
    (0, history_1.buildHistoryRouter)(router, rb);
    (0, query_1.buildQueryRouter)(router, rb);
    (0, schema_1.buildSchemaRouter)(router, rb);
    (0, tuid_1.buildTuidRouter)(router, rb);
    (0, sheet_1.buildSheetRouter)(router, rb);
    (0, import_1.buildImportRouter)(router, rb);
    (0, map_1.buildMapRouter)(router, rb);
    (0, tag_1.buildTagRouter)(router, rb);
    (0, ID_1.buildIDRouter)(router, rb);
}
exports.buildEntityRouter = buildEntityRouter;
//# sourceMappingURL=index.js.map