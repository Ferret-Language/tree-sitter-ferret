(line_comment) @comment
(block_comment) @comment

(string_literal) @string
(number_literal) @number
(boolean_literal) @boolean
(none_literal) @constant.builtin

[
  "import"
  "const"
  "let"
  "mut"
  "fn"
  "type"
  "copy"
  "struct"
  "interface"
  "enum"
  "union"
  "error"
  "if"
  "else"
  "switch"
  "case"
  "return"
  "static"
  "own"
  "raw"
  "comptime"
  "take"
  "catch"
] @keyword

[
  "="
  "!"
  "!!"
  "?"
  "??"
  "&"
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  "::"
] @operator

["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ";" ":" "."] @punctuation.delimiter

(type_declaration
  name: (identifier) @type)

(named_type (identifier) @type)
(scoped_identifier
  name: (identifier) @type)

((identifier) @type.builtin
 (#any-of? @type.builtin
  "bool" "char" "string"
  "u8" "u16" "u32" "u64" "usize"
  "i8" "i16" "i32" "i64" "isize"
  "f32" "f64" "void"))

(function_declaration
  name: (identifier) @function)

(function_declaration
  name: (destructor_name) @function)

(interface_method
  name: (identifier) @function)

(call_expression
  function: (identifier) @function)

(call_expression
  function: (scoped_identifier
    name: (identifier) @function))

(call_expression
  function: (selector_expression
    field: (identifier) @function))

(generic_call_expression
  function: (identifier) @function)

(generic_call_expression
  function: (scoped_identifier
    name: (identifier) @function))

(generic_call_expression
  function: (selector_expression
    field: (identifier) @function))

(parameter
  name: (identifier) @variable.parameter)

(receiver
  name: (identifier) @variable.parameter)

(let_statement
  name: (identifier) @variable)

(const_statement
  name: (identifier) @constant)

(const_declaration
  name: (identifier) @constant)

(field_declaration
  name: (identifier) @property)

(named_field_initializer
  name: (identifier) @property)
