"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldBud = exports.BizField = void 0;
/*
import {
    BBizField, DbContext
    , BBizFieldBud, BBizFieldField, BBizFieldJsonProp
} from "../builder";
import { BizBudValue } from "./Biz/Bud";
import { BizEntity } from "./Biz/Entity";
*/
// in FROM statement, columns use BizField
// and in Where, BizField is used.
class BizField {
}
exports.BizField = BizField;
class BizFieldBud extends BizField {
    db(dbContext) {
        return undefined;
    }
}
exports.BizFieldBud = BizFieldBud;
class BizFieldField extends BizField {
    db(dbContext) {
        return undefined;
    }
}
exports.BizFieldField = BizFieldField;
class BizFieldJsonProp extends BizField {
    db(dbContext) {
        return undefined;
    }
}
exports.BizFieldJsonProp = BizFieldJsonProp;
//# sourceMappingURL=BizField.js.map