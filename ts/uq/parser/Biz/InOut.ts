import { BizBudValue, BizIn, BizInOut, BizOut, BudDataType, Statements, Statement, BizInAct, BizStatementIn, BizInActStatements, Pointer, BizEntity, VarPointer } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizAct, PBizActStatements, PBizEntity } from "./Base";
import { BizEntitySpace } from "./Biz";

abstract class PBizInOut<T extends BizInOut> extends PBizEntity<T> {
    readonly keyColl = {};

    private parseProps(): BizBudValue[] {
        let budArr: BizBudValue[] = [];
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            let bud = this.parseSubItem();
            this.checkBudType(bud);
            budArr.push(bud);
            let { token } = this.ts;
            if (token === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
            }
            else if (token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        return budArr;
    }

    private checkBudType(bud: BizBudValue) {
        const types: BudDataType[] = [BudDataType.int, BudDataType.char, BudDataType.date, BudDataType.dec];
        if (types.indexOf(bud.dataType) < 0) {
            this.ts.error(`IN and OUT support only ${types.map(v => BudDataType[v]).join(', ')}`);
        }
    }

    protected override parseParam(): void {
        const { arrs, props } = this.element;
        let propArr = this.parseProps();
        this.parsePropMap(props, propArr);
        for (; this.ts.isKeyword('arr') === true;) {
            this.ts.readToken();
            let name = this.ts.passVar();
            propArr = this.parseProps();
            let map = new Map<string, BizBudValue>();
            this.parsePropMap(map, propArr);
            arrs[name] = {
                name,
                props: map,
            }
        }
    }

    protected override parseBody(): void {
    }

    private parsePropMap(map: Map<string, BizBudValue>, propArr: BizBudValue[]) {
        for (let p of propArr) {
            let { name } = p;
            if (map.has(name) === true) {
                this.ts.error(`duplicate ${name}`);
            }
            map.set(name, p);
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        const { props, arrs } = this.element;
        for (let i in arrs) {
            let arr = arrs[i];
            let { name, props: arrProps } = arr;
            if (props.has(name) === true) {
                this.log(`ARR '${name}' duplicate prop name`);
                ok = false;
            }
            for (let [propName,] of arrProps) {
                if (props.has(propName) === true) {
                    this.log(`ARR prop '${name}' duplicate main prop name`);
                    ok = false;
                }
            }
        }
        return ok;
    }
}

export class PBizIn extends PBizInOut<BizIn> {
    protected override parseBody(): void {
        if (this.ts.token !== Token.LBRACE) {
            this.ts.expectToken(Token.LBRACE);
        }
        let bizAct = new BizInAct(this.element.biz, this.element);
        this.context.parseElement(bizAct);
        this.element.act = bizAct;
    }
    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { act } = this.element;
        if (act.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

export class PBizOut extends PBizInOut<BizOut> {
    protected override parseBody(): void {
        this.ts.passToken(Token.SEMICOLON);
    }
}

export class PBizInAct extends PBizAct<BizInAct> {
    protected override createBizActStatements(): Statements {
        return new BizInActStatements(undefined, this.element);
    }

    protected override createBizActSpace(space: Space): Space {
        return new BizInActSpace(space, this.element.bizIn);
    }
    /*
    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { statement } = this.element;
        if (statement.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
    */
}

export class PBizInActStatements extends PBizActStatements<BizInAct> {
    protected override createBizActStatement(parent: Statement): Statement {
        return new BizStatementIn(parent, this.bizAct);
    }
}

export const inPreDefined = [
];

class BizInActSpace extends BizEntitySpace<BizIn> {
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (inPreDefined.indexOf(name) >= 0) {
            return new VarPointer();
        }
    }

    protected _varsPointer(names: string[]): [Pointer, string] {
        return undefined;
    }

    protected override _getBizEntity(name: string): BizEntity {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                return;
        }
    }
}
