import React from 'react';
import { browserHistory } from 'react-router';

export default class  AsyncButton extends React.Component {
  constructor(props) {
		super(props);
		this.state = {
			isPending: false,
			isFulfilled: false,
			isRejected: false
		}
	}

	// getInitialState() {
	// 	return {
	// 		isPending: false,
	// 		isFulfilled: false,
	// 		isRejected: false
	// 	};
	// }

	resetState() {
		this.setState({
			isPending: false,
			isFulfilled: false,
			isRejected: false
		});
	}

	handleClick() {
		this.setState({
			isPending: true
		});

		let promise = this.props.onClick(...arguments);
		if (promise && promise.then) {
			promise.then(() => {
				this.setState({
					isPending: false,
					isRejected: false,
					isFulfilled: true
				});
				if (this.props.hasOwnProperty('fullFilledRedirect')) {
					//console.log('fullFilledRedirect', this.props.fullFilledRedirect);
					browserHistory.push(this.props.fullFilledRedirect);
				}
			}).catch((error) => {
				this.setState({
					isPending: false,
					isRejected: true,
					isFulfilled: false
				});
				throw error;
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
			fullFilledRedirect,
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
      <button {...restProps} disabled={isDisabled} onClick={this.handleClick.bind(this)}>
        {children || buttonText}
      </button>
    //   <button {...this.props} className={btnClasses} disabled={isDisabled} onClick={() => this.handleClick()}>
    //     {children || buttonText}
    //   </button>
		);
	}
}