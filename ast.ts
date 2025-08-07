import { ValueType } from "./values.ts";

export type nodeType = 
| "Program"
| "NumericLiteral"
| "RealLiteral"
| "StringLiteral"
| "ListLiteral"
| "Identifier"
| "ListIdentifier"
| "BinaryExpr"
| "ComparatorExpr"
| "AssignmentExpr"
| "UnaryExpr"
| "EOL"

| "Property"
| "ObjectLiteral"

| "IfStmt"
| "SwitchStmt"

| "ForStmt"
| "ForEachStmt"

| "WhileStmt"
| "UntilStmt"

| "EndScope"
| "Dot"

| "VarDecl"

| "FuncDecl"
| "FuncCall"
| "ReturnExpr"
| "ArgumentExpr"

| "ConvertExpr"

| "InputStmt"
| "OutputStmt"

| "RetaExpr"
| "DesenharExpr"
| "LimparExpr"

| "AttributeLookup"
| "CallLookup"

| "Class"
| "ClassAtribute"
| "ClassConstructor"
| "ClassFunction"

| "ObjectLiteral"
| "NewObjectExpr";

export interface Stmt {
    kind: nodeType;
    line: number;
}

export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

export interface Class extends Stmt {
    kind: "Class";
    identifier: string;
    body: Stmt[];
    parent?: string; // Nome da classe pai, se houver
}

export interface NewObjectExpr extends Stmt {
    kind: "NewObjectExpr";
    class: string;
    args: Expr[];
}

export interface ObjectLiteral extends Expr {
    kind: "ObjectLiteral";
    className: string;
}

export interface ClassConstructor extends Stmt {
    kind: "ClassConstructor";
    function: FuncDecl;
}


export interface InputStmt extends Stmt {
    kind: "InputStmt";
    text?: Expr;
    varname?: string;
}

export interface OutputStmt extends Stmt {
    kind: "OutputStmt";
    value: Expr;
    final: string;
}

export interface IfStmt extends Stmt {
    kind: "IfStmt";
    comparison: Expr;
    body: Stmt[];
    else?: Stmt[];
    elseif?: IfStmt[];
}

export interface ForStmt extends Stmt {
    kind: "ForStmt";
    body: Stmt[];
    variable: Identifier;
    startIndex: Expr;
    endIndex: Expr;
    step: Expr;
}

export interface ForEachStmt extends Stmt {
    kind: "ForEachStmt";
    body: Stmt[];
    variable: Identifier;
    list: Identifier;
}

export interface WhileStmt extends Stmt {
    kind: "WhileStmt";
    body: Stmt[];
    comparison: Expr;
}

export interface UntilStmt extends Stmt {
    kind: "UntilStmt";
    body: Stmt[];
    comparison: Expr;
}


export interface VarDecl extends Stmt {
    kind: "VarDecl";
    identifier: string;
    type:string;
    value?: Expr;
}

export interface FuncDecl extends Stmt {
    kind: "FuncDecl";
    identifier: string;
    type:ValueType;
    args:ArgumentExpr[];
    body:Stmt[];
}

export interface FuncCall extends Stmt {
    kind: "FuncCall";
    identifier: string;
    args:Expr[];
}

export interface ArgumentExpr extends Expr {
    kind: "ArgumentExpr";
    identifier: string;
    type?: string;
}

export interface Expr extends Stmt {}

export interface UnaryExpr extends Expr {
    kind: "UnaryExpr";
    operator: string;
    value: Expr;
}

export interface ConvertExpr extends Expr {
    kind: "ConvertExpr";
    value: Expr;
    type: ValueType;
}

export interface RetaExpr extends Expr {
    kind: "RetaExpr";
    x1:Expr;
    y1:Expr;
    x2:Expr;
    y2:Expr;
}

export interface DesenharExpr extends Expr {
    kind: "DesenharExpr";
    x:Expr;
    y:Expr;
    w:Expr;
    h:Expr;
    img:Expr;
}

export interface LimparExpr extends Expr {
    kind: "LimparExpr";
}

export interface BinaryExpr extends Expr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface ComparatorExpr extends Expr {
    kind: "ComparatorExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface Identifier extends Expr {
    kind: "Identifier";
    symbol: string;
}

export interface AttributeLookup extends Expr {
    kind: "AttributeLookup";
    symbol: string;
    lookup: string;
}

export interface CallLookup extends Expr {
    kind: "CallLookup";
    symbol: string;
    call: string;
    args: Expr[];
}

export interface StringLiteral extends Expr {
    kind: "StringLiteral";
    value: string;
}

export interface AssignmentExpr extends Expr {
    kind: "AssignmentExpr";
    assigne: Expr;
    value: Expr;
}

export interface NumericLiteral extends Expr {
    kind: "NumericLiteral";
    value: number;
}

export interface RealLiteral extends Expr {
    kind: "RealLiteral";
    value: number;
}

export interface ReturnExpr extends Expr {
    kind: "ReturnExpr";
    value: Expr;
}

export interface ListLiteral extends Expr {
    kind: "ListLiteral";
    values: Expr[];
}

export interface ListIdentifier extends Expr {
    kind:"ListIdentifier";
    symbol:string;
    lookup:Stmt;
}

export interface EndOfLine extends Expr {
    kind: "EOL";
}

export interface Dot extends Expr {
    kind: "Dot";
}
