"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = exports.Delete = exports.WithFrom = exports.OrderBy = exports.JoinTable = exports.FromTable = exports.JoinType = void 0;
const parser = require("../parser");
const IElement_1 = require("./IElement");
const pointer_1 = require("./pointer");
var JoinType;
(function (JoinType) {
    JoinType[JoinType["left"] = 0] = "left";
    JoinType[JoinType["right"] = 1] = "right";
    JoinType[JoinType["queue"] = 2] = "queue";
    JoinType[JoinType["join"] = 3] = "join";
    JoinType[JoinType["inner"] = 4] = "inner";
    JoinType[JoinType["cross"] = 5] = "cross";
})(JoinType || (exports.JoinType = JoinType = {}));
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
class WithFrom extends IElement_1.IElement {
}
exports.WithFrom = WithFrom;
class Delete extends WithFrom {
    get type() { return 'delete'; }
    parser(context) {
        return new parser.PDelete(this, context);
    }
}
exports.Delete = Delete;
class Select extends WithFrom {
    constructor() {
        super(...arguments);
        this.type = 'select';
        this.distinct = false;
        this.inForeach = false;
        this.isValue = false;
        this.toVar = false; // is select to variable
        // 所有的select都加 for update，防止deadlock。query里面，没有transaction，所以不起作用
        this.lock = true; // false; 
        this.ignore = false;
        this.unions = [];
    }
    parser(context) {
        return new parser.PSelect(this, context);
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
exports.Select = Select;
//# sourceMappingURL=select.js.map