import { Space } from '../space';
import { InlineStatement } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';

const dbTypes = ['mysql', 'mssql', 'oracle'];
export class PInlineStatement extends PStatement {
    inline: InlineStatement;
    constructor(inline: InlineStatement, context: PContext) {
        super(inline, context);
        this.inline = inline;
    }

    protected _parse() {
        let { text } = this.ts;
        let code: string;
        for (let dbType of dbTypes) {
            if (text.startsWith(dbType) === true) {
                this.inline.dbType = dbType;
                let len = dbType.length;
                let pos = text.indexOf('\n', len);
                if (pos >= 0) {
                    this.inline.memo = text.substring(len, pos - 1);
                    this.inline.code = text.substring(pos + 1);
                }
                else {
                    this.inline.code = text.substring(len);
                }
                break;
            }
        }
        //this.ts.readToken();
    }

    scan(space: Space): boolean {
        return true;
    }
}
