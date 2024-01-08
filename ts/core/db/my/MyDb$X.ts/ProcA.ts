import { Proc } from "./Proc"


export class ProcA extends Proc {
    readonly name = 'A';
    readonly body = `
(db VARCHAR(200), site BIGINT, atomPhrase VARCHAR(200), base BIGINT, keys0 VARCHAR(500), ex VARCHAR(200))
BEGIN
    DECLARE b INT;
END;
`
}
