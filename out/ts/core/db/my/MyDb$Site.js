"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$Site = void 0;
const tool_1 = require("../../../tool");
const consts_1 = require("../../consts");
const MyDb_1 = require("./MyDb");
class MyDb$Site extends MyDb_1.MyDb {
    constructor(myDbs, siteId) {
        let dbName = consts_1.consts.$site;
        if (siteId !== undefined)
            dbName += '.' + siteId;
        super(myDbs, dbName);
    }
    initConfig(dbName) { return tool_1.env.connection; }
}
exports.MyDb$Site = MyDb$Site;
//# sourceMappingURL=MyDb$Site.js.map