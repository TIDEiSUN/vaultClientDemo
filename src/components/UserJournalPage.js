import React from 'react';
import { Link } from 'react-router';
import update from 'immutability-helper';
import moment from 'moment';
import { Checkbox, CheckboxGroup } from 'react-checkbox-group';
import AsyncButton from './common/AsyncButton';
import { VaultClient, VCUtils as Utils } from '../logics';

const messageIdString = [
  '',
  'Change password',
  'Update blob data',
  'Deactivate account',
  'Currency sent',
  'Currency received',
  'Currency withdrawn',
  'Currency deposited',
  'Request for change of email address',
  'Verify token for change of email address',
  'Request for change of phone number',
  'Verify token for change of phone number',
  'Login',
  'Reactivate account',
  'Login using the flow of forgot password',
  'Toggle 2FA',
  'Activate account',
  'Add a bank account',
  'Delete a bank account',
  'Upload ID photos',
  'Accept / reject ID photos by admin',
  'Logout',
  'Retrieve secret key',
  'Payment pin recovery',
  'Change payment pin',
  'Update change of email address',
  'Update change of phone number',
  'Upload verification of bank account',
  'Request token to set 2FA',
];

const messageTypeString = [
  '',
  'Settings',
  'Account status',
  'Transaction',
  'Contact',
  'Authentication',
  'Bank accounts',
];

const filterOptions = messageIdString.slice(1).map((value, index) => {
  return { label: value, value: index + 1 };
});

const defaultFilter = [16, 4, 5, 6, 7, 8, 25, 11, 26, 20, 27, 1, 24, 15];

function LoadButton(props) {
  const { text, onLoad, options = [] } = props;
  const handleClick = onLoad.bind(undefined, ...options);
  return (
    <AsyncButton
      type="button"
      onClick={handleClick}
      pendingText="..."
      fulFilledText={text}
      rejectedText="Failed! Try Again"
      text={text}
    />
  );
}

function JournalTable(props) {
  const { journals, total, curr, link, onRead } = props;

  if (journals === null) {
    return null;
  }

  const rows = journals.map((journal, index) => {
    const { id, messageId, messageType, result, time, read, info } = journal;
    const addButton = () => {
      const value = { index, id };
      return (
        <AsyncButton
          type="button"
          onClick={onRead}
          pendingText="Processing..."
          fulFilledText="Processed"
          rejectedText="Failed! Try Again"
          text="X"
          eventValue={value}
        />);
    };
    const style = {
      color: read ? 'LightGrey' : 'Black',
      lineHeight: '1.8em',
    };
    let detail;
    if (info) {
      detail = <span title={JSON.stringify(info, null, 2)}>[Detail]</span>;
    }
    return (
      <tr key={id} style={style}>
        <td>{moment(time).format('DD/MM/YYYY h:mm:ss A')}</td>
        <td>{messageTypeString[messageType]}</td>
        <td>{messageIdString[messageId]} {detail}</td>
        <td>{result}</td>
        <td>{read ? null : addButton()}</td>
      </tr>
    );
  });

  if (rows.length === 0) {
    return (
      <div>
        No journal!
      </div>
    );
  }

  const table = (
    <table>
      <thead>
        <tr>
          <td width="200">Time</td>
          <td width="120">Message Type</td>
          <td width="200">Message ID</td>
          <td width="60">Result</td>
          <td width="10">&nbsp;</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );

  return table;
}

function JournalPagination(props) {
  const { pagination, onLoad, onRead } = props;
  const { journals, total, curr, link } = pagination;

  if (journals === null) {
    return (
      <div>
        <LoadButton text="Load" onLoad={onLoad} options={['0', '10']} />
      </div>
    );
  }

  const table = <JournalTable journals={journals} onRead={onRead} />;

  const { next, prev } = link;
  const currOffset = parseInt(curr.offset, 10);
  const currLimit = parseInt(curr.limit, 10);

  return (
    <div>
      {table}
      <br />
      <p>{currOffset + 1} - {Math.min(currOffset + currLimit, total)} / {total}</p>
      {prev ? <LoadButton text="<" onLoad={onLoad} options={[prev.offset, prev.limit]} /> : null}
      {next ? <LoadButton text=">" onLoad={onLoad} options={[next.offset, next.limit]} /> : null}
    </div>
  );
}

function JournalScrolling(props) {
  const { scrolling, onLoad, onRead } = props;
  const { journals, link } = scrolling;

  if (journals === null) {
    return (
      <div>
        <LoadButton text="Load" onLoad={onLoad} options={['10']} />
      </div>
    );
  }

  const table = <JournalTable journals={journals} onRead={onRead} />;

  const { more } = link;
  const style = {
    overflow: 'scroll',
    width: '55em',
    maxHeight: '26em',
  };
  return (
    <div style={style}>
      {table}
      <br />
      {more ? <LoadButton text="more" onLoad={onLoad} options={[more.limit, more.marker]} /> : null}
    </div>
  );
}

function FilterCheckbox(props) {
  const { options, values, onChange, onApply, onSelectAll, onDeselectAll } = props;
  const checkboxes = options.map((option) => {
    const { label, value } = option;
    return <p key={value}><label><Checkbox value={value} />{label}</label></p>;
  });
  const style = {
    overflow: 'scroll',
    width: '30em',
    maxHeight: '9.5em',
  };
  return (
    <div>
      <div style={style}>
        <CheckboxGroup name="messageIdfilter" value={values} onChange={onChange}>
          {checkboxes}
        </CheckboxGroup>
      </div>
      <LoadButton text="Apply" onLoad={onApply} />
      <button onClick={onSelectAll}>Select all</button>
      <button onClick={onDeselectAll}>Deselect all</button>
    </div>
  );
}

export default class UserJournalPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginInfo: null,
      unreadCount: null,
      filter: defaultFilter,
      pagination: {
        journals: null,
        curr: null,
        link: null,
        total: null,
      },
      scrolling: {
        journals: null,
        link: null,
      },
    };
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.handleDeselectAll = this.handleDeselectAll.bind(this);
    this.handleMessageIdFilterChange = this.handleMessageIdFilterChange.bind(this);
    this.handleMessageIdFilterApply = this.handleMessageIdFilterApply.bind(this);
    this.handleGetJournalsPagination = this.handleGetJournalsPagination.bind(this);
    this.handleGetJournalsScrolling = this.handleGetJournalsScrolling.bind(this);
    this.handleReadJournalPagination = this.getHandleReadJournal('pagination');
    this.handleReadJournalScrolling = this.getHandleReadJournal('scrolling');
  }

  componentDidMount() {
    const setResults = ([loginInfo, unreadCount]) => {
      this.setState({
        loginInfo,
        unreadCount,
      });
    };
    const getUnreadCount = (loginInfo) => {
      const { username } = loginInfo;
      return VaultClient.getUserJournalsUnreadCount(loginInfo, username, defaultFilter);
    };
    const loginInfoPromise = VaultClient.getLoginInfo()
      .catch((err) => {
        console.error('getLoginInfo', err);
        return Promise.reject(err);
      });
    const unreadCountPromise = loginInfoPromise.then(getUnreadCount)
      .then((results) => {
        const { unreadCount } = results;
        return Promise.resolve(unreadCount);
      })
      .catch((err) => {
        console.error('getUnreadCount', err);
        return Promise.reject(err);
      });
    const promise = Promise.all([
      loginInfoPromise,
      unreadCountPromise,
    ]);
    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setResults)
      .catch((err) => {
        if (!(err instanceof Error) && err.isCanceled) {
          return;
        }
        alert('Failed to get login info / unread count');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleMessageIdFilterChange(newValues) {
    this.setState({
      filter: newValues,
    });
  }

  handleMessageIdFilterApply() {
    const { loginInfo, filter } = this.state;
    const { username } = loginInfo;
    return VaultClient.getUserJournalsUnreadCount(loginInfo, username, filter)
      .then((result) => {
        const { unreadCount } = result;
        this.setState({
          unreadCount,
          pagination: {
            journals: null,
            curr: null,
            link: null,
            total: null,
          },
          scrolling: {
            journals: null,
            link: null,
          },
        });
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('get journals unread count:', err);
        alert('Failed to apply filter: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleGetJournalsPagination(offset, limit) {
    console.log('Handle get journals pagination');

    const { loginInfo, filter } = this.state;
    const { username } = loginInfo;
    return VaultClient.getUserJournalsPagination(loginInfo, username, offset, limit, filter)
      .then((resp) => {
        const { journals, total, link } = resp;
        this.setState({
          pagination: {
            journals,
            curr: { offset, limit },
            total,
            link,
          },
        });
      }).catch((err) => {
        console.error('get journals pagination:', err);
        alert('Failed to get journals pagination: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleGetJournalsScrolling(limit, marker) {
    console.log('Handle get journals scrolling');

    const { loginInfo, filter } = this.state;
    const { username } = loginInfo;
    return VaultClient.getUserJournals(loginInfo, username, limit, marker, filter)
      .then((resp) => {
        const { journals, link } = resp;
        const newState = update(this.state, {
          scrolling: {
            journals: {
              $apply: j => update(j || [], { $push: journals }),
            },
            link: {
              $set: link,
            },
          },
        });
        this.setState(newState);
      }).catch((err) => {
        console.error('get journals scrolling:', err);
        alert('Failed to get journals scrolling: ' + err.message);
        return Promise.reject(err);
      });
  }

  getHandleReadJournal(viewType) {
    return (value) => {
      const { id: journalId, index: arrayIndex } = value;
      console.log('Handle read journal', journalId, arrayIndex);

      const { loginInfo } = this.state;
      const { username } = loginInfo;
      return VaultClient.setUserJournalStatus(loginInfo, username, journalId)
        .then(() => {
          const newState = update(this.state, {
            [viewType]: {
              journals: {
                [arrayIndex]: {
                  read: { $set: true },
                },
              },
            },
          });
          this.setState(newState);
          return Promise.resolve();
        }).catch((err) => {
          console.error('set journal as read:', err);
          alert('Failed to set journal as read: ' + err.message);
          return Promise.reject(err);
        });
    };
  }

  handleSelectAll(event) {
    event.preventDefault();
    this.setState({
      filter: messageIdString.slice(1).map((value, index) => index),
    });
  }

  handleDeselectAll(event) {
    event.preventDefault();
    this.setState({
      filter: [],
    });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      const { filter, unreadCount, pagination, scrolling } = this.state;
      childComponents = (
        <div>
          <h2>Message Filter</h2>
          <FilterCheckbox options={filterOptions} values={filter} onChange={this.handleMessageIdFilterChange} onApply={this.handleMessageIdFilterApply} onSelectAll={this.handleSelectAll} onDeselectAll={this.handleDeselectAll} />
          <br />
          <p><b>Unread: {unreadCount}</b></p>
          <br />
          <h2>Pagination</h2>
          <JournalPagination pagination={pagination} onLoad={this.handleGetJournalsPagination} onRead={this.handleReadJournalPagination} />
          <br />
          <h2>Infinite Scrolling</h2>
          <JournalScrolling scrolling={scrolling} onLoad={this.handleGetJournalsScrolling} onRead={this.handleReadJournalScrolling} />
        </div>
      );
    }
    return (
      <div className="home">
        <h1>User Journal</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
