"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntityBinUpPointer = exports.BizEntityForkUpPointer = exports.BizEntityFieldPointer = exports.BizEntityFieldIdPointer = exports.BizEntityBudPointer = exports.ConstPointer = exports.UnitPointer = exports.UserPointer = exports.GroupByPointer = exports.FieldPointer = exports.DotVarPointer = exports.VarPointer = exports.NamePointer = exports.Pointer = exports.GroupType = void 0;
const Biz_1 = require("./Biz");
const BizPhraseType_1 = require("./Biz/BizPhraseType");
var GroupType;
(function (GroupType) {
    GroupType[GroupType["Single"] = 1] = "Single";
    GroupType[GroupType["Group"] = 2] = "Group";
    GroupType[GroupType["Both"] = 3] = "Both";
})(GroupType || (exports.GroupType = GroupType = {}));
class Pointer {
}
exports.Pointer = Pointer;
class NamePointer extends Pointer {
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
exports.NamePointer = NamePointer;
class VarPointer extends NamePointer {
    constructor(_var) {
        super(_var.name);
        this._var = _var;
    }
}
exports.VarPointer = VarPointer;
class DotVarPointer extends Pointer {
    constructor(bud) {
        super();
        this.type = 'dotVarPointer';
        this.groupType = GroupType.Single;
        this.bud = bud;
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
class BizEntityFieldBasePointer extends Pointer {
    constructor(bizFromEntity) {
        super();
        this.groupType = GroupType.Both;
        this.bizFromEntity = bizFromEntity;
    }
}
class BizEntityBudPointer extends BizEntityFieldBasePointer {
    constructor(bizFromEntity, bud) {
        super(bizFromEntity);
        this.bud = bud;
    }
    to(stack, v) {
        stack.varOfBizEntity(this.bizFromEntity, this.bud);
    }
}
exports.BizEntityBudPointer = BizEntityBudPointer;
const $idu = ''; // '$idu';
const $atom = '$atom';
class BizEntityFieldIdPointer extends BizEntityFieldBasePointer {
    constructor(bizFromEntity) {
        super(bizFromEntity);
        this.bud = new Biz_1.BizBudID(bizFromEntity.bizEntityArr[0], 'id', undefined);
    }
    to(stack, v) {
        const { alias } = this.bizFromEntity;
        const { isForkBase } = this.bizFromEntity;
        let fn = 'id';
        if (isForkBase === true) {
            stack.dotVar([alias + $idu, fn]);
            stack.dotVar([this.bizFromEntity.parent.alias + $idu, 'id']);
            stack.func('IFNULL', 2, false);
        }
        else {
            switch (this.bizFromEntity.bizPhraseType) {
                default:
                    stack.dotVar([alias, fn]);
                    break;
                case BizPhraseType_1.BizPhraseType.atom:
                    stack.dotVar([alias + $atom, fn]);
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    stack.dotVar([alias + $idu, fn]);
                    break;
            }
        }
    }
}
exports.BizEntityFieldIdPointer = BizEntityFieldIdPointer;
class BizEntityFieldPointer extends BizEntityFieldBasePointer {
    constructor(bizFromEntity, fieldName) {
        super(bizFromEntity);
        let bizEntity = bizFromEntity.bizEntityArr[0];
        if (bizEntity !== undefined) {
            this.bud = bizEntity.getBud(fieldName);
        }
        this.fieldName = fieldName;
    }
    to(stack, v) {
        const { alias } = this.bizFromEntity;
        let fn = this.fieldName;
        if (fn === 'id') {
            const { isForkBase } = this.bizFromEntity;
            if (isForkBase === true) {
                stack.dotVar([alias + $idu, fn]);
                stack.dotVar([this.bizFromEntity.parent.alias + $idu, 'id']);
                stack.func('IFNULL', 2, false);
            }
            else {
                switch (this.bizFromEntity.bizPhraseType) {
                    default:
                        stack.dotVar([alias, fn]);
                        break;
                    case BizPhraseType_1.BizPhraseType.atom:
                        stack.dotVar([alias + $atom, fn]);
                        break;
                    case BizPhraseType_1.BizPhraseType.fork:
                        stack.dotVar([alias + $idu, fn]);
                        break;
                }
            }
        }
        else {
            let tAlias = alias;
            switch (this.bizFromEntity.bizPhraseType) {
                case BizPhraseType_1.BizPhraseType.atom:
                    if (tAlias === undefined)
                        debugger;
                    tAlias += $atom;
                    break;
                case BizPhraseType_1.BizPhraseType.pend:
                    if (tAlias === undefined)
                        tAlias = 'pend';
                    break;
            }
            stack.dotVar([tAlias, fn]);
        }
    }
}
exports.BizEntityFieldPointer = BizEntityFieldPointer;
class BizEntityForkUpPointer extends Pointer {
    constructor(bizFromEntity, upField) {
        super();
        this.groupType = GroupType.Single;
        this.bizFromEntity = bizFromEntity;
        this.upField = upField;
    }
    to(stack, v) {
        // stack.dotVar(['fork', this.upField]);
        stack.bizForkUp(this.bizFromEntity.alias, this.upField);
    }
}
exports.BizEntityForkUpPointer = BizEntityForkUpPointer;
class BizEntityBinUpPointer extends Pointer {
    constructor(bizFromEntity, upField) {
        super();
        this.groupType = GroupType.Single;
        this.bizFromEntity = bizFromEntity;
        this.upField = upField;
    }
    to(stack, v) {
        stack.bizBinUp(this.bizFromEntity.alias, this.upField);
    }
}
exports.BizEntityBinUpPointer = BizEntityBinUpPointer;
//# sourceMappingURL=pointer.js.map