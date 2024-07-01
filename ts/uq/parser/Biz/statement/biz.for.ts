import { BizField, BizFor, BizSelectStatement, Field, Pointer, ValueExpression, Var, VarPointer, createDataType } from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { BizSelectStatementSpace, PBizSelectStatement } from "./BizSelectStatement";
import { BizFieldSpace } from "../../../il/BizField";

export class PBizFor extends PBizSelectStatement<BizFor> {
    protected createFromSpace(space: Space): BizSelectStatementSpace<BizSelectStatement> {
        return new BizForSpace(space, this.element);
    }
    protected _parse(): void {
        let { forCols } = this.element;
        this.ts.passToken(Token.LPARENTHESE);
        this.ts.passKey('var');
        for (; ;) {
            let v = this.ts.passVar();
            let d = this.ts.passKey();
            let dataType = createDataType(d);
            this.context.parseElement(dataType);
            let vr = new Var(v, dataType);
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            forCols.push(vr);
            if (this.ts.token !== Token.COMMA) break;
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
        const { forCols, statements } = this.element;
        let theSpace = new BizForSpace(space, this.element);
        for (let v of forCols) {
            let vp = v.pointer = new VarPointer();
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
        let { forCols } = this.from;
        let vr = forCols.find(v => v.name === name);
        if (vr === undefined) return;
        return vr.pointer;
    }

    protected createBizFieldSpace(from: BizFor): BizFieldSpace {
        return new BizForFieldSpace();
    }
}

export class BizForFieldSpace extends BizFieldSpace {
    protected buildBizFieldFromDuo(n0: string, n1: string): BizField {
        throw new Error("Method not implemented.");
    }
}
