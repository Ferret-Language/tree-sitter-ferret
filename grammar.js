// tree-sitter-ferret grammar.js
// Variant that enables `word` token by removing duplicated identifier rules.
// We keep only `identifier` as the token rule, and create `type_identifier` / `field_identifier`
// node types via alias() at use sites.

module.exports = grammar({
  name: "ferret",

  // Allow editors to treat identifiers as “words” (double-click, etc.)
  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  conflicts: ($) => [
    [$.method_receiver, $.parameter],
    [$._primary_expression, $._generic_call_target],
    [$._postfix_expression, $._generic_call_target],
    [$.constraint_type_term, $.type],
    [$.constraint_union_expression, $.union_body],
  ],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.import_declaration,
        $.variable_declaration,
        $.constant_declaration,
        $.constraint_declaration,
        $.function_declaration,
        $.type_declaration,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.defer_statement,
        $.fork_statement,
        $.try_statement,
        $.assignment_statement,
        $.compound_assignment_statement,
        $.increment_statement,
        $.expression_statement,
      ),

    // =====================
    // Decls / Stmts
    // =====================

    import_declaration: ($) =>
      seq(
        "import",
        field("path", $.string_literal),
        optional(seq("as", field("alias", $.identifier))),
        optional(";"),
      ),

    variable_declaration: ($) =>
      seq(
        "let",
        field("declarations", seq($.declaration_item, repeat(seq(",", $.declaration_item)))),
        optional(";"),
      ),

    constant_declaration: ($) =>
      seq(
        "const",
        field("declarations", seq($.declaration_item, repeat(seq(",", $.declaration_item)))),
        optional(";"),
      ),

    constraint_declaration: ($) =>
      seq(
        "constraint",
        field("name", alias($.identifier, $.type_identifier)),
        "=",
        field("value", $.constraint_expression),
        optional(";"),
      ),

    declaration_item: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        optional(choice(seq(":=", field("value", $._expression)), seq("=", field("value", $._expression)))),
      ),

    type_declaration: ($) =>
      seq(
        "type",
        field("name", alias($.identifier, $.type_identifier)),
        optional(field("type_parameters", $.type_parameter_list)),
        field("type", $.type),
        optional(";"),
      ),

    function_declaration: ($) =>
      seq(
        "fn",
        optional($.method_receiver),
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameter_list)),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $.return_type))),
        choice(field("body", $.block), ";"),
      ),

    function_literal: ($) =>
      seq(
        "fn",
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $.return_type))),
        field("body", $.block),
      ),

    method_receiver: ($) =>
      seq(
        "(",
        field("name", $.identifier),
        ":",
        optional(field("move", "@")),
        field("type", $.type),
        ")",
      ),

    parameter_list: ($) =>
      seq("(", optional(seq($.parameter, repeat(seq(",", $.parameter)), optional(","))), ")"),

    type_parameter_list: ($) =>
      seq("<", $.type_parameter, repeat(seq(",", $.type_parameter)), optional(","), ">"),

    type_parameter: ($) =>
      seq(
        field("name", alias($.identifier, $.type_identifier)),
        optional(seq(":", field("constraint", $.constraint_expression))),
      ),

    parameter: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        optional("..."),
        optional(field("move", "@")),
        field("type", $.type),
        optional(seq("=", field("default", $._expression))),
      ),

    return_type: ($) => choice($.type, seq($.type, "!", $.type)),

    block: ($) => seq("{", repeat($._statement), "}"),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        field("consequence", $.block),
        optional(seq("else", field("alternative", choice($.block, $.if_statement)))),
      ),

    while_statement: ($) => seq("while", field("condition", $._expression), field("body", $.block)),

    for_statement: ($) =>
      seq(
        "for",
        choice(
          seq(field("index", $.identifier), ",", field("value", $.identifier)),
          field("variable", $.identifier),
        ),
        "in",
        field("iterable", $._expression),
        field("body", $.block),
      ),

    return_statement: ($) => prec.right(seq("return", optional($._expression), optional("!"), optional(";"))),
    break_statement: ($) => seq("break", optional(";")),
    continue_statement: ($) => seq("continue", optional(";")),
    defer_statement: ($) => prec.right(seq("defer", $._expression, optional(";"))),
    fork_statement: ($) => seq("fork", $._expression, optional(";")),
    try_statement: ($) => seq("try", field("expression", $._expression), optional(";")),

    expression_statement: ($) => seq($._expression, optional(";")),
    assignment_statement: ($) => seq($._expression, "=", $._expression, optional(";")),

    compound_assignment_statement: ($) =>
      seq($._expression, choice("+=", "-=", "*=", "/=", "%="), $._expression, optional(";")),

    increment_statement: ($) => seq($._expression, choice("++", "--"), optional(";")),

    // =====================
    // Expressions
    // =====================

    _primary_expression: ($) =>
      choice(
        $.identifier,
        $.scoped_identifier,
        $.imaginary_literal,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.byte_literal,
        $.boolean_literal,
        $.none_literal,
        $.function_literal,
        $.parenthesized_expression,
        $.composite_literal,
        $.array_literal,
        $.anonymous_struct_literal,
        $.anonymous_enum_literal,
        $.match_expression,
      ),

    _postfix_expression: ($) =>
      choice(
        $._primary_expression,
        $.field_expression,
        $.index_expression,
        $.generic_call_expression,
        $.call_expression,
        $.error_propagate_expression,
      ),

    _expression: ($) =>
      choice(
        $._postfix_expression,
        $.spread_expression,
        $.binary_expression,
        $.is_expression,
        $.cast_expression,
        $.unary_expression,
        $.catch_expression,
        $.range_expression,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    binary_expression: ($) =>
      choice(
        prec.left(2, seq($._expression, "|>", $._expression)),
        prec.left(3, seq($._expression, "??", $._expression)),
        prec.left(4, seq($._expression, "||", $._expression)),
        prec.left(5, seq($._expression, "&&", $._expression)),
        prec.left(6, seq($._expression, "|", $._expression)),
        prec.left(7, seq($._expression, "^", $._expression)),
        prec.left(8, seq($._expression, "&", $._expression)),
        prec.left(9, seq($._expression, choice("==", "!="), $._expression)),
        prec.left(10, seq($._expression, choice("<", ">", "<=", ">="), $._expression)),
        prec.left(11, seq($._expression, choice("+", "-"), $._expression)),
        prec.left(12, seq($._expression, choice("*", "/", "%"), $._expression)),
        prec.right(13, seq($._expression, "**", $._expression)),
      ),

    is_expression: ($) => prec.left(3, seq($._expression, "is", $.type)),
    cast_expression: ($) => prec.left(3, seq($._expression, "as", $.type)),

    unary_expression: ($) =>
      choice(
        prec.right(20, seq("!", $._expression)),
        prec.right(20, seq("-", $._expression)),
        prec.right(20, seq("&", optional(field("mutability", "mut")), $._expression)),
        prec.right(20, seq("@", $._expression)),
        prec.right(20, seq("#", $._expression)),
        prec.right(20, seq("~", $._expression)),
      ),

    spread_expression: ($) => prec.right(20, seq("...", $._expression)),

    error_propagate_expression: ($) =>
      prec.left(41, seq(field("expression", $._postfix_expression), "!!")),

    generic_call_expression: ($) =>
      prec.left(
        40,
        seq(
          field("function", $._generic_call_target),
          field("type_arguments", $.type_argument_list),
          field("arguments", $.argument_list),
        ),
      ),

    _generic_call_target: ($) => choice($.identifier, $.scoped_identifier, $.field_expression),

    call_expression: ($) =>
      prec.left(40, seq(field("function", $._postfix_expression), field("arguments", $.argument_list))),

    argument_list: ($) =>
      seq("(", optional(seq($._expression, repeat(seq(",", $._expression)), optional(","))), ")"),

    type_argument_list: ($) =>
      seq("<", $.type, repeat(seq(",", $.type)), optional(","), ">"),

    field_expression: ($) =>
      prec.left(
        42,
        seq(
          field("value", $._postfix_expression),
          ".",
          field("field", alias($.identifier, $.field_identifier)),
        ),
      ),

    index_expression: ($) =>
      prec.left(42, seq(field("array", $._postfix_expression), "[", field("index", $._expression), "]")),

    catch_expression: ($) =>
      prec.left(
        1,
        seq(
          field("expression", $._expression),
          "catch",
          choice(
            seq(
              field("error_name", $.identifier),
              field("error_handler", $.block),
              optional(field("fallback", $._expression)),
            ),
            field("fallback", $._expression),
          ),
        ),
      ),

    range_expression: ($) => prec.left(2, seq($._expression, "..", $._expression)),

    match_expression: ($) =>
      seq(
        "match",
        field("value", $._expression),
        "{",
        optional(seq($.match_arm, repeat(seq(",", $.match_arm)), optional(","))),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", choice($.wildcard_pattern, $._expression)),
        "=>",
        field("body", choice($.block, $._expression)),
      ),

    wildcard_pattern: ($) => "_",

    // =====================
    // Namespaces / literals / types
    // =====================

    scoped_identifier: ($) => seq(field("scope", $.identifier), "::", field("name", $.identifier)),
    
    reference_type: ($) =>
      prec.right(
        4,
        seq(
          "&",
          optional("mut"),
          field("base", $.type),
        ),
      ),

    scoped_type_identifier: ($) =>
      seq(field("scope", $.identifier), "::", field("name", alias($.identifier, $.type_identifier))),

    composite_literal: ($) =>
      prec(
        12,
        choice(
          seq("{", "}"),
          seq("{", $.map_entry, repeat(seq(",", $.map_entry)), optional(","), "}"),
          prec.right(
            seq(
              "{",
              $.struct_field_init,
              repeat(seq(",", $.struct_field_init)),
              optional(","),
              "}",
              optional(seq("as", $.type)),
            ),
          ),
        ),
      ),

    map_entry: ($) => seq(field("key", $._expression), "=>", field("value", $._expression)),

    struct_field_init: ($) =>
      seq(".", field("name", alias($.identifier, $.field_identifier)), "=", field("value", $._expression)),

    array_literal: ($) => seq("[", optional(seq($._expression, repeat(seq(",", $._expression)), optional(","))), "]"),

    anonymous_struct_literal: ($) => seq("struct", "{", repeat($.field_declaration), "}"),

    anonymous_enum_literal: ($) =>
      seq(
        "enum",
        "{",
        optional(
          seq(
            alias($.identifier, $.type_identifier),
            repeat(seq(",", alias($.identifier, $.type_identifier))),
            optional(","),
          ),
        ),
        "}",
      ),

    constraint_expression: ($) =>
      choice(
        $.constraint_term,
        prec.left(8, seq(field("left", $.constraint_expression), "&", field("right", $.constraint_term))),
      ),

    constraint_term: ($) =>
      choice(
        seq("(", $.constraint_expression, ")"),
        $.constraint_union_expression,
        seq(optional("~"), field("type", $.constraint_type_term)),
      ),

    constraint_union_expression: ($) =>
      seq(
        "union",
        "{",
        optional(seq($.constraint_union_term, repeat(seq(",", $.constraint_union_term)), optional(","))),
        "}",
      ),

    constraint_union_term: ($) => seq(optional("~"), field("type", $.constraint_type_term)),

    constraint_type_term: ($) =>
      choice(
        $.result_type,
        $.struct_type,
        $.enum_type,
        $.interface_type,
        $.function_type,
        $.primitive_type,
        $.applied_type,
        $.scoped_type_identifier,
        alias($.identifier, $.type_identifier),
        $.array_type,
        $.dynamic_array_type,
        $.map_type,
        $.optional_type,
        $.heap_type,
        $.reference_type,
      ),

    struct_type: ($) => seq("struct", field("body", $.struct_body)),
    enum_type: ($) => seq("enum", field("body", $.enum_body)),
    union_type: ($) => seq("union", field("body", $.union_body)),
    interface_type: ($) => seq("interface", field("body", $.interface_body)),

    struct_body: ($) => seq("{", repeat($.field_declaration), "}"),
    interface_body: ($) => seq("{", repeat($.interface_method), "}"),

    interface_method: ($) =>
      seq(
        optional(choice("~", "@", seq(
          "&",
          optional("mut")
        ))),
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $.return_type))),
        optional(";"),
      ),

    field_declaration: ($) =>
      seq(
        ".",
        field("name", alias($.identifier, $.field_identifier)),
        ":",
        field("type", $.type),
        ",",
      ),

    enum_body: ($) =>
      seq(
        "{",
        optional(seq($.enum_variant, repeat(seq(",", $.enum_variant)), optional(","))),
        "}",
      ),

    union_body: ($) =>
      seq("{", optional(seq($.type, repeat(seq(",", $.type)), optional(","))), "}"),

    enum_variant: ($) => alias($.identifier, $.type_identifier),

    applied_type: ($) =>
      prec(
        11,
        seq(
          field("base", choice($.scoped_type_identifier, alias($.identifier, $.type_identifier))),
          field("type_arguments", $.type_argument_list),
        ),
      ),

    type: ($) =>
      choice(
        $.result_type,
        $.struct_type,
        $.enum_type,
        $.union_type,
        $.interface_type,
        $.function_type,
        $.primitive_type,
        $.applied_type,
        $.scoped_type_identifier,
        alias($.identifier, $.type_identifier),
        $.array_type,
        $.dynamic_array_type,
        $.map_type,
        $.optional_type,
        $.heap_type,
        $.reference_type,
      ),

    primitive_type: ($) =>
      choice(
        "i8",
        "i16",
        "i32",
        "i64",
        "i128",
        "i256",
        "u8",
        "u16",
        "u32",
        "u64",
        "u128",
        "u256",
        "f32",
        "f64",
        "f128",
        "f256",
        "str",
        "bool",
        "byte",
        "char",
      ),

    array_type: ($) => seq("[", field("size", $.integer_literal), "]", field("element_type", $.type)),
    dynamic_array_type: ($) => seq("[", "]", field("element_type", $.type)),
    map_type: ($) => seq("map", "[", field("key_type", $.type), "]", field("value_type", $.type)),

    optional_type: ($) => prec.right(2, seq("?", field("base", $.type))),

    heap_type: ($) => prec.right(3, seq("#", field("base", $.type))),

    result_type: ($) => prec.right(10, seq(field("error_type", $.type), "!", field("success_type", $.type))),

    function_type: ($) =>
      seq(
        "fn",
        "(",
        optional(seq($.function_type_parameter, repeat(seq(",", $.function_type_parameter)))),
        ")",
        optional(seq("->", field("return_type", $.type))),
      ),

    function_type_parameter: ($) =>
      choice(
        seq(optional(choice("_", field("name", $.identifier))), ":", field("type", $.type)),
        seq("...", field("type", $.type)),
      ),

    // Literals
    integer_literal: ($) =>
      token(
        choice(
          /0[xX][0-9a-fA-F][0-9a-fA-F_]*/,
          /0[oO][0-7][0-7_]*/,
          /0[bB][01][01_]*/,
          /[0-9][0-9_]*/,
        ),
      ),

    float_literal: ($) => token(/[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9][0-9_]*)?/),


    imaginary_literal: ($) =>
      token(/[0-9][0-9_]*(\.[0-9][0-9_]*)?([eE][+-]?[0-9][0-9_]*)?i/),

    string_literal: ($) =>
      token(
        seq(
          '"',
          repeat(
            choice(
              seq("\\", choice(/[nrt'"\\]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/)),
              /[^"\\]/,
            ),
          ),
          '"',
        ),
      ),

    char_literal: ($) =>
      token(
        seq(
          "'",
          choice(
            seq("\\", choice(/[nrt'"\\]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/)),
            /[^'\\]/,
          ),
          "'",
        ),
      ),

    byte_literal: ($) =>
      token(
        seq(
          "b'",
          choice(
            seq("\\", choice(/[nrt'"\\]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/)),
            /[^'\\]/,
          ),
          "'",
        ),
      ),

    escape_sequence: ($) => token(seq("\\", choice(/[nrt'"\\]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/))),

    boolean_literal: ($) => choice("true", "false"),
    none_literal: ($) => "none",

    // Identifiers (ONLY ONE token rule)
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Comments
    line_comment: ($) => token(seq("//", /.*/)),
    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});
