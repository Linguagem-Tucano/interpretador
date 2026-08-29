// deno-lint-ignore-file no-case-declarations
import { BooleanVal, ListVal, MK_NULL, NullVal, NumberVal, ObjectVal, ReturnVal, RuntimeVal, StringVal, ValueType } from './values.ts';
import { ArgumentExpr, AssignmentExpr, AttributeLookup, BinaryExpr, Body, CallLookup, ClassExpr, ComparatorExpr, ConvertExpr, ForEachStmt, ForStmt, FuncCall, FuncDecl, Identifier, IfStmt, ListIdentifier, ListLiteral, NewObjectExpr, NumericLiteral, ObjectLiteral, Program, ReturnExpr, Stmt, StringLiteral, SwitchStmt, UnaryExpr, UntilStmt, VarDecl, WhileStmt } from './ast.ts';
import Environment from './environment.ts';
import { reportError } from './main.ts';
import { Function } from './function.ts';

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
    switch (astNode.kind) {
        case 'NumericLiteral':
            return { value: (astNode as NumericLiteral).value, type: 'NumberVal' } as NumberVal;
        case 'StringLiteral':
            return { value: (astNode as StringLiteral).value, type: 'StringVal' } as StringVal;
        case 'ObjectLiteral':
            return { className: (astNode as ObjectLiteral).className, value: 'Objeto da classe ' + (astNode as ObjectLiteral).className, env, type: 'ObjectVal' } as ObjectVal;
        case 'ListLiteral':
            return evaluateListLiteral(astNode as ListLiteral, env);
        case 'ListIdentifier':
            return evaluateListIdentifier(astNode as ListIdentifier, env);
        case 'BinaryExpr':
            return evaluateBinaryExpr(astNode as BinaryExpr, env);
        case 'Identifier':
            return evaluateIdentifier(astNode as Identifier, env);
        case 'Program':
            return evaluateProgram(astNode as Program, env);
        case 'VarDecl':
            return evaluateVarDecl(astNode as VarDecl, env);
        case 'AssignmentExpr':
            return evaluateVarAssignment(astNode as AssignmentExpr, env);
        case 'ComparatorExpr':
            return evaluateComparison(astNode as ComparatorExpr, env);
        case 'IfStmt':
            return evaluateIfStmt(astNode as IfStmt, env);
        case 'ForStmt':
            return evaluateForStmt(astNode as ForStmt, env);
        case 'ForEachStmt':
            return evaluateForEachStmt(astNode as ForEachStmt, env);
        case 'WhileStmt':
            return evaluateWhileStmt(astNode as WhileStmt, env);
        case 'UntilStmt':
            return evaluateUntilStmt(astNode as UntilStmt, env);
        case 'FuncDecl':
            return evaluateFuncDecl(astNode as FuncDecl, env);
        case 'FuncCall':
            return evaluateFuncCall(astNode as FuncCall, env);
        case 'ClassExpr':
            return evaluateClassDecl(astNode as ClassExpr, env);
        case 'ReturnExpr':
            return evaluateReturnExpr(astNode as ReturnExpr, env);
        case 'NewObjectExpr':
            return evaluateNewObjectExpr(astNode as NewObjectExpr, env);
        case 'AttributeLookup':
            return evaluateAttributeLookup(astNode as AttributeLookup, env);
        case 'CallLookup':
            return evaluateCallLookup(astNode as CallLookup, env);
        case 'ConvertExpr':
            return evaluateConvertExpr(astNode as ConvertExpr, env);
        case 'UnaryExpr':
            return evaluateUnaryExpr(astNode as UnaryExpr, env);
        case 'EOL':
            return MK_NULL();
        case 'SwitchStmt':
            return evaluateSwitchStmt(astNode as SwitchStmt, env);
        case 'Body':
            return evaluateBlock(astNode as Body, env);
        default:
            throw reportError('Tipo de nó desconhecido: ' + astNode.kind, astNode.line);
    }
}

function evaluateBlock(block: Body, env: Environment): RuntimeVal {
    let result: RuntimeVal = MK_NULL();

    for (const stmt of block.lines) {
        result = evaluate(stmt, env);

        if (result.type === 'ReturnVal') {
            return result; // Bubbles up!
        }
    }

    return result;
}

function evaluateSwitchStmt(node: SwitchStmt, env: Environment): RuntimeVal {
    const mapaResolvido = new Map<string, Body>();

    for (const [chave, valor] of node.cases) {
        mapaResolvido.set(evaluate(chave, env).value, valor);
    }

    const mestre = evaluate(node.value, env).value;

    const body = mapaResolvido.get(mestre) ?? ({ kind: 'Body', lines: [], line: node.line } as Body);

    const newEnv = new Environment(env);

    return evaluateBlock(body, newEnv);
}

function evaluateUnaryExpr(node: UnaryExpr, env: Environment): RuntimeVal {
    switch (node.operator) {
        case 'nao':
            const nope = evaluate(node.value, env) as RuntimeVal;
            if (nope.type != 'BooleanVal') {
                throw reportError('Tentou negar um valor não booleano', node.line);
            }

            return { ...nope, value: !nope.value };
        case '-':
            const val = evaluate(node.value, env);
            if (val.type != 'NumberVal') {
                throw reportError('Tentou negativar um valor não numérico', node.line);
            }
            val.value = -1 * val.value;
            return val;
        default:
            throw reportError('Operador unário desconhecido: ' + node.operator, node.line);
    }
}

function evaluateConvertExpr(node: ConvertExpr, env: Environment): RuntimeVal {
    const value = evaluate(node.value, env);
    const firstType = value.type as ValueType;
    const desiredType = node.type as string;

    switch (desiredType) {
        case 'texto':
            if (firstType == 'NumberVal') {
                return { type: 'StringVal', value: value.value.toString() } as StringVal;
            } else if (firstType == 'BooleanVal') {
                return { type: 'StringVal', value: value.value ? 'verdadeiro' : 'falso' } as StringVal;
            } else if (firstType == 'ListVal') {
                const list = value as ListVal;
                const strList = list.value.map((item) => item.value).join(', ');
                return { type: 'StringVal', value: strList } as StringVal;
            } else {
                throw reportError('Não é possível converter ' + firstType + ' para texto.', node.line);
            }
        case 'numero':
            if (firstType == 'StringVal') {
                const num = parseFloat(value.value);
                if (isNaN(num)) {
                    throw reportError("Não é possível converter '" + value.value + "' para número.", node.line);
                }
                return { type: 'NumberVal', value: num } as NumberVal;
            } else if (firstType == 'BooleanVal') {
                return { type: 'NumberVal', value: value.value ? 1 : 0 } as NumberVal;
            } else {
                throw reportError('Não é possível converter ' + firstType + ' para inteiro.', node.line);
            }
        case 'logico':
            if (firstType == 'StringVal') {
                return { type: 'BooleanVal', value: value.value == 'verdadeiro' ? true : false } as BooleanVal;
            } else if (firstType == 'NumberVal') {
                return { type: 'BooleanVal', value: value.value > 0 ? true : false } as BooleanVal;
            } else {
                throw reportError('Não é possível converter ' + firstType + ' para lógico.', node.line);
            }
        default:
            throw reportError('Tipo de conversão desconhecido: ' + desiredType, node.line);
    }
}

function evaluateAttributeLookup(node: AttributeLookup, env: Environment): RuntimeVal {
    const obj = lookupVar(node, node.symbol, env) as ObjectVal;
    const objEnv = obj.env;
    //const ret = evaluate(node.lookup, objEnv); //descobri
    const ret = lookupVar(node, node.lookup, objEnv);
    //console.log(ret);
    return ret;
}

function evaluateCallLookup(node: CallLookup, env: Environment): RuntimeVal {
    const obj = lookupVar(node, node.symbol, env) as ObjectVal;
    const objEnv = obj.env;

    const c = { identifier: node.call, args: node.args, kind: 'FuncCall', line: node.line } as FuncCall;
    const ret = evaluateFuncCall(c, objEnv, env); //para ele fazer lookup no ambiente normal.
    return ret;
}

function evaluateNewObjectExpr(node: NewObjectExpr, env: Environment): RuntimeVal {
    const nodeClass = env.resolveClass(node.class);

    const _parent = nodeClass.parent;
    const body = nodeClass.body;

    const objectEnv = new Environment();

    objectEnv.declareVar('isso', { type: 'ObjectVal', value: 'Objeto da classe ' + node.class, env: objectEnv } as ObjectVal, 'ObjectVal');

    evaluateBlock(body, objectEnv);

    const args = node.args;
    const identifier = 'construtor';

    const call = { kind: 'FuncCall', args, identifier } as FuncCall;
    //console.log(objectEnv);
    return evaluateFuncCall(call, objectEnv);
}

function evaluateClassDecl(node: ClassExpr, env: Environment): RuntimeVal {
    //declare class in environment
    env.declareClass(node);
    return MK_NULL();
}

function evaluateWhileStmt(node: WhileStmt, env: Environment): RuntimeVal {
    const comparison = node.comparison;
    const newEnv = new Environment(env);

    const body = node.body;

    let result = {} as RuntimeVal;

    while (true) {
        const condition = evaluate(comparison, newEnv) as BooleanVal;
        if (!condition.value) break;

        result = evaluateBlock(body, newEnv);

        if (result.type == 'ReturnVal') return result;
        // adicionar "sair" e "pular"
    }

    return result;
}

function evaluateUntilStmt(node: UntilStmt, env: Environment): RuntimeVal {
    const comparison = node.comparison;
    const newEnv = new Environment(env);

    const body = node.body;

    let result = {} as RuntimeVal;

    while (true) {
        const condition = evaluate(comparison, newEnv) as BooleanVal;
        if (condition.value) break;

        result = evaluateBlock(body, newEnv);

        if (result.type == 'ReturnVal') return result;
        // adicionar "sair" e "pular"
    }

    return result;
}

function evaluateListIdentifier(node: ListIdentifier, env: Environment): RuntimeVal {
    const symbol = node.symbol;
    if (env.hasVar(symbol)) {
        let list = lookupVar(node, symbol, env) as ListVal;
        let i = node.lookup.length - 1;
        let curr = 0;
        while (i > 0) {
            i--;
            const smallLookup = evaluate(node.lookup[curr], env) as NumberVal;
            if (list.listType !== 'ListVal') {
                throw reportError('Tentou buscar um índice em uma variável que não é lista', node.line);
            }
            list = list.value[smallLookup.value] as ListVal;
            curr++;
        }
        const lookup = evaluate(node.lookup[curr], env) as NumberVal;
        return list.value[lookup.value];
    } else {
        throw reportError('Lista não existe', node.line);
    }
}

function evaluateListLiteral(node: ListLiteral, env: Environment): RuntimeVal {
    const values = node.values;
    let type = null;
    const list = [] as RuntimeVal[];
    for (let i = 0; i <= values.length - 1; i++) {
        const value = values[i];

        const v = evaluate(value, env);
        if (type == null) {
            type = v.type;
        }

        if (type != v.type) {
            throw reportError('Tipo inconsistente de dados na lista.', node.line);
        }

        list.push(v);
    }
    return { type: 'ListVal', value: list, listType: type } as ListVal;
}

function evaluateReturnExpr(node: ReturnExpr, env: Environment): RuntimeVal {
    return { type: 'ReturnVal', value: evaluate(node.value, env) } as ReturnVal;
}

function evaluateFuncDecl(node: FuncDecl, env: Environment): RuntimeVal {
    env.declareFunc(node);
    return MK_NULL();
}

function evaluateForStmt(node: ForStmt, env: Environment): RuntimeVal {
    const starti = node.startIndex;
    const i = evaluate(starti, env);
    const endi = node.endIndex;
    const end = evaluate(endi, env);
    const identifier = node.variable.symbol;
    const step = evaluate(node.step, env) as NumberVal;

    const body = node.body;
    let ending = {} as RuntimeVal;
    for (let index = i.value; index <= end.value; index += step.value) {
        const newEnv = new Environment(env);

        if (!newEnv.hasVar(identifier)) {
            newEnv.declareVar(identifier, { value: index, type: 'NumberVal' } as NumberVal, 'NumberVal');
        } else {
            newEnv.assignVar(identifier, { value: index, type: 'NumberVal' } as NumberVal);
        }
        ending = evaluateBlock(body, newEnv);
        if (ending.type == 'ReturnVal') return ending; // bubble up
    }

    return ending;
}

function evaluateForEachStmt(node: ForEachStmt, env: Environment): RuntimeVal {
    const lista = node.list.symbol;
    const identifier = node.variable.symbol;

    let list;
    //check list
    if (env.hasVar(lista)) {
        list = lookupVar(node, lista, env) as ListVal;
    } else {
        throw reportError('Lista não existe', node.line);
    }

    const val = 0;
    const valMax = list.value.length - 1;

    const startItem = list.value[val];

    if (!env.hasVar(identifier)) {
        env.declareVar(identifier, startItem, startItem.type);
    } else {
        env.assignVar(identifier, startItem);
    }

    const body = node.body;
    let ending = {} as RuntimeVal;
    const newEnv = new Environment(env);
    for (let val = 0; val <= valMax; val += 1) {
        const item = list.value[val];
        env.assignVar(identifier, item);

        ending = evaluateBlock(body, newEnv);
        if (ending.type == 'ReturnVal') return ending; //bubble up
    }

    return ending;
}

function evaluateIfStmt(node: IfStmt, env: Environment): RuntimeVal {
    const comparison = node.comparison;
    const body = node.body;
    const resultComp = evaluate(comparison, env) as BooleanVal;
    let lastRes = MK_NULL() as RuntimeVal;
    const newEnv = new Environment(env);
    if (resultComp.value == true) {
        lastRes = evaluateBlock(body, newEnv);
        if (lastRes.type == 'ReturnVal') return lastRes; //bubble up
    } else if (node.else) {
        lastRes = evaluateBlock(node.else, newEnv);
        if (lastRes.type == 'ReturnVal') return lastRes; //bubble up
    }
    return lastRes;
}

function evaluateComparison(node: ComparatorExpr, env: Environment): RuntimeVal {
    const operator = node.operator;
    const result = { value: false, type: 'BooleanVal' } as BooleanVal;
    let left, right;
    try {
        switch (operator) {
            case '==':
                left = evaluate(node.left, env);
                right = evaluate(node.right, env);
                result.value = left.value == right.value && left.type == right.type;
                break;
            case '>=':
                left = evaluate(node.left, env);
                right = evaluate(node.right, env);
                if (right.type == 'NumberVal' && left.type == 'NumberVal') {
                    result.value = left.value >= right.value;
                    break;
                } else {
                    throw reportError('Tentou avaliar dois tipos incompativeis: ' + evaluate(node.left, env).type + ' e ' + evaluate(node.right, env).type, node.line);
                }
            case '<=':
                left = evaluate(node.left, env);
                right = evaluate(node.right, env);
                if (right.type == 'NumberVal' && left.type == 'NumberVal') {
                    result.value = left.value <= right.value;
                    break;
                } else {
                    throw reportError('Tentou avaliar dois tipos incompativeis: ' + evaluate(node.left, env).type + ' e ' + evaluate(node.right, env).type, node.line);
                }
            case '>':
                left = evaluate(node.left, env);
                right = evaluate(node.right, env);
                if (right.type == 'NumberVal' && left.type == 'NumberVal') {
                    result.value = left.value > right.value;
                    break;
                } else {
                    throw reportError('Tentou avaliar dois tipos incompativeis: ' + evaluate(node.left, env).type + ' e ' + evaluate(node.right, env).type, node.line);
                }
            case '<':
                left = evaluate(node.left, env);
                right = evaluate(node.right, env);
                if (right.type == 'NumberVal' && left.type == 'NumberVal') {
                    result.value = left.value < right.value;
                    break;
                } else {
                    throw reportError('Tentou avaliar dois tipos incompativeis: ' + evaluate(node.left, env).type + ' e ' + evaluate(node.right, env).type, node.line);
                }

            case '~=':
                left = evaluate(node.left, env);
                right = evaluate(node.right, env);
                result.value = left.value != right.value || left.type != right.type;
        }
        return result;
    } catch (error) {
        throw reportError(error as string, node.line);
    }
}

function evaluateVarDecl(variable: VarDecl, env: Environment): RuntimeVal {
    const value = variable.value ? evaluate(variable.value, env) : MK_NULL();
    const hasValue = variable.value ? true : false;
    let assignedtype = value.type;
    let type = 'NullVal' as ValueType;
    let listType = 'NullVal' as ValueType;
    switch (variable.type) {
        case 'numero':
            type = 'NumberVal';
            break;
        case 'texto':
            type = 'StringVal';
            break;
        case 'logico':
            type = 'BooleanVal';
            break;
        case 'numero[]':
            type = 'ListVal';
            listType = 'NumberVal';
            break;
        case 'texto[]':
            type = 'ListVal';
            listType = 'StringVal';
            break;
        case 'logico[]':
            type = 'ListVal';
            listType = 'BooleanVal';
            break;
        default:
            if (env.hasClass(variable.type)) {
                type = 'ObjectVal';
            }
    }

    if (hasValue && type != assignedtype) {
        throw reportError('Tipo de variavel errado. Esperava: ' + type + ' e recebi: ' + assignedtype, variable.line);
    }

    if (type == 'ListVal' && hasValue) {
        if ((value as ListVal).listType != listType) {
            throw reportError('Lista com tipo incompatível. Esperava ' + listType + ' e recebi: ' + (value as ListVal).listType, variable.line);
        }
    }

    const varEnv = variable.global ? GLOBAL_ENV : env;

    try {
        varEnv.declareVar(variable.identifier, value, type as ValueType);
    } catch (error) {
        throw reportError(error as string, variable.line);
    }
    return value;
}

function evaluateVarAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    if (node.assigne.kind === 'AttributeLookup') {
        return evaluateAttributeAssignment(node, env);
    }

    const varname = node.assigne;

    const valueside = evaluate(node.value, env);

    const vartype = lookupVar(node, (varname as Identifier).symbol, env).type as ValueType as string as ValueType;
    const assigneetype = valueside.type as ValueType;

    if (assigneetype == vartype || vartype == 'NullVal') {
        return env.assignVar(varname.symbol, valueside);
    } else {
        throw reportError('Tipo de variavel errado. Esperava: ' + vartype + ' e recebi: ' + assigneetype, node.line);
    }
}

function evaluateAttributeAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    const attLookup = node.assigne as AttributeLookup;
    const obj = lookupVar(node, attLookup.symbol, env) as ObjectVal;
    const objEnv = obj.env;
    const varname = attLookup.lookup;

    let valueside = evaluate(node.value, env);

    const vartype = lookupVar(node, varname, objEnv).type as ValueType as string;
    const assigneetype = valueside.type;

    if (assigneetype == vartype) {
        return objEnv.assignVar(varname, valueside);
    } else {
        throw reportError('Tipo de variavel errado. Esperava: ' + vartype + ' e recebi: ' + assigneetype, node.line);
    }
}

function evaluateIdentifier(identifier: Identifier, env: Environment): RuntimeVal {
    //change this
    const val = lookupVar(identifier, identifier.symbol, env);
    return val;
}

function evaluateFuncCall(node: FuncCall, env: Environment, argsEnv?: Environment): RuntimeVal {
    //check if argsEnv was passed
    argsEnv = argsEnv ? argsEnv : env;

    const identifier = node.identifier;
    //call function
    let func: Function;
    try {
        func = env.lookupFunc(identifier);
    } catch (error) {
        throw reportError(error as string, node.line);
    }
    //get the arguments
    const args = func.args ? func.args : ([] as ArgumentExpr[]);
    const passedArgs = node.args;

    //check if arguments match
    if (args.length != passedArgs.length) {
        throw reportError('Esperava ' + args.length + ' argumentos, recebi ' + passedArgs.length, node.line);
    }

    const newEnv = new Environment(env);
    const argsList = [] as RuntimeVal[];
    if (args.length > 0) {
        //has arguments
        for (let index = 0; index < args.length; index++) {
            const arg = args[index];
            const passed = passedArgs[index];
            const pArg = evaluate(passed, argsEnv) as RuntimeVal;
            const passedType = pArg.type;
            if (arg.type == passedType || arg.type == 'NullVal') {
                newEnv.declareVar(arg.identifier, pArg, passedType);
                argsList.push(pArg);
            } else {
                throw reportError(`Função ${identifier} esperava argumento número ${index + 1} como ${arg.type} mas recebi ${passedType}`, node.line);
            }
        }
    }

    try {
        return func.call(newEnv);
    } catch (error) {
        throw reportError(error as string, node.line);
    }
}

function evaluateBinaryExpr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const leftHand = evaluate(binop.left, env);
    const rightHand = evaluate(binop.right, env);

    //needs to match to "NumberVal", "RealVal", "NumericLiteral". How do i do that?
    if (leftHand.type == 'NullVal' || rightHand.type == 'NullVal') {
        return MK_NULL();
    }

    if (binop.operator == '..') {
        const l = leftHand as StringVal;
        const r = rightHand as StringVal;
        const v = l.value + r.value;
        const res = { type: 'StringVal', value: v } as StringVal;
        const result = res;
        return result;
    } else if (binop.operator == 'e' || binop.operator == 'ou' || binop.operator == 'xou') {
        const v = evaluateLogicalBinaryExpr(leftHand, rightHand, binop.operator, binop.line);
        return v;
    } else {
        //check if both are numeric values
        if (leftHand.type != 'NumberVal') {
            throw reportError('Tentativa de fazer operação numérica com valor não numérico: ' + leftHand.type, binop.line);
        }
        if (rightHand.type != 'NumberVal') {
            throw reportError('Tentativa de fazer operação numérica com valor não numérico: ' + rightHand.type, binop.line);
        }

        const left = leftHand as NumberVal;
        const right = rightHand as NumberVal;
        const v = evaluateNumericBinaryExpr(left, right, binop.operator);

        const result = v;
        return result;
    }
}

function evaluateLogicalBinaryExpr(left: RuntimeVal, right: RuntimeVal, op: string, line: number): BooleanVal {
    if (left.type != 'BooleanVal' || right.type != 'BooleanVal') {
        throw reportError('Tentativa de fazer operação logica com valores não booleanos', line);
    }

    switch (op) {
        case 'e':
            return { type: 'BooleanVal', value: left.value && right.value } as BooleanVal;
        case 'ou':
            return { type: 'BooleanVal', value: left.value || right.value } as BooleanVal;
        case 'xou':
            return { type: 'BooleanVal', value: left.value != right.value } as BooleanVal;
    }
    return { type: 'BooleanVal', value: false } as BooleanVal;
}

function evaluateNumericBinaryExpr(left: NumberVal, right: NumberVal, op: string): NumberVal {
    let result = 0;
    switch (op) {
        case '+':
            result = left.value + right.value;
            break;
        case '-':
            result = left.value - right.value;
            break;
        case '*':
            result = left.value * right.value;
            break;
        case '/':
            result = left.value / right.value;
            break;
        case '%':
            result = left.value % right.value;
            break;
        case '//':
            result = Math.floor(left.value / right.value);
            break;
        case '^':
            result = Math.pow(left.value, right.value);
            break;
    }
    return { type: 'NumberVal', value: result } as NumberVal;
}

let outputBuffer = '';
export function appendOutput(text: string) {
    outputBuffer += text;
}

export function clearOutputBuffer() {
    outputBuffer = '';
}

export function flushOutputBuffer() {
    if (outputBuffer.endsWith('\n')) {
        console.log(outputBuffer.trimEnd());
        clearOutputBuffer();
    }
}

let GLOBAL_ENV = {} as Environment;
export function setGlobalEnv(env: Environment) {
    GLOBAL_ENV = env;
}

function evaluateProgram(program: Program, env: Environment): RuntimeVal {
    outputBuffer = '';
    let lastEvaluated: RuntimeVal = { type: 'NullVal', value: 'nulo' } as NullVal;
    GLOBAL_ENV = env;

    lastEvaluated = evaluate(program.body, env);

    if (outputBuffer != '') {
        console.log(outputBuffer);
    }

    return lastEvaluated;
}

function lookupVar(node: Stmt, varname: string, env: Environment): RuntimeVal {
    try {
        return env.lookupVar(varname);
    } catch (error) {
        throw reportError(error as string, node.line);
    }
}
