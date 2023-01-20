"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDbNoName = void 0;
const tool_1 = require("../../../tool");
const MyDbBase_1 = require("./MyDbBase");
class MyDbNoName extends MyDbBase_1.MyDbBase {
    connectionConfig() { return tool_1.env.connection; }
}
exports.MyDbNoName = MyDbNoName;
//# sourceMappingURL=MyDbNoName.js.map