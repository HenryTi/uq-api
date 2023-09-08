import {SmallInt} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PSmallInt extends PDataType {
    private dt: SmallInt;
    constructor(dt: SmallInt, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
