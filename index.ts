import { makeExecutableSchema } from "@graphql-tools/schema"
import { extendSchema, graphql, parse } from "graphql";

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
  typeDefs: remoteSchemaSDL,
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

;(async () => {
  const remoteResult = await graphql({
    schema: remoteSchema,
    source: `
      query {
        user {
          name
          title
        }
      }
    `
  })
  const localResult = await graphql({
    schema: localSchema,
    source: `
      query {
        user {
          name
          title
          hasLocalState
        }
      }
    `,
    /**
     * Inject remote result, which will return most values as-is with the default field resolver.
     * 
     * TODO: This would break wit aliased results coming back from the remote.
     */
    rootValue: remoteResult
  })
  console.log(localResult)
})();