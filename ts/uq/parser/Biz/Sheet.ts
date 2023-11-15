import {
    BizBin, BizSheet
    , Uq
} from "../../il";
import { BizPhraseType } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizSheet extends PBizEntity<BizSheet> {
    private main: string;
    private details: { name: string, caption: string }[] = [];

    private parseMain = () => {
        if (this.main !== undefined) {
            this.ts.error(`main can only be defined once in Biz Sheet`);
        }
        this.main = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseDetail = () => {
        let name = this.ts.passVar();
        let caption = this.ts.mayPassString();
        this.details.push({ name, caption });
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePermit = () => {
        this.parsePermission('crud');
    }

    readonly keyColl = {
        prop: this.parseProp,
        main: this.parseMain,
        detail: this.parseDetail,
        permit: this.parsePermit,
    };

    scan0(space: Space): boolean {
        let ok = true;
        if (this.main === undefined) {
            this.log(`Biz Sheet must define main`);
            ok = false;
        }
        let main = this.getBizEntity<BizBin>(space, this.main, BizPhraseType.bin);
        if (main === undefined) {
            this.log(`MAIN ${this.main} is not defined`);
            ok = false;
        }
        else {
            this.element.main = main;
        }
        for (let { name, caption } of this.details) {
            let detail = this.getBizEntity<BizBin>(space, name, BizPhraseType.bin);
            if (detail === undefined) {
                ok = false;
                continue;
            }
            this.element.details.push({ bin: detail, caption });
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        return ok;
    }
}
