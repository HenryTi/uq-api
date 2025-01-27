import { BBizReport, DbContext } from "../../builder";
import { PBizReport, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizAtom, BizCombo, BizFork } from "./BizID";
import { BizPhraseType } from "./BizPhraseType";
import { BizBud, BizBudValue } from "./Bud";
import { BizEntity, BizNotID } from "./Entity";
import { BizBook } from "./Title";

export interface ReportTitle {
    caption: string;
    title: BizBook;
    bud: BizBudValue;
}

export enum ReportJoinType { x = 1, to = 2 };
export interface ReportJoin {
    type: ReportJoinType;
    entity: BizEntity;
}

export class BizReport extends BizNotID {
    readonly bizPhraseType = BizPhraseType.report;
    readonly titles: ReportTitle[] = [];
    from: BizAtom | BizCombo | BizFork;
    readonly joins: ReportJoin[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizReport(this, context);
    }

    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
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
        return ret;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }

    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
    }

    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        return undefined;
    }

    db(dbContext: DbContext): BBizReport {
        return new BBizReport(dbContext, this);
    }
}
