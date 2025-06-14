# Textlint API Usage

## Overview
Textlintは新しいモジュールAPIを提供しており、以下の主要なAPIを使用してプログラム的にlintと自動修正を実行できます。

## 主要API

### createLinter(options)
Linterインスタンスを作成します。

```javascript
import { createLinter, loadTextlintrc } from "textlint";

const descriptor = await loadTextlintrc();
const linter = createLinter({ descriptor });
```

### Linterメソッド

#### lintFiles(files)
複数のファイルをlintします。

```javascript
const results = await linter.lintFiles(["*.md"]);
// results: Array of LintResult objects
```

#### lintText(text, filePath)
単一のテキスト文字列をlintします。

```javascript
const result = await linter.lintText("# Hello World", "example.md");
```

#### fixFiles(files)
複数のファイルの自動修正を実行します。

```javascript
const fixResults = await linter.fixFiles(["*.md"]);
```

#### fixText(text, filePath)
単一のテキスト文字列の自動修正を実行します。

```javascript
const fixResult = await linter.fixText("# Hello World", "example.md");
```

### loadTextlintrc()
`.textlintrc`設定ファイルを読み込みます。

```javascript
const descriptor = await loadTextlintrc();
// descriptor contains rules, plugins, and options
```

## 基本的な使用例

### シンプルなlinting
```javascript
import { createLinter, loadTextlintrc } from "textlint";

// 設定読み込み
const descriptor = await loadTextlintrc();

// Linter作成
const linter = createLinter({ descriptor });

// ファイルをlint
const results = await linter.lintFiles(["README.md"]);

// 結果の処理
results.forEach(result => {
  console.log(`File: ${result.filePath}`);
  result.messages.forEach(message => {
    console.log(`Line ${message.line}: ${message.message}`);
  });
});
```

### 自動修正
```javascript
import { createLinter, loadTextlintrc } from "textlint";

const descriptor = await loadTextlintrc();
const linter = createLinter({ descriptor });

// 修正実行
const fixResults = await linter.fixFiles(["README.md"]);

fixResults.forEach(result => {
  if (result.output) {
    // 修正されたコンテンツ
    console.log("Fixed content:", result.output);
  }
});
```

## 結果オブジェクトの構造

### LintResult
```typescript
interface LintResult {
  filePath: string;
  messages: LintMessage[];
}
```

### LintMessage
```typescript
interface LintMessage {
  line: number;
  column: number;
  severity: number; // 1=warning, 2=error
  message: string;
  ruleId: string;
  fix?: {
    range: [number, number];
    text: string;
  };
}
```

### FixResult
```typescript
interface FixResult {
  filePath: string;
  output: string; // 修正されたテキスト
  messages: LintMessage[];
}
```

## エラーハンドリング

```javascript
try {
  const descriptor = await loadTextlintrc();
  const linter = createLinter({ descriptor });
  const results = await linter.lintFiles(["*.md"]);
} catch (error) {
  console.error("Textlint error:", error);
}
```

## 設定ファイル (.textlintrc)

```json
{
  "rules": {
    "preset-ja-technical-writing": true
  },
  "plugins": []
}
```

## 注意事項

1. **新しいAPI**: この文書で説明するAPIは新しいAPIです。古い`TextLintEngine`APIは非推奨です。
2. **非同期処理**: すべてのAPIは非同期でPromiseを返します。
3. **設定ファイル**: `.textlintrc`ファイルが必要です。
4. **ファイル拡張子**: Textlintは拡張子に基づいてファイルタイプを判定します。
5. **ES Modules**: ES Modulesをサポートしています。

## カスタムルールの追加

```javascript
import { createLinter } from "textlint";

const descriptor = {
  rules: {
    "custom-rule": require("./custom-rule")
  },
  plugins: []
};

const linter = createLinter({ descriptor });
```

## TypeScript使用時の注意

Textlintの型定義は`@types/textlint`ではなく、パッケージ自体に含まれています。ただし、一部の型定義が不完全な場合があるため、必要に応じて独自の型定義を追加してください。