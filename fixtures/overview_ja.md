<!-- TODO: need an Angular + AI logo -->
<docs-decorative-header title="AIで構築" imgSrc="adev/src/assets/images/what_is_angular.svg"> <!-- markdownlint-disable-line -->
AI駆動型アプリを構築。AIにより開発を加速。
</docs-decorative-header>

大規模言語モデル（LLM）による生成AI（GenAI）は、パーソナライズされたコンテンツ、インテリジェントなレコメンデーション、メディア生成と理解、情報要約、動的な機能など、洗練された魅力的なアプリケーション体験の作成を可能とします。

これらのような機能開発には、以前は深いドメイン知識と多大な開発労力が必要でした。しかし、新しい製品やSDKにより、参入障壁は低くなっています。Angularは、次の理由から、AIをウェブアプリケーションに統合する上で非常に適しています。

* Angularの堅牢なテンプレートAPIは、生成されたコンテンツから、動的でクリーンに構成されたUI作成を可能にします
* データと状態を動的に管理するよう設計された、強力なシグナルベースのアーキテクチャ
* AngularはAI SDKやAPIとシームレスに統合します

このガイドでは、[Genkit](/ai#build-ai-powered-applications-with-genkit-and-angular)、[Firebase AI Logic](https://firebase.google.com/products/firebase-ai-logic)、および[Gemini API](https://ai.google.dev/)を使って、AngularアプリにAIを今日から組み込む方法を説明します。このガイドは、AngularアプリにAIを統合し始める方法を説明することで、AIを活用したウェブアプリ開発の旅を加速させます。このガイドではまた、スターターキット、サンプルコード、一般的なワークフローのレシピなど、迅速に習得できるリソースも共有しています。

始めるには、Angularの基本的な理解が必要です。Angularは初めてですか？[基本ガイド](/essentials)または[入門チュートリアル](/tutorials)をお試しください。

NOTE: このページではGoogle AI製品との統合と例を紹介していますが、Genkitのようなツールはモデル非依存であり、独自のモデルを選択できます。多くの場合、例やコードサンプルは他のサードパーティソリューションにも適用できます。

## はじめに
AIを活用したアプリケーション構築は、新しく急速に発展している分野です。どこから始め、どの技術を選択すべきか決定することは困難な場合があります。以下のセクションでは、選択できる3つのオプションを提示します。

1. *Genkit*は、フルスタックアプリケーション構築向けに、[サポートされるモデルと統一されたAPIインターフェース](https://firebase.google.com/docs/genkit)の選択肢を提供します。パーソナライズされたレコメンデーションなど、高度なバックエンドAIロジックを必要とするアプリケーションに最適です。

1. *Firebase AI Logic*は、Googleのモデル向けに安全なクライアントサイドAPIを提供し、クライアントサイドのみのアプリケーションやモバイルアプリの構築を可能にします。リアルタイムのテキスト分析や基本的なチャットボットなど、ブラウザで直接インタラクティブなAI機能を利用するのに最適です。

1. *Gemini API*は、APIサーフェスを通じて直接公開されるメソッドと機能を使用するアプリケーションの構築を可能にし、フルスタックアプリケーションに最適です。カスタム画像生成やディープデータ処理など、AIモデルを直接制御する必要があるアプリケーションに適しています。

### GenkitとAngularでAI搭載アプリケーションを構築する
[Genkit](https://firebase.google.com/docs/genkit) は、ウェブアプリやモバイルアプリでAI搭載機能を構築するのに役立つよう設計されたオープンソースツールキットです。Google、OpenAI、Anthropic、OllamaなどからのAIモデルを統合するための統一インターフェースを提供し、ニーズに合った最適なモデルを探索し、選択できます。サーバーサイドソリューションとして、Genkitと統合するために、ウェブアプリにはNode.jsベースのサーバーのようなサポートされているサーバー環境が必要です。例えば、Angular SSRを使用してフルスタックアプリを構築すると、サーバーサイドの開始コードが得られます。

GenkitとAngularを使って構築する方法の例を以下に示します。

* [GenkitとAngularによるエージェントアプリスターターキット](https://github.com/angular/examples/tree/main/genkit-angular-starter-kit)— AIでの構築は初めてですか？エージェントワークフローを備えた基本的なアプリから始めましょう。最初のAI構築体験に最適な場所です。

* [AngularアプリでGenkitを使用する](https://firebase.google.com/docs/genkit/angular)— Genkit Flows、Angular、Gemini 2.0 Flashを使用する基本的なアプリケーションを構築します。このステップバイステップのウォークスルーは、AI機能を備えたフルスタックのAngularアプリケーションを作成するのに役立ちます。

* [ダイナミックストーリージェネレーターアプリ](https://github.com/angular/examples/tree/main/genkit-angular-story-generator)— Genkit、Gemini、Imagen 3を搭載したエージェントAngularアプリを構築し、ユーザーインタラクションに基づいて動的にストーリーを生成する方法を学びます。発生するイベントに付随する美しい画像パネルが特徴です。より高度なユースケースを試したい場合は、ここから始めましょう。

  この例には、機能の詳細なビデオウォークスルーも含まれています。
    * [「Building Agentic Apps with Angular and Genkit live!」を視聴する](https://youtube.com/live/mx7yZoIa2n4?feature=share)
    * [「Building Agentic Apps with Angular and Genkit live! PT 2」を視聴する](https://youtube.com/live/YR6LN5_O3B0?feature=share)

* [FirebaseとGoogle Cloudでエージェントアプリを構築する（バリスタの例）](https://developers.google.com/solutions/learn/agentic-barista) - FirebaseとGoogle Cloudを使ってエージェントコーヒー注文アプリを構築する方法を学びます。この例では、Firebase AI LogicとGenkitの両方を使用しています。

### Firebase AI Logic と Angular を利用した AI 搭載アプリケーションの構築
[Firebase AI Logic](https://firebase.google.com/products/vertex-ai-in-firebase) は、Web アプリやモバイルアプリから Vertex AI Gemini API または Imagen API と直接やり取りする安全な方法を提供します。アプリケーションはフルスタックでもクライアントサイドのみでも構築できるため、これは Angular 開発者にとって魅力的です。クライアントサイドのみのアプリケーションを開発している場合、Firebase AI Logic は Web アプリへの AI 組み込みに適しています。

Firebase AI Logic と Angular を利用した構築方法の例を以下に示します。
* [Firebase AI Logic x Angular Starter Kit](https://github.com/angular/examples/tree/main/vertex-ai-firebase-angular-example) - このスターターキットを使用して、タスクを実行できるチャットエージェントを備えた eコマースアプリケーションを構築します。Firebase AI Logic と Angular を利用した構築経験がない場合は、ここから始めてください。

  この例には、機能の説明と新機能の追加方法を実演する詳細なビデオウォークスルーが含まれています。

### Gemini APIとAngularでAI活用アプリケーションを構築する
[Gemini API](https://ai.google.dev/gemini-api/docs)を使えば、音声、画像、動画、テキスト入力をサポートするGoogleの最先端モデルにアクセスできます。特定のユースケース向けに最適化されたモデルについては、[Gemini APIドキュメントサイト](https://ai.google.dev/gemini-api/docs/models)で詳細をご確認ください。

* [AI Text Editor Angular app template](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-text-editor) - このテンプレートを使用すると、テキストの洗練、拡張、形式化といったAI活用機能を備えた、完全に機能するテキストエディターから始められます。これはHTTP経由でGemini APIを呼び出す経験を積む良い出発点です。

* [AI Chatbot app template](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-chatbot) - このテンプレートは、HTTP経由でGemini APIと通信するチャットボットのユーザーインターフェースから始められます。

## AIパターン活用：チャット応答のストリーミング
モデルから応答が受信されるにつれてテキストが表示されるのは、AIを利用するWebアプリで一般的なUIパターンです。Angularの`resource` APIで、この非同期タスクを実現できます。`resource`の`stream`プロパティは、時間の経過とともにシグナル値へ更新を適用する非同期関数を受け入れます。更新されるシグナルは、ストリーミングされるデータを表します。

```ts
characters = resource({
    stream: async () => {
      const data = signal<{ value: string } | { error: unknown }>({
        value: "",
      });

      fetch(this.url).then(async (response) => {
        if (!response.body) return;
        
        for await (const chunk of response.body) {
          const chunkText = this.decoder.decode(chunk);
          data.update((prev) => {
            if ("value" in prev) {
              return { value: `${prev.value} ${chunkText}` };
            } else {
              return { error: chunkText };
            }
          });
        }
      });

      return data;
    },
  });

```

`characters`メンバーは非同期で更新され、テンプレートに表示できます。

```html
<p>{{ characters.value() }}</p>
```

サーバー側、例えば`server.ts`で、定義されたエンドポイントはストリーミングされるデータをクライアントへ送信します。以下のコードはGemini APIを使用しますが、この手法はLLMからストリーミング応答をサポートする他のツールやフレームワークにも適用可能です。

```ts
 app.get("/api/stream-response", async (req, res) => {
   ai.models.generateContentStream({
     model: "gemini-2.0-flash",
     contents: "Explain how AI works",
   }).then(async (response) => {
     for await (const chunk of response) {
       res.write(chunk.text);
     }
   });
 });

```
この例はGemini APIに接続しますが、ストリーミング応答をサポートする他のAPIもここで使用できます。完全な例はAngular Githubで確認できます。

## ベストプラクティス
### モデルプロバイダーへの接続とAPI認証情報の安全な保持
モデルプロバイダーへ接続する際、APIシークレットを安全に保つことが重要です。*APIキーは、`environments.ts`のようなクライアントに配布されるファイルには絶対に入れないでください*。

アプリケーションのアーキテクチャによって、どのAI APIやツールを選択するかが決まります。具体的には、アプリケーションがクライアントサイドかサーバーサイドかに基づいて選択してください。Firebase AI Logicのようなツールは、クライアントサイドのコード向けにモデルAPIへの安全な接続を提供します。Firebase AI Logicと異なるAPIを使用したい場合、または別のモデルプロバイダーを利用したい場合は、プロキシサーバー、あるいは[Cloud Functions for Firebase](https://firebase.google.com/docs/functions)をプロキシとして使用し、APIキーを公開しないようにすることを検討してください。

クライアントサイドアプリを使用して接続する例は、以下のコードを参照してください: [Firebase AI Logic Angular example repository](https://github.com/angular/examples/tree/main/vertex-ai-firebase-angular-example)。

APIキーを必要とするモデルAPIへのサーバーサイド接続では、`environments.ts`ではなく、シークレットマネージャーまたは環境変数を使用することを推奨します。APIキーと認証情報を保護するための標準的なベストプラクティスに従う必要があります。Firebaseは、Firebase App Hostingの最新アップデートにより、新しいシークレットマネージャーを提供しています。詳細については、[公式ドキュメントをご確認ください](https://firebase.google.com/docs/app-hosting/configure)。

フルスタックアプリケーションにおけるサーバーサイド接続の例は、以下のコードを参照してください: [Angular AI Example (Genkit and Angular Story Generator) repository](https://github.com/angular/examples/tree/main/genkit-angular-story-generator)。

### アプリを強化するためのツール呼び出しの使用
エージェントがプロンプトに基づいて問題を解決するため、ツールを実行し利用できるエージェントワークフローを構築したい場合、「ツール呼び出し」を使用します。ツール呼び出しは関数呼び出しとも呼ばれ、LLMにそれを呼び出したアプリケーションへ要求する機能を提供する手段です。開発者として、利用可能なツールを定義し、ツールの呼び出し方法やタイミングを制御します。

ツール呼び出しは、質疑応答形式のチャットボットよりもAI統合をさらに拡張し、Webアプリをさらに強化します。実際、モデルプロバイダーの関数呼び出しAPIを使用し、モデルに機能呼び出しを要求させることができます。利用可能なツールは、アプリケーションのコンテキスト内でより複雑なアクションを実行するために利用できます。

[Angular examples repository](https://github.com/angular/examples)の[e-commerce example](https://github.com/angular/examples/blob/main/vertex-ai-firebase-angular-example/src/app/ai.service.ts#L88)では、LLMは在庫に関する関数呼び出しを要求し、店舗内の商品のグループがいくらになるかを計算するような、より複雑なタスクを実行するために必要なコンテキストを取得します。利用可能なAPIの範囲は、LLMによって要求された関数を呼び出すかどうかと同様に、開発者であるあなた次第です。あなたは実行フローを制御し続けます。例えば、サービスの特定の関数を公開できますが、そのサービスのすべての関数を公開する必要はありません。

### 非決定性応答の処理
モデルは非決定論的な結果を返す可能性があるため、その点を考慮してアプリケーションを設計する必要があります。アプリケーションの実装で利用できるいくつかの戦略を以下に示します。
* プロンプトとモデルパラメータ（[temperature](https://ai.google.dev/gemini-api/docs/prompting-strategies)など）を調整し、応答の決定性を高めたり低めたりします。[ai.google.dev](https://ai.google.dev/)の[プロンプト戦略セクション](https://ai.google.dev/gemini-api/docs/prompting-strategies)で詳細を確認できます。
* ワークフローを進める前に人間が出力を検証する「ヒューマン・イン・ザ・ループ」戦略を使用します。オペレーター（人間または他のモデル）が出力を検証し、重要な決定を確認できるようにアプリケーションのワークフローを構築します。
* ツール（または関数）呼び出しとスキーマ制約を利用し、モデルの応答を事前定義された形式に誘導・制限することで、応答の予測可能性を高めます。

これらの戦略や手法を考慮したとしても、アプリケーションの設計には適切なフォールバックを組み込むべきです。アプリケーションの回復性に関する既存の標準に従ってください。たとえば、リソースやAPIが利用できない場合にアプリケーションがクラッシュすることは許容されません。そのシナリオでは、エラーメッセージがユーザーに表示され、該当する場合は次のステップのオプションも表示されます。AIを活用したアプリケーションを構築する場合も、同じ考慮が必要です。応答が期待される出力と一致していることを確認し、一致しない場合は[グレースフルデグラデーション](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation)によって「安全な着地」を提供してください。これはLLMプロバイダーのAPI停止にも当てはまります。

この例を考えてみましょう：LLMプロバイダーが応答していません。停止を処理する潜在的な戦略は次のとおりです。
* ユーザーからの応答を保存し、リトライシナリオ（今すぐ、または後で）で使用します。
* 機密情報を漏らさない適切なメッセージで、ユーザーに停止を警告します。
* サービスが再び利用可能になったら、後で会話を再開します。
