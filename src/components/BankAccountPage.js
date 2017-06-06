import React from 'react';
import { Link } from 'react-router';
import AsyncButton from './common/AsyncButton';
import ImageUpload from './common/ImageUpload';
import DropdownMenu from './common/DropdownMenu';
import { VaultClient, VCUtils as Utils } from '../logics';

const timeRanges = [
  { start: '06:00', end: '10:00' },
  { start: '10:00', end: '14:00' },
  { start: '14:00', end: '18:00' },
  { start: '18:00', end: '22:00' },
  { start: '22:00', end: '02:00' },
  { start: '02:00', end: '06:00' },
];

function VerifyBankAccountForm(props) {
  const { bankAccount, self } = props;
  const { info } = bankAccount;
  const timeRangeOptions = timeRanges.reduce((acc, curr, index) => {
    const { start, end } = curr;
    const opt = {
      value: String(index),
      label: `${start}~${end}`,
    };
    return [...acc, opt];
  }, []);

  const cancelForm = (event) => {
    event.preventDefault();
    self.setState({
      verifyBankAccount: null,
    });
  };

  return (
    <form>
      <div>Account Name: {info.bankName}</div>
      <div>Account Account Number: {info.bankAccountNumber}</div>
      <div>
        Transaction Time:
        <input type="text" name="txDate" value={self.state.txDate} onChange={self.onInputChange} />
        <DropdownMenu items={timeRangeOptions} onChange={self.onTxTimeRangeIndexChange} />
      </div>
      <div>
        Amount:
        <input type="text" name="txValue" value={self.state.txValue} onChange={self.onInputChange} />
      </div>
      <div>
        Currency:
        <input type="text" name="txCurrency" value={self.state.txCurrency} onChange={self.onInputChange} />
      </div>
      <ImageUpload title="Receipt Photo" name="txReceiptPhoto" onImageChange={self.onImageChange} />
      <AsyncButton
        type="button"
        onClick={self.handleVerifyBankAccount}
        pendingText="Sending..."
        fulFilledText="Sent"
        rejectedText="Failed! Try Again"
        text="Send"
      />
      <button onClick={cancelForm}>Cancel</button>
    </form>
  );
}

function BankAccountTable(props) {
  const { bankAccounts, self } = props;

  const verifyField = (status, value) => {
    switch (status) {
      case 'BAC_ADDED': {
        return (
          <AsyncButton
            type="button"
            onClick={self.handleShowVerifyBankAccountForm}
            pendingText="Sending..."
            fulFilledText="Sent"
            rejectedText="Failed! Try Again"
            text="Verify"
            eventValue={value}
          />
        );
      }
      case 'BAC_PENDING_VERIFY': {
        return <span>Verifying</span>;
      }
      case 'BAC_ACCEPTED': {
        return <span>Accepted</span>;
      }
      case 'BAC_REJECTED': {
        return <span>Rejected</span>;
      }
      default: {
        return null;
      }
    }
  };

  const deleteField = (value) => (
    <AsyncButton
      type="button"
      onClick={self.handleDeleteBankAccount}
      pendingText="Deleting..."
      fulFilledText="Deleted"
      rejectedText="Failed! Try Again"
      text="Delete"
      eventValue={value}
    />
  );

  const rows = bankAccounts.map((bankAccount) => {
    const { info, status, identifier } = bankAccount;
    return (
      <tr key={identifier}>
        <td>{info.bankName}</td>
        <td>{info.bankAccountNumber}</td>
        <td>{verifyField(status, identifier)}</td>
        <td>{deleteField(identifier)}</td>
      </tr>
    );
  });

  if (rows.length === 0) {
    return (
      <div>
        No bank account!
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <td>Bank Name</td>
          <td>Bank Account Number</td>
          <td>Verify</td>
          <td>Delete</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function AddBankAccountForm(props) {
  const {
    self,
  } = props;

  return (
    <form>
      <div>
        Bank Name:
        <input type="text" value={self.state.newBankAccount.bankName} onChange={self.handleNewBankAccountChange.bind(self, 'bankName')} />
      </div>
      <div>
        Bank Account Number:
        <input type="text" value={self.state.newBankAccount.bankAccountNumber} onChange={self.handleNewBankAccountChange.bind(self, 'bankAccountNumber')} />
      </div>
      <div>
        <AsyncButton
          type="button"
          onClick={self.handleAddBankAccount}
          pendingText="Adding..."
          fulFilledText="Added"
          rejectedText="Failed! Try Again"
          text="Add"
        />
      </div>
    </form>
  );
}

export default class BankAccountPage extends React.Component {
  constructor(props) {
    super(props);
    this.blobDataKey = 'bankaccounts';

    this.state = {
      loginInfo: null,
      bankAccounts: [],
      newBankAccount: {
        bankName: '',
        bankAccountNumber: '',
      },
      verifyBankAccount: null,
      txDate: '',
      txTimeRangeIndex: 0,
      txValue: '',
      txCurrency: '',
      txReceiptPhoto: null,
    };
    this.handleAddBankAccount = this.handleAddBankAccount.bind(this);
    this.handleDeleteBankAccount = this.handleDeleteBankAccount.bind(this);
    this.handleVerifyBankAccount = this.handleVerifyBankAccount.bind(this);
    this.handleShowVerifyBankAccountForm = this.handleShowVerifyBankAccountForm.bind(this);
    this.onImageChange = this.onImageChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onTxTimeRangeIndexChange = this.onDropdownChange.bind(this, 'txTimeRangeIndex');
  }

  componentDidMount() {
    const setLoginInfo = (loginInfo) => {
      const { blob } = loginInfo;
      const { data, bank_accounts } = blob;
      const blobBankAccounts = data[this.blobDataKey] || [];
      const bankAccounts = blobBankAccounts.reduce((acc, curr) => {
        const hashed = Utils.createHashedBankAccount(curr);
        const statusInfo = bank_accounts.find((info) => {
          return info.identifier === hashed;
        });
        if (!statusInfo) {
          return acc;
        }
        const bankAccount = {
          info: curr,
          status: statusInfo.status,
          identifier: hashed,
        };
        return [...acc, bankAccount];
      }, []);
      this.setState({
        loginInfo,
        bankAccounts,
      });
    };
    const promise = VaultClient.getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
    this.cancelablePromise.promise
      .then(setLoginInfo)
      .catch((err) => {
        console.error('getLoginInfo', err);
        alert('Failed to get bank accounts');
      });
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
  }

  onImageChange(name, file) {
    this.setState({ [name]: file });
  }

  onInputChange(event) {
    const { target } = event;
    const { value, name } = target;
    this.setState({ [name]: value });
  }

  onDropdownChange(name, value) {
    console.log('onDropdownChange', name, value);
    this.setState({ [name]: value });
  }

  handleNewBankAccountChange(name, event) {
    const updatedNewBankAccount = { ...this.state.newBankAccount };
    updatedNewBankAccount[name] = event.target.value;
    this.setState({ newBankAccount: updatedNewBankAccount });
  }

  handleAddBankAccount() {
    console.log('Handle add bank account');

    const { newBankAccount } = this.state;
    const updateBlobDataCallback = (blobData) => {
      if (Object.prototype.hasOwnProperty.call(blobData, this.blobDataKey)) {
        blobData[this.blobDataKey].push(newBankAccount);
      } else {
        blobData[this.blobDataKey] = [newBankAccount];
      }
    };

    return VaultClient.addBankAccount(this.state.loginInfo, newBankAccount, updateBlobDataCallback)
      .then((result) => {
        console.log('add bank account', result);
        const { loginInfo, status } = result;
        const { blob } = loginInfo;
        const bankAccount = {
          info: newBankAccount,
          status,
          identifier: Utils.createHashedBankAccount(newBankAccount),
        };
        const bankAccounts = [...this.state.bankAccounts, bankAccount];
        this.setState({
          loginInfo,
          bankAccounts,
        });
        alert('Added bank account!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('add bank account:', err);
        alert('Failed to add bank account: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleShowVerifyBankAccountForm(value) {
    const rowIndex = this.state.bankAccounts.findIndex(bankAccount => bankAccount.identifier === value);
    console.log('Handle show verify bank account', rowIndex);

    const verifyBankAccount = this.state.bankAccounts[rowIndex];
    this.setState({ verifyBankAccount });
  }

  handleVerifyBankAccount() {
    const {
      verifyBankAccount,
      txDate,
      txTimeRangeIndex,
      txValue,
      txCurrency,
      txReceiptPhoto,
    } = this.state;

    const bankAccountInfo = verifyBankAccount.info;

    const timeRange = timeRanges[parseInt(txTimeRangeIndex, 10)];
    const timezoneOffsetHrs = -(new Date().getTimezoneOffset() / 60);
    const timezoneStr = timezoneOffsetHrs < 0 ? String(timezoneOffsetHrs) : `+${timezoneOffsetHrs}`;
    const txDateRange = {
      start: new Date(`${txDate} ${timeRange.start} ${timezoneStr}`),
      end: new Date(`${txDate} ${timeRange.end} ${timezoneStr}`),
    };

    return VaultClient.uploadBankAccountVerification(this.state.loginInfo, bankAccountInfo, txDateRange, txValue, txCurrency, txReceiptPhoto)
      .then((result) => {
        const { status } = result;
        const rowIndex = this.state.bankAccounts.findIndex(bankAccount => bankAccount.identifier === verifyBankAccount.identifier);
        const bankAccounts = [...this.state.bankAccounts];
        bankAccounts[rowIndex] = { ...verifyBankAccount, status };
        this.setState({
          bankAccounts,
          verifyBankAccount: null,
        });
        console.log('Upload bank account verification', result);
        alert('Uploaded verification!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('Upload bank account verification:', err);
        alert('Failed to upload bank account verification: ' + err.message);
        return Promise.reject(err);
      });
  }

  handleDeleteBankAccount(value) {
    const rowIndex = this.state.bankAccounts.findIndex(bankAccount => bankAccount.identifier === value);
    console.log('Handle delete bank account', rowIndex);

    const deleteBankAccount = this.state.bankAccounts[rowIndex];
    const bankAccountInfo = deleteBankAccount.info;

    // update blob data
    const updateBlobDataCallback = (blobData) => {
      blobData[this.blobDataKey].splice(rowIndex, 1);
    };

    return VaultClient.deleteBankAccount(this.state.loginInfo, bankAccountInfo, updateBlobDataCallback)
      .then((result) => {
        console.log('delete bank account', result);
        const { loginInfo } = result;
        const bankAccounts = [...this.state.bankAccounts];
        bankAccounts.splice(rowIndex, 1);
        this.setState({
          loginInfo,
          bankAccounts,
        });
        alert('Deleted bank account!');
        return Promise.resolve();
      }).catch((err) => {
        console.error('delete bank account:', err);
        alert('Failed to delete bank account: ' + err.message);
        return Promise.reject(err);
      });
  }

  render() {
    let childComponents = null;
    if (this.state.loginInfo) {
      if (this.state.verifyBankAccount) {
        childComponents = (
          <div>
            <VerifyBankAccountForm bankAccount={this.state.verifyBankAccount} self={this} />
          </div>
        );
      } else {
        childComponents = (
          <div>
            <BankAccountTable bankAccounts={this.state.bankAccounts} self={this} />
            <br />
            <AddBankAccountForm self={this} />
          </div>
        );
      }
    }
    return (
      <div className="home">
        <h1>Bank Accounts</h1>
        {childComponents}
        <br />
        <Link to="/main">Back to main page</Link>
      </div>
    );
  }
}
