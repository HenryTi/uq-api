import { Const } from "../../il";
import { BEntity } from "./entity";

export class BConst extends BEntity<Const> {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
