<!-- TODO: need an Angular + AI logo -->
<docs-decorative-header title="AIで構築" imgSrc="adev/src/assets/images/what_is_angular.svg"> <!-- markdownlint-disable-line -->
AIを活用したアプリケーションを構築する。AIで開発を加速する。
</docs-decorative-header>

大規模言語モデル (LLM) を用いた生成AI (GenAI) は、パーソナライズされたコンテンツ、賢い推奨、メディアの生成と理解、情報の要約、動的な機能など、高度で魅力的なアプリケーション体験の作成を可能にします。

このような機能の開発は、以前は深い領域知識と多大な開発労力を必要としました。しかし、新しい製品やSDKは参入障壁を下げています。Angularは、次の理由により、ウェブアプリケーションにAIを統合するのに適しています。

* Angularの堅牢なテンプレートAPIは、生成されたコンテンツから動的で、きれいに構成されたUIの作成を可能にします
* データと状態を動的に管理するよう設計された、強力なシグナルベースのアーキテクチャ
* AngularはAI SDKやAPIとシームレスに統合されます

このガイドは、[Genkit](/ai#build-ai-powered-applications-with-genkit-and-angular)、[Firebase AI Logic](https://firebase.google.com/products/firebase-ai-logic)、[Gemini API](https://ai.google.dev/) を使って、AngularアプリにAIを組み込む方法を説明します。このガイドは、AngularアプリにAIを統合し始める方法を説明し、AIを活用したウェブアプリ開発の旅を加速させます。また、このガイドは、スターターキット、サンプルコード、一般的なワークフローのレシピなど、迅速に習得するためのリソースも共有しています。

始めるには、Angularの基本的な理解が必要です。Angularを初めて利用しますか？当社の[基本ガイド](/essentials)または[入門チュートリアル](/tutorials)を試してください。

NOTE: このページはGoogle AI製品との統合と例を特徴としていますが、Genkitのようなツールはモデルに依存せず、独自のモデルを選択できます。多くの場合、例やコードサンプルは他のサードパーティソリューションにも適用可能です。

## はじめに
AIを活用したアプリケーション構築は、新しく急速に発展している分野です。どこから始め、どの技術を選ぶか決めるのは難しい場合があります。以下のセクションでは、選択肢となる3つの方法を提示します。

1. *Genkit* は、フルスタックアプリケーション構築のため、[統一されたAPIでサポートされるモデルとインターフェース](https://firebase.google.com/docs/genkit)の選択肢を提供します。パーソナライズされた推薦など、高度なバックエンドAIロジックを必要とするアプリケーションに最適です。

1. *Firebase AI Logic* は、Googleのモデルでクライアントサイドのみのアプリケーションやモバイルアプリを構築するための、安全なクライアントサイドAPIを提供します。リアルタイムのテキスト分析や基本的なチャットボットなど、ブラウザで直接動作する対話型AI機能に最適です。

1. *Gemini API* は、APIインターフェースを通じて直接公開されるメソッドと機能を使用するアプリケーションを構築できます。フルスタックアプリケーションに最適です。カスタム画像生成や詳細なデータ処理など、AIモデルを直接制御する必要があるアプリケーションに適しています。

### GenkitとAngularでAI搭載アプリケーションを構築する
[Genkit](https://firebase.google.com/docs/genkit)は、ウェブアプリおよびモバイルアプリにAI搭載機能の構築を支援するよう設計されたオープンソースツールキットです。Google、OpenAI、Anthropic、OllamaなどからのAIモデルを統合する統一されたインターフェースを提供し、必要に応じた最適なモデルを検討し選択できます。サーバーサイドの解決策として、ウェブアプリはGenkitと統合するため、Nodeベースのサーバーなど、サポートされたサーバー環境を必要とします。例えば、Angular SSRを用いたフルスタックアプリの構築は、開始となるサーバーサイドコードを提供します。

GenkitとAngularで構築する方法の例を次に示します。

* [GenkitとAngularによるエージェントアプリのスターターキット](https://github.com/angular/examples/tree/main/genkit-angular-starter-kit)— AIでの構築が初めてですか？エージェントワークフローを備えた基本的なアプリから始めましょう。初めてのAI構築体験に最適な場所です。

* [AngularアプリでのGenkitの使用](https://firebase.google.com/docs/genkit/angular)— Genkitフロー、Angular、Gemini 2.0 Flashを使用する基本的なアプリケーションを構築します。このステップバイステップのチュートリアルは、AI機能を備えたフルスタックAngularアプリケーションの作成を案内します。

* [動的ストーリー生成アプリ](https://github.com/angular/examples/tree/main/genkit-angular-story-generator)— Genkit、Gemini、Imagen 3を搭載し、ユーザーの操作に基づいて動的にストーリーを生成し、発生するイベントに付随する美しい画像パネルを特徴とするエージェントAngularアプリの構築方法を学びます。より高度な利用例を試したい場合は、ここから始めましょう。

  この例には、機能の詳細なビデオチュートリアルも含まれています。
    * [「AngularとGenkitでエージェントアプリをライブ構築！」を視聴する](https://youtube.com/live/mx7yZoIa2n4?feature=share)
    * [「AngularとGenkitでエージェントアプリをライブ構築！パート2」を視聴する](https://youtube.com/live/YR6LN5_o3B0?feature=share)

* [FirebaseとGoogle Cloudによるエージェントアプリの構築（バリスタの例）](https://developers.google.com/solutions/learn/agentic-barista) - FirebaseとGoogle Cloudを使用してエージェントコーヒー注文アプリを構築する方法を学びます。この例では、Firebase AI LogicとGenkitの両方を使用しています。

### Firebase AI Logic と Angular でAI搭載アプリケーションを構築する
[Firebase AI Logic](https://firebase.google.com/products/vertex-ai-in-firebase) は、ウェブおよびモバイルアプリから Vertex AI Gemini API または Imagen API と直接やり取りするための安全な方法を提供します。アプリがフルスタックまたはクライアントサイドのみのいずれかであるため、これは Angular 開発者にとって魅力的です。クライアントサイドのみのアプリケーションを開発している場合、Firebase AI Logic はウェブアプリにAIを組み込むのに適しています。

Firebase AI Logic と Angular を用いた構築方法の例を以下に示します。
* [Firebase AI Logic x Angular 開始用キット](https://github.com/angular/examples/tree/main/vertex-ai-firebase-angular-example) - この開始用キットを使用して、タスクを実行できるチャットエージェントを備えた電子商取引アプリケーションを構築します。Firebase AI Logic と Angular での構築経験がない場合は、ここから始めます。

  この例には、機能の説明と新機能の追加方法を示す[詳細なビデオ解説](https://youtube.com/live/4vfDz2_BI)が含まれています。

### Gemini APIとAngularでAI活用アプリケーションを構築する
[Gemini API](https://ai.google.dev/gemini-api/docs)は、Googleが提供する音声、画像、動画、テキスト入力をサポートする最先端のモデルへのアクセスを提供します。特定の利用事例向けに最適化されたモデルについては、[Gemini APIドキュメントサイトで詳細をご確認ください](https://ai.google.dev/gemini-api/docs/models)。

* [AI Text Editor Angular app template](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-text-editor) - このテンプレートを利用して、テキストの洗練、拡張、形式化といったAI活用機能を備えた、完全に機能するテキストエディターを始めることができます。これは、HTTP経由でGemini APIを呼び出す経験を積む良い出発点となります。

* [AI Chatbot app template](https://github.com/FirebaseExtended/firebase-framework-tools/tree/main/starters/angular/ai-chatbot) - このテンプレートは、HTTP経由でGemini APIと通信するチャットボットのユーザーインターフェースから始まります。

## AIパターンの活用: チャット応答の逐次表示
モデルから応答を受信するにつれてテキストが表示されるのは、AIを使用するウェブアプリケーションで一般的なUIパターンです。Angularの`resource` APIで、この非同期タスクを実現できます。`resource`の`stream`プロパティは、時間とともにシグナル値に更新を適用する非同期関数を受け入れます。更新されるシグナルは、ストリーミングされるデータを表します。

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

サーバー側、例えば`server.ts`では、定義されたエンドポイントがストリーミングされるデータをクライアントに送信します。以下のコードはGemini APIを使用していますが、この手法は大規模言語モデルからのストリーミング応答をサポートする他のツールやフレームワークにも適用できます。

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
この例はGemini APIに接続していますが、ストリーミング応答をサポートする他のAPIもここで使用できます。AngularのGithubで完全な例を見つけることができます。

## 推奨事項
### モデル提供者への接続とAPI認証情報の安全な管理
モデル提供者に接続する際、API秘密情報を安全に保つことが重要です。*APIキーを`environments.ts`のようなクライアントに配布されるファイルへ決して配置しないでください*。

アプリケーションのアーキテクチャによって、どのAI APIとツールを選択するかが決まります。具体的には、アプリケーションがクライアントサイドかサーバーサイドかによって選択します。Firebase AI Logicのようなツールは、クライアントサイドのコードのためにモデルAPIへの安全な接続を提供します。Firerbase AI Logicとは異なるAPIを使用したい場合、または異なるモデル提供者を使用したい場合は、プロキシサーバー、あるいは[Cloud Functions for Firebase](https://firebase.google.com/docs/functions)をプロキシとして利用し、APIキーを公開しないことを検討してください。

クライアントサイドアプリケーションを用いた接続の例については、以下のコードを参照してください:  [Firebase AI Logic Angular example repository](https://github.com/angular/examples/tree/main/vertex-ai-firebase-angular-example)。

APIキーを必要とするモデルAPIへのサーバーサイド接続については、`environments.ts`ではなく、秘密情報管理システムまたは環境変数の使用を推奨します。APIキーと認証情報を保護するための標準的な最善策に従うべきです。Firebaseは、Firebase App Hostingの最新の更新により、新しい秘密情報管理システムを提供しています。詳細については、[公式ドキュメントを確認してください](https://firebase.google.com/docs/app-hosting/configure)。

フルスタックアプリケーションにおけるサーバーサイド接続の例については、以下のコードを参照してください: [Angular AI Example (Genkit and Angular Story Generator) repository](https://github.com/angular/examples/tree/main/genkit-angular-story-generator)。

### ツール呼び出しでアプリを強化する
エージェントがプロンプトに基づき動作し、ツールを使用して問題を解決するようなエージェントワークフローを構築したい場合、「ツール呼び出し」を使用します。ツール呼び出しは、関数呼び出しとも呼ばれ、LLMに自身を呼び出したアプリケーションへ要求する能力を与える手段です。開発者として、利用可能なツールを定義し、ツールの呼び出し方法やタイミングを制御できます。

ツール呼び出しは、AI連携を質疑応答形式のチャットボットよりもさらに拡大することで、ウェブアプリをさらに強化します。実際、モデルプロバイダーの関数呼び出しAPIを使用して、モデルに関数呼び出しを要求する権限を与えることができます。利用可能なツールは、アプリケーションのコンテキスト内でより複雑なアクションを実行するために使用できます。

[Angular examples repository](https://github.com/angular/examples)の[e-commerce example](https://github.com/angular/examples/blob/main/vertex-ai-firebase-angular-example/src/app/ai.service.ts#L88)では、LLMは、店舗内の商品グループの合計金額を計算するような、より複雑なタスクを実行するために必要なコンテキストを得るため、在庫に関する関数を呼び出すよう要求します。利用可能なAPIの範囲は開発者であるあなた次第であり、LLMが要求した関数を呼び出すかどうかも同様です。実行フローはあなたが制御します。例えば、サービスの特定の関数を公開できますが、そのサービスのすべての関数を公開する必要はありません。

### 非決定的な応答の処理
モデルは非決定的な結果を返す可能性があるため、それを念頭に置いてアプリケーションを設計する必要があります。アプリケーションの実装で利用できる戦略をいくつか示します。
* 決定的な応答の度合いを調整するため、プロンプトとモデルのパラメータ（[温度](https://ai.google.dev/gemini-api/docs/prompting-strategies)など）を調整します。[ai.google.dev](https://ai.google.dev/)の[プロンプト戦略のセクション](https://ai.google.dev/gemini-api/docs/prompting-strategies)で詳細を確認できます。
* ワークフローを進める前に人間が出力を検証する「ヒューマン・イン・ザ・ループ」戦略を使用します。オペレーター（人間または他のモデル）が出力を検証し、重要な決定を確認できるように、アプリケーションのワークフローを構築します。
* 応答の予測可能性を高めるため、ツール（または関数）呼び出しとスキーマ制約を用いて、モデルの応答を事前定義された形式に誘導し、制限します。

これらの戦略や手法を考慮しても、アプリケーションの設計には適切なフォールバックを組み込むべきです。アプリケーションの回復性に関する既存の標準に従ってください。たとえば、リソースやAPIが利用できない場合にアプリケーションがクラッシュすることは許容されません。そのシナリオでは、ユーザーにエラーメッセージが表示され、該当する場合は次の手順の選択肢も表示されます。AIを活用したアプリケーションの構築には、同様の考慮が必要です。応答が期待される出力と一致していることを確認し、一致しない場合は[グレースフルデグラデーション](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation)により「安全な着地」を提供してください。これは、LLMプロバイダーのAPI停止にも適用されます。

次の例を考えてみましょう。LLMプロバイダーが応答していません。停止を処理するための潜在的な戦略は次のとおりです。
* ユーザーからの応答を、再試行シナリオ（現在または後で）で使用するために保存します。
* 機密情報を明らかにしない適切なメッセージで、ユーザーに停止を通知します。
* サービスが再度利用可能になったら、後で会話を再開します。
