import { Space } from '../space';
import { Token } from '../tokens';
import { TextStatement } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PTextStatement extends PStatement {
    private text: TextStatement;
    private tableName: string;
    constructor(text: TextStatement, context: PContext) {
        super(text, context);
        this.text = text;
    }

    protected _parse() {
        if (this.ts.token !== Token.VAR) this.expect('变量名称');
        this.text.textVar = this.ts.lowerVar;
        this.ts.readToken();

        this.text.sep = this.parseDilimiter('sep');
        this.text.ln = this.parseDilimiter('ln');

        this.ts.assertKey('into');
        this.ts.readToken();
        this.tableName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(Token.SEMICOLON);
        this.ts.readToken();
    }

    private parseDilimiter(d: 'sep' | 'ln'): string {
        if (this.ts.isKeyword(d) !== true) return;
        this.ts.readToken();
        if (this.ts.token !== Token.EQU) {
            this.ts.expectToken(Token.EQU);
        }
        this.ts.readToken();
        if (this.ts.token !== Token.STRING) {
            this.ts.expectToken(Token.STRING);
        }
        let ret = this.ts.text;
        this.ts.readToken();
        return ret;
    }

    setTableName(tableName: string) { this.tableName = tableName }

    scan(space: Space): boolean {
        let ok = true;
        let tv = space.getTableVar(this.tableName);
        if (tv === undefined) {
            this.log('没有定义表变量 ' + this.tableName);
            ok = false;
        }
        this.text.tableVar = tv;
        let no = space.newStatementNo();
        this.text.setNo(no++);
        space.setStatementNo(no);
        return ok;
    }
}
