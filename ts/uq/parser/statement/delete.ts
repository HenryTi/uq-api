import { Space } from '../space';
import {DeleteStatement, Delete} from '../../il';
import {PStatement} from './statement';
import {PContext} from '../pContext';
import { DeleteSpace } from '../select';

export class PDeleteStatement extends PStatement {
    from: string;
    delStatement: DeleteStatement;
    constructor(delStatement: DeleteStatement, context: PContext) {
        super(delStatement, context);
        this.delStatement = delStatement;
    }
    
    protected _parse() {
        let del = this.delStatement.del = new Delete();
        let parser = del.parser(this.context);
        parser.parse();
    }

    scan(space: Space):boolean {
        let ok = true;
        let {del} = this.delStatement;
        let theSpace = new DeleteSpace(space, del);
        if (del.pelement.scan(theSpace) == false) ok = false;
        return ok;
    }
}
