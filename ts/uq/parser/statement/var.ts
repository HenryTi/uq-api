import { VarStatement, ValueExpression, createDataType, Var, VarPointer, Select, Entity, Pointer, Table, FromTable, OpEQ, CompareExpression, VarOperand, OpParenthese } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PContext } from '../pContext';
import { PStatement } from './statement';

export class PVarStatement extends PStatement {
    _var: VarStatement;
    constructor(_var: VarStatement, context: PContext) {
        super(_var, context);
        this._var = _var;
    }

    protected _parse() {
        for (; ;) {
            if (this.ts.token !== Token.VAR) this.expect('变量名称');
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.expect('类型');
            }
            let dataType = createDataType(this.ts.lowerVar);
            if (dataType === undefined) {
                this.expect('类型');
            }
            this.ts.readToken();
            let parser = dataType.parser(this.context);
            parser.parse();
            let expression = undefined;
            let token = this.ts.token;
            if (token === Token.EQU as any) {
                this.ts.readToken();
                expression = new ValueExpression();
                parser = expression.parser(this.context);
                parser.parse();
                token = this.ts.token;
            }
            let v: Var = new Var(name, dataType, expression);
            this._var.vars.push(v);
            if (this.ts.isKeywords('from') === true) {
                let select = new Select();
                select.toVar = true;
                select.columns = this._var.vars.map(v => {
                    let { name, exp } = v;
                    return {
                        alias: name,
                        value: exp as ValueExpression,
                    }
                });
                this._var.select = select;
                this.context.parseElement(select);
                this.ts.passToken(Token.SEMICOLON);
                return;
            }
            switch (token as any) {
                case Token.COMMA:
                    this.ts.readToken();
                    continue;
                case Token.SEMICOLON:
                    this.ts.readToken();
                    return;
                default:
                    this.expectToken(Token.COMMA, Token.SEMICOLON);
                    return;
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { vars, select } = this._var;
        if (select !== undefined) {
            vars.forEach(v => {
                const { name, dataType } = v;
                const { pelement } = dataType;
                if (pelement !== undefined) {
                    if (pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                let p = space.varPointer(name, undefined);
                if (p !== undefined) {
                    this.log('重复定义变量 ' + name);
                    ok = false;
                }
                let vp = v.pointer = new VarPointer(name);
                let no = this._var.no; // space.getVarNo();
                vp.no = no;
                space.setVarNo(no + 1);
                let exp = v.exp;
                if (exp === undefined) return;
                // if (exp.pelement.scan(space) === false) ok = false;
            });
            let varSelectSpace = new VarSelectSpace(space, this._var);
            if (select.pelement.scan(varSelectSpace) === false) ok = false;
        }
        else {
            vars.forEach(v => {
                const { name, dataType } = v;
                const { pelement } = dataType;
                if (pelement !== undefined) {
                    if (pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                let p = space.varPointer(name, undefined);
                if (p !== undefined) {
                    this.log('重复定义变量 ' + name);
                    ok = false;
                }
                let vp = v.pointer = new VarPointer(name);
                let no = this._var.no; //space.getVarNo();
                vp.no = no;
                space.setVarNo(no + 1);
                let exp = v.exp;
                if (exp === undefined) return;
                if (exp.pelement.scan(space) === false) ok = false;
            });
        }
        return ok;
    }
}

class VarSelectSpace extends Space {
    readonly _var: VarStatement;
    constructor(outer: Space, _var: VarStatement) {
        super(outer);
        this._var = _var;
    }
    protected _getEntityTable(name: string): Entity & Table {
        return undefined;
    }
    protected _getTableByAlias(alias: string): Table {
        return undefined;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let v = this._var.getVar(name);
        if (v !== undefined) {
            return v.pointer;
        }
    }
}