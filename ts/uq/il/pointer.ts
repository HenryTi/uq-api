import { BizBud, BizBudID, BizFromEntity } from './Biz';
import { BizPhraseType } from './Biz/BizPhraseType';
import { ValueExpression, VarOperand } from './Exp';
import { Stack } from './Exp/Stack';
import { Var } from './statement';

export enum GroupType { Single = 1, Group = 2, Both = 3 }

export abstract class Pointer {
    abstract get groupType(): GroupType;
    abstract to(stack: Stack, v: VarOperand): void;
}

export class NamePointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    name: string;
    no: number;     // 扫描之后的局部变量编号
    arr: string;    // arr name
    constructor(name?: string) {
        super();
        this.name = name;
    }
    to(stack: Stack, v: VarOperand) {
        stack.var(this.varName(v._var[0]));
    }
    varName(v: string) {
        if (v === undefined) {
            v = this.name;
        }
        if (this.arr !== undefined) {
            v = this.arr + '_' + v;
        }
        return this.no === undefined ? v : v + '_' + this.no;
    }
}

export class VarPointer extends NamePointer {
    readonly _var: Var;
    constructor(_var: Var) {
        super(_var.name);
        this._var = _var;
    }
}

export class DotVarPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    no: number;     // 扫描之后的局部变量编号
    to(stack: Stack, v: VarOperand) {
        stack.dotVar(v._var);
    }
}

export class FieldPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    to(stack: Stack, v: VarOperand) {
        let vr = v._var;
        let len = vr.length;
        let v0: string, v1: string;
        if (len === 1) v0 = vr[0];
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

export class GroupByPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Group;
    exp: ValueExpression;
    to(stack: Stack, v: VarOperand) {
        stack.expr(this.exp);
    }
}

export class UserPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    to(stack: Stack, v: VarOperand) { stack.var('$user');/* stack.push(new exp.ExpVar('$user'))*/ }
}

export class UnitPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    to(stack: Stack, v: VarOperand) { stack.var('$unit'); /*stack.push(new exp.ExpVar('$unit'))*/ }
}

export class ConstPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Both;
    readonly exp: ValueExpression;
    constructor(exp: ValueExpression) {
        super();
        this.exp = exp;
    }
    to(stack: Stack, v: VarOperand) {
        stack.expr(this.exp);
    }
}

abstract class BizEntityFieldBasePointer extends Pointer {
    readonly groupType: GroupType = GroupType.Both;
    readonly bizFromEntity: BizFromEntity;
    bud: BizBud;
    constructor(bizFromEntity: BizFromEntity) {
        super();
        this.bizFromEntity = bizFromEntity;
    }
}

export class BizEntityBudPointer extends BizEntityFieldBasePointer {
    constructor(bizFromEntity: BizFromEntity, bud: BizBud) {
        super(bizFromEntity);
        this.bud = bud;
    }
    override to(stack: Stack, v: VarOperand): void {
        stack.varOfBizEntity(this.bizFromEntity, this.bud);
    }
}

const $idu = ''; // '$idu';
const $atom = '$atom';

export class BizEntityFieldIdPointer extends BizEntityFieldBasePointer {
    constructor(bizFromEntity: BizFromEntity) {
        super(bizFromEntity);
        this.bud = new BizBudID(bizFromEntity.bizEntityArr[0], 'id', undefined);
    }
    override to(stack: Stack, v: VarOperand): void {
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
                case BizPhraseType.atom:
                    stack.dotVar([alias + $atom, fn]);
                    break;
                case BizPhraseType.fork:
                    stack.dotVar([alias + $idu, fn]);
                    break;
            }
        }
    }
}

export class BizEntityFieldPointer extends BizEntityFieldBasePointer {
    // readonly groupType: GroupType = GroupType.Single;
    readonly fieldName: string;
    constructor(bizFromEntity: BizFromEntity, fieldName: string) {
        super(bizFromEntity);
        let bizEntity = bizFromEntity.bizEntityArr[0];
        if (bizEntity !== undefined) {
            this.bud = bizEntity.getBud(fieldName);
        }
        this.fieldName = fieldName;
    }

    override to(stack: Stack, v: VarOperand): void {
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
                    case BizPhraseType.atom:
                        stack.dotVar([alias + $atom, fn]);
                        break;
                    case BizPhraseType.fork:
                        stack.dotVar([alias + $idu, fn]);
                        break;
                }
            }
        }
        else {
            let tAlias = alias;
            if (tAlias === undefined) debugger;
            switch (this.bizFromEntity.bizPhraseType) {
                case BizPhraseType.atom:
                    tAlias += $atom;
                    break;
                case BizPhraseType.pend:
                    if (tAlias === undefined) tAlias = 'pend';
                    break;
            }
            stack.dotVar([tAlias, fn]);
        }
    }
}

export class BizEntityForkUpPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    readonly bizFromEntity: BizFromEntity;
    readonly upField: string;
    constructor(bizFromEntity: BizFromEntity, upField: string) {
        super();
        this.bizFromEntity = bizFromEntity;
        this.upField = upField;
    }

    override to(stack: Stack, v: VarOperand): void {
        // stack.dotVar(['fork', this.upField]);
        stack.bizForkUp(this.bizFromEntity.alias, this.upField);
    }
}

export class BizEntityBinUpPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    readonly bizFromEntity: BizFromEntity;
    readonly upField: string;
    constructor(bizFromEntity: BizFromEntity, upField: string) {
        super();
        this.bizFromEntity = bizFromEntity;
        this.upField = upField;
    }

    override to(stack: Stack, v: VarOperand): void {
        stack.bizBinUp(this.bizFromEntity.alias, this.upField);
    }
}
