import { BigInt, BizField, BizFor, BizForIdCol, BizSelectStatement, Dec, EnumAsc, Field, Pointer, ValueExpression, Var, VarPointer, createDataType } from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { BizSelectStatementSpace, PBizSelectStatement } from "./BizSelectStatement";
import { BizFieldSpace } from "../../../il/BizField";

export class PBizFor extends PBizSelectStatement<BizFor> {
    private readonly ids: Map<string, [string, EnumAsc]> = new Map();
    protected createFromSpace(space: Space): BizSelectStatementSpace<BizSelectStatement> {
        return new BizForSpace(space, this.element);
    }
    protected _parse(): void {
        let { values } = this.element;
        this.ts.passToken(Token.LPARENTHESE);
        this.ts.passKey('id');
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            let v = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let t = this.ts.passVar();
            if (this.ids.has(v) === true) {
                this.ts.error(`duplicate name ${v}`);
            }
            let asc: EnumAsc;
            if (this.ts.token === Token.VAR) {
                if (this.ts.varBrace === false) {
                    switch (this.ts.lowerVar) {
                        default: this.ts.expect('asc', 'desc'); break;
                        case 'asc': asc = EnumAsc.asc; break;
                        case 'desc': asc = EnumAsc.desc; break;
                    }
                    this.ts.readToken();
                }
            }
            else {
                asc = EnumAsc.asc;
            }
            this.ids.set(v, [t, asc]);
            if (this.ts.token !== Token.COMMA) {
                this.ts.passToken(Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
        }

        this.ts.passKey('value');
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            let v = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            values.set(v, val);
            if (this.ts.token !== Token.COMMA as any) {
                this.ts.passToken(Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
        }
        if (this.ts.isKeyword('from') === true) {
            this.ts.readToken();
            this.parseFromEntity(this.pFromEntity);
        }
        this.parseWhere();
        this.ts.passToken(Token.RPARENTHESE);
        let statement = this.element.statements = this.context.createStatements(this.element);
        statement.level = this.element.level;
        let parser = statement.parser(this.context);
        parser.parse();
    }

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        const { ids, values, statements, vars } = this.element;
        let theSpace = new BizForSpace(space, this.element);
        for (let [n, [v, asc]] of this.ids) {
            let fromEntity = theSpace.getBizFromEntityArrFromAlias(v);
            if (fromEntity === undefined) {
                ok = false;
                this.log(`${v} not defined`);
                continue;
            }
            vars[n] = new Var(n, new BigInt());
            let idCol: BizForIdCol = {
                name: n,
                fromEntity,
                asc,
            }
            ids.set(n, idCol);
        }
        for (let [n, val] of values) {
            if (ids.has(n) === true) {
                ok = false;
                this.log(`duplicate name ${n}`);
                continue;
            }
            if (val.pelement.scan(theSpace) === false) {
                ok = false;
                continue;
            }
            vars[n] = new Var(n, new Dec(18, 6));
        }
        for (let i in vars) {
            let vr = vars[i];
            let vp = vr.pointer = new VarPointer();
            let no = theSpace.getVarNo();
            vp.no = no;
            theSpace.setVarNo(no + 1);
        }
        if (statements.pelement.scan(theSpace) === false) {
            ok = false;
        }
        return ok;
    }
}

export class BizForSpace extends BizSelectStatementSpace<BizFor> {
    get inLoop(): boolean { return true; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let { vars } = this.from;
        let vr = vars[name];
        if (vr === undefined) return;
        return vr.pointer;
    }

    protected createBizFieldSpace(from: BizFor): BizFieldSpace {
        return new BizForFieldSpace();
    }

    protected override _getBizFromEntityFromAlias(name: string) {
        return this.from.getBizFromEntityFromAlias(name);
    }
}

export class BizForFieldSpace extends BizFieldSpace {
    protected buildBizFieldFromDuo(n0: string, n1: string): BizField {
        throw new Error("Method not implemented.");
    }
}
