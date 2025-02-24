import {
    Statement, BizBudValue
    , BizEntity, BizQueryTableStatements, FromStatementInPend,
    BizFieldSpace,
    BizPendQueryFieldSpace,
    Pointer,
    NamePointer,
    BizField
} from "../../il";
import { BizPend, BizQueryTableInPendStatements, PendQuery, PendValueType } from "../../il/Biz/Pend";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";
import { BizEntitySpace } from "./Biz";
import { PBizBudValue } from "./Bud";
import { PBizQueryTable, PBizQueryTableStatements } from "./Query";

export class PBizPend extends PBizEntity<BizPend> {
    private keys: string[];
    private parsePredefined(name: string) {
        let caption = this.ts.mayPassString();
        this.element.predefinedFields.push(name);
        let bud = this.element.predefinedBuds[name];
        if (bud === undefined) debugger;
        // 有caption值，才会显示
        bud.ui = { caption: caption ?? name };
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseQuery = () => {
        this.element.pendQuery = new PendQuery(this.element);
        let { pendQuery } = this.element;
        this.context.parseElement(pendQuery);
    }

    private parseI = () => {
        if (this.element.i !== undefined) {
            this.ts.error(`I can only be defined once in Biz Pend`);
        }
        this.element.i = this.parseBudAtom('i');
    }

    private parseX = () => {
        if (this.element.x !== undefined) {
            this.ts.error(`X can only be defined once in Biz Pend`);
        }
        this.element.x = this.parseBudAtom('x');
    }

    private parseKeys = () => {
        this.keys = [];
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            this.keys.push(this.ts.passVar());
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseValue = () => {
        if (this.ts.token === Token.VAR) {
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect('BOOL', 'DEC');
                    break;
                case 'dec':
                    this.ts.readToken();
                    break;
                case 'bool':
                    this.element.valueType = PendValueType.bool;
                    this.ts.readToken();
                    break;
            }
        }
    }

    readonly keyColl: { [key: string]: () => void } = (() => {
        let ret: { [key: string]: () => void } = {
            prop: this.parseProp,
            query: this.parseQuery,
            i: this.parseI,
            x: this.parseX,
            key: this.parseKeys,
            value: this.parseValue,
        };
        const setRet = (n: string) => {
            ret[n] = () => this.parsePredefined(n);
        }
        BizPend.predefinedId.forEach(setRet);
        BizPend.predefinedValue.forEach(setRet);
        return ret;
    })();

    protected override parseContent(): void {
        super.parseContent();
    }

    override scan0(space: Space): boolean {
        let ok = super.scan0(space);
        if (this.keys !== undefined) {
            this.element.keys = [];
            const { keys } = this.element;
            for (let key of this.keys) {
                let bud = this.element.getDefinedBud(key);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${key} is not defined in PEND`);
                }
                else {
                    keys.push(bud);
                }
            }
            if (keys.length < 2) {
                ok = false;
                this.log(`PEND key items count must be at least 2`);
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { props, pendQuery, i, x } = this.element;
        const predefines = [...BizPend.predefinedId, ...BizPend.predefinedValue];

        if (i !== undefined) {
            if (this.scanBud(space, i) === false) {
                ok = false;
            }
            if (i.value !== undefined) {
                this.log(`I can not =`);
                ok = false;
            }
        }
        else {
            this.log(`I must be defined`);
            ok = false;
        }
        if (x !== undefined) {
            if (this.scanBud(space, x) === false) {
                ok = false;
            }
            if (x.value !== undefined) {
                this.log(`X can not =`);
                ok = false;
            }
        }

        for (let [, bud] of props) {
            if (predefines.includes(bud.name) === true) {
                this.log(`Pend Prop name can not be one of these: ${predefines.join(', ')}`);
                ok = false;
            }
        }

        if (pendQuery !== undefined) {
            let pendSpace = new BizPendSpace(space, this.element);
            if (pendQuery.pelement.scan(pendSpace) === false) {
                ok = false;
            }
            for (let param of pendQuery.params) {
                const { name } = param;
                if (this.element.getBud(name) !== undefined) {
                    this.log(`${name} duplicate`);
                    ok = false;
                }
            }
        }
        return ok;
    }

    bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = super.bizEntityScan2(bizEntity);
        let { i, x } = this.element;
        function check2(bizBud: BizBudValue) {
            if (bizBud === undefined) return;
            let { pelement } = bizBud;
            if (pelement !== undefined) {
                if ((pelement as PBizBudValue<any>).bizEntityScan2(bizEntity) === false) ok = false;
            }
        }
        check2(i);
        check2(x);
        return ok;
    }
}

export class PPendQuery extends PBizQueryTable<PendQuery> {
    override parseHeader() {
    }

    protected createStatements(): BizQueryTableStatements {
        return new BizQueryTableInPendStatements(this.element);
    }
}

export class PBizQueryTableInPendStatements extends PBizQueryTableStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        let bizQueryTableInPendStatements = this.element as BizQueryTableInPendStatements;
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'from': return new FromStatementInPend(parent, bizQueryTableInPendStatements.pendQuery);
        }
    }
}

class BizPendSpace extends BizEntitySpace<BizPend> {
    protected readonly bizFieldSpace: BizFieldSpace;

    constructor(outer: Space, bizPend: BizPend) {
        super(outer, bizPend);
        this.bizFieldSpace = new BizPendQueryFieldSpace(bizPend);
    }
    /*
        protected override _getBizField(names: string[]): BizField {
            return this.bizFieldSpace.getBizField(names);
        }
    */
}
