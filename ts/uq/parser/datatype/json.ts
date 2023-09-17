import { JsonDataType } from '../../il';
import { PDataType } from './datatype';
import { PContext } from '../pContext';

export class PJsonDataType extends PDataType {
    private dt: JsonDataType;
    constructor(dt: JsonDataType, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
