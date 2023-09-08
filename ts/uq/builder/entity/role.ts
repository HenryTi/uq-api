import { Role } from '../../il';
import { BEntity } from './entity';

export class BRole extends BEntity<Role> {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
