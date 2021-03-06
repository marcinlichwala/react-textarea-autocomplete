import React from 'react';
import { shallow, mount } from 'enzyme';
import ReactTextareaAutocomplete from './../index';

//eslint-disable-next-line
const SmileItemComponent = ({ entity: { label, text } }) => (
  <div> {label} </div>
);

const Loading = () => <div>Loading...</div>;

describe('object-based items', () => {
  const mockedFn = jest.fn();
  const rtaComponent = (
    <ReactTextareaAutocomplete
      placeholder={'Write a message.'}
      value={'Controlled text'}
      onChange={mockedFn}
      className={'ownClassName'}
      style={{ background: 'red' }}
      loadingComponent={Loading}
      trigger={{
        ':': {
          output: item => `___${item.text}___`,
          dataProvider: () => [
            { id: 1, label: ':)', text: 'happy_face' },
            { id: 2, label: ':(', text: 'sad_face' },
          ],
          component: SmileItemComponent,
        },
      }}
    />
  );
  const rta = mount(rtaComponent);

  it('match match the snapshot', () => {
    expect(shallow(rtaComponent)).toMatchSnapshot();
  });

  it('Textarea exists', () => {
    expect(rta.find('textarea')).toHaveLength(1);
  });

  it('After the trigger was typed, it should appear list of options', async () => {
    rta
      .find('textarea')
      .simulate('change', { target: { value: 'some test :a' } });
    expect(rta.find('.rta__autocomplete')).toHaveLength(1);
  });

  it('should display all items', () => {
    expect(rta.find('.rta__autocomplete .rta__list .rta__item')).toHaveLength(
      2,
    );
  });

  it('items should be rendered within the component', () => {
    expect(
      rta
        .find('.rta__item')
        .first()
        .containsMatchingElement(<SmileItemComponent />),
    ).toEqual(true);
  });

  it('should invoke onchange handler', () => {
    expect(mockedFn).toHaveBeenCalled();
  });

  it('should close the autocomplete after mouse click', () => {
    const item = rta.find('.rta__entity').first();
    item.simulate('click');
    expect(rta.find('.rta__entity')).toHaveLength(0);
  });

  it('should invoke onchange handler after selection', () => {
    expect(mockedFn).toHaveBeenCalledTimes(2);
  });

  it('text in textarea should be changed', () => {
    expect(rta.find('textarea').node.value).toBe(
      '___happy_face___some test :a',
    );
  });
});

describe('string-based items w/o output fn', () => {
  const mockedFn = jest.fn();
  const rtaComponent = (
    <ReactTextareaAutocomplete
      placeholder={'Write a message.'}
      value={'Controlled text'}
      onChange={mockedFn}
      className={'ownClassName'}
      style={{ background: 'red' }}
      loadingComponent={Loading}
      trigger={{
        ':': {
          dataProvider: () => Promise.resolve(['happy_face', 'sad_face']),
          component: SmileItemComponent,
        },
      }}
    />
  );
  const rta = mount(rtaComponent);

  it('match match the snapshot', () => {
    expect(shallow(rtaComponent)).toMatchSnapshot();
  });

  it('Textarea exists', () => {
    expect(rta.find('textarea')).toHaveLength(1);
  });

  it('After the trigger was typed, it should appear list of options', async () => {
    rta
      .find('textarea')
      .simulate('change', { target: { value: 'some test :a' } });
    expect(rta.find('.rta__autocomplete')).toHaveLength(1);
  });

  it('should display all items', () => {
    expect(rta.find('.rta__autocomplete .rta__list .rta__item')).toHaveLength(
      2,
    );
  });

  it('items should be rendered within the component', () => {
    expect(
      rta
        .find('.rta__item')
        .first()
        .containsMatchingElement(<SmileItemComponent />),
    ).toEqual(true);
  });

  it('should invoke onchange handler', () => {
    expect(mockedFn).toHaveBeenCalled();
  });

  it('should close the autocomplete after mouse click', () => {
    const item = rta.find('.rta__entity').first();
    item.simulate('click');
    expect(rta.find('.rta__entity')).toHaveLength(0);
  });

  it('should invoke onchange handler after selection', () => {
    expect(mockedFn).toHaveBeenCalledTimes(2);
  });

  it('text in textarea should be changed', () => {
    expect(rta.find('textarea').node.value).toBe(':happy_face:some test :a');
  });
});

describe('string-based items with output fn', () => {
  const mockedFn = jest.fn();
  const rtaComponent = (
    <ReactTextareaAutocomplete
      placeholder={'Write a message.'}
      value={'Controlled text'}
      onChange={mockedFn}
      className={'ownClassName'}
      style={{ background: 'red' }}
      loadingComponent={Loading}
      trigger={{
        ':': {
          output: item => `__${item}__`,
          dataProvider: () => Promise.resolve(['happy_face', 'sad_face']),
          component: SmileItemComponent,
        },
      }}
    />
  );
  const rta = mount(rtaComponent);

  it('match match the snapshot', () => {
    expect(shallow(rtaComponent)).toMatchSnapshot();
  });

  it('Textarea exists', () => {
    expect(rta.find('textarea')).toHaveLength(1);
  });

  it('After the trigger was typed, it should appear list of options', async () => {
    rta
      .find('textarea')
      .simulate('change', { target: { value: 'some test :a' } });
    expect(rta.find('.rta__autocomplete')).toHaveLength(1);
  });

  it('should display all items', () => {
    expect(rta.find('.rta__autocomplete .rta__list .rta__item')).toHaveLength(
      2,
    );
  });

  it('items should be rendered within the component', () => {
    expect(
      rta
        .find('.rta__item')
        .first()
        .containsMatchingElement(<SmileItemComponent />),
    ).toEqual(true);
  });

  it('should invoke onchange handler', () => {
    expect(mockedFn).toHaveBeenCalled();
  });

  it('should close the autocomplete after mouse click', () => {
    const item = rta.find('.rta__entity').first();
    item.simulate('click');
    expect(rta.find('.rta__entity')).toHaveLength(0);
  });

  it('should invoke onchange handler after selection', () => {
    expect(mockedFn).toHaveBeenCalledTimes(2);
  });

  it('text in textarea should be changed', () => {
    expect(rta.find('textarea').node.value).toBe('__happy_face__some test :a');
  });
});
