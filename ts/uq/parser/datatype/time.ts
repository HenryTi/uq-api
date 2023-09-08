import {Time} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PTime extends PDataType {
    private dt: Time;
    constructor(dt: Time, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
