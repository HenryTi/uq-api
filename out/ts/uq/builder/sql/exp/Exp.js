"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumExpOP = exports.Exp = void 0;
// Exp
class Exp {
    get voided() { return false; }
}
exports.Exp = Exp;
var EnumExpOP;
(function (EnumExpOP) {
    EnumExpOP[EnumExpOP["and"] = 0] = "and";
    EnumExpOP[EnumExpOP["or"] = 1] = "or";
})(EnumExpOP || (exports.EnumExpOP = EnumExpOP = {}));
//# sourceMappingURL=Exp.js.map