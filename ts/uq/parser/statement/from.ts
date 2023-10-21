import { BizBud, BizBudNone, BizBudValue, BizEntity, BizPhraseType, CompareExpression, Entity, EnumSysTable, FromStatement, Pointer, Table, ValueExpression } from "../../il";
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
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            if (this.ts.token === Token.MOD) {
                const { peekToken, lowerVar } = this.ts.peekToken();
                if (peekToken !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                let val = new ValueExpression();
                this.context.parseElement(val);
                this.element.cols.push({ name: lowerVar, caption: null, val });
            }
            else {
                let name = this.ts.passVar();
                let caption = this.ts.mayPassString();
                this.ts.passToken(Token.EQU);
                let val = new ValueExpression();
                this.context.parseElement(val);
                this.element.cols.push({ name, caption, val });
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
            }
            else if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
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
        const { biz } = space.uq;
        space = new FromSpace(space, this.element);
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
            let bizEntity = entityArr[0];
            this.element.bizEntity0 = bizEntity;
            const { bizPhraseType } = bizEntity;
            for (let i = 1; i < length; i++) {
                let ent = entityArr[i];
                if (ent.bizPhraseType !== bizPhraseType) {
                    this.log(`${entityArr.map(v => v.getJName()).join(', ')} must be the same type`);
                    ok = false;
                }
            }
            this.element.bizPhraseType = bizPhraseType;
            let bizEntityTable: EnumSysTable;
            this.element.bizEntityArr = entityArr;
            switch (bizPhraseType) {
                default:
                    this.log(`FROM can only be one of ATOM, SPEC, BIN, SHEET, PEND`);
                    ok = false;
                    break;
                case BizPhraseType.atom:
                    bizEntityTable = EnumSysTable.atom; break;
                case BizPhraseType.spec:
                    bizEntityTable = EnumSysTable.spec; break;
                case BizPhraseType.bin:
                    bizEntityTable = EnumSysTable.bizBin; break;
                case BizPhraseType.sheet:
                    bizEntityTable = EnumSysTable.sheet; break;
                case BizPhraseType.pend:
                    bizEntityTable = EnumSysTable.pend; break;
            }
            this.element.bizEntityTable = bizEntityTable;
            if (bizEntity !== undefined) {
                for (let col of this.element.cols) {
                    const { name, caption, val } = col;
                    if (val.pelement.scan(space) === false) {
                        ok = false;
                    }
                    if (caption === null) {
                        // from entity bud
                        if (bizEntity.hasField(name) === false) {
                            let bud = this.element.getBud(name);
                            if (bud !== undefined) {
                                col.entity = bizEntity;
                                col.bud = bud;
                            }
                        }
                    }
                    else {
                        // Query bud
                        let bud = new BizBudNone(biz, name, caption);
                        col.bud = bud;
                    }
                }
            }
        }

        const { where } = this.element;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

class FromSpace extends Space {
    private readonly from: FromStatement;

    constructor(outer: Space, from: FromStatement) {
        super(outer);
        this.from = from;
    }

    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        return;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        return;
    }
    protected override _getBizFrom(): FromStatement {
        return this.from;
    }
}