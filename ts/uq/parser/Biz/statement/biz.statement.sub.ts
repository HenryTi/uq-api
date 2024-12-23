import { BizStatementSub, BizAct } from '../../../il';
import { PElement } from '../../element';

export abstract class PBizStatementSub<A extends BizAct, T extends BizStatementSub<A>> extends PElement<T> {
}
