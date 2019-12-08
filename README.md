# Create an infinite loading list with React and GraphQL

This week I had to implement a infinite loading list to display users in a React application I'm developping for my current customer. I have already done it before but never using GraphQL as server part. It was time to learn how to implement the [pagination mechanism](https://graphql.org/learn/pagination/) described in the GraphQL specification.

Infinite loading list are really useful to breaks large amount of data into small chunks that can be loaded as the user scrolls down the list. The front page of [dev.to](https://dev.to/) is a good example of this kind of lists. It saves users from a full page load. It also provides better user experience in mobile applications.

<figure>
	<img src="https://github.com/frinyvonnick/create-infinite-loading-list-react-graphql/blob/master/assets/infinite_loading.gif?raw=true" alt="Infinite loading list of persons"/>
	<figcaption>*We will create a infinite loading list of persons. You can see data loading as the user scrolls down the list.*</figcaption>
</figure>

## What this article covers

In this tutorial we will describe how to implement pagination on GraphQL side using [Apollo Server](https://www.apollographql.com/docs/apollo-server/). We won't cover the setup of the server but you can find how to do it with Koa in a [previous article](https://dev.to/yvonnickfrin/mock-your-graphql-server-realistically-with-faker-js-25oo) I wrote.

In a second time, we will consume a paginated query on React side using [hooks](https://blog.apollographql.com/apollo-client-now-with-react-hooks-676d116eeae2) recently added to [Apollo Client](https://www.apollographql.com/docs/react/).

Last but not least, we will implement the infinite loading list using [react-window](https://github.com/bvaughn/react-window) a library from [Brian Vaughn](https://github.com/bvaughn).

## Pagination

We want to display a list of persons. We will use a simple data model, a person has a `firstname` and a `lastname`. This will be enough to illustrate what we are implementing.

```js
type Person {
	id: ID,
	lastname: String,
	firstname: String,
}
```

The easy part is done. Now the hard one, pagination. There are multiple kind of pagination. You probably know page-based pagination using a page index and an offset of elements. But this pagination model has limitations that are reached in common scenarios. You can learn more about it in this [article](https://blog.apollographql.com/explaining-graphql-connections-c48b7c3d6976) from [Caleb Meredith](https://twitter.com/calebmer).

We will go with a cursor-based pagination.

The principle lies on the fact that a cursor is a unique identifier for each element in the list. In our case it will be the person's id (but it could be anything else).

I believe examples are the best way to understand. Let's go throw a sequence of queries to load the first two chunks of persons.

```
persons(first: 10)
```

It will return the ten first persons. Each person has a cursor. We will use the last person fetched's cursor to query again the GraphQL server and get a new chunk of persons.

```
persons(first: 10, cursor: "ZmY3OTI0YWMtYTY0Ny00NTIyLWE2ZjEtNzJmMTNhN2E3NjAx")
```

It will return the ten persons after the last one we fetched.

In GraphQL paginated queries return a `connection`.

```
type Query {
	persons(first: Int!, cursor: ID): PersonConnection
}
```

A `connection` let's you provide more information than the queried elements. Like total number of elements or information related to the current page.

```
type PersonConnection {
	edges: [PersonEdge]
	pageInfo: PageInfo
}

type PageInfo {
	endCursor: ID!,
	hasNextPage: Boolean!,
}
```

The collection of your elements are stored in a `edges` property. An `edge` is composed of the cursor we talked about earlier and a `node` containing all informatio related to an element of the list. Since the cursor isn't in the `Person` directly it let us free to change our server implementation without affecting the data model. It also adds the possibility to enhance the information carried by the edge like adding a `relations` property that lists the persons that are in contact with this person.

```
type PersonEdge {
	cursor: ID!,
	node: Person!,
}
```

It is time to implement the resolver for our `persons` query. We use faker to generate random data and provide a seed so the persons won't change between each request.

```js
const range = (size, callback) => {
  return Array.from({length: size}, callback);
};

const resolvers = {
  Query: {
    persons: (query, {cursor, first}) => {
      faker.seed(123);
      const persons = range(200, () => ({
        id: random.uuid(),
        firstname: name.firstName(),
        lastname: name.lastName(),
      }));

      const cursorIndex = !cursor
        ? 0
        : persons.findIndex(person => person.id === cursor) + 1;
      const sliceOfPersons = persons.slice(cursorIndex, cursorIndex + first);

      return {
        edges: sliceOfPersons.map(person => ({
          cursor: person.id,
          node: {...person},
        })),
        pageInfo: {
          endCursor: sliceOfPersons[sliceOfPersons.length - 1].id,
          hasNextPage: cursorIndex + first < persons.length,
        },
      };
    },
  },
};
```

If the cursor argument isn't provided we create a slice of a certain amount of elements determined by the `first` argument at the beginning of the array. If the `cursor` argument is provided we find the index of the person within the array and create a slice at this index.

We don't forget to provide information related to the current page by setting the `endCursor` property with the `index` of the last person in the slice. We also add a `hastNextPage` property that informs user if he can query more persons.

We are now done with the server part. You can test your query using GraphQL playground. It is available by default at your GraphQL endpoint with the Apollo Server implementation. Open the following url `http://localhost:4000/graphl` in your browser an type this query (the url depends on the endpoint you configured in your server):

```
{
  persons(first: 10) {
    edges {
      node {
        lastname
        firstname
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

We should see a list of persons appearing on the right side panel.

## Consuming the query using hooks from Apollo Client

I used `create-react-app` for the React application. I will be using the following folder structure:

```
.
├── package.json
└── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── InfiniteList.css
    ├── InfiniteList.hooks.js
    ├── InfiniteList.js
    ├── index.css
    └── index.js
```

First of all, we need to install Apollo Client dependencies.

```bash
yarn add apollo-boost @apollo/react-hooks graphql
```

In the file `App.js` we instantiate an Apollo client using `apollo-boost` and pass it to a `Provider` from `@apollo/react-hooks`.

```jsx
import React from 'react';
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from '@apollo/react-hooks';

import InfiniteList from './InfiniteList';

import './App.css';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <InfiniteList />
      </div>
    </ApolloProvider>
  );
}

export default App;
```

I like to separate data fetching logic from rendering logic. We will create a [custom hook] in the file `InfiniteList.hooks.js`.

We create a constant with our GraphQL query.

```js
import {gql} from 'apollo-boost';

const GET_PERSONS = gql`
  query getPersons($cursor: ID) {
    persons(first: 20, cursor: $cursor) {
      edges {
        node {
          lastname
          firstname
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;
```

We define a custom hook called `usePersons` that will return all variables necessary to implement the infinite loading list. To call our query we use the `useQuery` hook from `@apollo/react-hooks`. It takes a query and options as parameters. We specify the `notifyOnNetworkStatusChange` option as true so `loading` variable will be updated each time our query is called.

```js
import {useQuery} from '@apollo/react-hooks';

// ...

function usePersons() {
  const {data, loading, fetchMore} = useQuery(GET_PERSONS, {
    notifyOnNetworkStatusChange: true,
  });

  if (loading && !data.persons) return {loading, persons: []};

  const loadMore = () => {
    return fetchMore({
      query: GET_PERSONS,
      notifyOnNetworkStatusChange: true,
      variables: {
        cursor: data.persons.pageInfo.endCursor,
      },
      updateQuery: (previousResult, {fetchMoreResult}) => {
        const newEdges = fetchMoreResult.persons.edges;
        const pageInfo = fetchMoreResult.persons.pageInfo;

        return newEdges.length
          ? {
              persons: {
                __typename: previousResult.persons.__typename,
                edges: [...previousResult.persons.edges, ...newEdges],
                pageInfo,
              },
            }
          : previousResult;
      },
    });
  };

  return {
    persons: data.persons.edges.map(({node}) => node),
    hasNextPage: data.persons.pageInfo.hasNextPage,
    loading,
    loadMore,
  };
}

export default usePersons;
```

`useQuery` returns a `fetchMore` function we can use each time the user scrolls down the list. We prepare a `loadMore` function that call `fetchMore` with the last person fetched's cursor as we explained earlier. The `updateQuery` option let us describe what to do with the newly fetched chunks of persons. We merge the new edges with the previous ones.

## Implementing the infinite loading list

We will use `react-window` to implement the component that displays the infinite loading list. We install dependencies before doing it.

```bash
yarn add react-window react-window-infinite-loader react-virtualized-auto-sizer
```

A bit of explanations about these dependencies are neccessary. `react-window` is made to display efficiently large lists. It only creates components for the visible elements and reuse nodes.

`react-window-infinite-loader` is a HOC that loads elements just-in-time as user scrolls down the list and `react-virtualized-auto-sizer` is a little addition to help you displaying your list so it fits the space available in its parent container.

All these tools are made by [Brian Vaughn](https://github.com/bvaughn). There are made to work together perfectly.

First of all, we call our custom hooks to get the first chunk of persons.

```jsx
import React from 'react';

import usePersons from './InfiniteList.hooks';

import './InfiniteList.css';

function InfiniteList() {
  const {persons, loading, loadMore, hasNextPage} = usePersons();
}

export default InfiniteList;
```

We now add the `AutoSizer` component to get an `width` and a `height` property that represents the available space in our component's container.

```jsx
import AutoSizer from 'react-virtualized-auto-sizer';

// ...

return (
  <div className="InfiniteList-list">
    <AutoSizer>{({height, width}) => <div />}</AutoSizer>
  </div>
);
```

We add the `InfiniteLoader` component that requires three properties:

- `isItemLoaded` that determines is a row has been loaded
- `itemCount` is the total number of elements which will be displayed in the list. In our case we will use a little trick since we may not know this number (think about a twitter feed). We add 1 to the total count if there is still a next page to load.
- `loadMoreItems` is a function that fetch a new chunk of persons

It also takes a function as `children`. Two variables are available in the object passed as parameter that lets `InfiniteLoader` take control over the `List` component we will add in next step.

```jsx
const personsCount = hasNextPage ? persons.length + 1 : persons.length;
const loadMorePersons = loading ? () => {} : loadMore;
const isPersonLoaded = index => !hasNextPage || index < persons.length;

// ...

return (
  <div className="InfiniteList-list">
    <AutoSizer>
      {({height, width}) => (
        <InfiniteLoader
          isItemLoaded={isPersonLoaded}
          itemCount={personsCount}
          loadMoreItems={loadMorePersons}>
          {({onItemsRendered, ref}) => <div />}
        </InfiniteLoader>
      )}
    </AutoSizer>
  </div>
);
```

Finally we add the component `List` that displays the actual list of persons.

To work, it needs an `height` and `width` property. We should pass the values provided by the `AutoSizer` component. It needs a row height in the `itemSize` property too. We also pass the variables from `InfiniteLoader` as props.

The `List` component takes as `children` a function too. It gives you the `index` of the current person and a `style` property. You must pass down the `style` property to the parent element of your row so the list displays well.

In case the person isn't loaded yet we display a placeholder 'Loading...'.

```jsx
// ...

return (
  <div className="InfiniteList-list">
    <AutoSizer>
      {({height, width}) => (
        <InfiniteLoader
          isItemLoaded={isPersonLoaded}
          itemCount={personsCount}
          loadMoreItems={loadMorePersons}>
          {({onItemsRendered, ref}) => (
            <List
              height={height}
              itemCount={personsCount}
              itemSize={40}
              onItemsRendered={onItemsRendered}
              ref={ref}
              width={width}>
              {({index, style}) => {
                let content;
                if (!isPersonLoaded(index)) {
                  content = 'Loading...';
                } else {
                  const {firstname, lastname} = persons[index];
                  content = `${firstname} ${lastname}`;
                }

                return (
                  <div className="InfiniteList-item" style={style}>
                    {content}
                  </div>
                );
              }}
            </List>
          )}
        </InfiniteLoader>
      )}
    </AutoSizer>
  </div>
);
```

You're all set 🙌!

I made a [repository](https://github.com/frinyvonnick/create-infinite-loading-list-react-graphql) with all the sources presented in this article.

You can run it by executing the following command at the top level of the repository:

```bash
yarn && yarn start
```

Feedback is appreciated 🙏 Please tweet me if you have any questions [@YvonnickFrin](https://twitter.com/YvonnickFrin)!
