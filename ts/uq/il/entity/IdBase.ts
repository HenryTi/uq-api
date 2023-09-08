import { Field } from "../field";
import { EntityWithTable } from "./entity";

export abstract class IdBase extends EntityWithTable {
    // id: Field;
    fields: Field[] = [];
}
