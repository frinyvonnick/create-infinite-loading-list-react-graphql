import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

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
`

function usePersons() {
  const {
    data,
    loading,
    fetchMore,
  } = useQuery(GET_PERSONS, {
    notifyOnNetworkStatusChange: true,
  })

  console.log('useQuery', {
    data,
    loading,
  })

  if (loading && !data.persons) return { loading, persons: [] }

  const loadMore = () => {
    return fetchMore({
      query: GET_PERSONS,
      notifyOnNetworkStatusChange: true,
      variables: {
        cursor: data.persons.pageInfo.endCursor,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const newEdges = fetchMoreResult.persons.edges
        const pageInfo = fetchMoreResult.persons.pageInfo

        return newEdges.length
          ? {
            persons: {
              __typename: previousResult.persons.__typename,
              edges: [...previousResult.persons.edges, ...newEdges],
              pageInfo,
            },
          }
          : previousResult
      },
    })
  }

  return {
    persons: data.persons.edges.map(({ node }) => node),
    hasNextPage: data.persons.pageInfo.hasNextPage,
    loading,
    loadMore,
  }
}

export default usePersons;
