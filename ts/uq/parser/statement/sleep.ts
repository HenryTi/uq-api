import { Space } from '../space';
import {SleepStatement, ValueExpression} from '../../il';
import {PStatement} from './statement';
import {PContext} from '../pContext';

export class PSleepStatement extends PStatement {
    private sleepStatement: SleepStatement;
    constructor(sleepStatement: SleepStatement, context: PContext) {
        super(sleepStatement, context);
        this.sleepStatement = sleepStatement;
    }

    protected _parse() {
		let val = new ValueExpression();
		val.parser(this.context).parse();
		this.sleepStatement.value = val;
	}

	scan(space: Space):boolean {
		let ok = true;
		let {value} = this.sleepStatement;
		if (value) {
			if (value.pelement.scan(space) === false) ok = false;
		}
		return ok;
	}
}
