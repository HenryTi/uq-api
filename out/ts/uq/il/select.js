"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSelect = exports.Select = exports.SelectBase = exports.Delete = exports.WithFrom = exports.OrderBy = exports.JoinTable = exports.FromTable = exports.JoinType = void 0;
const parser = require("../parser");
const element_1 = require("./element");
const pointer_1 = require("./pointer");
var JoinType;
(function (JoinType) {
    JoinType[JoinType["left"] = 0] = "left";
    JoinType[JoinType["right"] = 1] = "right";
    JoinType[JoinType["queue"] = 2] = "queue";
    JoinType[JoinType["join"] = 3] = "join";
    JoinType[JoinType["inner"] = 4] = "inner";
    JoinType[JoinType["cross"] = 5] = "cross";
})(JoinType = exports.JoinType || (exports.JoinType = {}));
;
class FromTable {
    getTableAlias() { return this.alias; }
    getTableName() { return; }
    fieldPointer(name) {
        if (this.entity !== undefined) {
            if (this.entity === null)
                return;
            let tbl = this.entity;
            return tbl.fieldPointer(name);
        }
        if (this.select !== undefined)
            return this.select.field(name);
        return;
    }
    getKeys() { return; }
    getFields() { return; }
    getArrTable() { return; }
}
exports.FromTable = FromTable;
class JoinTable {
}
exports.JoinTable = JoinTable;
class OrderBy {
}
exports.OrderBy = OrderBy;
class WithFrom extends element_1.IElement {
}
exports.WithFrom = WithFrom;
class Delete extends WithFrom {
    get type() { return 'delete'; }
    parser(context) {
        return new parser.PDelete(this, context);
    }
}
exports.Delete = Delete;
class SelectBase extends WithFrom {
    constructor() {
        super(...arguments);
        this.distinct = false;
        this.inForeach = false;
        this.isValue = false;
        this.toVar = false; // is select to variable
        // 所有的select都加 for update，防止deadlock。query里面，没有transaction，所以不起作用
        this.lock = true; // false; 
        this.ignore = false;
        this.unions = [];
    }
    // 这个field，是作为子表的字段，从外部引用。
    // 所以，没有 group 属性了。
    field(name) {
        let by = this.groupBy;
        if (by !== undefined) {
            let gb = by.find(v => v.alias === name);
            //if (gb !== undefined) return new GroupByPointer();
            if (gb !== undefined)
                return new pointer_1.FieldPointer();
        }
        let col = this.columns.find(v => v.alias === name);
        if (col !== undefined)
            return new pointer_1.FieldPointer();
        return;
    }
}
exports.SelectBase = SelectBase;
class Select extends SelectBase {
    constructor() {
        super(...arguments);
        this.type = 'select';
    }
    parser(context) {
        return new parser.PSelect(this, context);
    }
}
exports.Select = Select;
class BizSelect extends SelectBase {
    constructor() {
        super(...arguments);
        this.type = 'bizselect';
    }
    parser(context) {
        return new parser.PBizSelect(this, context);
    }
}
exports.BizSelect = BizSelect;
//# sourceMappingURL=select.js.map