import { Queue } from "../../il";
import { BEntity } from "./entity";

export class BQueue extends BEntity<Queue> {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
