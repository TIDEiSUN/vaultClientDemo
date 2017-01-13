import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import IndexPage from './components/IndexPage';
import MakePaymentPage from './components/MakePaymentPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import RegistrationPage from './components/RegistrationPage';
import RenamePage from './components/RenamePage';
import NotFoundPage from './components/NotFoundPage';
import ActivatePage from './components/ActivatePage';
 
const routes = (
  <Route path="/" component={Layout}>
    <IndexRoute component={LoginPage}/>
    <Route path="/main" component={IndexPage}/>
    <Route path="/payment" component={MakePaymentPage}/>
    <Route path="/changepw" component={ChangePasswordPage}/>
    <Route path="/reg" component={RegistrationPage}/>
    <Route path="/rename" component={RenamePage}/>   
    <Route path="/activate" component={ActivatePage}/>
  <Route path="*" component={NotFoundPage}/>
</Route>
);

export default routes;
