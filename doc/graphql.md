# GraphQL

在GraphQL中，前端发送的请求和后端定义的schema中的resolvers有直接的对应关系。这种对应关系是GraphQL设计的核心特点之一，它允许前端请求所需的确切数据，后端则相应地解析这些请求。

GraphQL的schema定义了API的类型系统。它包含了可执行的查询（Query）和变更（Mutation）类型，以及这些类型的字段。例如，一个查询可能允许客户端获取用户信息或产品列表。

每个在GraphQL schema中定义的字段通常都有一个对应的resolver函数。这些resolver是在后端实现的，并且负责返回请求的数据。Resolver函数知道如何“解析”或检索schema字段所描述的数据。

当一个GraphQL请求（通常是查询或变更）被发送到服务器时，解析器会根据请求中指定的字段和查询结构执行。前端请求中的每个字段和嵌套字段都对应schema中的一个resolver函数。

例如，如果客户端发送了如下GraphQL查询请求：

```bash
query {
  user(id: "1") {
    name
    email
    posts {
      title
      content
    }
  }
}
```

在这个例子中：

- 顶层的`user`字段将对应到一个resolver函数，它接受用户ID作为参数并返回用户信息。
- `name`和`email`字段通常不需要特殊的resolver，因为它们是用户对象的直接属性。
- `posts`字段将对应到另一个resolver函数，它知道如何获取和返回该用户的帖子列表。
- 在`posts`下的`title`和`content`字段同样可以直接从帖子对象中获取，或者也可以有专门的resolvers，这取决于schema的设计。

返回的结果会匹配请求的查询结构，只包含请求的字段。这种能力允许客户端按需获取数据，减少不必要的数据传输，这是GraphQL最强大的功能之一。

总之，GraphQL前端的请求和后端schema中的resolvers之间的对应关系保证了强类型和结构的API设计，这使得开发更加一致和预测性强，并且可以轻松地在前后端之间协作。

## 例子

让我们通过一个具体的例子来解释前端请求与GraphQL schema中的resolvers之间的对应关系。

假设我们有如下的GraphQL schema定义：

```graphql
type Query {
  book(id: ID!): Book
  author(id: ID!): Author
}

type Book {
  id: ID!
  title: String
  author: Author
}

type Author {
  id: ID!
  name: String
  books: [Book]
}
```

这个schema定义了两种类型的查询（`book`和`author`），以及两个类型（`Book`和`Author`）。

### Resolvers 实现

后端对于这个schema可能会有如下的resolvers实现：

```javascript
const resolvers = {
  Query: {
    book: (_, { id }) => {
      // 逻辑来获取特定ID的书籍
      return getBookById(id);
    },
    author: (_, { id }) => {
      // 逻辑来获取特定ID的作者
      return getAuthorById(id);
    }
  },
  Book: {
    author: (book) => {
      // 逻辑来获取这本书的作者
      return getAuthorById(book.authorId);
    }
  },
  Author: {
    books: (author) => {
      // 逻辑来获取这位作者写的所有书籍
      return getBooksByAuthorId(author.id);
    }
  }
};
```

这里，`getBookById`和`getAuthorById`可能是一些函数，用来从数据库中获取信息。

### 前端请求示例

现在，假设前端想要获取一个特定作者的姓名以及他们所写的书籍的标题。前端将发送一个GraphQL查询如下：

```graphql
query {
  author(id: "123") {
    name
    books {
      title
    }
  }
}
```

当这个查询到达GraphQL服务器时，以下事情发生：

1. GraphQL服务器识别出这是一个查询`author`，并且传递了一个ID值`"123"`。
2. 对应于`author`查询的resolver被调用，使用ID`"123"`去获取作者的数据。
3. 一旦获取到`Author`对象，GraphQL服务器将寻找这个类型下的字段`name`和`books`。
4. `name`字段通常直接返回，因为它是一个基本类型。
5. `books`字段对应的resolver被调用，它使用作者的ID去获取他们所有的书籍。
6. 对于`books`数组中的每一本书，只有`title`字段被要求，所以GraphQL服务器只会获取这个信息。

最终返回给前端的数据将是这样的结构：

```json
{
  "data": {
    "author": {
      "name": "Jane Doe",
      "books": [
        { "title": "Book One" },
        { "title": "Book Two" },
        // ...其他书籍
      ]
    }
  }
}
```

在这个例子中，前端的请求精确地定义了它希望从后端获取的数据结构，后端的resolvers提供了必要的逻辑来获取和返回这些数据。这种模式使得数据获取高度优化和定制化。
