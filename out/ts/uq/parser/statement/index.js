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
exports.PAssertRoleStatement = exports.PRoleStatement = exports.PExecSqlStatement = exports.PQueueStatement = exports.PSleepStatement = exports.PPokeStatement = exports.PTransactionStatement = exports.PLogStatement = exports.PScheduleStatement = exports.PInlineStatement = exports.PTextStatement = exports.PTableStatement = exports.PSendStatement = exports.PProcStatement = exports.PBusStatement = exports.PFail = exports.PStateTo = exports.PPendingWrite = exports.PTuidWrite = exports.PHistoryWrite = exports.PBookWrite = exports.PDeleteStatement = exports.PSelectStatement = exports.PForEach = exports.PWhile = exports.PReturnStatement = exports.PContinueStatement = exports.PBreakStatement = exports.PIf = exports.PSettingStatement = exports.PValueStatement = exports.PWithStatement = exports.PSetStatement = exports.PVarStatement = void 0;
var var_1 = require("./var");
Object.defineProperty(exports, "PVarStatement", { enumerable: true, get: function () { return var_1.PVarStatement; } });
var set_1 = require("./set");
Object.defineProperty(exports, "PSetStatement", { enumerable: true, get: function () { return set_1.PSetStatement; } });
var with_1 = require("./with");
Object.defineProperty(exports, "PWithStatement", { enumerable: true, get: function () { return with_1.PWithStatement; } });
__exportStar(require("./biz"), exports);
var value_1 = require("./value");
Object.defineProperty(exports, "PValueStatement", { enumerable: true, get: function () { return value_1.PValueStatement; } });
var setting_1 = require("./setting");
Object.defineProperty(exports, "PSettingStatement", { enumerable: true, get: function () { return setting_1.PSettingStatement; } });
var if_1 = require("./if");
Object.defineProperty(exports, "PIf", { enumerable: true, get: function () { return if_1.PIf; } });
Object.defineProperty(exports, "PBreakStatement", { enumerable: true, get: function () { return if_1.PBreakStatement; } });
Object.defineProperty(exports, "PContinueStatement", { enumerable: true, get: function () { return if_1.PContinueStatement; } });
Object.defineProperty(exports, "PReturnStatement", { enumerable: true, get: function () { return if_1.PReturnStatement; } });
var while_1 = require("./while");
Object.defineProperty(exports, "PWhile", { enumerable: true, get: function () { return while_1.PWhile; } });
var foreach_1 = require("./foreach");
Object.defineProperty(exports, "PForEach", { enumerable: true, get: function () { return foreach_1.PForEach; } });
var select_1 = require("./select");
Object.defineProperty(exports, "PSelectStatement", { enumerable: true, get: function () { return select_1.PSelectStatement; } });
var delete_1 = require("./delete");
Object.defineProperty(exports, "PDeleteStatement", { enumerable: true, get: function () { return delete_1.PDeleteStatement; } });
var bookWrite_1 = require("./bookWrite");
Object.defineProperty(exports, "PBookWrite", { enumerable: true, get: function () { return bookWrite_1.PBookWrite; } });
var historyWrite_1 = require("./historyWrite");
Object.defineProperty(exports, "PHistoryWrite", { enumerable: true, get: function () { return historyWrite_1.PHistoryWrite; } });
var tuidWrite_1 = require("./tuidWrite");
Object.defineProperty(exports, "PTuidWrite", { enumerable: true, get: function () { return tuidWrite_1.PTuidWrite; } });
var pendingWrite_1 = require("./pendingWrite");
Object.defineProperty(exports, "PPendingWrite", { enumerable: true, get: function () { return pendingWrite_1.PPendingWrite; } });
var stateTo_1 = require("./stateTo");
Object.defineProperty(exports, "PStateTo", { enumerable: true, get: function () { return stateTo_1.PStateTo; } });
var fail_1 = require("./fail");
Object.defineProperty(exports, "PFail", { enumerable: true, get: function () { return fail_1.PFail; } });
var busStatement_1 = require("./busStatement");
Object.defineProperty(exports, "PBusStatement", { enumerable: true, get: function () { return busStatement_1.PBusStatement; } });
var procStatement_1 = require("./procStatement");
Object.defineProperty(exports, "PProcStatement", { enumerable: true, get: function () { return procStatement_1.PProcStatement; } });
var send_1 = require("./send");
Object.defineProperty(exports, "PSendStatement", { enumerable: true, get: function () { return send_1.PSendStatement; } });
var table_1 = require("./table");
Object.defineProperty(exports, "PTableStatement", { enumerable: true, get: function () { return table_1.PTableStatement; } });
var text_1 = require("./text");
Object.defineProperty(exports, "PTextStatement", { enumerable: true, get: function () { return text_1.PTextStatement; } });
var inline_1 = require("./inline");
Object.defineProperty(exports, "PInlineStatement", { enumerable: true, get: function () { return inline_1.PInlineStatement; } });
var schedule_1 = require("./schedule");
Object.defineProperty(exports, "PScheduleStatement", { enumerable: true, get: function () { return schedule_1.PScheduleStatement; } });
var log_1 = require("./log");
Object.defineProperty(exports, "PLogStatement", { enumerable: true, get: function () { return log_1.PLogStatement; } });
var transaction_1 = require("./transaction");
Object.defineProperty(exports, "PTransactionStatement", { enumerable: true, get: function () { return transaction_1.PTransactionStatement; } });
var poke_1 = require("./poke");
Object.defineProperty(exports, "PPokeStatement", { enumerable: true, get: function () { return poke_1.PPokeStatement; } });
var sleep_1 = require("./sleep");
Object.defineProperty(exports, "PSleepStatement", { enumerable: true, get: function () { return sleep_1.PSleepStatement; } });
var queue_1 = require("./queue");
Object.defineProperty(exports, "PQueueStatement", { enumerable: true, get: function () { return queue_1.PQueueStatement; } });
var execSql_1 = require("./execSql");
Object.defineProperty(exports, "PExecSqlStatement", { enumerable: true, get: function () { return execSql_1.PExecSqlStatement; } });
var role_1 = require("./role");
Object.defineProperty(exports, "PRoleStatement", { enumerable: true, get: function () { return role_1.PRoleStatement; } });
Object.defineProperty(exports, "PAssertRoleStatement", { enumerable: true, get: function () { return role_1.PAssertRoleStatement; } });
__exportStar(require("./use"), exports);
__exportStar(require("./put"), exports);
__exportStar(require("./from"), exports);
__exportStar(require("./statement"), exports);
//# sourceMappingURL=index.js.map