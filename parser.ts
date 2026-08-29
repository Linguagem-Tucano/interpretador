// deno-lint-ignore-file no-case-declarations
import { ArgumentExpr, AssignmentExpr, AttributeLookup, BinaryExpr, CallLookup, Body, ClassExpr, ComparatorExpr, ConvertExpr, Dot, EndOfLine, Expr, ForEachStmt, ForStmt, FuncCall, FuncDecl, Identifier, IfStmt, ListIdentifier, ListLiteral, NewObjectExpr, NumericLiteral, Program, ReturnExpr, Stmt, StringLiteral, SwitchStmt, UnaryExpr, UntilStmt, VarDecl, WhileStmt } from './ast.ts';
import { lexerError, Token, tokenize, TokenType } from './lexer.ts';
import { ValueType } from './values.ts';
import { reportError } from './main.ts';
//import { Class } from './class.ts';

export default class Parser {
    private tokens: Token[] = [];

    private at(): Token {
        return this.tokens[0] as Token;
    }

    private advance() {
        return this.tokens.shift() as Token;
    }

    private peek() {
        return this.tokens[1] as Token;
    }

    private eatOnly(type: TokenType, err: string): Token {
        const line = this.at().line;
        const tk = this.tokens.shift();
        if (tk?.type == type) {
            return tk;
        } else {
            throw reportError(err, line);
        }
    }

    public produceAST(sourceCode: string): Program {
        try {
            this.tokens = tokenize(sourceCode);
        } catch (e) {
            const err = e as lexerError;
            reportError(err.text, err.line);
        }
        const program: Program = { kind: 'Program', body: { kind: 'Body', lines: [], line: 1 }, line: 1 };

        while (this.notEOF()) {
            program.body.lines.push(this.parseStmt());
        }

        return program;
    }

    private notEOF(): boolean {
        return this.tokens[0].type !== TokenType.EOF;
    }

    public parseStmt(): Stmt {
        //this is not going to work man...
        switch (this.at().type) {
            case TokenType.Var:
                return this.parseVarDecl();
            case TokenType.Se:
                return this.parseIfStmt();
            case TokenType.Funcao:
                return this.parseFuncDecl();
            case TokenType.Retorna:
                return this.parseReturnExpr();
            case TokenType.Para:
                return this.parseForStmt();
            case TokenType.Enquanto:
                return this.parseWhileStmt();
            case TokenType.Repita:
                return this.parseUntilStmt();
            case TokenType.Novo:
                return this.parseNewObjectExpr();
            case TokenType.Escolha:
                return this.parseSwitchStmt();
            case TokenType.Classe:
                return this.parseClassDecl();
            default:
                return this.parseExpr();
        }
    }

    private parseNewObjectExpr(): Stmt {
        this.advance(); // consume 'novo'
        const className = this.eatOnly(TokenType.Identifier, 'Esperava o nome da classe').value;
        this.eatOnly(TokenType.LParen, "Esperava '(' após o nome da classe");

        const args: Expr[] = [];
        while (this.at().type !== TokenType.RParen && this.at().type !== TokenType.EOF) {
            if (this.at().type == TokenType.Virgula) {
                this.advance();
                continue;
            }
            args.push(this.parseExpr());
        }

        this.eatOnly(TokenType.RParen, "Esperava ')'");

        return { kind: 'NewObjectExpr', class: className, args, line: this.at().line } as NewObjectExpr;
    }

    private parseSwitchStmt(): Stmt {
        /*
            escolha variavel {
                caso expr:
                    stmt[]
            }
        */
        this.advance(); //passa do escolha
        const value = this.parseExpr();
        this.eatOnly(TokenType.LChave, 'Esperava um {');

        const cases = new Map<Expr, Body>();

        while (this.at().type != TokenType.RChave && this.at().type != TokenType.EOF) {
            if (this.at().type == TokenType.Caso) {
                this.eatOnly(TokenType.Caso, 'Esperava um caso dentro do escolha');
                const comparison = this.parseExpr();
                this.eatOnly(TokenType.DoisPontos, 'Esperava : após a expressão do caso');
                const body = { kind: 'Body', lines: [], line: this.at().line } as Body;
                while (this.at().type != TokenType.RChave && this.at().type != TokenType.EOF && this.at().type != TokenType.Caso) {
                    body.lines.push(this.parseStmt());
                }
                cases.set(comparison, body);
            } else {
                this.advance();
            }
        }

        this.advance();

        return { kind: 'SwitchStmt', value, cases } as SwitchStmt;
    }

    private parseWhileStmt(): Stmt {
        //enquanto () {}
        this.advance(); //go past enquanto
        this.eatOnly(TokenType.LParen, 'Esperava um (');
        const comparison = this.parseExpr();
        this.eatOnly(TokenType.RParen, 'Esperava um )');

        this.eatOnly(TokenType.LChave, 'Esperava um {');
        const body = this.parseBody();
        this.advance(); //go past }
        return { kind: 'WhileStmt', body, comparison, line: this.at().line } as WhileStmt;
    }

    private parseUntilStmt(): Stmt {
        //repita ate () {}
        this.advance(); //go past enquanto

        this.eatOnly(TokenType.Ate, "Esperava um 'ate'");

        this.eatOnly(TokenType.LParen, 'Esperava um (');
        const comparison = this.parseExpr();
        this.eatOnly(TokenType.RParen, 'Esperava um )');

        this.eatOnly(TokenType.LChave, 'Esperava um {');
        const body = this.parseBody();
        this.advance(); //go past }
        return { kind: 'UntilStmt', body, comparison, line: this.at().line } as UntilStmt;
    }

    private parseForStmt(): Stmt {
        //para (i=1,10) faca { }
        this.advance(); //go past para
        this.eatOnly(TokenType.LParen, 'Esperava um (');
        const variable = { symbol: this.eatOnly(TokenType.Identifier, 'Esperava uma váriavel').value } as Identifier;

        if (this.at().type == TokenType.Assignment) {
            return this.parseForNormalStmt(variable);
        } else if (this.at().type == TokenType.De) {
            return this.parseForEachStmt(variable);
        }

        throw 'Erro em definir um laço de repetição para..faça';
    }

    private parseForEachStmt(variable: Identifier): Expr {
        const line = this.at().line;

        this.eatOnly(TokenType.De, "Esperava um 'de'");

        const lista = { symbol: this.eatOnly(TokenType.Identifier, 'Esperava o nome de uma lista').value } as Identifier;

        this.eatOnly(TokenType.RParen, 'Esperava um )');

        this.eatOnly(TokenType.Faca, "Esperava um 'faça'");

        this.eatOnly(TokenType.LChave, 'Esperava um {');

        const step = { kind: 'NumericLiteral', value: 1 } as NumericLiteral;

        const body = this.parseBody();
        this.advance(); //go past }

        return { kind: 'ForEachStmt', variable, list: lista, body, step, line } as ForEachStmt;
    }

    private parseForNormalStmt(variable: Identifier): Expr {
        const line = this.at().line;
        this.eatOnly(TokenType.Assignment, 'Esperava um =');
        const startIndex = this.parseExpr();
        this.eatOnly(TokenType.Virgula, 'Esperava uma virgula');
        const endIndex = this.parseExpr();
        this.eatOnly(TokenType.RParen, 'Esperava um )');
        this.eatOnly(TokenType.Faca, "Esperava um 'faca'");
        this.eatOnly(TokenType.LChave, 'Esperava um {');

        const step = { kind: 'NumericLiteral', value: 1 } as NumericLiteral;

        const body = this.parseBody();
        this.advance(); //go past }

        return { kind: 'ForStmt', variable, startIndex, endIndex, body, step, line } as ForStmt;
    }

    private parseFuncDecl(): Stmt {
        //funcao nome(args:tipo,args:tipo):tipo {}
        this.advance(); //go past funcao
        const identifier = this.eatOnly(TokenType.Identifier, 'Esperava um nome de função').value; //get identifier
        this.eatOnly(TokenType.LParen, "Esperava um '('.");
        const args = [] as ArgumentExpr[];
        let returnType = 'NullVal' as string;
        if (this.at().type == TokenType.RParen) {
            this.advance();
            //Sem argumentos
            if (this.at().type == TokenType.DoisPontos) {
                this.advance(); //go past :
                //com tipo de retorno
                const tipo = this.eatOnly(TokenType.Identifier, 'Esperava um tipo de variável');
                returnType = tipo.value;
            } else {
                //sem tipo de retorno
                returnType = 'NullVal';
            }
            this.eatOnly(TokenType.LChave, "Esperava um '{'.");
        } else {
            //Com argumentos
            while (this.at().type != TokenType.RParen && this.at().type != TokenType.EOF) {
                if (this.at().type == TokenType.Virgula) this.advance();
                const argname = this.eatOnly(TokenType.Identifier, 'Esperava um nome de argumento').value;
                let argtype = 'NullVal' as ValueType;
                if (this.at().type == TokenType.DoisPontos) {
                    this.advance(); //go past :
                    //Com tipo
                    const argumenttype = this.advance();
                    switch (argumenttype.type) {
                        case TokenType.Int:
                            argtype = 'NumberVal';
                            break;
                        case TokenType.Texto:
                            argtype = 'StringVal';
                            break;
                        case TokenType.Logico:
                            argtype = 'BooleanVal';
                            break;
                        case TokenType.Var:
                            argtype = 'NullVal';
                            break;
                        default:
                            throw reportError('Esperava um tipo válido de variável. Recebi: ' + argtype, this.at().line);
                    }
                } else {
                    //sem tipo
                    argtype = 'NullVal';
                }
                args.push({ kind: 'ArgumentExpr', identifier: argname, type: argtype } as ArgumentExpr);
            }
            this.advance(); //go past )
            if (this.at().type == TokenType.DoisPontos) {
                this.advance(); //go past :
                //com tipo de retorno
                const tipo = this.advance();
                switch (tipo.type) {
                    case TokenType.Int:
                        returnType = 'NumberVal';
                        break;
                    case TokenType.Texto:
                        returnType = 'StringVal';
                        break;
                    case TokenType.Logico:
                        returnType = 'BooleanVal';
                        break;
                    case TokenType.Var:
                        returnType = 'NullVal';
                        break;
                    default:
                        throw reportError('Esperava um tipo válido de variável. Recebi: ' + returnType, this.at().line);
                }
            } else {
                //sem tipo de retorno
                returnType = 'NullVal';
            }
            this.eatOnly(TokenType.LChave, "Esperava um '{'.");
        }

        //while para pegar o body da função
        const body = this.parseBody();
        this.advance(); //go past }

        return { kind: 'FuncDecl', identifier: identifier, body: body, type: returnType, args: args, line: this.at().line } as FuncDecl;
    }

    private parseReturnExpr(): Expr {
        this.advance(); //go past retorna
        const value = this.parseStmt();
        return { kind: 'ReturnExpr', value, line: this.at().line } as ReturnExpr;
    }

    private parseIfStmt(): Stmt {
        //se (expr) {corpo}
        this.advance(); // passar o se

        this.eatOnly(TokenType.LParen, "Esperava um '('.");

        const comparison = this.parseExpr();

        this.eatOnly(TokenType.RParen, "Esperava um ')'.");

        this.eatOnly(TokenType.LChave, "Esperava um '{'.");

        const body = this.parseBody();

        this.advance(); //past the }

        let elsebody;

        if (this.at().type == TokenType.Senao) {
            this.advance(); //move past senão
            if (this.at().type == TokenType.LChave) {
                this.advance(); //move past {
                elsebody = this.parseBody();
                this.advance(); //move past }
            }
        }

        return { kind: 'IfStmt', comparison, body, else: elsebody, line: this.at().line } as IfStmt;
    }

    private parseClassDecl(): ClassExpr {
        this.advance(); //go past classe
        const identifier = this.eatOnly(TokenType.Identifier, 'Esperava um nome').value;
        this.eatOnly(TokenType.LChave, 'Esperava um {'); // Consome a chave

        const body = this.parseBody();
        this.advance();
        return { kind: 'ClassExpr', body, identifier, line: this.at().line } as ClassExpr;
    }

    private parseVarDecl(): Stmt {
        const global = false; //preciso de um jeito melhor

        //mudança: agora a sintaxe é `var nome: tipo (= valor)`

        // if (this.at().type == TokenType.Global) {
        //     local = true;
        //     this.advance();
        // }

        this.advance(); //sair do "var"

        const identifier = this.eatOnly(TokenType.Identifier, 'Esperava um nome de variável')?.value;

        this.eatOnly(TokenType.DoisPontos, 'Esperava um : depois do nome da variável');

        let varType = this.eatOnly(TokenType.Identifier, 'Esperava um tipo de variável')?.value;

        //check if list
        while (this.at().type == TokenType.LColch) {
            this.advance();
            this.eatOnly(TokenType.RColch, 'Esperava um ]');
            varType += '[]';
        }

        if (this.at().type == TokenType.EOL || this.at().type == TokenType.EOF) {
            return { kind: 'VarDecl', identifier, line: this.at().line, global, type: varType } as VarDecl;
        } else if (this.at().type == TokenType.Assignment) {
            const decl = { kind: 'VarDecl', value: this.parseStmt(), identifier, type: varType, line: this.at().line, global: global } as VarDecl;
            return decl;
        } else {
            throw reportError('Esperava ; ou = na declaração de váriavel', this.at().line);
        }
    }

    private parseExpr(): Expr {
        return this.parseLogicalExpr();
    }

    private parseLogicalExpr(): Expr {
        let left = this.parseConcatenateExpr();
        //if (this.at().type==TokenType.BinaryOperator) {
        while (this.at().value == 'e' || this.at().value == 'ou' || this.at().value == 'xou') {
            const operator = this.advance().value;
            const right = this.parseConcatenateExpr();
            left = { kind: 'BinaryExpr', left, right, operator, line: this.at().line } as BinaryExpr;
        }
        //}
        return left;
    }

    private parseConcatenateExpr(): Expr {
        let left = this.parseFuncCall();
        while (this.at().value == '..') {
            const operator = this.advance().value;
            const right = this.parseFuncCall();
            left = { kind: 'BinaryExpr', left, right, operator, line: this.at().line } as BinaryExpr;
        }
        return left;
    }

    private parseFuncCall(): Expr {
        if (this.at().type == TokenType.Identifier) {
            const identifier = this.at().value;
            if (this.peek().type == TokenType.LParen) {
                this.advance(); //go past identifier
                this.advance(); //go past (
                const args = [] as Expr[];
                while (this.at().type != TokenType.RParen && this.at().type != TokenType.EOF) {
                    if (this.at().type != TokenType.Virgula) {
                        const s = this.parseStmt();
                        args.push(s);
                    } else {
                        this.advance();
                    }
                }
                this.advance(); //go past the )
                return { kind: 'FuncCall', identifier, args, line: this.at().line } as FuncCall;
            }
        }
        return this.parseComparatorExpr();
    }



    private parseComparatorExpr(): Expr {
        const left = this.parseAssignmentExpr();
        if (this.at().type == TokenType.ComparatorOperator) {
            const operator = this.advance().value; //advance past operator
            const right = this.parseAssignmentExpr();
            return { kind: 'ComparatorExpr', left, right, operator, line: this.at().line } as ComparatorExpr;
        }
        return left;
    }

    private parseAssignmentExpr(): Expr {
        const left = this.parseAdditiveExpr();
        if (this.at().type == TokenType.Assignment) {
            this.advance(); //advance past =
            const value = this.parseAdditiveExpr();
            return { value, assigne: left, kind: 'AssignmentExpr', line: this.at().line } as AssignmentExpr;
        }
        return left;
    }

    private parseAdditiveExpr(): Expr {
        let left = this.parseMultiplicativeExpr();
        while (this.at().value == '+' || this.at().value == '-') {
            const operator = this.advance().value;
            const right = this.parseMultiplicativeExpr();
            left = { kind: 'BinaryExpr', left, right, operator, line: this.at().line } as BinaryExpr;
        }
        return left;
    }

    private parseMultiplicativeExpr(): Expr {
        let left = this.parseExponentialExpr();
        while (this.at().value == '/' || this.at().value == '*' || this.at().value == '%' || this.at().value == '//') {
            const operator = this.advance().value;
            const right = this.parseExponentialExpr();
            left = { kind: 'BinaryExpr', left, right, operator, line: this.at().line } as BinaryExpr;
        }
        return left;
    }

    private parseExponentialExpr(): Expr {
        let left = this.parseAttributeLookup();
        while (this.at().value == '^') {
            const operator = this.advance().value;
            const right = this.parseAttributeLookup();
            left = { kind: 'BinaryExpr', left, right, operator, line: this.at().line } as BinaryExpr;
        }
        return left;
    }

    //private parseAttributeLookup(): Expr {
    //    if (this.at().type == TokenType.Identifier && this.peek().type == TokenType.Ponto) {
    //        const symbol = this.advance().value; // advance past identifier
    //        this.advance(); // advance past dot
    //        const lookup = this.parseStmt(); // parse the expression after the dot
    //        return {kind:"AttributeLookup",symbol,lookup} as AttributeLookup;
    //    }
    //    return this.parsePrimaryExpr();
    //}

    private parseAttributeLookup(): Expr {
        let expr = this.parseConvertExpr();

        if (expr.kind != 'Identifier') return expr;
        const newexpr = expr as Identifier;
        let property = '';
        while (true) {
            if (this.at().type == TokenType.Ponto) {
                this.advance(); // go past .
                property = this.eatOnly(TokenType.Identifier, "Expected property name after '.'").value;
                expr = { kind: 'AttributeLookup', symbol: newexpr.symbol, lookup: property, line: this.at().line } as AttributeLookup;
            } else if (this.at().type == TokenType.LParen) {
                this.advance();

                const args = [] as Expr[];
                while (this.at().type != TokenType.RParen && this.at().type != TokenType.EOF) {
                    if (this.at().type != TokenType.Virgula) {
                        const s = this.parseStmt();
                        args.push(s);
                    } else {
                        this.advance();
                    }
                }
                this.advance(); //go past the )
                expr = { kind: 'CallLookup', symbol: newexpr.symbol, call: property, args, line: this.at().line } as CallLookup;
            } else {
                break;
            }
        }

        return expr;
    }

    private parseConvertExpr(): Stmt {
        // converter(expr para tipo)
        if (this.at().type != TokenType.Converter) {
            return this.parseUnaryExpr();
        }

        this.advance(); //go past converter
        this.eatOnly(TokenType.LParen, "Esperava um '('");
        const value = this.parseExpr();
        this.eatOnly(TokenType.Para, "Esperava um 'para'");
        const typeToken = this.eatOnly(TokenType.Identifier, "Esperava um tipo");
        const type: ValueType = "NullVal";
        this.eatOnly(TokenType.RParen, "Esperava um ')'");
        return { kind: 'ConvertExpr', value, type:typeToken.value, line: this.at().line } as ConvertExpr;
    }

    private parseUnaryExpr(): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Nao:
                this.advance();
                const value = this.parseUnaryExpr();
                return { kind: 'UnaryExpr', operator: 'nao', value, line: this.at().line } as UnaryExpr;
            case TokenType.Menos:
                this.advance();
                const negValue = this.parseUnaryExpr();
                return { kind: 'UnaryExpr', operator: '-', value: negValue, line: this.at().line } as UnaryExpr;
            default:
                return this.parseListExpr();
        }
    }

    private parseListExpr(): Expr {
        if (this.at().type == TokenType.LColch) {
            this.advance();
            const list = [] as Expr[];
            while (this.at().type != TokenType.RColch && this.at().type != TokenType.EOF) {
                if (this.at().type != TokenType.Virgula) {
                    const s = this.parseStmt();
                    list.push(s);
                } else {
                    this.advance();
                }
            }
            this.advance();
            return { kind: 'ListLiteral', values: list, line: this.at().line } as ListLiteral;
        }
        return this.parsePrimaryExpr();
    }

    private parsePrimaryExpr(): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Identifier:
                const id = this.advance().value;
                const lookup = [];
                while (this.at().type == TokenType.LColch) {
                    this.advance();

                    lookup.push(this.parseStmt());
                    this.eatOnly(TokenType.RColch, 'Esperava um ]');
                }
                if (lookup.length > 0) {
                    return { kind: 'ListIdentifier', symbol: id, lookup: lookup, line: this.at().line } as ListIdentifier;
                }
                return { kind: 'Identifier', symbol: id, line: this.at().line } as Identifier;
            case TokenType.Ponto:
                return { kind: 'Dot', line: this.at().line } as Dot;
            case TokenType.Number:
                return { kind: 'NumericLiteral', value: parseFloat(this.advance().value), line: this.at().line } as NumericLiteral;
            case TokenType.StringLiteral:
                return { kind: 'StringLiteral', value: this.advance().value, line: this.at().line } as StringLiteral;
            case TokenType.LParen:
                this.advance();
                const value = this.parseStmt();
                this.eatOnly(TokenType.RParen, "')' esperado mas não encontrado.");
                value.line = this.at().line;
                return value;
            case TokenType.EOL:
                this.advance();
                return { kind: 'EOL', line: this.at().line } as EndOfLine;
            case TokenType.Assignment:
                this.advance();
                const valAssign = this.parseStmt();
                valAssign.line = this.at().line;
                return valAssign;
            case TokenType.Novo:
                this.advance(); //past 'novo'
                const className = this.eatOnly(TokenType.Identifier, 'Esperava um nome de uma classe').value;
                this.eatOnly(TokenType.LParen, 'Esperava um (');
                const args: Expr[] = [];
                if (!(this.at().type == TokenType.RParen)) {
                    do {
                        args.push(this.parseExpr());
                    } while (this.at().type == TokenType.Virgula);
                }
                this.eatOnly(TokenType.RParen, 'Esperava um )');
                return { kind: 'NewObjectExpr', class: className, args: args, line: this.at().line } as NewObjectExpr;
            default:
                throw reportError("Token inesperado: '" + this.at().value + "'", this.at().line);
        }
    }

    private parseBody(): Body {
        const lines = [] as Stmt[];
        while (this.at().type != TokenType.RChave && this.at().type != TokenType.EOF) {
            const s = this.parseStmt();
            lines.push(s);
        }
        return { kind: 'Body', lines, line: this.at().line };
    }
}
