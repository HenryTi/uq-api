import { PCompareExpression, PComparePartExpression, PContext, PValueExpression } from '../../parser';
import { BizBud } from '../Biz';
import { IElement } from '../IElement';
import { GroupType } from '../pointer';
import { Atom, NullOperand, NumberOperand, TextOperand, VarOperand } from './Op';

export abstract class Expression extends IElement {
    get type(): string { return 'expression'; }
    protected atoms: Atom[] = [];
    groupType: GroupType;

    // select字段自动取出alias
    alias(): string {
        if (this.atoms.length > 1) return undefined;
        let atom = this.atoms[0];
        if (atom.type !== 'var') return undefined;
        let vars = (atom as VarOperand)._var;
        let len = vars.length;
        if (len > 0) return vars[len - 1];
    }

    isVarEqVar(): boolean {
        let len = this.atoms.length;
        let e1 = this.atoms[len - 2];
        let e2 = this.atoms[len - 1];
        let { type } = e1;
        if (type !== 'var') return false;
        if (type !== e2.type) return false;
        let varOperand: VarOperand = e1 as VarOperand;
        return varOperand.isSameVar(e2 as VarOperand);
    }

    isVar(): boolean {
        if (this.atoms.length > 1) {
            return false;
        }
        return this.atoms[0].type === 'var';
    }

    isScalar(): boolean {
        if (this.isVar() === false) return false;

    }

    getBud(): BizBud {
        if (this.atoms.length !== 1) return;
        let atom = this.atoms[0];
        if (atom.type !== 'var') return;
        let { pointer } = atom as VarOperand;
        let bud: BizBud = (pointer as unknown as any).bud;
        // if (bud !== undefined) return bud;
        return bud;
    }

    abstract setScalarValue(): void;

    add(atom: Atom) {
        this.atoms.push(atom);
    }

    getAtoms() { return this.atoms; }
}

export class ValueExpression extends Expression {
    scalarValue: string | number | [string, string];
    static const(num: number | string): ValueExpression {
        let ret = new ValueExpression();
        let atom: Atom;
        switch (typeof num) {
            default: atom = new NullOperand(); break;
            case 'number': atom = new NumberOperand(num); break;
            case 'string': atom = new TextOperand(num); break;
        }
        ret.atoms.push(atom);
        return ret;
    }
    parser(context: PContext) { return new PValueExpression(this, context); }
    setScalarValue(): void {
        if (this.atoms.length !== 1) return;
        const atom = this.atoms[0];
        this.scalarValue = atom.scalarValue;
    }
}

export class CompareExpression extends Expression {
    parser(context: PContext) { return new PCompareExpression(this, context); }
    setScalarValue(): void { }
}

// 专门用于Select Of ID，比较的前半部分固定是id=exp
export class ComarePartExpression extends CompareExpression {
    parser(context: PContext) { return new PComparePartExpression(this, context); }
}
