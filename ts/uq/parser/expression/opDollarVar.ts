import { PElement } from '../element';
import { Space } from '../space';
import { OpDollarVar } from "../../il";
import { PContext } from "../pContext";

export class POpDollarVar extends PElement {
	private opDollarVar: OpDollarVar;
	constructor(opDollarVar: OpDollarVar, context:PContext) {
		super(opDollarVar, context);
		this.opDollarVar = opDollarVar;
	}
	protected _parse() {};
	scan(space: Space):boolean {
		let {_var} = this.opDollarVar;
		if (space.varPointer('$' + _var, false) === undefined) {
			this.log('不支持系统变量 $' + _var);
			return false;
		}
		return true;
	}
}
