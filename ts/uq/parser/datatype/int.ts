import {Int} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PInt extends PDataType {
    private dt: Int;
    constructor(dt: Int, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
