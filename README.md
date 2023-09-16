# Amplify GraphQL Typesense Transformer

Enhance your Amplify API with serverless search capabilities using the Typesense transformer.

## Overview
The Amplify GraphQL Typesense Transformer allows you to seamlessly integrate Typesense, a modern, open-source search engine designed with cutting-edge algorithms and machine learning, into your Amplify API. It offers a privacy-friendly approach and is optimized for the latest hardware capabilities.

## Getting Started

### Installation
```bash
npm install amplify-graphql-typesense-transformer
```

### Integration
1. **Update Configuration**: Modify the `transform.conf.json` file located at `/amplify/backend/api/<API_NAME>/`.

```json
{
    ...
    "transformers": [
        ...,
        "amplify-graphql-typesense-transformer"
    ]
}
```

2. **Set Up Connection Parameters**: Update `/amplify/backend/api/<API_NAME>/parameters.json` with your Typesense connection details, available in your Typesense Cloud dashboard.

```json
{
  ...
  "TypesenseApiKey": "...api-key...",
  "TypesenseHost": "abc.typesense.net",
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

4. **Utilize the Generated Search Query**: The transformer also updates your GraphQL generated queries with a search query for each model using the `@typesense` directive.

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
          filter_by: 'num_comments:>100',
          sort_by: 'num_comments:desc'
        }),
    },
});
```

5. **Deploy Changes**: Apply the modifications to your Amplify API.
```bash
amplify push
```

### Example Project
_Work in Progress_

## How It Works
The `@typesense` directive establishes a dedicated Lambda function for each GraphQL API in your Amplify project. It then links DynamoDB streams from the corresponding tables to this function. Upon receiving a stream, the function processes the fields as defined, transforms the record into a Typesense payload, and updates (or creates if not present) the Typesense collection named after the model.

## Contribution
We appreciate and welcome contributions! If you have improvements or features to suggest, please feel free to submit a pull request.

### Development Workflow

#### Transformer
- Set up an Amplify project and integrate an API.
- Incorporate the transformer using its absolute path:

```json
// amplify/backend/api/<API_NAME>/transform.conf.json
{
    ...
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
