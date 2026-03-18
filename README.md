# tree-sitter-ferret

Tree-sitter grammar for the current Ferret language revision.

This grammar targets the new Ferret syntax in this repo, not the older Ferret compiler syntax.

## Current coverage

- imports
- top-level `const`
- top-level `constraint`
- `type` declarations
- generic type/function declarations with `<T>` and constrained type parameters
- attached methods with `Type::Method(...)`
- `let` / `let mut`
- local `const`
- `if` / `else`
- `match`
- owning pointers, references, raw pointers, optionals, error unions
- array literals and indexing
- postfix `++` / `--`
- Zig-style `.{ ... }` and typed `.Type{ ... }` literals
- `comptime` parameters and prefix expressions
- constraint expressions with `&`, `union`, `interface`, and `~Type`
- `!!`, `??`, `catch`

## File extension

The grammar is configured for `.ferr` files.

## Development

```bash
tree-sitter generate
tree-sitter test
```
