import { PContext, PElement } from "../../parser";
import { PBizQueryTable, PBizQueryTableStatements, PBizQueryValue, PBizQueryValueStatements } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../element";
import { FromStatement, Statements } from "../statement";
import { BizBase, BizPhraseType } from "./Base";
import { BizBudValue } from "./Bud";

export abstract class BizQuery extends BizBase {
    readonly bizPhraseType = BizPhraseType.query;
    statement: Statements;
    abstract hasName(name: string): boolean;
}

export class BizQueryValue extends BizQuery {
    on: string[];
    get type() { return 'queryvalue'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryValue(this, context);
    }
    hasName(name: string): boolean {
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
    readonly params: { [name: string]: BizBudValue } = {};
    from: FromStatement;
    get type() { return 'queryvalue'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTable(this, context);
    }
    hasName(name: string): boolean {
        return this.params[name] !== undefined;
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
