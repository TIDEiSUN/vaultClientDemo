import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import IndexPage from './components/IndexPage';
import MakePaymentPage from './components/MakePaymentPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import RegistrationPage from './components/RegistrationPage';
import NotFoundPage from './components/NotFoundPage';
import ActivateAccountPage from './components/ActivateAccountPage';
import VerifyPhonePage from './components/VerifyPhonePage';
import RecoverPage from './components/RecoverPage';
import ChangeEmailPage from './components/ChangeEmailPage';
import ChangePersonalDataPage from './components/ChangePersonalDataPage';
import WalletPage from './components/WalletPage';
import BlockAccountPage from './components/BlockAccountPage';
import UnblockAccountPage from './components/UnblockAccountPage';
import UploadIDPhotosPage from './components/UploadIDPhotosPage';
import BankAccountPage from './components/BankAccountPage';
import TwoFactorAuthPage from './components/TwoFactorAuthPage';

const routes = (
  <Route path="/" component={Layout}>
    <IndexRoute component={LoginPage} />
    <Route path="/main" component={IndexPage} />
    <Route path="/payment" component={MakePaymentPage} />
    <Route path="/changepw" component={ChangePasswordPage} />
    <Route path="/reg" component={RegistrationPage} />
    <Route path="/activateAccount" component={ActivateAccountPage} />
    <Route path="/phone" component={VerifyPhonePage} />
    <Route path="/recover" component={RecoverPage} />
    <Route path="/changeemail" component={ChangeEmailPage} />
    <Route path="/changepersonaldata" component={ChangePersonalDataPage} />
    <Route path="/wallet" component={WalletPage} />
    <Route path="/block" component={BlockAccountPage} />
    <Route path="/unblock" component={UnblockAccountPage} />
    <Route path="/upload" component={UploadIDPhotosPage} />
    <Route path="/bankaccount" component={BankAccountPage} />
    <Route path="/2fa" component={TwoFactorAuthPage} />
  <Route path="*" component={NotFoundPage} />
</Route>
);

export default routes;
