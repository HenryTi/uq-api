import { BizBud, BizFromEntity } from './Biz';
import { BizPhraseType } from './Biz/BizPhraseType';
import { ValueExpression, VarOperand } from './Exp';
import { Stack } from './Exp/Stack';

export enum GroupType { Single = 1, Group = 2, Both = 3 }

export abstract class Pointer {
    abstract get groupType(): GroupType;
    abstract to(stack: Stack, v: VarOperand): void;
}

export class VarPointer extends Pointer {
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

export class BizEntityBudPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Both;
    readonly bizFromEntity: BizFromEntity;
    readonly bud: BizBud;
    constructor(bizFromEntity: BizFromEntity, bud: BizBud) {
        super();
        this.bizFromEntity = bizFromEntity;
        this.bud = bud;
    }
    override to(stack: Stack, v: VarOperand): void {
        stack.varOfBizEntity(this.bizFromEntity, this.bud);
    }
}

export class BizEntityFieldPointer extends Pointer {
    readonly groupType: GroupType = GroupType.Single;
    readonly bizFromEntity: BizFromEntity;
    readonly fieldName: string;
    constructor(bizFromEntity: BizFromEntity, fieldName: string) {
        super();
        this.bizFromEntity = bizFromEntity;
        this.fieldName = fieldName;
    }

    override to(stack: Stack, v: VarOperand): void {
        const { alias } = this.bizFromEntity;
        let fn = this.fieldName;
        if (fn === 'id') {
            const { isForkBase } = this.bizFromEntity;
            if (isForkBase === true) {
                stack.dotVar([alias, fn]);
                stack.dotVar([this.bizFromEntity.parent.alias + '$idu', 'id']);
                stack.func('IFNULL', 2, false);
            }
            else {
                switch (this.bizFromEntity.bizPhraseType) {
                    default:
                        stack.dotVar([alias, fn]);
                        break;
                    case BizPhraseType.atom:
                    case BizPhraseType.fork:
                        stack.dotVar([alias + '$idu', fn]);
                        break;
                }
            }
        }
        else {
            stack.dotVar([alias, fn]);
        }
    }
}
