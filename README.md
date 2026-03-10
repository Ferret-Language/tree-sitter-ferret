# tree-sitter-ferret

Tree-sitter grammar for the current Ferret language revision.

This grammar targets the new Ferret syntax in this repo, not the older Ferret compiler syntax.

## Current coverage

- imports
- top-level `const`
- `type` declarations
- external methods with receivers
- `let` / `let mut`
- local `const`
- `if` / `else`
- `switch` / `case`
- pointers, optionals, error unions
- Zig-style `.{ ... }` literals
- `comptime` parameters and prefix expressions
- `!!`, `??`, `catch`

## File extension

The grammar is configured for `.ferr` files.

## Development

```bash
tree-sitter generate
tree-sitter test
```
