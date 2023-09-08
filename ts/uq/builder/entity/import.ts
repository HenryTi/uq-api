import { Import } from '../../il';
import { BEntity } from './entity';

export class BImport extends BEntity<Import> {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
