import React from 'react';
import { Link } from 'react-router';
import update from 'immutability-helper';
import moment from 'moment';
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
    const { id, messageId, messageType, result, time, read } = journal;
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
    };
    return (
      <tr key={id} style={style}>
        <td>{moment(time).format('DD/MM/YYYY h:mm:ss A')}</td>
        <td>{messageTypeString[messageType]}</td>
        <td>{messageIdString[messageId]}</td>
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
          <td width="150">Message ID</td>
          <td width="60">Result</td>
          <td width="10">X</td>
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
    width: '50em',
    maxHeight: '26em',
  };
  return (
    <div style={style}>
      {table}
      <br />
      {more ? <LoadButton text="more" onLoad={onLoad} options={['10', more.marker]} /> : null}
    </div>
  );
}

export default class UserJournalPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginInfo: null,
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
    this.handleGetJournalsPagination = this.handleGetJournalsPagination.bind(this);
    this.handleGetJournalsScrolling = this.handleGetJournalsScrolling.bind(this);
    this.handleReadJournalPagination = this.getHandleReadJournal('pagination');
    this.handleReadJournalScrolling = this.getHandleReadJournal('scrolling');
  }

  componentDidMount() {
    const setLoginInfo = (loginInfo) => {
      this.setState({
        loginInfo,
      });
    };
    const promise = VaultClient.getLoginInfo()
      .catch((err) => {
        console.error('getLoginInfo', err);
        return Promise.reject(err);
      });
    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setLoginInfo)
      .catch((err) => {
        if (!(err instanceof Error) && err.isCanceled) {
          return;
        }
        alert('Failed to get login info');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  handleGetJournalsPagination(offset, limit) {
    console.log('Handle get journals pagination');

    const { loginInfo } = this.state;
    const { username } = loginInfo;
    return VaultClient.getUserJournalsPagination(loginInfo, username, offset, limit)
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

    const { loginInfo } = this.state;
    const { username } = loginInfo;
    return VaultClient.getUserJournals(loginInfo, username, limit, marker)
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

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      const { pagination, scrolling } = this.state;
      childComponents = (
        <div>
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
