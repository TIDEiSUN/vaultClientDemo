import React from 'react';
import { Link } from 'react-router';
import AsyncButton from './common/AsyncButton';
import { VaultClient, VCUtils as Utils } from '../logics';

function BankAccountTable(props) {
  const { bankAccounts, self } = props;

  const rows = [];
  let index = 0;
  bankAccounts.forEach((bankAccount) => {
    rows.push(
      <tr key={index}>
        <td>{bankAccount.bankName}</td>
        <td>{bankAccount.bankAccountNumber}</td>
        <td>
          <AsyncButton
            type="button"
            onClick={self.handleDeleteBankAccount}
            pendingText="Deleting..."
            fulFilledText="Deleted"
            rejectedText="Failed! Try Again"
            text="Delete"
            eventValue={index}
          />
        </td>
      </tr>
    );
    index += 1;
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
    };
    this.handleAddBankAccount = this.handleAddBankAccount.bind(this);
    this.handleDeleteBankAccount = this.handleDeleteBankAccount.bind(this);
  }

  componentDidMount() {
    const getLoginInfo = () => {
      return VaultClient.getLoginInfo()
        .then((loginInfo) => {
          const { blob } = loginInfo;
          const bankAccounts = blob.data[this.blobDataKey] || [];
          this.setState({
            loginInfo,
            bankAccounts,
          });
        })
        .catch((err) => {
          console.error('getLoginInfo', err);
          alert('Failed to get bank accounts');
        });
    };
    const promise = getLoginInfo();
    this.cancelablePromise = Utils.makeCancelable(promise);
  }

  componentWillUnmount() {
    this.cancelablePromise.cancel();
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
        const { loginInfo } = result;
        const { blob } = loginInfo;
        const bankAccounts = blob.data[this.blobDataKey];
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

  handleDeleteBankAccount(value) {
    const rowIndex = value;
    console.log('Handle delete bank account', rowIndex);

    const deleteBankAccount = this.state.bankAccounts[rowIndex];

    // update blob data
    const updateBlobDataCallback = (blobData) => {
      blobData[this.blobDataKey].splice(rowIndex, 1);
    };

    return VaultClient.deleteBankAccount(this.state.loginInfo, deleteBankAccount, updateBlobDataCallback)
      .then((result) => {
        console.log('delete bank account', result);
        const { loginInfo } = result;
        const { blob } = loginInfo;
        const bankAccounts = blob.data[this.blobDataKey];
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
      childComponents = (
        <div>
          <BankAccountTable bankAccounts={this.state.bankAccounts} self={this} />
          <br />
          <AddBankAccountForm self={this} />
        </div>
      );
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
