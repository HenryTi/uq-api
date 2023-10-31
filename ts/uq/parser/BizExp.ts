import {
    BizPhraseType
    , ValueExpression, BizSelectJoinType
    , BizExp, BizExpOperand, BizAtom
    , BizAtomSpec, BizBin, BizTitle
} from "../il";
import { PElement } from "./element";
import { Space } from "./space";
import { Token } from "./tokens";

interface Tbl {
    entityArr: string[];
    alias: string;
}

interface Join {
    joinType: BizSelectJoinType;
    tbl: Tbl;
}

interface From {
    main: Tbl;
    joins: Join[];
}

export class PBizExpOperand extends PElement<BizExpOperand> {
    protected _parse(): void {
        this.element.bizExp = new BizExp();
        const { bizExp } = this.element;
        this.context.parseElement(bizExp);
    }

    scan(space: Space): boolean {
        let ok = true;
        const { bizExp } = this.element;
        if (bizExp.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

// (#Entity.Bud(id).^|Prop IN timeSpan +- delta)
export class PBizExp extends PElement<BizExp> {
    private bizEntity: string;
    private bud: string;
    protected _parse(): void {
        this.bizEntity = this.ts.passVar();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.bud = this.ts.passVar();
        }
        this.ts.passToken(Token.LPARENTHESE);
        this.element.param = new ValueExpression();
        let { param } = this.element;
        this.context.parseElement(param);
        this.ts.passToken(Token.RPARENTHESE);
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            if (this.ts.token === Token.XOR as any) {
                this.element.prop = 'base';
                this.ts.readToken();
            }
            else {
                this.element.prop = this.ts.passVar();
            }
        }
        if (this.ts.isKeyword('in') === true) {
            this.ts.readToken();
            let timeSpan = this.ts.passVar();
            let op: '+' | '-';
            let val: ValueExpression;
            switch (this.ts.token) {
                case Token.SUB: op = '-'; break;
                case Token.ADD: op = '+'; break;
            }
            if (op !== undefined) {
                this.ts.readToken();
                val = new ValueExpression();
                this.context.parseElement(val);
            }
            this.element.in = {
                varTimeSpan: timeSpan,
                op,
                val,
                statementNo: undefined,
                spanPeiod: undefined,
            };
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        this.element.bizEntity = space.getBizEntity(this.bizEntity);
        const { bizEntity, in: varIn, param } = this.element;
        if (param.pelement.scan(space) === false) {
            ok = false;
        }
        if (bizEntity === undefined) {
            this.log(`${this.bizEntity} is not a Biz Entity`);
            ok = false;
        }
        else {
            let ret: boolean;
            switch (bizEntity.bizPhraseType) {
                default:
                    ok = false;
                    this.log(`${bizEntity.jName} must be either Atom, Spec, Bin or Title`);
                    break;
                case BizPhraseType.atom: ret = this.scanAtom(space); break;
                case BizPhraseType.spec: ret = this.scanSpec(space); break;
                case BizPhraseType.bin: ret = this.scanBin(space); break;
                case BizPhraseType.title: ret = this.scanTitle(space); break;
            }
            if (ret === false) {
                ok = false;
            }
        }
        if (varIn !== undefined) {
            // scan BizExp.in
            const { varTimeSpan: timeSpan, val } = varIn;
            let { statementNo, obj: spanPeiod } = space.getUse(timeSpan);
            if (statementNo === undefined) {
                this.log(`${timeSpan} is not used`);
                ok = false;
            }
            varIn.spanPeiod = spanPeiod;
            varIn.statementNo = statementNo;
            if (val !== undefined) {
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }

    private scanAtom(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop } = this.element;
        let bizAtom = bizEntity as BizAtom;
        if (this.bud !== undefined) {
            this.log(`ATOM ${bizEntity.jName} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            if (bizAtom.okToDefineNewName(prop) === false) {
                this.log(`${bizAtom.jName} does not have prop ${prop}`);
                ok = false;
            }
        }
        return ok;
    }

    private scanSpec(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop } = this.element;
        let bizSpec = bizEntity as BizAtomSpec;
        if (this.bud !== undefined) {
            this.log(`SPEC ${bizEntity.jName} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            if (bizSpec.okToDefineNewName(prop) === false) {
                this.log(`${bizSpec.jName} does not have prop ${prop}`);
                ok = false;
            }
        }
        return ok;
    }

    private scanBin(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop } = this.element;
        let bizBin = bizEntity as BizBin;
        if (this.bud !== undefined) {
            this.log(`BIN ${bizEntity.jName} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            const arr = ['i', 'x', 'price', 'amount', 'value'];
            if (arr.includes(prop) === false || bizBin.okToDefineNewName(prop) === false) {
                this.log(`${bizBin.jName} does not have prop ${prop}`);
                ok = false;
            }
        }
        return ok;
    }

    private scanTitle(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop, in: inVar } = this.element;
        let title = bizEntity as BizTitle;
        if (this.bud === undefined) {
            this.log(`TITLE ${title.jName} should follow .`);
            ok = false;
        }
        else {
            let bud = title.props.get(this.bud);
            if (bud === undefined) {
                this.log(`TITLE ${title.getJName()} does not have ${this.bud} .`);
                ok = false;
            }
            else {
                this.element.bud = bud;
            }
        }
        if (prop === undefined) {
            this.element.prop = 'value';
        }
        else {
            const arr = ['value', 'count', 'sum', 'avg', 'average', 'max', 'min'];
            if (arr.includes(prop) === false) {
                this.log(`Title does not have function ${prop}`);
            }
        }
        return ok;
    }
}
