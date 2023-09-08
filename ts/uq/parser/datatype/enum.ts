import { EnumDataType } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PDataType } from './datatype';
import { PContext } from '../pContext';

export class PEnumDataType extends PDataType {
	private enumName: string;
	private enumDataType: EnumDataType;
	constructor(enumDataType: EnumDataType, context: PContext) {
		super(enumDataType, context);
		this.enumDataType = enumDataType;
	}

	protected _parse() {
		if (this.ts.token !== Token.VAR) {
			this.ts.expect('定义的enum');
		}
		this.enumName = this.ts.lowerVar;
		this.ts.readToken();
		return true;
	}

	scan(space: Space): boolean {
		let enm = space.getEnum(this.enumName);
		if (enm === undefined) {
			this.log(`${this.enumName} is not ENUM`);
			return false;
		}
		this.enumDataType.enm = enm;
		return true;
	}

	scanReturnMessage(space: Space): string {
		let enm = space.getEnum(this.enumName);
		if (enm === undefined) {
			return `${this.enumName} is not ENUM`;
		}
		this.enumDataType.enm = enm;
	}
}
