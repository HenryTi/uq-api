"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizLog = exports.LogType = void 0;
const builder_1 = require("../../../builder");
const parser_1 = require("../../../parser");
const statement_1 = require("../../statement");
var LogType;
(function (LogType) {
    LogType[LogType["off"] = 0] = "off";
    LogType[LogType["on"] = 1] = "on";
    LogType[LogType["scalar"] = 2] = "scalar";
    LogType[LogType["array"] = 3] = "array";
    LogType[LogType["object"] = 4] = "object";
})(LogType || (exports.LogType = LogType = {}));
;
class BizLog extends statement_1.Statement {
    db(db) {
        return new builder_1.BBizLog(db, this);
    }
    parser(context) {
        return new parser_1.PBizLog(this, context);
    }
}
exports.BizLog = BizLog;
//# sourceMappingURL=biz.log.js.map