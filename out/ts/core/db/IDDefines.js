"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumIdType = void 0;
var EnumIdType;
(function (EnumIdType) {
    EnumIdType[EnumIdType["None"] = 0] = "None";
    EnumIdType[EnumIdType["UID"] = 1] = "UID"; // UUID or ULocal or UMinute
    EnumIdType[EnumIdType["UUID"] = 2] = "UUID"; // universally unique identifier (UUID)
    EnumIdType[EnumIdType["ULocal"] = 3] = "ULocal"; // local unique identifier
    EnumIdType[EnumIdType["UMinute"] = 4] = "UMinute"; // minute unique identifier
    EnumIdType[EnumIdType["Global"] = 11] = "Global";
    EnumIdType[EnumIdType["Local"] = 12] = "Local";
    EnumIdType[EnumIdType["Minute"] = 13] = "Minute";
    EnumIdType[EnumIdType["MinuteId"] = 21] = "MinuteId";
})(EnumIdType = exports.EnumIdType || (exports.EnumIdType = {})); // Minute: unique in uq
//# sourceMappingURL=IDDefines.js.map