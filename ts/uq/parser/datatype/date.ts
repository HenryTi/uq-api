import {DDate} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PDate extends PDataType {
    private dt: DDate;
    constructor(dt: DDate, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
