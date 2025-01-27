import { BizAtom, BizBudValue, BizCombo, BizFork, BizReport, BizBook, ReportJoinType } from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizReport extends PBizEntity<BizReport> {
    private readonly titles: { title: [string, string]; caption: string; }[] = [];
    private from: string;
    private joins: { type: ReportJoinType; entity: string; }[] = [];
    private parseBooks = () => {
        if (this.titles.length > 0) {
            this.ts.error(`Title can define only once in REPORT`);
        }
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                this.titles.push(this.passTitle());
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                }
                else if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                else {
                    this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                }
            }
        }
        else {
            this.titles.push(this.passTitle());
        }
        this.ts.passToken(Token.SEMICOLON);
    }
    private passTitle(): { title: [string, string]; caption: string; } {
        let v0 = this.ts.passVar();
        this.ts.passToken(Token.DOT);
        let v1 = this.ts.passVar();
        let caption = this.ts.mayPassString();
        return { title: [v0, v1], caption };
    }

    private parseFrom = () => {
        this.from = this.ts.passVar();
        for (; ;) {
            let join = this.ts.passKey();
            let type: ReportJoinType;
            switch (join) {
                default: this.ts.expect('X', 'TO'); break;
                case 'x': type = ReportJoinType.x; break;
                case 'to': type = ReportJoinType.to; break;
            }
            let entity = this.ts.passVar();
            this.joins.push({ type, entity });
            if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                break;
            }
        }
    }

    private parsePermit = () => {
        this.parsePermission('');
    }

    readonly keyColl = {
        title: this.parseBooks,
        book: this.parseBooks,
        from: this.parseFrom,
        permit: this.parsePermit,
    };

    override scan(space: Space): boolean {
        let ok = true;
        if (this.titles.length === 0) {
            ok = false;
            this.log(`Report ${this.element.jName} must define Title`);
        }
        else {
            for (let t of this.titles) {
                let { title: [t0, t1], caption } = t;
                let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(t0);
                if (entity === undefined || entity.bizPhraseType !== BizPhraseType.book) {
                    ok = false;
                    this.log(`${t0} is not a title`);
                }
                else {
                    let title = entity as BizBook;
                    let bud = title.getBud(t1) as BizBudValue;
                    if (bud === undefined) {
                        ok = false;
                        this.log(`${t1} is not a prop of ${title.jName}`);
                    }
                    else {
                        this.element.titles.push({
                            caption,
                            title,
                            bud,
                        });
                    }
                }
            }
        }
        if (this.from === undefined) {
            ok = false;
            this.log('FROM must be defined');
        }
        else {
            let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(this.from);
            if (entity === undefined) {
                ok = false;
                this.log(`${this.from} is not a ATOM`);
            }
            else {
                const { bizPhraseType } = entity;
                switch (bizPhraseType) {
                    default:
                        ok = false;
                        this.log(`FROM ${this.from} must be ATOM`);
                        break;
                    case BizPhraseType.atom:
                    case BizPhraseType.combo:
                    case BizPhraseType.fork:
                        break;
                }
                this.element.from = entity as BizAtom | BizCombo | BizFork;
                for (let join of this.joins) {
                    let { type, entity } = join;
                    let { bizEntityArr: [en] } = space.getBizFromEntityArrFromName(entity);
                    if (en === undefined) {
                        ok = false;
                        this.log(`${entity} is unknown`);
                    }
                    this.element.joins.push({ type, entity: en });
                }
            }
        }
        return ok;
    }
}