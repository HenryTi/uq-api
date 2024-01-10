import { BizBudValue, BizIn, BizInOut, BizOut, BudDataType, Statements, Statement, BizInAct, BizInActStatement } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizActStatements, PBizEntity } from "./Base";

abstract class PBizInOut<T extends BizInOut> extends PBizEntity<T> {
    private parseProps(): BizBudValue[] {
        let budArr: BizBudValue[] = [];
        let name: string;
        if (this.ts.token === Token.VAR) {
            name = this.ts.passVar();
        }
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                let bud = this.parseSubItem();
                this.ts.passToken(Token.SEMICOLON);
                this.checkBudType(bud);
                const { name: budName } = bud;
                if (budArr.findIndex(v => v.name === name) >= 0) {
                    this.ts.error(`duplicate ${budName}`)
                }
                budArr.push(bud);
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    this.ts.mayPassToken(Token.SEMICOLON);
                    break;
                }
            }
        }
        else {
            if (name === undefined) {
                this.ts.expectToken(Token.LBRACE);
            }
            let ui = this.parseUI();
            let bizBud = this.parseBud(name, ui);
            this.checkBudType(bizBud);
            this.ts.passToken(Token.SEMICOLON);
            budArr.push(bizBud);
        }
        return budArr;
    }

    private checkBudType(bud: BizBudValue) {
        const types: BudDataType[] = [BudDataType.int, BudDataType.char, BudDataType.date, BudDataType.dec];
        if (types.indexOf(bud.dataType) < 0) {
            this.ts.error(`IN and OUT support only ${types.map(v => BudDataType[v]).join(', ')}`);
        }
    }

    private parsePropMap(props: Map<string, BizBudValue>) {
        let propArr = this.parseProps();
        for (let p of propArr) {
            let { name } = p;
            if (props.has(name) === true) {
                this.ts.error(`duplicate ${name}`);
            }
            props.set(name, p);
        }
    }

    private parseActObj(): BizInAct {
        this.ts.passToken(Token.LBRACE);
        this.ts.passToken(Token.RBRACE);
        this.ts.mayPassToken(Token.SEMICOLON);
        return;
    }

    protected parseInOutProp = () => {
        this.parsePropMap(this.element.props);
    }

    protected parseArr = () => {
        let name = this.ts.passVar();
        let props = new Map<string, BizBudValue>();
        let act: BizInAct;
        this.ts.passToken(Token.LBRACE);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) {
                this.ts.readToken();
                this.ts.mayPassToken(Token.SEMICOLON);
                break;
            }
            let v = this.ts.passKey();
            switch (v) {
                default:
                    this.ts.expect('prop', 'act');
                    break;
                case 'prop':
                    this.parsePropMap(props);
                    break;
                case 'act':
                    this.parseAct();
                    break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
        }
        if (props.size === 0) {
            this.ts.error('no prop defined in ARR');
        }
        let { arrs } = this.element;
        arrs[name] = {
            name,
            props,
            act,
        }
    }

    protected parseAct = () => {
        this.element.act = this.parseActObj();
    }

    override scan(space: Space): boolean {
        if (super.scan(space) === false) return false;
        let ok = true;
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
    readonly keyColl = {
        prop: this.parseInOutProp,
        arr: this.parseArr,
        act: this.parseAct,
    };
}

export class PBizOut extends PBizInOut<BizOut> {
    readonly keyColl = {
        prop: this.parseInOutProp,
        arr: this.parseArr,
    };
}

export class PBizInActStatements extends PBizActStatements<BizInAct> {
    scan0(space: Space): boolean {
        return super.scan0(space);
    }
    protected statementFromKey(parent: Statement, key: string): Statement {
        let ret: Statement;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new BizInActStatement(parent, this.bizAct);
                break;
        }
        if (ret !== undefined) ret.inSheet = true;
        return ret;
    }
}
