import { BBizEntity, BBizSheet, DbContext } from "../../builder";
import { BBizBin } from "../../builder";
import { PBizBin, PBizDetailAct, PBizPend, PBizSheet, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { Field } from "../field";
import { ActionStatement, TableVar } from "../statement";
import { BizBase, BizPhraseType } from "./Base";
import { Biz } from "./Biz";
import { BizBud, BizBudAtom, BizBudDec, BudValue } from "./Bud";
import { BizEntity } from "./Entity";

export class BizSheet extends BizEntity {
    readonly bizPhraseType = BizPhraseType.sheet;
    main: BizBin;
    readonly details: { detail: BizBin; caption: string; }[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizSheet(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.main === undefined) debugger;
        ret = {
            ...ret,
            main: this.main.name,
            details: this.details.map(v => {
                const { detail, caption } = v;
                return {
                    detail: detail.name,
                    caption,                // 此处暂时不做res翻译
                }
            }),
        };
        return ret;
    }

    db(dbContext: DbContext): BBizSheet {
        return new BBizSheet(dbContext, this);
    }
}

export interface RefEntity<T extends BizEntity> {
    caption: string;
    entity: T;
}

export class BizBin extends BizEntity {
    readonly bizPhraseType = BizPhraseType.bin;
    act: BizBinAct;
    i: BizBud; // DetailItem;
    x: BizBud; // DetailItem;
    pend: RefEntity<BizPend>;
    value: BizBud;
    price: BizBud;
    amount: BizBud;

    parser(context: PContext): PElement<IElement> {
        return new PBizBin(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let pend: any;
        if (this.pend !== undefined) {
            let { caption, entity } = this.pend;
            pend = {
                caption,
                entity: entity.name
            }
        }
        return {
            ...ret,
            pend,
            i: this.i?.buildSchema(res),
            x: this.x?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price: this.price?.buildSchema(res),
        }
    }
    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        if (this.i !== undefined) callback(this.i);
        if (this.x !== undefined) callback(this.x);
        if (this.value !== undefined) callback(this.value);
        if (this.price !== undefined) callback(this.price);
        if (this.amount !== undefined) callback(this.amount);
    }
    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        if (this.value !== undefined) {
            if (this.value.name === name) return this.value;
        }
        if (this.price !== undefined) {
            if (this.price.name === name) return this.price;
        }
        if (this.amount !== undefined) {
            if (this.amount.name === name) return this.amount;
        }
        return undefined;
    }
    db(dbContext: DbContext): BBizEntity<any> {
        return new BBizBin(dbContext, this);
    }
}

export class BizPend extends BizEntity {
    static predefinedId = ['i', 'x', 'si', 'sx', 's'];
    static predefinedValue = ['value', 'price', 'amount', 'svalue', 'sprice', 'samount',];

    readonly bizPhraseType = BizPhraseType.pend;
    readonly predefinedBuds: { [name: string]: BizBud };
    constructor(biz: Biz) {
        super(biz);
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new BizBudAtom(n, undefined);
        }
        for (let n of BizPend.predefinedValue) {
            this.predefinedBuds[n] = new BizBudDec(n, undefined);
        }
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizPend(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            // detail: this.detail.name,
        }
    }

    override getBud(name: string): BizBud {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
    }
}

export class BizBinAct extends BizBase {
    readonly bizPhraseType = BizPhraseType.detailAct;
    readonly bizDetail: BizBin;
    readonly tableVars: { [name: string]: TableVar } = {};

    idParam: Field;
    statement: ActionStatement;
    // fromPend: BizPend;

    constructor(bizDetail: BizBin) {
        super();
        this.bizDetail = bizDetail;
    }

    parser(context: PContext): PElement<IElement> {
        return new PBizDetailAct(this, context);
    }

    addTableVar(tableVar: TableVar): boolean {
        let name = tableVar.name;
        let t = this.tableVars[name];
        if (t !== undefined) return false;
        this.tableVars[name] = tableVar;
        return true;
    }

    getTableVar(name: string): TableVar { return this.tableVars[name] }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            // fromPend: this.fromPend?.name,
            detail: this.bizDetail.name,
        };
    }
}
