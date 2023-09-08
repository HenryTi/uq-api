import {Double} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PDouble extends PDataType {
    private dt: Double;
    constructor(dt: Double, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
