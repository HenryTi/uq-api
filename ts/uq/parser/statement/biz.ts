import { Space } from '../space';
import { BizDetailActStatement, BizDetailActSubPend, BizDetailActSubStatement, BizDetailActSubBud, BizPend, BizMoniker, PendAct, PendValueCalc, ValueExpression, Var, VarPointer, SetEqu, BudDataType } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';
import { PElement } from '../element';
import { Token } from '../tokens';

export class PBizDetailActStatement extends PStatement {
    bizStatement: BizDetailActStatement;
    constructor(bizStatement: BizDetailActStatement, context: PContext) {
        super(bizStatement, context);
        this.bizStatement = bizStatement;
    }

    private bizSubs: { [key: string]: new (bizStatement: BizDetailActStatement) => BizDetailActSubStatement } = {
        pend: BizDetailActSubPend,
        bud: BizDetailActSubBud,
    };

    protected _parse() {
        let key = this.ts.passKey();
        let BizSub = this.bizSubs[key];
        if (BizSub === undefined) {
            this.ts.expect(...Object.keys(this.bizSubs));
        }
        let bizSub = new BizSub(this.bizStatement);
        this.context.parseElement(bizSub);
        this.bizStatement.sub = bizSub;
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan(space) == false) ok = false;
        return ok;
    }
}

export class PBizDetailActSubPend extends PElement<BizDetailActSubPend> {
    private toVar: string;
    private pend: string;
    private pendGoTo: string;

    protected _parse(): void {
        this.pend = this.ts.passVar();
        if (this.ts.isKeyword('id') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
                this.element.valId = this.context.parse(ValueExpression);
            }
            else if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                this.toVar = this.ts.passVar();
            }
            else {
                this.ts.expect('=', 'TO');
            }
        }
        if (this.ts.isKeyword('detail') === true) {
            this.ts.readToken();
            this.ts.passToken(Token.EQU);
            this.element.valDetailId = this.context.parse(ValueExpression);
        }
        if (this.ts.isKeyword('set') === true) {
            this.ts.readToken();
            this.ts.passKey('value');
            let valueCalc: PendValueCalc;
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.EQU, Token.ADDEQU, Token.SUBEQU);
                    break;
                case Token.EQU: valueCalc = PendValueCalc.equ; break;
                case Token.ADDEQU: valueCalc = PendValueCalc.add; break;
                case Token.SUBEQU: valueCalc = PendValueCalc.sub; break;
            }
            this.ts.readToken();
            this.element.valueCalc = valueCalc;
            this.element.valValue = this.context.parse(ValueExpression);
        }
        else if (this.ts.isKeyword('del') === true) {
            this.ts.readToken();
            this.element.pendAct = PendAct.del;
        }
        else if (this.ts.isKeyword('goto') === true) {
            this.ts.readToken();
            this.element.pendAct = PendAct.goto;
            this.pendGoTo = this.ts.passVar();
        }
    }

    private getPend(space: Space, pendName: string): BizPend {
        let pend = space.uq.biz.bizEntities.get(pendName);
        if (pend === undefined) {
            this.log(`'${this.pend}' is not defined`);
            return undefined;
        }
        if (pend.type !== 'pend') {
            this.log(`'${this.pend}' is not a PEND`);
            return undefined;
        }
        return pend as BizPend;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { valId, valDetailId, valValue, receiver, bizStatement, pendAct } = this.element;
        // let { bizDetailAct } = bizStatement;

        let pend = this.getPend(space, this.pend);
        if (pend === undefined) {
            ok = false;
        }
        else {
            this.element.pend = pend;
        }

        if (this.pendGoTo !== undefined) {
            let pendGoto = this.getPend(space, this.pendGoTo);
            if (pendGoto === undefined) {
                ok = false;
            }
            else {
                this.element.pendGoto = pendGoto;
            }
        }

        if (this.toVar !== undefined) {
            let vp = space.varPointer(this.toVar, false) as VarPointer;
            if (vp === undefined) {
                this.log(`变量 ${this.toVar} 没有定义`);
                ok = false;
            }
            let v = new Var(this.toVar, undefined, undefined);
            v.pointer = vp;
            this.element.toVar = v;
            let cannotAct: string;
            switch (pendAct) {
                default: break;
                case PendAct.goto:
                    cannotAct = 'GOTO';
                    break;
                case PendAct.del:
                    cannotAct = 'DEL';
                    break;
            }
            if (cannotAct !== undefined) {
                this.log(`Biz Pend ID TO can not ${cannotAct}`);
                ok = false;
            }
            if (valDetailId === undefined) {
                this.log(`Biz Pend ID To must have DETAIL=?`);
                ok = false;
            }
        }

        if (valId !== undefined) {
            if (valId.pelement.scan(space) === false) ok = false;
        }
        if (valDetailId !== undefined) {
            if (valDetailId.pelement.scan(space) === false) ok = false;
        }
        if (valValue !== undefined) {
            if (valValue.pelement.scan(space) === false) ok = false;
        }
        if (receiver !== undefined) {
            if (receiver.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}

export class PBizDetailActSubBud extends PElement<BizDetailActSubBud> {
    private bizEntity: string;
    private bud: string;
    private v: string;

    protected _parse(): void {
        this.bizEntity = this.ts.passVar();
        this.ts.passToken(Token.DOT);
        this.bud = this.ts.passVar();
        this.ts.passKey('of');
        this.element.obj = this.context.parse(ValueExpression);
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.v = this.ts.lowerVar;
            this.ts.readToken();
            return;
        }
        switch (this.ts.token) {
            default: this.ts.expectToken(Token.ADDEQU, Token.SUBEQU); break;
            case Token.EQU: this.element.setEqu = SetEqu.equ; break;
            case Token.ADDEQU: this.element.setEqu = SetEqu.add; break;
            case Token.SUBEQU: this.element.setEqu = SetEqu.sub; break;
        }
        this.ts.readToken();
        this.element.value = this.context.parse(ValueExpression);
        if (this.ts.isKeyword('ref') === true) {
            this.ts.readToken();
            this.element.ref = this.context.parse(ValueExpression);
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { value: delta, ref, obj, setEqu } = this.element;
        let entity = space.uq.biz.bizEntities.get(this.bizEntity);
        if (entity === undefined) {
            this.log(`'${this.bizEntity}' is not a Biz Entity`);
            ok = false;
            return ok;
        }
        let bud = entity.getBud(this.bud);
        if (bud === undefined) {
            this.log(`'${this.bizEntity}.${this.bud}' not defined`);
            ok = false;
        }
        else {
            this.element.bud = bud;
            let { dataType, hasHistory } = bud;
            if (setEqu === SetEqu.add || setEqu === SetEqu.sub) {
                if (dataType !== BudDataType.int && dataType !== BudDataType.dec) {
                    this.log('only int or dec support += or -=');
                    ok = false;
                }
            }
            if (ref !== undefined) {
                if (hasHistory !== true) {
                    this.log(`'${this.bizEntity}.${this.bud}' not support HISTORY`)
                    ok = false;
                }

            }
        }
        if (delta !== undefined) {
            if (delta.pelement.scan(space) === false) ok = false;
        }
        if (ref !== undefined) {
            if (ref.pelement.scan(space) === false) ok = false;
        }
        if (obj !== undefined) {
            if (obj.pelement.scan(space) === false) ok = false;
        }
        if (this.v !== undefined) {
            let vp = space.varPointer(this.v, false) as VarPointer;
            if (vp === undefined) {
                this.log(`变量 ${this.v} 没有定义`);
                ok = false;
            }
            let v = new Var(this.v, undefined, undefined);
            v.pointer = vp;
            this.element.toVar = v;
            return;
        }
        return ok;
    }
}