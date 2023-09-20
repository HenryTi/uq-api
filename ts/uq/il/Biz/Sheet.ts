import { PBizDetail, PBizDetailAct, PBizMain, PBizPend, PBizSheet, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { Field } from "../field";
import { ActionStatement, TableVar } from "../statement";
import { BizAtom, BizPick } from "./Atom";
import { BizBase, BizPhraseType } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export class BizSheet extends BizEntity {
    readonly bizPhraseType = BizPhraseType.sheet;
    main: BizMain;
    readonly acts: BizDetailAct[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizSheet(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.main === undefined) debugger;
        ret = {
            ...ret,
            main: this.main.name,
            acts: this.acts.map(v => v.buildSchema(res)),
        };
        // this.entitySchema = JSON.stringify(ret);
        return ret;
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

interface DetailItem {
    caption: string;
    atom: string;
    pick: string;
}

export class BizDetail extends BizEntity {
    readonly bizPhraseType = BizPhraseType.detail;
    readonly acts: BizDetailAct[] = [];
    main: BizMain;
    item: DetailItem;
    pend: BizPend;
    value: BizBud;
    price: BizBud;
    amount: BizBud;

    parser(context: PContext): PElement<IElement> {
        return new PBizDetail(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            main: this.main.name,
            pend: this.pend?.name,
            item: this.item,
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price: this.price?.buildSchema(res),
        }
    }
}

export class BizPend extends BizEntity {
    readonly bizPhraseType = BizPhraseType.pend;
    // detail: BizDetail;

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
