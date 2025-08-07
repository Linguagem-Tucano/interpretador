export interface Token {
    type: TokenType,
    value: string,
    line: number,
}

export enum TokenType {
    BinaryOperator,
    UnaryOperator,

    ComparatorOperator,

    Assignment,

    Number,
    Real,
    Identifier,
    StringLiteral,

    Whitespace,

    LParen, // (
    RParen, // )
    LColch, // [
    RColch, // ]
    LChave, // {
    RChave, // }

    DoisPontos,
    Virgula,
    Ponto,

    Aspas,

    EOL,
    EOF,

    Var,
    Int,
    Caractere,
    RealWord,
    Logico,
    Se,
    Senao,
    Para,
    De,
    Faca,
    Enquanto,
    Repita,
    Ate,
    Funcao,
    Retorna,
    Escreva,
    Escreval,
    Leia,
    Desenhar,
    Limpar,
    Imprima,
    Reta,
    Classe,
    Construtor,
    Privado,
    Protegido,
    Publico,
    Novo,
    Converter,
}
const reservedWordsObj = {
    "var": TokenType.Var,
    "int": TokenType.Int,
    "caractere": TokenType.Caractere,
    "real": TokenType.RealWord,
    "logico": TokenType.Logico,
    
    "se": TokenType.Se,
    "senao": TokenType.Senao,
    
    "para": TokenType.Para,
    "de": TokenType.De,
    "faca": TokenType.Faca,

    "enquanto": TokenType.Enquanto,
    "repita": TokenType.Repita,
    "ate": TokenType.Ate,
    "até": TokenType.Ate,

    "funcao": TokenType.Funcao,
    "função": TokenType.Funcao,
    "retorna": TokenType.Retorna,

    "escreva": TokenType.Escreva,
    "escreval": TokenType.Escreval,
    "leia": TokenType.Leia,

    "desenhe": TokenType.Desenhar,
    "reta": TokenType.Reta,
    "limpe": TokenType.Limpar,
    "imprima": TokenType.Imprima,

    "classe": TokenType.Classe,
    "construtor": TokenType.Construtor,
    "privado": TokenType.Privado,
    "protegido": TokenType.Protegido,
    "publico": TokenType.Publico,
    "novo": TokenType.Novo,

    "converta": TokenType.Converter,
}

export const reservedWords = new Map<string, TokenType>(Object.entries(reservedWordsObj));


const binaryOperators = [
    "+",
    "-",
    "*",
    "/",
    "%",
    "//",
    "^",
    "..",
];

const comparatorOperators = [
    "==",
    ">=",
    "<=",
    ">",
    "<",
    "~=",
]

const assign = "=";

const endOfLine = [
    ";",
    "\n",
]

const openAndClose: {[id:string]:TokenType} = {
    "(":TokenType.LParen,
    ")":TokenType.RParen,
    "[":TokenType.LColch,
    "]":TokenType.RColch,
    "{":TokenType.LChave,
    "}":TokenType.RChave,
    ":":TokenType.DoisPontos,
    ",":TokenType.Virgula,
}

function isBinaryOperator(str:string) {
    return binaryOperators.includes(str);
}

function isEndOfLine(str:string) {
    return endOfLine.includes(str);
}

function isAssign(str:string):boolean {
    return (str==assign);
}

function isComparator(str:string):boolean {
    return comparatorOperators.includes(str);
}

function isOpeningOrClosing(str:string) {
    return openAndClose[str]!=null;
}

function isLetter(str: string):boolean {
    str = str.toLowerCase();
    return /[a-zA-Zçãé]/.test(str);
}

function isNumber(str: string):boolean {
    return /^\d+$/.test(str);
}

function isComentario(str: string):boolean {
    return "--".includes(str);
}

function isPonto(str: string):boolean {
    return ".".includes(str);
}

function isReal(str:string):boolean {
    return isNumber(str) || str.includes(".");
}

function isAspas(str:string):boolean {
    return "\"".includes(str);
}

function isWhiteSpace(str:string):boolean {
    return /\s/.test(str);
}

function isReservedWord(str:string):boolean {
    return reservedWords.has(str.toLowerCase());
}

function token(value:string,type:TokenType, line: number): Token {
    return {value,type,line};
}

function current():string {
    return src[0];
}

export let src = [] as string[];

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>;
    src = sourceCode.split("");
    let lineNumber = 1;

    //run til end of source code
    while (src.length>0) {
        let testStr = src[0];
        if (testStr=="/") {
            testStr+=src[1];
            
            if (isBinaryOperator(testStr)) {
                tokens.push(token(testStr,TokenType.BinaryOperator, lineNumber));
                for (let i=0; i<testStr.length; i++) {
                    src.shift();
                }
                continue;
            } else if (isBinaryOperator(src[0])) {
                tokens.push(token(src[0],TokenType.BinaryOperator, lineNumber));
                src.shift();
                continue;
            }
        }
        if (isPonto(testStr)) {
            testStr+=src[1];
            if (isBinaryOperator(testStr)) {
                tokens.push(token(testStr,TokenType.BinaryOperator, lineNumber));
                src.shift();
                src.shift();
                continue;
            } else {
                tokens.push(token(testStr,TokenType.Ponto, lineNumber));
                src.shift();
                continue;
            }
            
        }
        if (testStr=="-") {
            testStr+=src[1];
            if (isComentario(testStr)) {
                while (!isEndOfLine(src[0]) && src.length>0) {
                    src.shift();
                }
                lineNumber++;
                src.shift();
                if (src.length<=0) {
                    continue;
                }
            }
        }

        if (isBinaryOperator(src[0])) {
            tokens.push(token(src[0],TokenType.BinaryOperator,lineNumber));
            src.shift();
            continue;
        }
        if (isOpeningOrClosing(src[0])) {
            tokens.push(token(src[0],openAndClose[src[0]],lineNumber));
            src.shift();
            continue;
        }

        if (testStr=="=" || testStr==">" || testStr=="<" || testStr=="~") {
            testStr+=src[1];
            if (isComparator(testStr)) {
                tokens.push(token(testStr,TokenType.ComparatorOperator,lineNumber));
                src.shift();
                src.shift();
                continue;
            } else if (isComparator(src[0])) {
                tokens.push(token(src[0],TokenType.ComparatorOperator,lineNumber));
                src.shift();
                continue;
            }
        }
        if (isComparator(src[0])) {
            tokens.push(token(src[0],TokenType.ComparatorOperator,lineNumber));
            src.shift();
            continue;
        }

        if (isAssign(src[0])) {
            tokens.push(token(src[0],TokenType.Assignment,lineNumber));
            src.shift();
            continue;
        }
        if (isEndOfLine(src[0])) {
            if (match("\n")) {lineNumber++}
            tokens.push(token(src[0],TokenType.EOL,lineNumber));
            src.shift();
            continue;
        }
        if (isWhiteSpace(src[0])) {
            //tokens.push(token(src[0],TokenType.Whitespace));
            src.shift();
            continue;
        }
        //Time to deal with multichar things

        //deal with integer numbers and real numbers
        if (isReal(src[0])) {
            let number = "";
            while (src.length>0 && isReal(src[0])) {
                number+=src[0];
                src.shift();
            }
            let ttype = TokenType.Number;
            if (number.includes(".")) {ttype=TokenType.Real;} 
            tokens.push(token(number,ttype,lineNumber));
            continue;
        }

        if (isAspas(src[0])) {
            let text = "";
            src.shift(); //eat the "
            while (src.length>0 && !isAspas(src[0])) {
                text+=src[0];
                src.shift();
            }
            src.shift(); //eat the last "
            tokens.push(token(text,TokenType.StringLiteral,lineNumber));
            continue;
        }

        //deal with string literal
        if (isLetter(src[0])) {
            let text = "";
            while (src.length>0 && isLetter(src[0])) {
                text+=src[0];
                src.shift();
            }
            if (isReservedWord(text)) {
                const type = reservedWords.get(text) as TokenType;
                tokens.push(token(text,type,lineNumber));
            } else if (text!="") {
                tokens.push(token(text,TokenType.Identifier,lineNumber));
            }
            continue;
        }
    }

    tokens.push(token("EOF",TokenType.EOF,lineNumber));
    return tokens;
}

function match(str: string): boolean {
    return current() == str;
}