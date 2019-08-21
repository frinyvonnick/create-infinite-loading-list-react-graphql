import React from 'react';
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import AutoSizer from 'react-virtualized-auto-sizer'

import usePersons from './InfiniteList.hooks'

import './InfiniteList.css'

function InfiniteList() {
  const { persons, loading, loadMore, hasNextPage } = usePersons()

  const personsCount = hasNextPage ? persons.length + 1 : persons.length
  const loadMorePersons = loading ? () => {} : loadMore
  const isPersonLoaded = index => !hasNextPage || index < persons.length

  return (
    <div className="InfiniteList-list">
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader
            isItemLoaded={isPersonLoaded}
            itemCount={personsCount}
            loadMoreItems={loadMorePersons}
          >
            {({ onItemsRendered, ref }) => (
              <List
                height={height}
                itemCount={personsCount}
                itemSize={40}
                onItemsRendered={onItemsRendered}
                ref={ref}
                width={width}
              >
                {({ index, style }) => {
                  let content
                  if (!isPersonLoaded(index)) {
                    content = 'Loading...'
                  } else {
                    const { firstname, lastname } = persons[index]
                    content = `${firstname} ${lastname}` 
                  }

                  return <div className="InfiniteList-item" style={style}>{content}</div>
                }}
              </List>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  )
}

export default InfiniteList
