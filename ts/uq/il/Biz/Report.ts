import { BBizReport, DbContext } from "../../builder";
import { PBizReport, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizAtom, BizAtomSpec } from "./Atom";
import { BizPhraseType, BudDataType } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";
import { BizTitle } from "./Title";

export interface ReportTitle {
    caption: string;
    title: BizTitle;
    bud: BizBud;
}

export enum ReportJoinType { x = 1, to = 2 };
export interface ReportJoin {
    type: ReportJoinType;
    entity: BizEntity;
}
/*
export class ReportList extends BizBud {
    readonly dataType = BudDataType.none;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        throw new Error("Method not implemented.");
    }
    atom: BizAtom | BizAtomSpec;

    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.atom = this.atom.name;
        return ret;
    }
}
*/
export class BizReport extends BizEntity {
    readonly bizPhraseType = BizPhraseType.report;
    // readonly lists: ReportList[] = [];
    readonly titles: ReportTitle[] = [];
    from: BizAtom;
    readonly joins: ReportJoin[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizReport(this, context);
    }

    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        // const { title, bud } = this.title;
        ret.title = this.titles.map(v => {
            const { caption, title, bud } = v;
            return {
                caption,
                title: [title.name, bud.name],
            }
        });
        ret.from = this.from.name;
        ret.joins = this.joins.map(v => {
            const { type, entity } = v;
            return {
                type,
                entity: entity.name,
            }
        });
        /*
        ret.lists = this.lists.map(v => {
            return v.buildSchema(res);
        });
        */
        return ret;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        /*
        let phrase = this.phrase;
        for (let list of this.lists) {
            list.buildPhrases(phrases, phrase)
        }
        */
    }

    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        // for (let list of this.lists) callback(list);
    }

    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        /*
        for (let kBud of this.lists) {
            if (kBud.name === name) return kBud;
        }
        */
        return undefined;
    }

    db(dbContext: DbContext): BBizReport {
        return new BBizReport(dbContext, this);
    }
}
