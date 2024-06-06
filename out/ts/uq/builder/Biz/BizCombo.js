"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizCombo = void 0;
const il_1 = require("../../il");
const BizEntity_1 = require("./BizEntity");
class BBizCombo extends BizEntity_1.BBizEntity {
    buildTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, keys, indexes } = this.bizEntity;
            let table = this.createTable(`${this.context.site}.${id}`);
            let keyFields = keys.map(v => (0, il_1.bigIntField)(v.name));
            let idField = (0, il_1.bigIntField)('id');
            table.keys = [idField];
            table.fields = [idField, ...keyFields];
        });
    }
}
exports.BBizCombo = BBizCombo;
//# sourceMappingURL=BizCombo.js.map