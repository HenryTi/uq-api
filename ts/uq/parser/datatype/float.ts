import {Float} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PFloat extends PDataType {
    private dt: Float;
    constructor(dt: Float, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
