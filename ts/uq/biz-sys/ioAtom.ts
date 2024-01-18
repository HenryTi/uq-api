export default `
ATOM $IOOuter {
    PROP {
        url CHAR;
        appKey CHAR;
    }
}

ATOM $IOApp {
}

DUO $IOOuterApp {
    I $IOOuter;
    X $IOApp;
    PROP {
        url CHAR;
        appKey CHAR;
    }
}

DUO $IOAppInOut {
    I $IOApp;
    X $BizPhrase;
}
`;
