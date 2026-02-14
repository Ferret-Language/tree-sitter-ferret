// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "src/scanner.c") {
    sources.append("src/scanner.c")
}

let package = Package(
    name: "TreeSitterFerretLanguage",
    products: [
        .library(name: "TreeSitterFerretLanguage", targets: ["TreeSitterFerretLanguage"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterFerretLanguage",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterFerretLanguageTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterFerretLanguage",
            ],
            path: "bindings/swift/TreeSitterFerretLanguageTests"
        )
    ],
    cLanguageStandard: .c11
)
