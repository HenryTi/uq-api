import { Atom, BigInt, BizField, BizFor, BizForIdCol, BizSelectStatement, Dec, EnumAsc, Field, NumberOperand, Pointer, ValueExpression, Var, VarOperand, NamePointer, bizDecType, createDataType, VarPointer } from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { BizSelectStatementSpace, PBizSelectStatement } from "./BizSelectStatement";
import { BizFieldSpace } from "../../../il/BizField";

export class PBizFor extends PBizSelectStatement<BizFor> {
    private readonly ids: Map<string, string> = new Map();
    protected createFromSpace(space: Space): BizSelectStatementSpace<BizSelectStatement> {
        return new BizForSpace(space, this.element);
    }
    protected _parse(): void {
        let { values } = this.element;
        this.ts.passToken(Token.LPARENTHESE);
        this.ts.passKey('id');
        if (this.ts.isKeyword('group') === true) {
            this.element.isGroup = true;
            this.ts.readToken();
        }
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            let v = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let t = this.ts.passVar();
            if (this.ids.has(v) === true) {
                this.ts.error(`duplicate name ${v}`);
            }
            this.ids.set(v, t);
            if (this.ts.token !== Token.COMMA) {
                this.ts.passToken(Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
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
            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
        }
        if (this.ts.isKeyword('from') === true) {
            this.ts.readToken();
            this.parseFromEntity(this.pFromEntity);
        }
        this.parseWhere();
        this.parseOrder();
        if (this.ts.isKeyword('limit') === true) {
            this.ts.readToken();
            let limit: Atom;
            switch (this.ts.token) {
                default: this.expect('number or var');
                case Token.NUM:
                    limit = new NumberOperand(this.ts.dec);
                    this.ts.readToken();
                    break;
                case Token.VAR:
                    let v: VarOperand = new VarOperand();
                    limit = v;
                    v._var.push(this.ts.lowerVar);
                    this.ts.readToken();
                    this.context.parseElement(v);
                    break;
            }
            this.element.limit = limit;
        }
        this.ts.passToken(Token.RPARENTHESE);
        let statement = this.element.statements = this.context.createStatements(this.element);
        statement.level = this.element.level;
        let parser = statement.parser(this.context);
        parser.parse();
    }

    private parseOrder() {
        if (this.ts.isKeyword('order') === false) return;
        this.ts.readToken();
        this.ts.passKey('by');
        const { orderBys } = this.element;
        for (; ;) {
            let fieldName = this.ts.passVar();
            let asc: EnumAsc = EnumAsc.asc;
            if (this.ts.token === Token.VAR) {
                if (this.ts.varBrace === false) {
                    switch (this.ts.lowerVar) {
                        case 'asc': asc = EnumAsc.asc; this.ts.readToken(); break;
                        case 'desc': asc = EnumAsc.desc; this.ts.readToken(); break;
                    }
                }
            }
            orderBys.push({ fieldName, asc });
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
        }
    }

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        if (ok === false) return ok;
        const { ids, values, statements, vars, orderBys, limit } = this.element;
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
            }
            ids.set(n, idCol);
        }
        for (let [n, val] of values) {
            vars[n] = new Var(n, bizDecType);
            if (ids.has(n) === true) {
                ok = false;
                this.log(`duplicate name ${n}`);
                continue;
            }
            if (val.pelement.scan(theSpace) === false) {
                ok = false;
                continue;
            }
        }
        for (let i in vars) {
            let vr = vars[i];
            let vp = vr.pointer; //  = new VarPointer(vr);
            let no = theSpace.getVarNo();
            vp.no = no;
            theSpace.setVarNo(no + 1);
        }
        for (let { fieldName } of orderBys) {
            if (ids.has(fieldName) === true) continue;
            if (values.has(fieldName) === true) continue;
            ok = false;
            this.log(`${fieldName} is not defined`);
        }
        if (limit !== undefined) {
            const { pelement } = limit;
            if (pelement !== undefined) {
                if (pelement.scan(space) === false) {
                    ok = false;
                }
                else if (limit.type === 'var') {
                    let varLimit = limit as VarOperand;
                    let vp = varLimit.pointer as VarPointer;
                    switch (vp._var.dataType.type) {
                        default:
                            this.log('LIMIT only support int variable');
                            ok = false;
                            break;
                        case 'tinyint':
                        case 'smallint':
                        case 'int':
                        case 'bigint':
                            break;
                    }
                }
            }
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
        return;
        // throw new Error("Method not implemented.");
    }
}
