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
  const { text, onLoad, offset, limit } = props;
  const handleClick = onLoad.bind(undefined, offset, limit);
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
  const { journals, total, curr, link, onLoad, onRead } = props;

  if (journals === null) {
    return (
      <div>
        <LoadButton text="Load" onLoad={onLoad} offset="0" limit="10" />
      </div>
    );
  }

  const rows = Object.keys(journals).map((key) => {
    const journal = journals[key];
    const { id, messageId, messageType, result, time, read } = journal;
    const addButton = () => {
      return (
        <AsyncButton
          type="button"
          onClick={onRead}
          pendingText="Processing..."
          fulFilledText="Processed"
          rejectedText="Failed! Try Again"
          text="X"
          eventValue={id}
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

  const { next, prev } = link;
  const currOffset = parseInt(curr.offset, 10);
  const currLimit = parseInt(curr.limit, 10);

  return (
    <div>
      {table}
      <br />
      <p>{currOffset + 1} - {currOffset + currLimit} / {total}</p>
      {prev ? <LoadButton text="<" onLoad={onLoad} offset={prev.offset} limit={prev.limit} /> : null}
      {next ? <LoadButton text=">" onLoad={onLoad} offset={next.offset} limit={next.limit} /> : null}
    </div>
  );
}

export default class UserJournalPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginInfo: null,
      journals: null,
      curr: null,
      link: null,
      total: null,
    };
    this.handleGetJournals = this.handleGetJournals.bind(this);
    this.handleReadJournal = this.handleReadJournal.bind(this);
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

  handleGetJournals(offset, limit) {
    console.log('Handle get journals');

    const { loginInfo } = this.state;
    const { username } = loginInfo;
    return VaultClient.getUserJournals(loginInfo, username, offset, limit)
      .then((resp) => {
        const { journals, total, link } = resp;
        const converted = journals.reduce((acc, curr) => {
          const { id } = curr;
          return { ...acc, [id]: curr };
        }, {});
        this.setState({
          journals: converted,
          curr: { offset, limit },
          total,
          link,
        });
      }).catch((err) => {
        console.error('get journals:', err);
        alert('Failed to get journals: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleReadJournal(value) {
    const journalId = value;
    console.log('Handle read journal', journalId);

    const { loginInfo } = this.state;
    const { username } = loginInfo;
    return VaultClient.setUserJournalStatus(loginInfo, username, journalId)
      .then(() => {
        const newState = update(this.state, {
          journals: {
            [journalId]: {
              read: { $set: true },
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
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      const { journals, total, curr, link } = this.state;
      childComponents = (
        <JournalTable journals={journals} total={total} curr={curr} link={link} onLoad={this.handleGetJournals} onRead={this.handleReadJournal} />
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
