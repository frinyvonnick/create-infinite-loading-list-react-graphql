const Koa = require('koa')
const { ApolloServer, gql } = require('apollo-server-koa')
const faker = require('faker/locale/fr')
const { random, name } = faker 

const typeDefs = gql`
  type Person {
    id: ID,
    lastname: String,
    firstname: String,
  }

  type PersonEdge {
    cursor: ID!,
    node: Person!,
  }

  type PersonConnection {
    edges: [PersonEdge]
    pageInfo: PageInfo
  }

  type PageInfo {
    endCursor: ID!,
    hasNextPage: Boolean!,
  }

  type Query {
    persons(first: Int!, cursor: ID): PersonConnection
  }
`

const range = (size, callback) => {
  return Array.from({ length: size }, callback)
}

const resolvers = {
  Query: {
    persons: (query, { cursor, first }) => {
      faker.seed(123)
      const persons = range(50, () => ({
        id: random.uuid(),
        firstname: name.firstName(),
        lastname: name.lastName(),
      }))

      const cursorIndex = !cursor ? 0 : persons.findIndex(person => person.id === cursor) + 1
      const sliceOfPersons = persons.slice(cursorIndex, cursorIndex + first)

      return {
        edges: sliceOfPersons.map(person => ({ cursor: person.id, node: { ...person } })),
        pageInfo: {
          endCursor: sliceOfPersons[sliceOfPersons.length - 1].id,
          hasNextPage: cursorIndex + first < persons.length,
        },
      }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const app = new Koa()
server.applyMiddleware({ app })

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`),
)
