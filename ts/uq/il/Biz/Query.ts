import { BBizEntity, DbContext } from "../../builder";
import { BBizQuery } from "../../builder/Biz/BizQuery";
import { PContext, PElement } from "../../parser";
import { PBizQueryTable, PBizQueryTableStatements, PBizQueryValue, PBizQueryValueStatements } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../IElement";
import { Statements } from "../statement";
import { BizPhraseType } from "./BizPhraseType";
import { BizBud, BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";
import { FromEntity, FromStatement } from "./statement";

export abstract class BizQuery extends BizEntity {
    readonly bizPhraseType = BizPhraseType.query;
    statement: Statements;
    abstract hasParam(name: string): boolean;
}

export class BizQueryValue extends BizQuery {
    protected readonly fields = [];
    readonly isID = false;
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
    readonly isID = false;
    readonly params: BizBudValue[] = [];
    from: FromStatement;
    value: BizBud;
    get type() { return 'query'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTable(this, context);
    }
    hasParam(name: string): boolean {
        let index = this.params.findIndex(v => v.name === name);
        return index >= 0;
    }
    hasReturn(prop: string): boolean {
        let { cols, value } = this.from;
        let ret = (cols.findIndex(v => v.name === prop) >= 0);
        if (ret === true) return ret;
        if (prop === 'value' && value !== undefined) return true;
        return false;
    }
    db(dbContext: DbContext): BBizEntity {
        return new BBizQuery(dbContext, this);
    }
    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        const { ban, cols, fromEntity, ids, showIds, groupByBase } = this.from;
        ret.ids = ids.map(v => ({
            ui: v.ui,
            alias: v.fromEntity.alias,
            asc: v.asc,
        }));
        ret.showIds = showIds.map(v => ({
            ui: v.ui,
            alias: v.fromEntity.alias,
        }));
        if (ban !== undefined) {
            ret.ban = ban.caption ?? true;
        }
        if (groupByBase === true) {
            ret.groupByBase = true;
        }
        ret.params = this.params.map(v => v.buildSchema(res));
        let budCols = cols.filter(v => v.bud !== undefined);
        ret.cols = budCols.map(v => {
            const { bud } = v;
            const { entity } = bud;
            return [entity.id, bud.id];
        });
        ret.from = this.buildFromSchema(fromEntity);
        ret.value = this.value?.id;
        return ret;
    }

    private buildFromSchema(from: FromEntity) {
        const { bizEntityArr, bizPhraseType, subs, alias } = from;
        let subsSchema: any;
        if (subs !== undefined && subs.length > 0) {
            subsSchema = subs.map(v => this.buildFromSchema(v.fromEntity));
        }
        let ret = {
            arr: bizEntityArr.map(v => v.id),
            bizPhraseType,
            alias,
            subs: subsSchema,
        };
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
