import { BBizReport, DbContext } from "../../builder";
import { PBizReport, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizAtom, BizAtomSpec } from "./Atom";
import { BizPhraseType, BudDataType } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";
import { BizTitle } from "./Title";

export interface ReportTitle {
    title: BizTitle;
    bud: BizBud;
}

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

export class BizReport extends BizEntity {
    readonly bizPhraseType = BizPhraseType.report;
    readonly lists: ReportList[] = [];
    title: ReportTitle;

    parser(context: PContext): PElement<IElement> {
        return new PBizReport(this, context);
    }

    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        const { title, bud } = this.title;
        ret.title = `${title.name}.${bud.name}`;
        ret.lists = this.lists.map(v => {
            return v.buildSchema(res);
        });
        return ret;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let list of this.lists) {
            list.buildPhrases(phrases, phrase)
        }
    }

    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        for (let list of this.lists) callback(list);
    }

    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        for (let kBud of this.lists) {
            if (kBud.name === name) return kBud;
        }
        return undefined;
    }

    db(dbContext: DbContext): BBizReport {
        return new BBizReport(dbContext, this);
    }
}
