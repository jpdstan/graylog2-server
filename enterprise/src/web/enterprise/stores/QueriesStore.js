// @flow strict
import Reflux from 'reflux';
import * as Immutable from 'immutable';
import { isEqual } from 'lodash';
import moment from 'moment';

import Search from 'enterprise/logic/search/Search';
import { QueriesActions } from 'enterprise/actions/QueriesActions';
import type { QueryId, TimeRange } from 'enterprise/logic/queries/Query';
import Query from 'enterprise/logic/queries/Query';

import { ViewActions, ViewStore } from './ViewStore';
import { ViewStatesActions } from './ViewStatesStore';

export { QueriesActions } from 'enterprise/actions/QueriesActions';
export const QueriesStore = Reflux.createStore({
  listenables: [QueriesActions],
  queries: new Immutable.Map<QueryId, Query>(),
  search: Search.create(),

  init() {
    this.listenTo(ViewStore, this.onViewStoreChange, this.onViewStoreChange);
  },

  getInitialState() {
    return this._state();
  },

  onViewStoreChange(state) {
    const { view } = state;
    if (!view || !view.search) {
      return;
    }
    const { search } = view;
    this.search = search;

    const { queries } = search;
    const newQueries = Immutable.Map(queries.map(q => [q.id, q]));

    if (!isEqual(newQueries, this.queries)) {
      this.queries = newQueries;
      this._trigger();
    }
  },

  duplicate(queryId: QueryId) {
    const newQuery = this.queries.get(queryId).toBuilder().newId().build();
    const promise = ViewStatesActions.duplicate(queryId)
      .then(newViewState => QueriesActions.create(newQuery, newViewState));
    QueriesActions.duplicate.promise(promise);
    return promise;
  },

  remove(queryId: QueryId) {
    const newQueries = this.queries.remove(queryId);
    const promise = this._propagateQueryChange(newQueries);
    QueriesActions.remove.promise(promise);
    return promise;
  },
  update(queryId: QueryId, query: Query) {
    const newQueries = this.queries.set(queryId, query);
    const promise = this._propagateQueryChange(newQueries);
    QueriesActions.update.promise(promise);
    return promise;
  },

  query(queryId: QueryId, query: string) {
    const activeQuery: Query = this.queries.get(queryId);
    const newQuery = activeQuery.toBuilder().query(Object.assign({}, activeQuery.query, { query_string: query })).build();
    const newQueries = this.queries.set(queryId, newQuery);
    const promise = this._propagateQueryChange(newQueries);
    QueriesActions.query.promise(promise);
    return promise;
  },
  timerange(queryId: QueryId, timerange: TimeRange) {
    const newQueries = this.queries.update(queryId, query => query.toBuilder().timerange(timerange).build());
    const promise = this._propagateQueryChange(newQueries);
    QueriesActions.timerange.promise(promise);
    return promise;
  },
  rangeParams(queryId: QueryId, key, value) {
    const newQueries = this.queries.update(queryId, query => query.toBuilder().timerange(Object.assign({}, query.timerange, { [key]: value })).build());
    const promise = this._propagateQueryChange(newQueries);
    QueriesActions.rangeParams.promise(promise);
    return promise;
  },
  rangeType(queryId: QueryId, type) {
    const oldQuery = this.queries.get(queryId);
    const oldTimerange = oldQuery.timerange;
    const oldType = oldTimerange.type;

    if (type === oldType) {
      return Promise.resolve();
    }

    let newTimerange: TimeRange;

    // eslint-disable-next-line default-case
    switch (type) {
      case 'absolute':
        newTimerange = {
          type,
          from: moment().subtract(oldTimerange.range, 'seconds').toISOString(),
          to: moment().toISOString(),
        };
        break;
      case 'relative':
        newTimerange = {
          type,
          range: 300,
        };
        break;
      case 'keyword':
        newTimerange = {
          type,
          keyword: 'Last five Minutes',
        };
        break;
    }
    const newQueries = this.queries.update(queryId, query => query.toBuilder().timerange(newTimerange).build());
    const promise = this._propagateQueryChange(newQueries);
    QueriesActions.rangeType.promise(promise);
    return promise;
  },

  _propagateQueryChange(newQueries) {
    const newSearch = this.search.toBuilder()
      .queries(newQueries.valueSeq().toList())
      .build();
    return ViewActions.search(newSearch);
  },

  _state() {
    return this.queries;
  },

  _trigger() {
    this.trigger(this._state());
  },
});
