import { Space } from '../space';
import {
    BizDetailActStatement, BizDetailActSubPend, BizDetailActSubStatement
    , BizDetailActSubTab, BizPend, ValueExpression
    , SetEqu, BudDataType
} from '../../il';
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
        bud: BizDetailActSubTab,
        tab: BizDetailActSubTab,
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
    private pend: string;

    protected _parse(): void {
        let setEqu: SetEqu;
        if (this.ts.token === Token.VAR) {
            this.pend = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            setEqu = SetEqu.equ;
        }
        else {
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.EQU, Token.ADDEQU, Token.SUBEQU);
                    break;
                case Token.EQU: setEqu = SetEqu.equ; break;
                case Token.ADDEQU: setEqu = SetEqu.add; break;
                case Token.SUBEQU: setEqu = SetEqu.sub; break;
            }
            this.ts.readToken();
        }
        this.element.setEqu = setEqu;
        this.element.val = this.context.parse(ValueExpression);
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
        let { val, bizStatement: { bizDetailAct } } = this.element;

        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend === undefined) {
                ok = false;
            }
            else {
                this.element.pend = pend;
            }
        }
        else {
            const { bizDetail } = bizDetailAct;
            if (bizDetail.pend === undefined) {
                this.log(`Biz Pend = can not be used here when ${bizDetail.jName} has no PEND`);
                ok = false;
            }
        }

        if (val !== undefined) {
            if (val.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}

export class PBizDetailActSubTab extends PElement<BizDetailActSubTab> {
    private buds: string[];
    private v: string;

    protected _parse(): void {
        this.buds = [];
        for (; ;) {
            this.buds.push(this.ts.passVar());
            if (this.ts.token !== Token.DOT) break;
            this.ts.readToken();
        }
        this.ts.passKey('of');
        this.element.of = this.context.parse(ValueExpression);
        switch (this.ts.token) {
            default: this.ts.expectToken(Token.ADDEQU, Token.SUBEQU); break;
            case Token.EQU: this.element.setEqu = SetEqu.equ; break;
            case Token.ADDEQU: this.element.setEqu = SetEqu.add; break;
            case Token.SUBEQU: this.element.setEqu = SetEqu.sub; break;
        }
        this.ts.readToken();
        this.element.val = this.context.parse(ValueExpression);
    }

    scan(space: Space): boolean {
        let ok = true;
        let { val, of, setEqu } = this.element;
        let len = this.buds.length;
        let buds0 = this.buds[0];
        let entity = space.uq.biz.bizEntities.get(buds0);
        if (entity === undefined) {
            this.log(`'${buds0}' is not a Biz Entity`);
            ok = false;
            return ok;
        }
        if (len !== 2) {
            this.log(`'There must be a bud of ${buds0}`);
            ok = false;
            return ok;
        }
        let buds1 = this.buds[1];
        let bud = entity.getBud(buds1);
        if (bud === undefined) {
            this.log(`'${buds0}.${buds1}' not defined`);
            ok = false;
            return ok;
        }
        this.element.entity = entity;
        this.element.bud = bud;
        let { dataType } = bud;
        if (setEqu === SetEqu.add || setEqu === SetEqu.sub) {
            if (dataType !== BudDataType.int && dataType !== BudDataType.dec) {
                this.log('only int or dec support += or -=');
                ok = false;
            }
        }
        if (val !== undefined) {
            if (val.pelement.scan(space) === false) ok = false;
        }
        if (of !== undefined) {
            if (of.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}