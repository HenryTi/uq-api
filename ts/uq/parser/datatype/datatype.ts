import {DataType} from '../../il';
import {PElement} from '../element';
import {PContext} from '../pContext';

// token data type
export abstract class PDataType extends PElement {
    constructor(dataType: DataType, context: PContext) {
        super(dataType, context);
        this.ts = context.ts;
        this.context = context;
    }
    protected _parse() {}
}
