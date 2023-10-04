import { BizAtom, BizAtomSpec, BizPhraseType, BizReport, BizTitle, ReportList } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizReport extends PBizEntity<BizReport> {
    private readonly titles: string[] = [];
    private readonly lists: { name: string, caption: string, atomName: string }[] = [];
    private parseTitle = () => {
        if (this.titles.length > 0) {
            this.ts.error(`Title can define only once in REPORT`);
        }
        for (; ;) {
            let v = this.ts.passVar();
            this.titles.push(v);
            if (this.ts.token !== Token.DOT) break;
            this.ts.readToken();
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseList = () => {
        let name = this.ts.passVar();
        let caption = this.ts.passString();
        this.ts.passKey('of');
        let atomName = this.ts.passVar();
        this.lists.push({ name, caption, atomName });
        this.ts.passToken(Token.SEMICOLON);
    }

    readonly keyColl = {
        title: this.parseTitle,
        list: this.parseList,
    };

    override scan(space: Space): boolean {
        let ok = true;
        let t0 = this.titles[0];
        if (t0 === undefined) {
            ok = false;
            this.log(`Report ${this.element.jName} must define Title`);
        }
        else {
            if (this.titles.length !== 2) {
                ok = false;
                this.log('Title must be entity.bud');
            }
            let entity = space.getBizEntity(t0);
            if (entity === undefined || entity.bizPhraseType !== BizPhraseType.title) {
                ok = false;
                this.log(`${t0} is not a title`);
            }
            else {
                let t1 = this.titles[1];
                let title = entity as BizTitle;
                let bud = title.getBud(t1);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${t1} is not a prop of ${title.jName}`);
                }
                else {
                    this.element.title = {
                        title,
                        bud,
                    }
                }
            }
        }
        for (let { name, caption, atomName } of this.lists) {
            let entity = space.getBizEntity(atomName) as BizAtom | BizAtomSpec;
            if (
                entity === undefined
                || (
                    entity.bizPhraseType !== BizPhraseType.atom
                    && entity.bizPhraseType !== BizPhraseType.spec
                )
            ) {
                ok = false;
                this.log(`${atomName} is neither ATON nor SPEC`);
            }
            let r = new ReportList(name, caption)
            this.element.lists.push(r);
            r.atom = entity;
        }
        return ok;
    }
}
