import { makeExecutableSchema } from "@graphql-tools/schema"
import { extendSchema, graphql, GraphQLSchema, parse } from "graphql";

const remoteSchemaSDL = `
  type Query {
    user: User!
  }
  type User {
    name: String!
    title: String!
  }
`;

const localSchemaSDL = `
  extend type User {
    hasLocalState: Boolean!
  }
`

const remoteSchema = makeExecutableSchema({
  typeDefs: parse(remoteSchemaSDL),
  resolvers: {
    Query: {
      user: () => ({
        name: "Satya",
        title: "CEO"
      })
    }
  }
})

const localSchema = makeExecutableSchema({
  typeDefs: extendSchema(remoteSchema, parse(localSchemaSDL)),
  resolvers: {
    /**
     * Fields for which no local resolver is provided, such a `name` in this example, are used as-is.
     */
    User: {
      /**
       * Localizes the remote result for this field.
       */
      title: (remoteSource) => remoteSource.title === "CEO" ? "Bossmang" : remoteSource.title,
      /**
       * Adds a local field that doesn't exist in the remote schema.
       */
      hasLocalState: () => true,
    }
  }
})

/**
 * Fields that don't exist in the remote schema need to be removed from the request document before delegating the request.
 * 
 * TODO: @graphql-tools has support for transforms, which could probably handle this.
 */
function filterLocalOnlyFields(document: string) {
  return document.replace("hasLocalState", "")
}

async function augmentedExecute(options: {
  localSchema: GraphQLSchema,
  remoteSchema: GraphQLSchema,
  document: string,
}) {
  const remoteResult = await graphql({
    schema: options.remoteSchema,
    source: filterLocalOnlyFields(options.document),
  })
  const localResult = await graphql({
    schema: options.localSchema,
    source: options.document,
    /**
     * Inject remote result, which will return most values as-is with the default field resolver.
     * 
     * TODO: This would break with aliased results coming back from the remote.
     *       @graphql-tools has support for transforms, which could probably handle this.
     */
    rootValue: remoteResult
  })
  return localResult;
}

;(async () => {
  const result = await augmentedExecute({
    localSchema,
    remoteSchema,
    document: `
      query {
        user {
          name
          title
          hasLocalState
        }
      }
    `
  })
  console.log(result)
})();