import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';

import InfiniteList from './InfiniteList'

import logo from './logo.svg';
import graphqlLogo from './graphql.svg';
import './App.css';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <div>
            <img src={logo} className="App-logo" alt="logo" />
            <a
              className="App-link"
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn React
            </a>
          </div>
          <div>
            <img src={graphqlLogo} className="App-logo" alt="logo" />
            <a
              className="App-link-graphql"
              href="https://graphql.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn GraphQL
            </a>
          </div>
        </header>
        <InfiniteList />
      </div>
    </ApolloProvider>
  );
}

export default App;
