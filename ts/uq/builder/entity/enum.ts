import { BEntity } from "./entity";
import { Enum } from "../../il";

export class BEnum extends BEntity<Enum> {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
