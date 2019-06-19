# graphqlgen-webpack-plugin

Runs [graphqlgen](https://github.com/prisma/graphqlgen) as part of the Webpack compilation process. It will run before type-checkers like fork-ts-checker-webpack-plugin.

## Usage

graphqlgen-webpack-plugin takes the same options as graphqlgen. While graphqlgen's options are specified in the file `graphqlgen.yml`,
graphqlgen-webpack-plugin instead takes options directly through the plugin constructor, like other Webpack plugins. This plugin does **NOT** read `graphqlgen.yml`.

Install as a dev dependency:

```bash
npm install --save-dev graphqlgen-webpack-plugin
```

Then, add the plugin to the `plugins` array in your Webpack config:

```javascript
const GraphqlgenWebpackPlugin = require("graphqlgen-webpack-plugin");

// ....

plugins: [
    new GraphqlgenWebpackPlugin({
        language: "typescript",
        schema: path.join(__dirname, "src/schema.graphql"),
        context: path.join(__dirname, "src/types.ts:GraphQLContext"),
        output: path.join(__dirname, "src/generated/graphql.ts"),
        models: {
            files: [
                path.join(__dirname, "src/models/**/*.ts")
            ]
        }
    })
]
```

This is equivalent to a `graphqlgen.yml` file that looks like this:

```yml
language: typescript
schema: ./src/schema.graphql
context: ./src/types.ts:GraphQLContext
output: ./src/generated/graphql.ts
models:
  files:
    - ./src/models/**/*.ts
```

Read the [graphqlgen documentation](https://oss.prisma.io/graphqlgen/) for more details about options.