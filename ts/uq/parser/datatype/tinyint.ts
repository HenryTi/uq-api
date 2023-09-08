import {TinyInt} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PTinyInt extends PDataType {
    private dt: TinyInt;
    constructor(dt: TinyInt, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
