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
/*
export abstract class PBizSelect<T extends BizSelect> extends PElement<T> {
    protected from: From;
    protected parseFrom() {
        let main: Tbl = this.parseTbl();
        let joins: Join[] = this.parseJoins();
        this.from = {
            main,
            joins,
        }
    }

    private parseTbl(): Tbl {
        let entityArr: string[] = [];
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                entityArr.push(this.ts.passVar());
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                }
            }
        }
        else {
            entityArr.push(this.ts.passVar());
        }
        let alias: string;
        if (this.ts.token === Token.SubGT || this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            alias = this.ts.passVar();
        }
        return {
            entityArr,
            alias,
        }
    }

    private parseJoin(): Join {
        let joinType: BizSelectJoinType;
        if (this.ts.token === Token.XOR) {
            joinType = '^';
        }
        else if (this.ts.isKeyword('x') === true) {
            joinType = 'x';
        }
        else if (this.ts.isKeyword('i') === true) {
            joinType = 'i';
        }
        else {
            return;
        }
        let tbl = this.parseTbl();
        return { joinType, tbl };
    }

    private parseJoins(): Join[] {
        let joins: Join[] = [];
        for (; ;) {
            let join = this.parseJoin();
            if (join === undefined) break;
            joins.push(join);
        }
        if (joins.length === 0) return;
        return joins;
    }

    protected parseColumn() {
        if (this.ts.token === Token.Exclamation) {
            this.ts.readToken();
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.element.column = {
                alias: undefined,
                val,
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let from = this.scanFrom(space);
        if (from === undefined) {
            ok = false;
        }
        else {
            this.element.from = from;
        }
        let { column } = this.element;
        if (column !== undefined) {
            if (column.val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    protected scanFrom(space: Space): BizSelectFrom {
        let ok = true;
        let { joins } = this.from;
        let main = this.scanTbl(space, this.from.main);
        if (main === undefined) {
            ok = false;
        }
        let bsJoins: BizSelectJoin[];
        if (joins !== undefined) {
            bsJoins = [];
            for (let join of joins) {
                let bsJoin = this.scanJoin(space, join);
                if (bsJoin === undefined) {
                    ok = false;
                }
                else {
                    bsJoins.push(bsJoin);
                }
            }
        }
        if (ok === false) return;
        return {
            main,
            joins: bsJoins,
        };
    }

    protected scanTbl(space: Space, tbl: Tbl): BizSelectTbl {
        let ok = true;
        const { entityArr, alias } = tbl;
        const bizEntityArr: BizEntity[] = [];
        for (let entity of entityArr) {
            let bizEntity = space.getBizEntity(entity);
            if (bizEntity === undefined) {
                this.log(`${entity} is not defined`);
                ok = false;
            }
            // this.element.entity = entity;
            bizEntityArr.push(bizEntity);
        }
        if (ok === false) return;
        return {
            entityArr: bizEntityArr,
            alias,
        };
    }

    protected scanJoin(space: Space, join: Join): BizSelectJoin {
        let tbl = this.scanTbl(space, join.tbl);
        if (tbl === undefined) return undefined;
        return {
            joinType: join.joinType,
            tbl,
        };
    }
}

export class PBizSelectOperand extends PElement<BizSelectOperand> {
    protected _parse(): void {
        this.element.select = new BizSelectInline();
        const { select } = this.element;
        this.context.parseElement(select);
    }

    scan(space: Space): boolean {
        let ok = true;
        const { select } = this.element;
        if (select.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
*/
/*
export class PBizSelectInline extends PBizSelect<BizSelectInline> {
    protected _parse(): void {
        this.parseFrom();
        this.ts.passToken(Token.AT);
        this.element.on = new ValueExpression();
        const { on } = this.element;
        this.context.parseElement(on);
        this.parseColumn();
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }

        let expValue = new ValueExpression();
        let one = new VarOperand();
        one._var = ['i'];
        expValue.atoms.push(one);
        let { on } = this.element;
        if (on !== undefined && on.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
*/
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
