import { History } from '../../il';
import { PHistoryBase } from './historyBase';

export class PHistory extends PHistoryBase<History> {
    protected onSpecificField(fieldType: string) {
        switch (fieldType) {
            default:
                super.onSpecificField(fieldType);
                break;
            /*
            case 'key':
                this.ts.readToken();
                this.parseKey(); 
                break;
            */
        }
    }
    /*
    private parseKey() {
        let field = this.field(false);
        if (field.nullable === undefined) {
            field.nullable = false;
        }
        else if (field.nullable === true) {
            this.error('key字段不可以null');
        }
        this.entity.keys.push(field);
    }
    */
}
