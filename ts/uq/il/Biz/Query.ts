import { BBizEntity, DbContext } from "../../builder";
import { BBizQuery } from "../../builder/Biz/BizQuery";
import { PContext, PElement } from "../../parser";
import { PBizQueryTable, PBizQueryTableStatements, PBizQueryValue, PBizQueryValueStatements } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../element";
import { FromStatement, Statements } from "../statement";
import { BizPhraseType } from "./Base";
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
    db(dbContext: DbContext): BBizEntity {
        return new BBizQuery(dbContext, this);
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
