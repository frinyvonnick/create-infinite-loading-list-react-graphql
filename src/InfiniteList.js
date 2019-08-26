import React from 'react';
import InfiniteLoadingList from 'react-simple-infinite-loading'

import usePersons from './InfiniteList.hooks'

import './InfiniteList.css'

function InfiniteList() {
  const { persons, loading, loadMore, hasNextPage } = usePersons()

  const loadMorePersons = loading ? () => {} : loadMore
  const isPersonLoaded = index => !hasNextPage || index < persons.length

  return (
    <div className="InfiniteList-list">
      <InfiniteLoadingList
        items={persons}
        itemHeight={40}
        hasMoreItems={hasNextPage}
        loadMoreItems={loadMorePersons}
      >
        {({ item: person, index, style }) => {
          let content
          if (!isPersonLoaded(index)) {
            content = 'Loading...'
          } else {
            const { firstname, lastname } = person
            content = `${firstname} ${lastname}` 
          }

          return <div className="InfiniteList-item" style={style}>{content}</div>
        }}
      </InfiniteLoadingList>
    </div>
  )
}

export default InfiniteList
