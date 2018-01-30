// do(define(x,10),
//   if(>(x,5),
//     print("large"),
//     print("small")))



//returns object containing the data structure of an expression in the language
function parseExpression(program){
  program = skipSpace(program) //Redefine program with no spaces before
  let match, expr;
  //use fo regular expressions to spot the 3 atomic expressions in the EGG language
  if (match=/^"([^"]*)"/.exec(program))//any character that is not a " char, and that is between " "
    expr = {type:"value",value:match[1]}
  else if (match = /^\d+\b/.exec(program)) //Look for any digits
    expr = {type: "value", value: Number(match[0])}
  else if (match = /^[^\s(),"]+/.exec(program)) //Any expression that does not contain () empty spaces commas and "
    expr = {type: "word", name: match[0]}
  else
    throw new SyntaxError("Unexpected syntax: "+program)

  //check if expression is an application
  return parseApply(expr, program.slice(match[0].length))
}

//function to trim initial empty space from string
function skipSpace(string){ //take away initial space
  let first = string.search(/\S/)
  if (first == -1) return "";
  return string.slice(first)
}

//function that checks if an expression is an application, if so, parses a parenthesized string of arguments
function parseApply(expr,program){
  program = skipSpace(program)
  console.log("program "+program)
  //if the first character is not ( then it is not an application, returns the expr
  if (program[0] != "(")
    return {expr: expr, rest: program}

  //if it is, skip first character (
  program = skipSpace(program.slice(1))
  //defint expre as a apply typpe with an operator and a list of arguments
  expr = {type: "apply", operator:expr, args:[]}
  //While we don't reach the end of the application expression
  //create syntax tree
  while(program[0] != ")"){
    //parse each argument expressions until closing parenthesis is found
    let arg = parseExpression(program)
    expr.args.push(arg.expr)
    program = skipSpace(arg.rest)
    if(program[0] == ",")
      program = skipSpace(program.slice(1))
    else if (program[0] != ")")
      throw  new SyntaxError("Expected ',' or ')'")
  }
  return parseApply(expr, program.slice(1))
}

//parse function that verifies the program has reached the last line
function parse(program){
  let result = parseExpression(program)
  if(skipSpace(result.rest).length > 0)
    throw new SyntaxError("Unexpected text after program")
  return result.expr
}

console.log(parse("+(a,10)"))

//Evaluator takes a syntax tree. Evaluates the expression and returns the corresponding value
function evaluate(expr, env){ //takes an expression and its environment
  switch(expr.type){
    case "value": //a literal expression just produces a value
      return expr.value

    case "word":
      if (exp.name in env) //evaulate if the expression is defined in the environment
        return env[expr.name]
      else
        throw new ReferenceError("Undefined Variable: "+ expr.name)

    case "apply": //
      if (expr.operator.type == "word" &&
          expr.operator.name in specialForms) //special forms like if, while.
        return specialForms[expr.opertor.name](expr.args, env) //pass it to a function that evaluates this form

      let op = evaluate(expr.operator, env)
      if (typeof op != "function")
        throw new TypeError("Applying not a function")
      return op.apply(null, expr.args.map(function(arg){
        return evaluate(arg, env)
      }))
  }
}
//create special forms object we will fill with types of applciations
let specialForms = Object.create(null)

//define if statement for EGG language
//special forms are because if statement, contrary to other functions, is run before the value of its argument is
//determined. Normal functions first take the value of the arguments and then run the function
specialForms["if"] = function(args, env){
  if(args.length != 3) //EGG's if statement expects exactly three arguments
    throw new SyntaxError("Bad number of arguments to if")

  if(evaluate(args[0],env) !== false)
    return evaluate(args[1],env)
  else
    return evaluate(args[2],env)
}

specialForms["while"] = function(args,env){
  if(args.length != 2)
    throw new SyntaxError("Bad number of arguments to while")

  while(evaluate(args[0],env) !== false)
    evaluate(args[1], env)

  return false //return false cause undefined doesn't exist in EGG
}

specialForms["do"] = function(args,env){
  let value = false
  //executes (evaluates) each line of code that is contained in the arguments
  args.forEach(function(arg){
    value = evaluate(arg, env)
  })
  //returns the value of the last line of code. Not really important the return, the idea of this function
  //is to execute pieces of code in its arguments.
  return value
}

//we create define to be able to create variables and assign them values on an environment
specialForms["define"] = function(args, env){
  //first argument has to be a word, which is the name of the variable
  if (args.length != 2 || args[0].type != "word")
    throw new SyntaxError("Bad use of define")
  let value = evaluate(args[1], env) // the value is the second argument
  //assign value to the environment
  env[args[0].name] = value
  //return evaluates
  return value
}

//Environnment
