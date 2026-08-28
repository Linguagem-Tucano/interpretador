import { ValueType } from './values.ts';

export type nodeType = 'Program' | 'NumericLiteral' | 'StringLiteral' | 'ListLiteral' | 'Identifier' | 'ListIdentifier' | 'BinaryExpr' | 'ComparatorExpr' | 'AssignmentExpr' | 'UnaryExpr' | 'EOL' | 'Body' | 'Property' | 'ObjectLiteral' | 'IfStmt' | 'SwitchStmt' | 'ForStmt' | 'ForEachStmt' | 'WhileStmt' | 'UntilStmt' | 'EndScope' | 'Dot' | 'VarDecl' | 'FuncDecl' | 'FuncCall' | 'ReturnExpr' | 'ArgumentExpr' | 'ConvertExpr' | 'AttributeLookup' | 'CallLookup' | 'ClassExpr' | 'ClassAtribute' | 'ClassConstructor' | 'ClassFunction' | 'ObjectLiteral' | 'NewObjectExpr' | 'PropertyDecl';

export interface Stmt {
    kind: nodeType;
    line: number;
}

export interface Program extends Stmt {
    kind: 'Program';
    body: Body;
}

export interface Body extends Stmt {
    kind: 'Body';
    lines: Stmt[];
}

export interface ClassExpr extends Stmt {
    kind: 'ClassExpr';
    identifier: string;
    body: Body;
    parent?: string; // Nome da classe pai, se houver
}

// Dentro de ast.ts
export interface PropertyDecl extends Stmt {
    kind: 'PropertyDecl';
    modifier: 'publico' | 'privado';
    name: string;
    type: string; // "caractere", "int", etc.
}

export interface NewObjectExpr extends Stmt {
    kind: 'NewObjectExpr';
    class: string;
    args: Expr[];
}

export interface ObjectLiteral extends Expr {
    kind: 'ObjectLiteral';
    className: string;
}

export interface ClassConstructor extends Stmt {
    kind: 'ClassConstructor';
    function: FuncDecl;
}

export interface IfStmt extends Stmt {
    kind: 'IfStmt';
    comparison: Expr;
    body: Body;
    else?: Body;
    elseif?: IfStmt[];
}

export interface SwitchStmt extends Stmt {
    kind: 'SwitchStmt';
    value: Expr;
    cases: Map<Expr, Body>;
}

export interface ForStmt extends Stmt {
    kind: 'ForStmt';
    body: Body;
    variable: Identifier;
    startIndex: Expr;
    endIndex: Expr;
    step: Expr;
}

export interface ForEachStmt extends Stmt {
    kind: 'ForEachStmt';
    body: Body;
    variable: Identifier;
    list: Identifier;
}

export interface WhileStmt extends Stmt {
    kind: 'WhileStmt';
    body: Body;
    comparison: Expr;
}

export interface UntilStmt extends Stmt {
    kind: 'UntilStmt';
    body: Body;
    comparison: Expr;
}

export interface VarDecl extends Stmt {
    kind: 'VarDecl';
    identifier: string;
    type: string;
    value?: Expr;
    global: boolean;
}

export interface FuncDecl extends Stmt {
    kind: 'FuncDecl';
    identifier: string;
    type: ValueType;
    args: ArgumentExpr[];
    body: Body;
}

export interface FuncCall extends Stmt {
    kind: 'FuncCall';
    identifier: string;
    args: Expr[];
}

export interface ArgumentExpr extends Expr {
    kind: 'ArgumentExpr';
    identifier: string;
    type?: string;
}

export interface Expr extends Stmt {}

export interface UnaryExpr extends Expr {
    kind: 'UnaryExpr';
    operator: string;
    value: Expr;
}

export interface ConvertExpr extends Expr {
    kind: 'ConvertExpr';
    value: Expr;
    type: ValueType;
}

export interface BinaryExpr extends Expr {
    kind: 'BinaryExpr';
    left: Expr;
    right: Expr;
    operator: string;
}

export interface ComparatorExpr extends Expr {
    kind: 'ComparatorExpr';
    left: Expr;
    right: Expr;
    operator: string;
}

export interface Identifier extends Expr {
    kind: 'Identifier';
    symbol: string;
}

export interface AttributeLookup extends Expr {
    kind: 'AttributeLookup';
    symbol: string;
    lookup: string;
}

export interface CallLookup extends Expr {
    kind: 'CallLookup';
    symbol: string;
    call: string;
    args: Expr[];
}

export interface StringLiteral extends Expr {
    kind: 'StringLiteral';
    value: string;
}

export interface AssignmentExpr extends Expr {
    kind: 'AssignmentExpr';
    assigne: AttributeLookup | ListIdentifier | Identifier;
    value: Expr;
}

export interface NumericLiteral extends Expr {
    kind: 'NumericLiteral';
    value: number;
}

export interface ReturnExpr extends Expr {
    kind: 'ReturnExpr';
    value: Expr;
}

export interface ListLiteral extends Expr {
    kind: 'ListLiteral';
    values: Expr[];
}

export interface ListIdentifier extends Expr {
    kind: 'ListIdentifier';
    symbol: string;
    lookup: Stmt[];
}

export interface EndOfLine extends Expr {
    kind: 'EOL';
}

export interface Dot extends Expr {
    kind: 'Dot';
}
