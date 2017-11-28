// @flow

import React from 'react';
import PropTypes from 'prop-types';
import getCaretCoordinates from 'textarea-caret';

import Listeners, { KEY_CODES } from './listener';
import List from './List';

import type {
  TextareaProps,
  TextareaState,
  getTextToReplaceType,
  triggerType,
  settingType,
} from './types';

class ReactTextareaAutocomplete extends React.Component<TextareaProps, TextareaState> {
  static defaultProps = {
    containerStyle: undefined,
    minChar: 1,
    onChange: undefined,
    onCaretPositionChange: undefined,
    style: undefined,
    value: '',
  };

  constructor(props: TextareaProps) {
    super(props);

    Listeners.add(KEY_CODES.ESC, () => this._closeAutocomplete());

    const { loadingComponent, trigger, value } = this.props;

    if (value) this.state.value = value;
    this.tokenRegExp = new RegExp(`[${Object.keys(trigger).join('')}]\\w*$`);

    if (!loadingComponent) {
      throw new Error('RTA: loadingComponent is not defined');
    }

    if (!trigger) {
      throw new Error('RTA: trigger is not defined');
    }
  }

  state: TextareaState = {
    top: 0,
    left: 0,
    currentTrigger: null,
    actualToken: '',
    data: null,
    value: '',
    dataLoading: false,
    selectionEnd: 0,
    selectionStart: 0,
    component: null,
  };

  componentDidMount() {
    Listeners.startListen();
  }

  componentWillReceiveProps(nextProps: TextareaProps) {
    this._update(nextProps);
  }

  componentWillUnmount() {
    Listeners.stopListen();
  }

  setCaretPosition = (position: number = 0) => {
    if (!this.textareaRef) return;

    this.textareaRef.focus();
    this.textareaRef.setSelectionRange(position, position);
  };

  getCaretPosition = (): number => {
    if (!this.textareaRef) {
      return 0;
    }

    const position = this.textareaRef.selectionEnd;
    return position;
  };

  _onSelect = (newToken: string) => {
    const { selectionEnd, value: textareaValue } = this.state;
    const { onChange } = this.props;

    let offsetToEndOfToken = 0;
    while (
      textareaValue[selectionEnd + offsetToEndOfToken] &&
      /\S/.test(textareaValue[selectionEnd + offsetToEndOfToken])
    ) {
      offsetToEndOfToken += 1;
    }

    const textToModify = textareaValue.slice(
      0,
      selectionEnd + offsetToEndOfToken,
    );

    const startOfTokenPosition = textToModify.search(/\S*$/);
    const newCaretPosition = startOfTokenPosition + newToken.length;
    const modifiedText =
      textToModify.substring(0, startOfTokenPosition) + newToken;

    // set the new textarea value and after that set the caret back to its position
    this.setState(
      {
        value: textareaValue.replace(textToModify, modifiedText),
        dataLoading: false,
      },
      () => {
        // fire onChange event after successful selection
        const e = new Event('change', { bubbles: true });
        this.textareaRef.dispatchEvent(e);
        if (onChange) onChange(e);

        this.setCaretPosition(newCaretPosition);
      },
    );
    this._closeAutocomplete();
  };

  _getTextToReplace = (): ?getTextToReplaceType => {
    const { currentTrigger } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings();

    if (!currentTrigger || !triggerSettings) return () => '';

    const { output } = triggerSettings;

    return (item: Object | string) => {
      if (
        typeof item === 'object' &&
        (!output || typeof output !== 'function')
      ) {
        throw new Error('RTA: Output function is not defined!');
      }

      if (output) {
        return output(item, currentTrigger);
      }

      // $FlowFixMe
      return `${currentTrigger}${item}${currentTrigger}`;
    };
  };

  _getCurrentTriggerSettings = (): ?settingType => {
    const { currentTrigger } = this.state;

    if (!currentTrigger) return null;

    return this.props.trigger[currentTrigger];
  };

  _getValuesFromProvider = () => {
    const { currentTrigger, actualToken } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings();

    if (!currentTrigger || !triggerSettings) {
      return;
    }

    const { dataProvider, component } = triggerSettings;

    if (typeof dataProvider !== 'function') {
      throw new Error('RTA: Trigger provider has to be a function!');
    }

    this.setState({
      dataLoading: true,
    });

    let providedData = dataProvider(actualToken);

    if (!(providedData instanceof Promise)) {
      providedData = Promise.resolve(providedData);
    }

    providedData
      .then((data) => {
        if (typeof providedData !== 'object') {
          throw new Error('RTA: Trigger provider has to provide an array!');
        }

        if (typeof component !== 'function') {
          throw new Error('RTA: Component should be defined!');
        }

        this.setState({
          dataLoading: false,
          data,
          component,
        });
      })
      .catch((e) => {
        throw new Error(`RTA: dataProvider fails: ${e.message}`);
      });
  };

  _getSuggestions = (): ?Array<Object | string> => {
    const { currentTrigger, data } = this.state;

    if (!currentTrigger || !data || (data && !data.length)) return null;

    return data;
  };

  _update({ value, trigger }: TextareaProps) {
    const { value: oldValue } = this.state;
    const { trigger: oldTrigger } = this.props;

    if (value !== oldValue || !oldValue) this.setState({ value });
    if (trigger !== oldTrigger || !this.tokenRegExp) {
      this.tokenRegExp = new RegExp(`[${Object.keys(trigger).join('')}]\\w*$`);
    }
  }

  _closeAutocomplete = () => {
    if (!this._getSuggestions()) return;

    this.setState({ data: null });
  };

  _cleanUpProps = (): Object => {
    const props = { ...this.props };
    const notSafe = [
      'loadingComponent',
      'containerStyle',
      'minChar',
      'ref',
      'onChange',
      'onCaretPositionChange',
      'className',
      'value',
      'trigger',
    ];

    // eslint-disable-next-line
    for (const prop in props) {
      if (notSafe.includes(prop)) delete props[prop];
    }

    return props;
  };

  _changeHandler = (e: SyntheticInputEvent<*>) => {
    const { trigger, onChange, minChar, onCaretPositionChange } = this.props;
    const textarea = e.target;
    const { selectionEnd, selectionStart } = textarea;
    const value = textarea.value;

    if (onChange) {
      e.persist();
      onChange(e);
    }

    if (onCaretPositionChange) {
      const caretPosition = this.getCaretPosition();
      onCaretPositionChange(caretPosition);
    }

    this.setState({
      value,
    });

    const tokenMatch = this.tokenRegExp.exec(value.slice(0, selectionEnd));
    const lastToken = tokenMatch && tokenMatch[0];

    /*
     if we lost the trigger token or there is no following character we want to close
     the autocomplete
    */
    if (!lastToken || lastToken.length <= minChar) {
      this._closeAutocomplete();
      return;
    }

    const triggerChars = Object.keys(trigger);

    const currentTrigger =
      (lastToken && triggerChars.find(a => a === lastToken[0])) || null;

    const actualToken = lastToken.slice(1);

    // if trigger is not configured step out from the function, otherwise proceed
    if (!currentTrigger) {
      return;
    }

    const { top, left } = getCaretCoordinates(textarea, selectionEnd);
    this.setState({ top, left });

    this.setState(
      {
        selectionEnd,
        selectionStart,
        currentTrigger,
        actualToken,
      },
      this._getValuesFromProvider,
    );
  };

  _selectHandler = () => {
    const { onCaretPositionChange } = this.props;

    if (onCaretPositionChange) {
      const caretPosition = this.getCaretPosition();
      onCaretPositionChange(caretPosition);
    }
  };

  props: TextareaProps;

  textareaRef: HTMLInputElement;

  tokenRegExp: RegExp;

  render() {
    const {
      loadingComponent: Loader,
      style,
      containerStyle,
      ...otherProps
    } = this.props;
    const { left, top, dataLoading, component, value } = this.state;

    const suggestionData = this._getSuggestions();
    const textToReplace = this._getTextToReplace();

    return (
      <div
        className={`rta ${dataLoading === true ? 'rta--loading' : ''}`}
        style={containerStyle}
      >
        <textarea
          {...this._cleanUpProps()}
          ref={(ref) => { this.textareaRef = ref; }}
          className={`rta__textarea ${otherProps.className || ''}`}
          onChange={this._changeHandler}
          onSelect={this._selectHandler}
          value={value}
          style={style}
        />
        {(dataLoading || suggestionData) &&
          <div style={{ top, left }} className="rta__autocomplete">
            {suggestionData &&
              component &&
              textToReplace &&
              <List
                values={suggestionData}
                component={component}
                getTextToReplace={textToReplace}
                onSelect={this._onSelect}
              />}
            {dataLoading &&
              <div
                className={`rta__loader ${suggestionData !== null
                  ? 'rta__loader--suggestion-data'
                  : 'rta__loader--empty-suggestion-data'}`}
              >
                <Loader data={suggestionData} />
              </div>}
          </div>}
      </div>
    );
  }
}

const triggerPropsCheck = ({ trigger }: { trigger: triggerType }) => {
  if (!trigger) return Error('Invalid prop trigger. Prop missing.');

  const triggers = Object.entries(trigger);

  for (let i = 0; i < triggers.length; i += 1) {
    const [triggerChar, settings] = triggers[i];

    if (typeof triggerChar !== 'string' || triggerChar.length !== 1) {
      return Error(
        'Invalid prop trigger. Keys of the object has to be string.',
      );
    }

    // $FlowFixMe
    const { component, dataProvider } = settings;

    if (!component || typeof component !== 'function') {
      return Error('Invalid prop trigger: component should be defined.');
    }

    if (!dataProvider || typeof dataProvider !== 'function') {
      return Error('Invalid prop trigger: dataProvider should be defined.');
    }
  }

  return null;
};

ReactTextareaAutocomplete.propTypes = {
  containerStyle: PropTypes.object,
  loadingComponent: PropTypes.func.isRequired,
  minChar: PropTypes.number,
  onChange: PropTypes.func,
  onCaretPositionChange: PropTypes.func,
  style: PropTypes.object,
  trigger: triggerPropsCheck, //eslint-disable-line
  value: PropTypes.string,
};

export default ReactTextareaAutocomplete;
