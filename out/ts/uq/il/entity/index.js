"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuidArr = exports.Tuid = exports.Map = exports.IDX = exports.IX = exports.EnumIdType = exports.ID = void 0;
__exportStar(require("./entity"), exports);
var ID_1 = require("./ID");
Object.defineProperty(exports, "ID", { enumerable: true, get: function () { return ID_1.ID; } });
Object.defineProperty(exports, "EnumIdType", { enumerable: true, get: function () { return ID_1.EnumIdType; } });
var IX_1 = require("./IX");
Object.defineProperty(exports, "IX", { enumerable: true, get: function () { return IX_1.IX; } });
var IDX_1 = require("./IDX");
Object.defineProperty(exports, "IDX", { enumerable: true, get: function () { return IDX_1.IDX; } });
__exportStar(require("./act"), exports);
var map_1 = require("./map");
Object.defineProperty(exports, "Map", { enumerable: true, get: function () { return map_1.Map; } });
var tuid_1 = require("./tuid");
Object.defineProperty(exports, "Tuid", { enumerable: true, get: function () { return tuid_1.Tuid; } });
Object.defineProperty(exports, "TuidArr", { enumerable: true, get: function () { return tuid_1.TuidArr; } });
//# sourceMappingURL=index.js.map