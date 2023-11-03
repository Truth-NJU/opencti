<img src="./img/architecture.png" alt="img" style="zoom:60%;" />

## opencti-graphql目录

1. src/graphql/graphql.js用来创建graphql服务，调用src/graphql/schema.js中的createSchema来创建一个GraphQL模式，GraphQL模式（schema）是一个定义了GraphQL API的类型系统的核心部分。它描述了API提供的数据结构和可用的查询操作。 模式定义了可用的对象类型、字段、查询操作以及其他相关的元素。通过模式，客户端可以发出查询请求，并获取符合模式定义的数据。相当于后端接口。

2. src/graphql/schema.js中的createSchema方法会用到schemaResolvers，在GraphQL中，`schemaResolvers`是一个用于定义查询、变更（mutation）和订阅（subscription）解析器的对象。它们是GraphQL服务器的核心组成部分，用于处理客户端请求并返回相应的数据。

   `schemaResolvers`对象通常包含以下三个属性：

   - `Query`：用于处理查询请求的解析器。
   - `Mutation`：用于处理变更请求的解析器。
   - `Subscription`：用于处理订阅请求的解析器。

   每个属性都是一个包含多个字段解析器的对象。字段解析器是一个函数，用于处理特定字段的查询、变更或订阅请求，并返回相应的数据。通过定义适当的`schemaResolvers`，开发人员可以控制GraphQL服务器如何处理客户端请求并返回所需的数据。这使得GraphQL服务器可以根据需要进行数据的获取、修改和实时更新。

   具体的schemaResolvers在src/resolvers目录下。

3. 以src/resolvers/elasticSearchMetricsResolvers为例，在Query中调用了src/domain/searchMetrics中的getMetrics方法，getMetrics方法调用了src/database/engine中的getStats方法

4. src/database/engine.js初始化ElasticSearch