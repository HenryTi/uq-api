import { BBizEntity, DbContext } from "../../builder";
import { BBizQuery } from "../../builder/Biz/BizQuery";
import { PContext, PElement } from "../../parser";
import { PBizQueryTable, PBizQueryTableStatements, PBizQueryValue, PBizQueryValueStatements } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../IElement";
import { FromStatement, Statement, Statements } from "../statement";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

export abstract class BizQuery extends BizEntity {
    readonly bizPhraseType = BizPhraseType.query;
    statement: Statements;
    abstract hasParam(name: string): boolean;
}

export class BizQueryValue extends BizQuery {
    protected readonly fields = [];
    on: string[];
    get type() { return 'queryvalue'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryValue(this, context);
    }
    hasParam(name: string): boolean {
        if (this.on === undefined) return false;
        return this.on.includes(name);
    }
}

export class BizQueryValueStatements extends Statements {
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryValueStatements(this, context);
    }
    db(db: Builder): object {
        return;
    }
}

export class BizQueryTable extends BizQuery {
    protected readonly fields = [];
    readonly params: BizBudValue[] = [];
    from: FromStatement;
    get type() { return 'query'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTable(this, context);
    }
    hasParam(name: string): boolean {
        let index = this.params.findIndex(v => v.name === name);
        return index >= 0;
    }
    hasReturn(prop: string): boolean {
        let { cols } = this.from;
        return (cols.findIndex(v => v.name === prop) >= 0);
    }
    db(dbContext: DbContext): BBizEntity {
        return new BBizQuery(dbContext, this);
    }
    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        const { asc, ban, cols } = this.from;
        ret.asc = asc;
        if (ban !== undefined) {
            ret.ban = ban.caption ?? true;
        }
        ret.params = this.params.map(v => v.buildSchema(res));
        ret.cols = cols.map(v => {
            const { field } = v;
            return field.buildSchema();
        });
        return ret;
    }
}

export class BizQueryTableStatements extends Statements {
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTableStatements(this, context);
    }
    db(db: Builder): object {
        return;
    }
}
