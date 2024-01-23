"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = `
ATOM $IOOuter {
    PROP {
        url CHAR;
        appKey CHAR;
    }
}

DUO $IOOuterApp {
    I $IOOuter;
    X $IOApp;
    PROP {
        url CHAR;
        appKey CHAR;
    }
}

-- obsolete
ATOM $IOApp {
}

DUO $IOAppInOut {
    I $IOApp;
    X $BizPhrase;
}
`;
//# sourceMappingURL=IOAtom.js.map