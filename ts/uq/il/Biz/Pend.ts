import { BBizPend, DbContext } from "../../builder";
import { PBizPend, PBizQueryTableInPendStatements, PContext, PElement, PPendQuery } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../IElement";
import { Statements } from "../statement";
import { BizBin } from "./Bin";
import { Biz } from "./Biz";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue, BizBudID, BizBudDec, BizBud } from "./Bud";
import { BizID } from "./Entity";
import { BizQueryTable } from "./Query";

export enum PendValueType {
    dec,                // 用于普通流程
    bool,               // 审批流程
}

export class BizPend extends BizID {
    static predefinedId = ['si', 'sx', 's', 'sheet'];
    static predefinedValue = ['bin', 'value', 'price', 'amount', 'svalue', 'sprice', 'samount',];

    protected readonly fields = [...BizPend.predefinedId, ...BizPend.predefinedValue];
    readonly bizPhraseType = BizPhraseType.pend;
    readonly main = undefined;
    readonly predefinedBuds: { [name: string]: BizBudValue };
    readonly predefinedFields: string[] = [];
    readonly pendQueries: PendQuery[] = [];
    readonly bizBins: BizBin[] = [];
    valueType: PendValueType;
    i: BizBudID;
    x: BizBudID;
    keys: BizBud[];

    constructor(biz: Biz) {
        super(biz);
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new BizBudID(this, n, undefined);
        }
        for (let n of BizPend.predefinedValue) {
            this.predefinedBuds[n] = new BizBudDec(this, n, undefined);
        }
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizPend(this, context);
    }

    db(dbContext: DbContext): BBizPend {
        return new BBizPend(dbContext, this);
    }

    getPendQueryFromName(queryName: string): PendQuery {
        let qn = queryName ?? '$'
        return this.pendQueries.find(v => v.name === qn);
    }

    getBinBud(name: string): BizBud {
        for (let bizBin of this.bizBins) {
            let bud = bizBin.getBud(name);
            if (bud !== undefined) return bud;
        }
    }

    getSheetBud(name: string): BizBud {
        for (let bizBin of this.bizBins) {
            let bud = bizBin.getSheetMainBud(name);
            if (bud !== undefined) return bud;
        }
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let predefined: { [name: string]: any } = {};
        for (let i in this.predefinedBuds) {
            let bud = this.predefinedBuds[i];
            predefined[i] = bud.buildSchema(res);
        }
        ret.predefined = predefined;
        let queries: any[] = [];
        for (let pendQuery of this.pendQueries) {
            let { params, from } = pendQuery;
            const { cols, mainCols } = from;
            const query: any = {};
            query.params = params.map(v => v.buildSchema(res));
            query.cols = cols.map(v => {
                const bud = v.bud; // field.getBud();
                return bud?.buildSchema(res);
            });
            if (mainCols !== undefined) {
                query.mainCols = mainCols.map(v => v.bud.id);
            }
            queries.push(query);
        }
        ret.queries = queries;
        if (this.i !== undefined) ret.i = this.i.buildSchema(res);
        if (this.x !== undefined) ret.x = this.x.buildSchema(res);
        ret.predefinedFields = this.predefinedFields;
        ret.valueType = this.valueType;
        return ret;
    }

    override getBud(name: string): BizBud {
        let bud = this.getDefinedBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
    }

    getDefinedBud(name: string): BizBud {
        let bud = super.getBud(name);
        if (bud === undefined) {
            if (name === 'i') return this.i;
            if (name === 'x') return this.x;
        }
        return bud;
    }

    override forEachBud(callback: (bud: BizBud) => void): void {
        super.forEachBud(callback);
        if (this.i !== undefined) callback(this.i);
        if (this.x !== undefined) callback(this.x);
        //if (this.pendQuery === undefined) return;
        for (let pendQuery of this.pendQueries) {
            const { params, from } = pendQuery;
            const { cols } = from;
            for (let col of cols) {
                let bud = col.bud; // field?.getBud();
                if (bud === undefined) continue;
                callback(bud);
            }
            for (let param of params) {
                callback(param);
            }
        }
    }
    hasField(fieldName: string): boolean {
        let ret = this.fields.includes(fieldName);
        if (ret === true) return ret;
        if (fieldName === 'i' && this.i !== undefined) return true;
        if (fieldName === 'x' && this.x !== undefined) return true;
        if (this.props.has(fieldName) === true) return true;
        return false;
    }

    forEachSubEntity(callback: (sub: PendQuery) => void) {
        for (let pendQuery of this.pendQueries) {
            callback(pendQuery);
        }
    }

    override buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        for (let pendQuery of this.pendQueries) {
            pendQuery.buildPhrases(phrases, this.name);
        }
    }
}

export class BizQueryTableInPendStatements extends Statements {
    readonly pendQuery: PendQuery;
    constructor(pendQuery: PendQuery) {
        super(undefined);
        this.pendQuery = pendQuery;
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizQueryTableInPendStatements(this, context);
    }
    db(db: Builder): object {
        return;
    }
}

export class PendQuery extends BizQueryTable {
    readonly isIDScan = false;
    readonly bizPend: BizPend;
    constructor(bizPend: BizPend) {
        super(bizPend.biz);
        this.bizPend = bizPend;
    }
    parser(context: PContext): PElement<IElement> {
        return new PPendQuery(this, context);
    }
    protected buildPhrase(prefix: string) {
        this.phrase = `${prefix}.${this.name}`;
    }
}
