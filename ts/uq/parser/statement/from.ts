import { BizEntity, BizPhraseType, CompareExpression, FromStatement, ValueExpression } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PStatement } from "./statement";

export class PFromStatement extends PStatement<FromStatement> {
    private readonly tbls: string[] = [];
    protected _parse(): void {
        for (; ;) {
            this.tbls.push(this.ts.passVar());
            if (this.ts.token === Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
        this.ts.passKey('id');
        if (this.ts.isKeyword('asc') === true) {
            this.element.asc = 'asc';
        }
        else if (this.ts.isKeyword('desc') === true) {
            this.element.asc = 'desc';
        }
        else {
            this.ts.expect('ASC', 'DESC');
        }
        this.ts.readToken();
        this.ts.passKey('column');
        for (; ;) {
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.ts.passKey('as');
            let name = this.ts.passVar();
            this.element.cols.push({ name, val });
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        let entityArr: BizEntity[] = [];
        for (let tbl of this.tbls) {
            let entity = space.getBizEntity(tbl);
            if (entity === undefined) {
                this.log(`${tbl} is not defined`);
                ok = false;
            }
            else {
                entityArr.push(entity);
            }
        }
        let { length } = entityArr;
        if (length > 0) {
            let entity = entityArr[0];
            const { bizPhraseType } = entity;
            for (let i = 1; i < length; i++) {
                let ent = entityArr[i];
                if (ent.bizPhraseType !== bizPhraseType) {
                    this.log(`${entityArr.map(v => v.getJName()).join(', ')} must be the same type`);
                    ok = false;
                }
            }
            this.element.bizPhraseType = bizPhraseType;
            this.element.tbls = entityArr;
            switch (bizPhraseType) {
                default:
                    this.log(`FROM can only be one of ATOM, SPEC, BIN, SHEET, PEND`);
                    ok = false;
                    break;
                case BizPhraseType.atom:
                case BizPhraseType.spec:
                case BizPhraseType.bin:
                case BizPhraseType.sheet:
                case BizPhraseType.pend:
                    break;
            }
        }

        const { where } = this.element;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) {
                ok = false;
            }
        }
        for (let { val } of this.element.cols) {
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
