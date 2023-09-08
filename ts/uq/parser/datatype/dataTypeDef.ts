import { DataTypeDef } from '../../il';
import { PDataType } from './datatype';
import { PContext } from '../pContext';
import { Space } from '../space';

export class PDataTypeDef extends PDataType {
    private readonly dt: DataTypeDef;
    constructor(dt: DataTypeDef, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
    protected _parse() {
    }

    scan(space: Space): boolean {
        let ret = this.internalScan(space);
        if (ret === undefined) return true;
        this.log(ret);
        return false;
    }

    private internalScan(space: Space): string {
        const { typeName } = this.dt;
        let dt = space.getDataType(typeName);
        if (dt === undefined) {
            return `unknown data type '${typeName}'`;
        }
        this.dt.dataType = dt;
        return;
    }

    scanReturnMessage(space: Space): string {
        return this.internalScan(space);
    }
}
