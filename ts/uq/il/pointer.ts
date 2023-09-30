import {ValueExpression, VarOperand, Stack} from './expression';

export enum GroupType { Single = 1, Group = 2, Both = 3 }

export abstract class Pointer {
    abstract groupType: GroupType;
    //get type():string {return 'pointer';}
    //parser(ts:TokenStream):PElement {return;}
    //abstract builder(context:Context): BPointer;
    abstract to(stack:Stack, v:VarOperand):void;
}

export class VarPointer extends Pointer {
    groupType: GroupType = GroupType.Single;
    no: number;     // 扫描之后的局部变量编号
    arr: string;    // arr name
    to(stack:Stack, v:VarOperand) {
        stack.var(this.varName(v._var[0]));
    }
    varName(v:string) {
        if (this.arr !== undefined) {
            v = this.arr + '_' + v;
        }
        return this.no === undefined? v : v+'_'+this.no;
    }
}

export class FieldPointer extends Pointer {
    groupType: GroupType = GroupType.Single;
    to(stack:Stack, v:VarOperand) {
        let vr = v._var;
        let len = vr.length;
        let v0:string, v1:string;
        if (len === 1) v0 = vr[0];
        else {
			v0=vr[1]; 
			v1=vr[0];
			if (v0 === '$') {
				v1 += '$';
				v0 = 'name';
			}
		}
        stack.field(v0, v1);
    }
}

export class GroupByPointer extends Pointer {
    groupType: GroupType = GroupType.Group;
    exp: ValueExpression;
    to(stack:Stack, v:VarOperand) {
        stack.expr(this.exp);
    }
}

export class UserPointer extends Pointer {
    groupType: GroupType = GroupType.Single;
    to(stack:Stack, v:VarOperand) {stack.var('$user');/* stack.push(new exp.ExpVar('$user'))*/}
}

export class UnitPointer extends Pointer {
    groupType: GroupType = GroupType.Single;
    to(stack:Stack, v:VarOperand) {stack.var('$unit'); /*stack.push(new exp.ExpVar('$unit'))*/}
}

export class ConstPointer extends Pointer {
    constructor(exp: ValueExpression) {
        super();
        this.exp = exp;
    }
    exp: ValueExpression;
    groupType: GroupType = GroupType.Both;
    to(stack:Stack, v:VarOperand) {
        stack.expr(this.exp);
    }
}