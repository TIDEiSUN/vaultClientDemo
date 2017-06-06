import React from 'react';
import { browserHistory } from 'react-router';
import { VCUtils as Utils } from '../../logics';

export default class AsyncButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false,
      isFulfilled: false,
      isRejected: false,
    };
    this.cancelablePromise = null;
  }

  componentWillUnmount() {
    if (this.cancelablePromise) {
      this.cancelablePromise.cancel();
    }
  }

  resetState() {
    this.setState({
      isPending: false,
      isFulfilled: false,
      isRejected: false,
    });
  }

  handleClick() {
    this.setState({
      isPending: true,
    });

    const promise = this.props.onClick(...arguments);
    if (promise && promise.then) {
      this.cancelablePromise = Utils.makeCancelable(promise);
      this.cancelablePromise.promise
      .then(() => {
        this.setState({
          isPending: false,
          isRejected: false,
          isFulfilled: true,
        });
      })
      .catch((error) => {
        if (!(error instanceof Error) && error.isCanceled) {
          return;
        }
        this.setState({
          isPending: false,
          isRejected: true,
          isFulfilled: false,
        });
      });
    } else {
      this.resetState();
    }
  }

  render() {
    const { isPending, isFulfilled, isRejected } = this.state;
    const {
      children,
      text,
      pendingText,
      fulFilledText,
      rejectedText,
      className,
      loadingClass,
      fulFilledClass,
      rejectedClass,
      disabled,
      eventValue,
      ...restProps
    } = this.props;
    const isDisabled = this.props.disabled || isPending;
    let buttonText;

    if (isPending) {
      buttonText = pendingText;
    } else if (isFulfilled) {
      buttonText = fulFilledText;
    } else if (isRejected) {
      buttonText = rejectedText;
    }
    buttonText = buttonText || text;

    // const btnClasses = classNames(className, {
    //   [`${loadingClass || 'AsyncButton--loading'}`]: isPending,
    //   [`${fulFilledClass || 'AsyncButton--fulfilled'}`]: isFulfilled,
    //   [`${rejectedClass || 'AsyncButton--rejected'}`]: isRejected
    // });

    return (
      <button {...restProps} disabled={isDisabled} onClick={this.handleClick.bind(this, eventValue)}>
        {children || buttonText}
      </button>
    //   <button {...this.props} className={btnClasses} disabled={isDisabled} onClick={() => this.handleClick()}>
    //     {children || buttonText}
    //   </button>
    );
  }
}
