<!-- TODO: need an Angular + AI logo -->
<docs-decorative-header title="AI で構築" imgSrc="adev/src/assets/images/what_is_angular.svg"> <!-- markdownlint-disable-line -->
AI を活用したアプリを構築しましょう。AI を使うとより速く開発できます。
</docs-decorative-header>

大規模言語モデル (LLM) を使用した生成 AI (GenAI) により、パーソナライズされたコンテンツ、インテリジェントなレコメンデーション、メディア生成と理解、情報要約、動的な機能など、洗練された魅力的なアプリケーションエクスペリエンスの作成が可能になります。

このような機能の開発には、これまで深い専門知識と多大なエンジニアリングの労力が必要でした。しかし、新しい製品と SDK により、参入障壁が低くなっています。Angular は、以下の理由から、AI を Web アプリケーションに統合するのに適しています。

* Angular の堅牢なテンプレート API により、生成されたコンテンツから作成された動的できれいに構成された UI を作成できます。
* データを動的に管理するように設計された、強力なシグナルベースのアーキテクチャ
* Angular は、AI SDK および API とシームレスに統合できます。

このガイドでは、[Genkit](/ai#build-ai-powered-applications-with-genkit-and-angular)、[Firebase AI Logic](https://firebase.google.com/products/firebase-ai-logic)、および [Gemini API](https://ai.google.dev/) を使用して、Angular アプリに AI を組み込む方法を示します。このガイドでは、Angular アプリへの AI 統合を開始する方法を説明することで、AI 搭載の Web アプリ開発の旅をすぐに開始できます。また、スターターキット、サンプルコード、一般的なワークフローのレシピなど、すぐに使いこなせるリソースも共有します。

始めるには、Angular の基本的な理解が必要です。Angular は初めてですか？[エッセンシャルガイド](/essentials) または [入門チュートリアル](/tutorials) をお試しください。

NOTE: このページでは、Google AI 製品との統合と例を紹介していますが、Genkit などのツールはモデルに依存せず、独自のモデルを選択できます。多くの場合、例とコードサンプルは、他のサードパーティソリューションにも適用できます。

## はじめに
AI を活用したアプリケーションの構築は、新しく急速に発展している分野です。どこから始め、どのテクノロジーを選択するかを決めるのは難しい場合があります。以下のセクションでは、3 つのオプションから選択できます。

1.  *Genkit* では、フルスタックアプリケーションを構築するために、[サポートされているモデルと統合 API とのインターフェース](https://firebase.google.com/docs/genkit)を選択できます。パーソナライズされたレコメンデーションなど、高度なバックエンド AI ロジックを必要とするアプリケーションに最適です。

1.  *Firebase AI Logic* は、クライアントサイドのみのアプリケーションまたはモバイルアプリを構築するために、Google のモデル用の安全なクライアントサイド API を提供します。リアルタイムのテキスト分析や基本的なチャットボットなど、ブラウザで直接インタラクティブな AI 機能を構築するのに最適です。

1.  *Gemini API* を使用すると、API サーフェスを介して公開されるメソッドと機能を使用してアプリケーションを直接構築できます。フルスタックアプリケーションに最適です。カスタム画像生成や詳細なデータ処理など、AI モデルを直接制御する必要があるアプリケーションに適しています。

### GenkitとAngularでAIを活用したアプリケーションを構築する
[Genkit](https://firebase.google.com/docs/genkit)は、WebおよびモバイルアプリでAIを活用した機能を構築するのに役立つように設計されたオープンソースのツールキットです。Google、OpenAI、Anthropic、OllamaなどのAIモデルを統合するための統一されたインターフェースを提供するため、ニーズに最適なモデルを探索して選択できます。サーバー側のソリューションとして、WebアプリはGenkitと統合するために、Nodeベースのサーバーなどのサポートされているサーバー環境が必要です。たとえば、Angular SSRを使用してフルスタックアプリを構築すると、スターターサーバー側のコードが得られます。

GenkitとAngularを使用して構築する方法の例を次に示します。

* [Agentic Apps with Genkit and Angular starter-kit](https://github.com/angular/examples/tree/main/genkit-angular-starter-kit) - AIを使用した構築は初めてですか？エージェントワークフローを備えた基本的なアプリから始めましょう。最初のAI構築体験を始めるのに最適な場所です。

* [Use Genkit in an Angular app](https://firebase.google.com/docs/genkit/angular) - Genkit Flows、Angular、Gemini 2.0 Flashを使用する基本的なアプリケーションを構築します。このステップバイステップのチュートリアルでは、AI機能を備えたフルスタックAngularアプリケーションの作成について説明します。

* [Dynamic Story Generator app](https://github.com/angular/examples/tree/main/genkit-angular-story-generator) - Genkit、Gemini、Imagen 3を搭載したエージェントAngularアプリを構築して、ユーザーインタラクションに基づいてストーリーを動的に生成する方法を学びます。イベントに付随する美しい画像パネルが特徴です。より高度なユースケースを試したい場合は、ここから始めてください。

  この例には、機能の詳細なビデオチュートリアルもあります。
    * [Watch "Building Agentic Apps with Angular and Genkit live!"](https://youtube.com/live/mx7yZoIa2n4?feature=share)
    * [Watch "Building Agentic Apps with Angular and Genkit live! PT 2"](https://youtube.com/live/YR6LN5_o3B0?feature=share)

* [Building Agentic apps with Firebase and Google Cloud (Barista Example)](https://developers.google.com/solutions/learn/agentic-barista) - FirebaseとGoogle Cloudを使用してエージェントコーヒー注文アプリを構築する方法を学びます。この例では、Firebase AI LogicとGenkitの両方を使用します。

### Firebase AI LogicとAngularでAIを活用したアプリケーションを構築する
[Firebase AI Logic](https://firebase.google.com/products/vertex-ai-in-firebase)は、Vertex AI Gemini APIまたはImagen APIとWebおよびモバイルアプリから直接安全にやり取りする方法を提供します。これはAngular開発者にとって魅力的です。なぜなら、アプリはフルスタックまたはクライアントサイドのみのいずれかになる可能性があるからです。クライアントサイドのみのアプリケーションを開発している場合、Firebase AI LogicはWebアプリにAIを組み込むのに適しています。

Firebase AI LogicとAngularで構築する方法の例を次に示します。
* [Firebase AI Logic x Angular Starter Kit](https://github.com/angular/examples/tree/main/vertex-ai-firebase-angular-example) - このスターターキットを使用して、タスクを実行できるチャットエージェントを備えたeコマースアプリケーションを構築します。Firebase AI LogicとAngularでの構築経験がない場合は、ここから始めてください。

  この例には、[機能の説明と新しい機能の追加方法を示す詳細なビデオウォークスルー](https://youtube.com/live/4vfDz2al_BI)が含まれています。

### Gemini APIとAngularでAIを活用したアプリケーションを構築する
[Gemini API](https://ai.google.dev/gemini-api/docs)は、Googleの最先端モデルへのアクセスを提供し、オーディオ、画像、ビデオ、テキスト入力をサポートします。特定のユースケースに最適化されたモデルについては、[Gemini APIのドキュメントサイト](https://ai.google.dev/gemini-api/docs/models)で詳細をご覧ください。

* [AIテキストエディタAngularアプリテンプレート](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-text-editor) - このテンプレートを使用すると、テキストの洗練、テキストの拡張、テキストの形式化などのAIを活用した機能を備えた、完全に機能するテキストエディタから始めることができます。これは、HTTP経由でGemini APIを呼び出す経験を積むための良い出発点です。

* [AIチャットボットアプリテンプレート](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-chatbot) - このテンプレートは、HTTP経由でGemini APIと通信するチャットボットのユーザーインターフェースから始まります。

## 実行中のAIパターン：ストリーミングチャット応答
モデルから応答を受信するにつれてテキストが表示されるようにすることは、AIを使用するWebアプリで一般的なUIパターンです。Angularの`resource` APIを使用すると、この非同期タスクを実現できます。`resource`の`stream`プロパティは、時間の経過とともにシグナル値に更新を適用するために使用できる非同期関数を受け入れます。更新されるシグナルは、ストリーミングされるデータを表します。

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

サーバー側では、たとえば`server.ts`で、定義されたエンドポイントはストリーミングされるデータをクライアントに送信します。次のコードはGemini APIを使用していますが、この手法はLLMからのストリーミング応答をサポートする他のツールやフレームワークにも適用できます。

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
この例はGemini APIに接続しますが、ストリーミング応答をサポートする他のAPIもここで使用できます。[完全な例はAngular Githubにあります](https://github.com/angular/examples/tree/main/streaming-example)。

## Best Practices
### モデルプロバイダーへの接続とAPI認証情報の保護
モデルプロバイダーに接続する際は、APIシークレットを安全に保つことが重要です。*`environments.ts`など、クライアントに配布されるファイルにAPIキーを絶対に入れないでください*。

アプリケーションのアーキテクチャによって、選択するAI APIとツールが決まります。具体的には、アプリケーションがクライアントサイドかサーバーサイドかに基づいて選択します。Firebase AI Logicなどのツールは、クライアントサイドのコードに対してモデルAPIへの安全な接続を提供します。Firebase AI Logicとは異なるAPIを使用したい場合や、別のモデルプロバイダーを使用したい場合は、プロキシサーバー、あるいは[Cloud Functions for Firebase](https://firebase.google.com/docs/functions)を作成してプロキシとして機能させ、APIキーを公開しないことを検討してください。

クライアントサイドアプリを使用して接続する例については、[Firebase AI Logic Angularのサンプルリポジトリ](https://github.com/angular/examples/tree/main/vertex-ai-firebase-angular-example)のコードを参照してください。

APIキーを必要とするモデルAPIへのサーバーサイド接続の場合、`environments.ts`ではなく、シークレットマネージャーまたは環境変数を使用することを推奨します。APIキーと認証情報を保護するための標準的なベストプラクティスに従ってください。Firebaseは、Firebase App Hostingからの最新のアップデートを含む新しいシークレットマネージャーを提供するようになりました。詳細については、[公式ドキュメント](https://firebase.google.com/docs/app-hosting/configure)を確認してください。

フルスタックアプリケーションでのサーバーサイド接続の例については、[Angular AI Example (Genkit and Angular Story Generator) リポジトリ](https://github.com/angular/examples/tree/main/genkit-angular-story-generator)のコードを参照してください。

### ツール呼び出しを使用してアプリを強化する
エージェントがプロンプトに基づいて行動し、ツールを使用して問題を解決できるエージェントワークフローを構築したい場合は、「ツール呼び出し」を使用します。ツール呼び出し（関数呼び出しとも呼ばれます）は、LLMがそれを呼び出したアプリケーションにリクエストを返す機能を提供する手段です。開発者として、利用可能なツールを定義し、ツールがどのように、またはいつ呼び出されるかを制御します。

ツール呼び出しは、質問と回答形式のチャットボットよりもさらにAI統合を拡張することにより、Webアプリをさらに強化します。実際、モデルプロバイダーの関数呼び出しAPIを使用して、関数呼び出しをリクエストするようにモデルに指示できます。利用可能なツールを使用して、アプリケーションのコンテキスト内でより複雑なアクションを実行できます。

[Angular examples repository](https://github.com/angular/examples)の[e-commerce example](https://github.com/angular/examples/blob/main/vertex-ai-firebase-angular-example/src/app/ai.service.ts#L88)では、LLMはストア内のアイテムグループの費用を計算するなど、より複雑なタスクを実行するために必要なコンテキストを取得するために、在庫の関数を呼び出すようにリクエストします。利用可能なAPIの範囲は、開発者としてあなた次第であり、LLMからリクエストされた関数を呼び出すかどうかと同じです。実行の流れはあなたが制御し続けます。たとえば、サービスの特定の関数を公開できますが、そのサービスのすべての関数を公開する必要はありません。

### 非決定的な応答の処理

モデルは非決定的な結果を返す可能性があるため、アプリケーションはそれを念頭に置いて設計する必要があります。アプリケーションの実装で使用できる戦略をいくつか紹介します。
* プロンプトとモデルのパラメータ（[temperature](https://ai.google.dev/gemini-api/docs/prompting-strategies)など）を調整して、決定的な応答を増減させます。[ai.google.dev](https://ai.google.dev/)の[プロンプト戦略セクション](https://ai.google.dev/gemini-api/docs/prompting-strategies)で詳細を確認できます。
* ワークフローを進める前に、人が出力を検証する「ヒューマンインザループ」戦略を使用します。オペレーター（人間または他のモデル）が出力を検証し、主要な決定を確認できるように、アプリケーションのワークフローを構築します。
* ツール（または関数）呼び出しとスキーマ制約を使用して、モデルの応答を事前に定義された形式に誘導および制限し、応答の予測可能性を高めます。

これらの戦略とテクニックを考慮しても、アプリケーションの設計には適切なフォールバックを組み込む必要があります。既存のアプリケーションの回復性の標準に従ってください。たとえば、リソースまたはAPIが利用できない場合にアプリケーションがクラッシュすることは許容されません。そのシナリオでは、エラーメッセージがユーザーに表示され、該当する場合は、次のステップのオプションも表示されます。AIを活用したアプリケーションの構築には、同じ考慮事項が必要です。応答が期待される出力と一致していることを確認し、[グレースフルデグラデーション](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation)によって一致しない場合に「安全な着地」を提供します。これは、LLMプロバイダーのAPI停止にも当てはまります。

次の例を考えてみましょう。LLMプロバイダーが応答していません。停止を処理するための潜在的な戦略は次のとおりです。
* 再試行シナリオ（今または後で）で使用するために、ユーザーからの応答を保存します
* 機密情報を明らかにしない適切なメッセージで、停止をユーザーに警告します
* サービスが再び利用可能になったら、後で会話を再開します。