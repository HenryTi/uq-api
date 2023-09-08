import { DataTypeDefine } from "../../il";
import { BEntity } from "./entity";

export class BDataTypeDefine extends BEntity<DataTypeDefine> {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
