import { PContext, PElement } from "../../parser";
import { PBizQueryTable, PBizQueryValue, PBizQueryValueStatements } from "../../parser/Biz/Query";
import { Builder } from "../builder";
import { IElement } from "../element";
import { Statements } from "../statement";
import { Biz } from "./Biz";

export abstract class BizQuery extends IElement {
    readonly biz: Biz;
    statement: Statements;
    constructor(biz: Biz) {
        super();
        this.biz = biz;
    }
}

export class BizQueryValue extends BizQuery {
    readonly type = 'queryvalue';
    on: string[];
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryValue(this, context);
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
    readonly type = 'queryvalue';
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTable(this, context);
    }
}

export class BizQueryTableStatements extends Statements {
    parser(context: PContext): PElement<IElement> {
        throw new Error("Method not implemented.");
    }
    db(db: Builder): object {
        return;
    }
}
