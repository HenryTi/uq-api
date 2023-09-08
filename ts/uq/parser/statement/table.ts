import { Space } from '../space';
import { Token } from '../tokens';
import { TableStatement } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PTableStatement extends PStatement {
    private table: TableStatement;
    constructor(table: TableStatement, context: PContext) {
        super(table, context);
        this.table = table;
    }

    protected _parse() {
        if (this.ts.token !== Token.VAR) this.expect('变量名称');
        let table = this.table.table;
        table.name = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();

        for (; ;) {
            let isKey = false;
            if (this.ts.isKeyword('key')) {
                this.ts.readToken();
                isKey = true;
            }
            let field = this.field(!isKey);
            table.fields.push(field);
            if (isKey === true) {
                if (table.keys === undefined) table.keys = [];
                table.keys.push(field);
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        if (this.ts.isKeyword('no') === true) {
            this.ts.readToken();
            this.ts.passKey('drop');
            this.table.noDrop = true;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    preScan(space: Space): boolean {
        let ok = true;
        let { table } = this.table;
        if (space.addTableVar(table) === false) {
            this.log('重复定义表变量 ' + table.name);
            ok = false;
        }
        if (space.varPointer(table.name, false) !== undefined) {
            this.log('重复定义变量 ' + table.name);
            ok = false;
        }
        return ok;
    }
}
