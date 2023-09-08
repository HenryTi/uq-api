import {BigInt} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PBigInt extends PDataType {
    private dt: BigInt;
    constructor(dt: BigInt, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
}
