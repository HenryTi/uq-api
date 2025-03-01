"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budTypes = exports.BudDataType = exports.BizPhraseType = void 0;
const EnumSysTable_1 = require("../EnumSysTable");
var BizPhraseType;
(function (BizPhraseType) {
    BizPhraseType[BizPhraseType["any"] = 0] = "any";
    BizPhraseType[BizPhraseType["flow"] = 10] = "flow";
    BizPhraseType[BizPhraseType["atom"] = 11] = "atom";
    BizPhraseType[BizPhraseType["fork"] = 12] = "fork";
    BizPhraseType[BizPhraseType["bud"] = 13] = "bud";
    BizPhraseType[BizPhraseType["budGroup"] = 14] = "budGroup";
    // duo = 15,           // 二重奏
    BizPhraseType[BizPhraseType["combo"] = 16] = "combo";
    /*
    card = 61,
    cardDetail = 63,
    cardState = 62,
    */
    BizPhraseType[BizPhraseType["sheet"] = 101] = "sheet";
    BizPhraseType[BizPhraseType["bin"] = 102] = "bin";
    BizPhraseType[BizPhraseType["pend"] = 104] = "pend";
    BizPhraseType[BizPhraseType["sheetState"] = 105] = "sheetState";
    BizPhraseType[BizPhraseType["act"] = 111] = "act";
    BizPhraseType[BizPhraseType["query"] = 151] = "query";
    BizPhraseType[BizPhraseType["pick"] = 161] = "pick";
    BizPhraseType[BizPhraseType["role"] = 201] = "role";
    BizPhraseType[BizPhraseType["permit"] = 202] = "permit";
    BizPhraseType[BizPhraseType["options"] = 301] = "options";
    BizPhraseType[BizPhraseType["tree"] = 401] = "tree";
    BizPhraseType[BizPhraseType["tie"] = 501] = "tie";
    BizPhraseType[BizPhraseType["report"] = 601] = "report";
    BizPhraseType[BizPhraseType["in"] = 701] = "in";
    BizPhraseType[BizPhraseType["out"] = 700] = "out";
    BizPhraseType[BizPhraseType["ioApp"] = 710] = "ioApp";
    BizPhraseType[BizPhraseType["ioSite"] = 711] = "ioSite";
    BizPhraseType[BizPhraseType["book"] = 901] = "book";
    BizPhraseType[BizPhraseType["assign"] = 902] = "assign";
    BizPhraseType[BizPhraseType["key"] = 1001] = "key";
    BizPhraseType[BizPhraseType["prop"] = 1011] = "prop";
    BizPhraseType[BizPhraseType["optionsitem"] = 1031] = "optionsitem";
    BizPhraseType[BizPhraseType["binDiv"] = 2001] = "binDiv";
    BizPhraseType[BizPhraseType["console"] = 6001] = "console";
    BizPhraseType[BizPhraseType["templet"] = 6101] = "templet";
    BizPhraseType[BizPhraseType["print"] = 6102] = "print";
})(BizPhraseType || (exports.BizPhraseType = BizPhraseType = {}));
;
var BudDataType;
(function (BudDataType) {
    BudDataType[BudDataType["none"] = 0] = "none";
    BudDataType[BudDataType["int"] = 11] = "int";
    BudDataType[BudDataType["atom"] = 12] = "atom";
    BudDataType[BudDataType["radio"] = 13] = "radio";
    BudDataType[BudDataType["check"] = 14] = "check";
    BudDataType[BudDataType["bin"] = 15] = "bin";
    BudDataType[BudDataType["ID"] = 19] = "ID";
    BudDataType[BudDataType["dec"] = 21] = "dec";
    BudDataType[BudDataType["char"] = 31] = "char";
    BudDataType[BudDataType["str"] = 32] = "str";
    BudDataType[BudDataType["date"] = 41] = "date";
    BudDataType[BudDataType["datetime"] = 42] = "datetime";
    BudDataType[BudDataType["optionItem"] = 81] = "optionItem";
    BudDataType[BudDataType["fork"] = 95] = "fork";
    BudDataType[BudDataType["any"] = 96] = "any";
    BudDataType[BudDataType["unique"] = 97] = "unique";
    BudDataType[BudDataType["user"] = 98] = "user";
    BudDataType[BudDataType["arr"] = 99] = "arr";
})(BudDataType || (exports.BudDataType = BudDataType = {}));
;
const budTypeInt = {
    sysTable: EnumSysTable_1.EnumSysTable.ixInt,
};
const budTypeStr = {
    sysTable: EnumSysTable_1.EnumSysTable.ixStr,
};
const budTypeDec = {
    sysTable: EnumSysTable_1.EnumSysTable.ixDec,
};
const budTypeJson = {
    sysTable: EnumSysTable_1.EnumSysTable.ixJson,
};
exports.budTypes = {
    [BudDataType.int]: budTypeInt,
    [BudDataType.str]: budTypeStr,
    [BudDataType.char]: budTypeStr,
    [BudDataType.dec]: budTypeDec,
    [BudDataType.date]: budTypeInt,
    [BudDataType.datetime]: budTypeInt,
    [BudDataType.atom]: budTypeInt,
    [BudDataType.ID]: budTypeInt,
    [BudDataType.radio]: budTypeInt,
    [BudDataType.fork]: budTypeJson,
};
//# sourceMappingURL=BizPhraseType.js.map