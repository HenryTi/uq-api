"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntityFieldPointer = exports.BizEntityBudPointer = exports.ConstPointer = exports.UnitPointer = exports.UserPointer = exports.GroupByPointer = exports.FieldPointer = exports.DotVarPointer = exports.VarPointer = exports.Pointer = exports.GroupType = void 0;
var GroupType;
(function (GroupType) {
    GroupType[GroupType["Single"] = 1] = "Single";
    GroupType[GroupType["Group"] = 2] = "Group";
    GroupType[GroupType["Both"] = 3] = "Both";
})(GroupType || (exports.GroupType = GroupType = {}));
class Pointer {
}
exports.Pointer = Pointer;
class VarPointer extends Pointer {
    constructor(name) {
        super();
        this.groupType = GroupType.Single;
        this.name = name;
    }
    to(stack, v) {
        stack.var(this.varName(v._var[0]));
    }
    varName(v) {
        if (v === undefined) {
            v = this.name;
        }
        if (this.arr !== undefined) {
            v = this.arr + '_' + v;
        }
        return this.no === undefined ? v : v + '_' + this.no;
    }
}
exports.VarPointer = VarPointer;
class DotVarPointer extends Pointer {
    constructor() {
        super(...arguments);
        this.groupType = GroupType.Single;
    }
    to(stack, v) {
        stack.dotVar(v._var);
    }
}
exports.DotVarPointer = DotVarPointer;
class FieldPointer extends Pointer {
    constructor() {
        super(...arguments);
        this.groupType = GroupType.Single;
    }
    to(stack, v) {
        let vr = v._var;
        let len = vr.length;
        let v0, v1;
        if (len === 1)
            v0 = vr[0];
        else {
            v0 = vr[1];
            v1 = vr[0];
            if (v0 === '$') {
                v1 += '$';
                v0 = 'name';
            }
        }
        stack.field(v0, v1);
    }
}
exports.FieldPointer = FieldPointer;
class GroupByPointer extends Pointer {
    constructor() {
        super(...arguments);
        this.groupType = GroupType.Group;
    }
    to(stack, v) {
        stack.expr(this.exp);
    }
}
exports.GroupByPointer = GroupByPointer;
class UserPointer extends Pointer {
    constructor() {
        super(...arguments);
        this.groupType = GroupType.Single;
    }
    to(stack, v) { stack.var('$user'); /* stack.push(new exp.ExpVar('$user'))*/ }
}
exports.UserPointer = UserPointer;
class UnitPointer extends Pointer {
    constructor() {
        super(...arguments);
        this.groupType = GroupType.Single;
    }
    to(stack, v) { stack.var('$unit'); /*stack.push(new exp.ExpVar('$unit'))*/ }
}
exports.UnitPointer = UnitPointer;
class ConstPointer extends Pointer {
    constructor(exp) {
        super();
        this.groupType = GroupType.Both;
        this.exp = exp;
    }
    to(stack, v) {
        stack.expr(this.exp);
    }
}
exports.ConstPointer = ConstPointer;
class BizEntityBudPointer extends Pointer {
    constructor(bizFromEntity, bud) {
        super();
        this.groupType = GroupType.Both;
        this.bizFromEntity = bizFromEntity;
        this.bud = bud;
    }
    to(stack, v) {
        stack.varOfBizEntity(this.bizFromEntity, this.bud);
    }
}
exports.BizEntityBudPointer = BizEntityBudPointer;
class BizEntityFieldPointer extends Pointer {
    constructor(bizFromEntity, fieldName) {
        super();
        this.groupType = GroupType.Single;
        this.bizFromEntity = bizFromEntity;
        // this.entity = entity;
        this.fieldName = fieldName;
    }
    to(stack, v) {
        const { alias } = this.bizFromEntity;
        /*
        let tblAlias: string;
        switch (bizPhraseType) {
            default: tblAlias = alias; break;
            case BizPhraseType.atom: tblAlias = alias + '$atom'; break;
        }
        */
        stack.dotVar([alias, this.fieldName]);
    }
}
exports.BizEntityFieldPointer = BizEntityFieldPointer;
//# sourceMappingURL=pointer.js.map