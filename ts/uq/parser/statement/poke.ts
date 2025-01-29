import { Space } from '../space';
import { PokeStatement, ValueExpression } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';

export class PPokeStatement extends PStatement {
    private pokeStatement: PokeStatement;
    constructor(pokeStatement: PokeStatement, context: PContext) {
        super(pokeStatement, context);
        this.pokeStatement = pokeStatement;
    }

    protected _parse() {
        let val = new ValueExpression();
        val.parser(this.context).parse();
        this.pokeStatement.user = val;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { user } = this.pokeStatement;
        if (user) {
            if (user.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}
