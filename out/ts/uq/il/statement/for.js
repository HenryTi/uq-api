"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForQueue = exports.ForSelect = exports.ForListWithVars = exports.ForBizInOutArr = exports.ForArr = exports.ForList = exports.ForEach = void 0;
const parser = require("../../parser");
const Statement_1 = require("./Statement");
class ForEach extends Statement_1.Statement {
    get type() { return 'foreach'; }
    db(db) {
        return this.list.db(db, this);
    }
    parser(context) { return new parser.PForEach(this, context); }
    eachChild(callback) {
        this.statements.eachChild((child, cname) => callback(child, cname));
    }
    getVar(name) { return this.list.getVar(name); }
    createBizForDetail(bizDetail, vars) { return undefined; }
}
exports.ForEach = ForEach;
class ForList {
    getVar(name) {
        return undefined;
    }
    check() { return undefined; }
}
exports.ForList = ForList;
class ForArr extends ForList {
    constructor(arr) {
        super();
        this.arr = arr;
    }
    db(db, forEach) {
        return db.foreachArr(forEach, this);
    }
}
exports.ForArr = ForArr;
class ForBizInOutArr extends ForList {
    constructor(arr) {
        super();
        this.arr = arr;
    }
    db(db, forEach) {
        return db.foreachBizInOutArr(forEach, this);
    }
}
exports.ForBizInOutArr = ForBizInOutArr;
class ForListWithVars extends ForList {
    constructor(vars) {
        super();
        this.vars = vars;
    }
    getVar(name) {
        if (this.vars === undefined)
            return;
        return this.vars.find(v => v.name === name);
    }
}
exports.ForListWithVars = ForListWithVars;
class ForSelect extends ForListWithVars {
    constructor(vars, select) {
        super(vars);
        this.select = select;
    }
    db(db, forEach) {
        return db.foreachSelect(forEach, this);
    }
}
exports.ForSelect = ForSelect;
class ForQueue extends ForListWithVars {
    constructor(vars, queue, ix) {
        super(vars);
        this.queue = queue;
        this.ix = ix;
    }
    db(db, forEach) {
        return db.foreachQueue(forEach, this);
    }
}
exports.ForQueue = ForQueue;
//# sourceMappingURL=for.js.map