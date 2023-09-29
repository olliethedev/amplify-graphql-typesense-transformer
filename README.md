[![Code Coverage](https://github.com/olliethedev/amplify-graphql-typesense-transformer/actions/workflows/coverage.yml/badge.svg)](https://github.com/olliethedev/amplify-graphql-typesense-transformer/actions/workflows/coverage.yml)


# Amplify GraphQL Typesense Transformer

Enhance your Amplify API with serverless search capabilities using the Typesense transformer.

## Overview
The Amplify GraphQL Typesense Transformer allows you to seamlessly integrate Typesense, a modern, open-source search engine designed with cutting-edge algorithms and machine learning, into your AWS Amplify API. It offers a privacy-friendly approach and is optimized for the latest hardware capabilities.

## Getting Started

### Installation
```bash
npm install amplify-graphql-typesense-transformer
```

### Integration
1. **Update Configuration**: Modify the `transform.conf.json` file located at `/amplify/backend/api/<API_NAME>/`.

```json
{
    "transformers": [
        "amplify-graphql-typesense-transformer"
    ]
}
```

2. **Set Up Connection Parameters**: Update `/amplify/backend/api/<API_NAME>/parameters.json` with your Typesense connection details, available in your Typesense Cloud dashboard.

```json
{
  "TypesenseApiKey": "<API_KEY>",
  "TypesenseHost": "xxx.a1.typesense.net",
  "TypesensePort": "443",
  "TypesenseProtocol": "https"
}
```

3. **Add Directive**: Attach the `@typesense` directive to the desired model for indexing. This will automatically create and manage a Typesense collection for the model.

```graphql
type Todo @model @typesense {
  id: ID!
  name: String!
  description: String
}
```

4. **Deploy Changes**: Apply the modifications to your Amplify API.
```bash
amplify push
```

### Usage

1. **Create a Record**: Create a record using the GraphQL API.

```javascript
import { API } from "aws-amplify";
import * as mutations from "../graphql/mutations";
import { GraphQLQuery } from "@aws-amplify/api";
import { CreateBlogMutation } from "../API";

const blogDetails: CreateBlogInput = {
  name: text,
};

const newTodo = await API.graphql<GraphQLQuery<CreateBlogMutation>>({
  query: mutations.createBlog,
  variables: { input: blogDetails },
});
```

2. **Search Record with a Search Query**: The transformer also creates your GraphQL queries with a search query for each model marked with the `@typesense` directive. You can learn about the query syntax from [Typesense Search API](https://typesense.org/docs/0.25.0/api/documents.html#search-documents).

```javascript
import { API } from "aws-amplify";
import * as queries from "../graphql/queries";
import { GraphQLQuery } from "@aws-amplify/api";
import { SearchBlogsQuery } from "../API";

const results = await API.graphql<GraphQLQuery<SearchBlogsQuery>>({
    query: queries.searchBlogs,
    variables: {
        searchParameters: JSON.stringify({
          q: `*${text}*`,
          query_by: "name",
        }),
    },
});
```

### GraphQL Schema changes
The transformer will automatically create a Typesense collection for each model with the `@typesense` directive, and the schema will be auto detected by Typesense. This means that any non distructive changes, like adding a new field to the GraphQL schema will be reflected in the Typesense collection. 


### Optional: Amplify Cloud CI/CD

If you encounter an error related to amplify-graphql-typesense-transformer not being found, you may need to add the following to your `amplify.yml` file in the **cloud console**:

```yaml
backend:
  phases:
    build:
      commands:
        - npm install amplify-graphql-typesense-transformer
        - amplifyPush --simple
```

### Example Project
Check out [this project](./examples/blog) for a searchable blog example.

## How It Works
The `@typesense` directive establishes a dedicated Lambda function for each GraphQL API in your Amplify project. It then links DynamoDB streams from the corresponding tables to this function. Upon receiving a stream, the function processes the fields as defined, transforms the record into a Typesense payload, and updates (or creates if not present) the Typesense collection named after the model.

Read more about building custom directives [here](https://docs.amplify.aws/cli/plugins/authoring/#authoring-custom-graphql-transformers--directives).

## Contribution
We appreciate and welcome contributions! If you have improvements or features to suggest, please feel free to submit a pull request.

### Development Workflow

#### Transformer
- Set up an Amplify project and integrate an API.
- Add the transformer using an absolute path in `amplify/backend/api/<API_NAME>/transform.conf.json`:

```json
{
    "transformers": [
        "file:///absolute/path/to/graphql-Typesense-transform/"
    ]
}
```

- Rebuild the transformer: `npm run compile`.
- Use `amplify api gql-compile` to inspect stack outputs without initiating the push process.
- Review `amplify/backend/api/<API>/build/stacks/TypesenseStack` for expected results.

## License
Distributed under the [Apache 2.0 License](LICENSE).
