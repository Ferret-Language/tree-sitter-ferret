module.exports = grammar({
  name: "ferret",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  conflicts: ($) => [
    [$.block, $.composite_literal],
    [$.composite_literal, $.cast_expression],
  ],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.import_declaration,
        $.variable_declaration,
        $.constant_declaration,
        $.function_declaration,
        $.type_declaration,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.defer_statement,
        $.fork_statement,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.try_statement,
        $.assignment_statement,
        $.compound_assignment_statement,
        $.increment_statement,
        $.expression_statement,
      ),

    // Import declarations
    import_declaration: ($) =>
      seq(
        "import",
        field("path", $.string_literal),
        optional(seq("as", field("alias", $.identifier))),
        ";",
      ),

    // Variable declarations
    variable_declaration: ($) =>
      seq(
        "let",
        field("declarations", seq(
          $.declaration_item,
          repeat(seq(",", $.declaration_item))
        )),
        ";",
      ),

    // Constant declarations
    constant_declaration: ($) =>
      seq(
        "const",
        field("declarations", seq(
          $.declaration_item,
          repeat(seq(",", $.declaration_item))
        )),
        ";",
      ),

    declaration_item: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        optional(choice(
          seq(":=", field("value", $._expression)),
          seq("=", field("value", $._expression)),
        )),
      ),

    // Type declarations
    type_declaration: ($) =>
      seq("type", field("name", $.type_identifier), field("type", $.type), ";"),

    struct_type: ($) => seq("struct", field("body", $.struct_body)),

    enum_type: ($) => seq("enum", field("body", $.enum_body)),

    union_type: ($) => seq("union", field("body", $.union_body)),

    interface_type: ($) => seq("interface", field("body", $.interface_body)),

    struct_body: ($) => seq("{", repeat($.field_declaration), "}"),

    interface_body: ($) => seq("{", repeat($.interface_method), "}"),

    interface_method: ($) =>
      seq(
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $.return_type))),
        ";",
      ),

    field_declaration: ($) =>
      seq(
        ".",
        field("name", $.field_identifier),
        ":",
        field("type", $.type),
        ",",
      ),

    enum_body: ($) =>
      seq(
        "{",
        optional(
          seq($.enum_variant, repeat(seq(",", $.enum_variant)), optional(",")),
        ),
        "}",
      ),

    union_body: ($) =>
      seq(
        "{",
        optional(seq($.type, repeat(seq(",", $.type)), optional(","))),
        "}",
      ),

    enum_variant: ($) => $.type_identifier,

    // Function declarations
    function_declaration: ($) =>
      seq(
        "fn",
        optional($.method_receiver),
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $.return_type))),
        field("body", $.block),
      ),

    method_receiver: ($) =>
      seq(
        "(",
        field("name", $.identifier),
        ":",
        "&",
        optional(choice(field("mutability", "mut"), "'")),
        field("type", $.type),
        optional("?"),
        ")",
      ),

    parameter_list: ($) =>
      seq(
        "(",
        optional(
          seq($.parameter, repeat(seq(",", $.parameter)), optional(",")),
        ),
        ")",
      ),

    parameter: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        optional("..."),
        field("type", $.type)
      ),

    return_type: ($) => choice($.type, seq($.type, "!", $.type)),

    block: ($) => seq("{", repeat($._statement), "}"),

    // Control flow statements
    if_statement: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        field("consequence", $.block),
        optional(
          seq("else", field("alternative", choice($.block, $.if_statement))),
        ),
      ),

    while_statement: ($) =>
      seq("while", field("condition", $._expression), field("body", $.block)),

    for_statement: ($) =>
      seq(
        "for",
        "let",
        field("variable", $.identifier),
        "in",
        field("range", $.range_expression),
        field("body", $.block),
      ),

    return_statement: ($) =>
      seq("return", optional($._expression), optional("!"), ";"),

    break_statement: ($) => seq("break", ";"),

    continue_statement: ($) => seq("continue", ";"),

    defer_statement: ($) => seq("defer", $._expression, ";"),

    fork_statement: ($) => seq("fork", $._expression, ";"),

    try_statement: ($) =>
      seq("try", field("expression", $._expression), ";"),

    expression_statement: ($) => seq($._expression, ";"),

    assignment_statement: ($) =>
      seq($._expression, "=", $._expression, ";"),

    compound_assignment_statement: ($) =>
      seq(
        $._expression,
        choice("+=", "-=", "*=", "/=", "%="),
        $._expression,
        ";"
      ),

    increment_statement: ($) =>
      seq($._expression, choice("++", "--"), ";"),

    // Expressions
    _expression: ($) =>
      choice(
        $.identifier,
        $.scoped_identifier,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.byte_literal,
        $.boolean_literal,
        $.none_literal,
        $.binary_expression,
        $.is_expression,
        $.cast_expression,
        $.unary_expression,
        $.call_expression,
        $.field_expression,
        $.index_expression,
        $.catch_expression,
        $.parenthesized_expression,
        $.composite_literal,
        $.array_literal,
        $.anonymous_struct_literal,
        $.anonymous_enum_literal,
        $.range_expression,
        $.match_expression,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // Binary expressions
    binary_expression: ($) =>
      choice(
        // Logical
        prec.left(1, seq($._expression, "||", $._expression)),
        prec.left(2, seq($._expression, "&&", $._expression)),
        // Comparison
        prec.left(3, seq($._expression, choice("==", "!="), $._expression)),
        prec.left(
          4,
          seq($._expression, choice("<", ">", "<=", ">="), $._expression),
        ),
        // Arithmetic
        prec.left(5, seq($._expression, choice("+", "-"), $._expression)),
        prec.left(6, seq($._expression, choice("*", "/", "%"), $._expression)),
        // Power operator
        prec.right(7, seq($._expression, "**", $._expression)),
        // Coalescing operator
        prec.left(8, seq($._expression, "??", $._expression)),
      ),

    is_expression: ($) => prec.left(3, seq($._expression, "is", $.type)),

    cast_expression: ($) => prec.left(3, seq($._expression, "as", $.type)),

    // Unary expressions
    unary_expression: ($) =>
      choice(
        prec.right(9, seq("!", $._expression)),
        prec.right(9, seq("-", $._expression)),
        prec.right(9, seq("&", optional(field("mutability", "mut")), $._expression)),
        prec.right(9, seq("&'", $._expression)),
      ),

    // Call expression
    call_expression: ($) =>
      prec(
        10,
        seq(
          field("function", $._expression),
          field("arguments", $.argument_list),
        ),
      ),

    argument_list: ($) =>
      seq(
        "(",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(",")),
        ),
        ")",
      ),

    // Field access
    field_expression: ($) =>
      prec(
        11,
        seq(
          field("value", $._expression),
          ".",
          field("field", $.field_identifier),
        ),
      ),

    // Array indexing
    index_expression: ($) =>
      prec(
        11,
        seq(
          field("array", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    // Catch expression
    catch_expression: ($) =>
      prec.left(
        1,
        seq(
          field("expression", $._expression),
          "catch",
          choice(
            // With error handler block
            seq(
              field("error_name", $.identifier),
              field("error_handler", $.block),
              field("fallback", $._expression),
            ),
            // Shorthand without handler
            field("fallback", $._expression),
          ),
        ),
      ),

    // Range expression
    range_expression: ($) =>
      prec.left(2, seq($._expression, "..", $._expression)),

    match_expression: ($) =>
      seq(
        "match",
        field("value", $._expression),
        "{",
        optional(
          seq($.match_arm, repeat(seq(",", $.match_arm)), optional(",")),
        ),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", choice($.wildcard_pattern, $._expression)),
        "=>",
        field("body", choice($.block, $._expression)),
      ),

    wildcard_pattern: ($) => "_",

    // Scoped identifier (for module access and enum variants)
    scoped_identifier: ($) =>
      seq(
        field("scope", choice($.identifier, $.type_identifier)),
        "::",
        field("name", choice($.identifier, $.type_identifier)),
      ),

    // Scoped type identifier (for module types like io::Printable)
    scoped_type_identifier: ($) =>
      seq(
        field("scope", choice($.identifier, $.type_identifier)),
        "::",
        field("name", $.type_identifier),
      ),

    // Composite literal (map and struct)
    composite_literal: ($) =>
      prec(12, choice(
        // Empty literal {}
        seq("{", "}"),
        // Map literal: has =>
        seq(
          "{",
          $.map_entry,
          repeat(seq(",", $.map_entry)),
          optional(","),
          "}",
        ),
        // Struct literal: has . prefix
        prec.right(seq(
          "{",
          $.struct_field_init,
          repeat(seq(",", $.struct_field_init)),
          optional(","),
          "}",
          optional(seq("as", $.type)),
        )),
      )),

    map_entry: ($) =>
      seq(field("key", $._expression), "=>", field("value", $._expression)),

    struct_field_init: ($) =>
      seq(
        ".",
        field("name", $.field_identifier),
        "=",
        field("value", $._expression),
      ),

    // Array literal
    array_literal: ($) =>
      seq(
        "[",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(",")),
        ),
        "]",
      ),

    // Anonymous struct literal
    anonymous_struct_literal: ($) =>
      seq("struct", "{", repeat($.field_declaration), "}"),

    // Anonymous enum literal
    anonymous_enum_literal: ($) =>
      seq(
        "enum",
        "{",
        optional(
          seq(
            $.type_identifier,
            repeat(seq(",", $.type_identifier)),
            optional(","),
          ),
        ),
        "}",
      ),

    // Types
    type: ($) =>
      choice(
        $.result_type,
        $.struct_type,
        $.enum_type,
        $.union_type,
        $.interface_type,
        $.primitive_type,
        $.scoped_type_identifier,
        $.type_identifier,
        $.array_type,
        $.dynamic_array_type,
        $.map_type,
        $.optional_type,
        $.reference_type,
      ),

    primitive_type: ($) =>
      choice(
        // Signed integers (8-256 bits)
        "i8",
        "i16",
        "i32",
        "i64",
        "i128",
        "i256",
        // Unsigned integers (8-256 bits)
        "u8",
        "u16",
        "u32",
        "u64",
        "u128",
        "u256",
        // Floats (32-256 bits)
        "f32",
        "f64",
        "f128",
        "f256",
        // Other primitives
        "str",
        "bool",
        "byte",
        "char",
      ),

    array_type: ($) =>
      seq(
        "[",
        field("size", $.integer_literal),
        "]",
        field("element_type", $.type),
      ),

    dynamic_array_type: ($) => seq("[", "]", field("element_type", $.type)),

    map_type: ($) =>
      seq(
        "map",
        "[",
        field("key_type", $.type),
        "]",
        field("value_type", $.type),
      ),

    optional_type: ($) =>
      prec(
        1,
        seq(
          choice(
            $.type_identifier,
            $.primitive_type,
            $.array_type,
            $.dynamic_array_type,
            $.map_type,
            $.struct_type,
            $.enum_type,
            $.union_type,
            $.interface_type,
          ),
          "?",
        ),
      ),

    reference_type: ($) =>
      prec(
        2,
        seq(
          "&",
          optional("mut"),
          choice(
            $.type_identifier,
            $.primitive_type,
            $.array_type,
            $.dynamic_array_type,
            $.map_type,
            $.optional_type,
            $.struct_type,
            $.enum_type,
            $.union_type,
            $.interface_type,
          ),
        ),
      ),

    result_type: ($) =>
      prec.right(
        10,
        seq(field("error_type", $.type), "!", field("success_type", $.type)),
      ),

    // Literals
    integer_literal: ($) =>
      token(choice(
        /0[xX][0-9a-fA-F][0-9a-fA-F_]*/, // hexadecimal (at least one digit after prefix)
        /0[oO][0-7][0-7_]*/,              // octal (at least one digit after prefix)
        /0[bB][01][01_]*/,                // binary (at least one digit after prefix)
        /[0-9][0-9_]*/                    // decimal with optional underscores
      )),

    float_literal: ($) => token(/[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9][0-9_]*)?/),

    string_literal: ($) =>
      seq('"', repeat(choice($.escape_sequence, /[^"\\]/)), '"'),

    char_literal: ($) => seq("'", choice($.escape_sequence, /[^'\\]/), "'"),

    byte_literal: ($) => seq("b'", choice($.escape_sequence, /[^'\\]/), "'"),

    escape_sequence: ($) =>
      token(
        seq("\\", choice(/[nrt'"\\]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/)),
      ),

    boolean_literal: ($) => choice("true", "false"),

    none_literal: ($) => "none",

    // Identifiers
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    field_identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Comments
    line_comment: ($) => token(seq("//", /.*/)),

    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});
