import { BBizEntity, BBizSheet, DbContext } from "../../builder";
import { BBizDetail } from "../../builder";
import { PBizDetail, PBizDetailAct, PBizMain, PBizPend, PBizSheet, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { Field } from "../field";
import { ActionStatement, TableVar } from "../statement";
import { BizBase, BizPhraseType } from "./Base";
import { BizBud, BizBudAtom, BizBudDec, BudValue } from "./Bud";
import { BizEntity } from "./Entity";

export class BizSheet extends BizEntity {
    readonly bizPhraseType = BizPhraseType.sheet;
    main: BizMain;
    readonly details: { detail: BizDetail; caption: string; }[] = [];

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

export class BizMain extends BizEntity {
    readonly bizPhraseType = BizPhraseType.main;
    target: BizBud;

    parser(context: PContext): PElement<IElement> {
        return new PBizMain(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            target: this.target?.buildSchema(res),
        };
    }
}

export interface DetailItem extends BudValue {
    caption: string;
    atom: string;
    pick: string;
}

export interface RefEntity<T extends BizEntity> {
    caption: string;
    entity: T;
}

export class BizDetail extends BizEntity {
    readonly bizPhraseType = BizPhraseType.detail;
    readonly acts: BizDetailAct[] = [];
    main: BizMain;
    item: BizBud; // DetailItem;
    itemX: BizBud; // DetailItem;
    pend: RefEntity<BizPend>;
    value: BizBud;
    price: BizBud;
    amount: BizBud;

    parser(context: PContext): PElement<IElement> {
        return new PBizDetail(this, context);
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
            main: this.main.name,
            pend,
            item: this.item?.buildSchema(res),
            itemx: this.itemX?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price: this.price?.buildSchema(res),
        }
    }
    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        if (this.item !== undefined) callback(this.item);
        if (this.itemX !== undefined) callback(this.itemX);
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
        return new BBizDetail(dbContext, this);
    }
}

export class BizPend extends BizEntity {
    readonly bizPhraseType = BizPhraseType.pend;
    readonly buds = [
        new BizBudAtom('item', undefined),
        new BizBudAtom('itemx', undefined),
        new BizBudDec('value', undefined),
        new BizBudDec('price', undefined),
        new BizBudDec('amount', undefined),
    ];

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
        if (bud !== undefined) return bud;
        bud = this.buds.find(v => v.name === name);
        return bud;
    }
}

export class BizDetailAct extends BizBase {
    readonly bizPhraseType = BizPhraseType.detailAct;
    readonly bizDetail: BizDetail;
    readonly tableVars: { [name: string]: TableVar } = {};

    idParam: Field;
    statement: ActionStatement;
    // fromPend: BizPend;

    constructor(bizDetail: BizDetail) {
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
