import { BizPrint, BizTemplet } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTemplet extends PBizEntity<BizTemplet> {
    protected override _parse(): void {
        this.parseHeader();
        if (this.ts.token !== Token.CODE) {
            this.ts.expectToken(Token.CODE);
        }
        this.element.template = this.ts.text;
        this.ts.readToken();
    }
    readonly keyColl = {
    };
}

export class PBizPrint extends PBizEntity<BizPrint> {
    private header: string;
    private content: string;
    private footer: string;
    private pageHeader: string;
    private pageFooter: string;

    private parsePrintHeader = () => {
        this.header = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }
    private parsePrintContent = () => {
        this.content = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }
    private parsePrintFooter = () => {
        this.footer = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }
    private parsePageHeader = () => {
        this.pageHeader = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }
    private parsePageFooter = () => {
        this.pageFooter = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    readonly keyColl = {
        header: this.parsePrintHeader,
        content: this.parsePrintContent,
        footer: this.parsePrintFooter,
        pageheader: this.parsePageHeader,
        pagefooter: this.parsePageFooter,
    };

    override scan(space: Space): boolean {
        let ok = true;
        return ok;
    }
}

