"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldBud = exports.BizField = void 0;
const builder_1 = require("../builder");
// in FROM statement, columns use BizField
// and in Where, BizField is used.
class BizField {
}
exports.BizField = BizField;
class BizFieldBud extends BizField {
    db(dbContext) {
        return new builder_1.BBizFieldBud(dbContext, this);
    }
}
exports.BizFieldBud = BizFieldBud;
class BizFieldField extends BizField {
    db(dbContext) {
        return new builder_1.BBizFieldField(dbContext, this);
    }
}
exports.BizFieldField = BizFieldField;
class BizFieldJsonProp extends BizField {
    db(dbContext) {
        return new builder_1.BBizFieldJsonProp(dbContext, this);
    }
}
exports.BizFieldJsonProp = BizFieldJsonProp;
//# sourceMappingURL=BizField.js.map