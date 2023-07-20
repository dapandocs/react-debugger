let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;
let useTransition;
let useState;
let useOptimistic;
let textCache;

describe('ReactAsyncActions', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    useTransition = React.useTransition;
    useState = React.useState;
    useOptimistic = React.experimental_useOptimistic;

    textCache = new Map();
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function getText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };
      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);
      return thenable;
    } else {
      switch (record.status) {
        case 'pending':
          return record.value;
        case 'rejected':
          return Promise.reject(record.value);
        case 'resolved':
          return Promise.resolve(record.value);
      }
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.log(text);
    return text;
  }

  // @gate enableAsyncActions
  test('isPending remains true until async action finishes', async () => {
    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    // At the start of an async action, isPending is set to true.
    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        await getText('Wait');
        Scheduler.log('Async action ended');
      });
    });
    assertLog(['Async action started', 'Pending: true']);
    expect(root).toMatchRenderedOutput('Pending: true');

    // Once the action finishes, isPending is set back to false.
    await act(() => resolveText('Wait'));
    assertLog(['Async action ended', 'Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');
  });

  // @gate enableAsyncActions
  test('multiple updates in an async action scope are entangled together', async () => {
    let startTransition;
    function App({text}) {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return (
        <>
          <span>
            <Text text={'Pending: ' + isPending} />
          </span>
          <span>
            <Text text={text} />
          </span>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App text="A" />);
    });
    assertLog(['Pending: false', 'A']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A</span>
      </>,
    );

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        await getText('Yield before updating');
        Scheduler.log('Async action ended');
        startTransition(() => root.render(<App text="B" />));
      });
    });
    assertLog(['Async action started', 'Pending: true', 'A']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A</span>
      </>,
    );

    await act(() => resolveText('Yield before updating'));
    assertLog(['Async action ended', 'Pending: false', 'B']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>B</span>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('multiple async action updates in the same scope are entangled together', async () => {
    let setStepA;
    function A() {
      const [step, setStep] = useState(0);
      setStepA = setStep;
      return <AsyncText text={'A' + step} />;
    }

    let setStepB;
    function B() {
      const [step, setStep] = useState(0);
      setStepB = setStep;
      return <AsyncText text={'B' + step} />;
    }

    let setStepC;
    function C() {
      const [step, setStep] = useState(0);
      setStepC = setStep;
      return <AsyncText text={'C' + step} />;
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return (
        <>
          <span>
            <Text text={'Pending: ' + isPending} />
          </span>
          <span>
            <A />, <B />, <C />
          </span>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    resolveText('A0');
    resolveText('B0');
    resolveText('C0');
    await act(() => {
      root.render(<App text="A" />);
    });
    assertLog(['Pending: false', 'A0', 'B0', 'C0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A0, B0, C0</span>
      </>,
    );

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        setStepA(1);
        await getText('Wait before updating B');
        startTransition(() => setStepB(1));
        await getText('Wait before updating C');
        startTransition(() => setStepC(1));
        Scheduler.log('Async action ended');
      });
    });
    assertLog(['Async action started', 'Pending: true', 'A0', 'B0', 'C0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // This will schedule an update on B, but nothing will render yet because
    // the async action scope hasn't finished.
    await act(() => resolveText('Wait before updating B'));
    assertLog([]);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // This will schedule an update on C, and also the async action scope
    // will end. This will allow React to attempt to render the updates.
    await act(() => resolveText('Wait before updating C'));
    assertLog(['Async action ended', 'Pending: false', 'Suspend! [A1]']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // Progressively load the all the data. Because they are all entangled
    // together, only when the all of A, B, and C updates are unblocked is the
    // render allowed to proceed.
    await act(() => resolveText('A1'));
    assertLog(['Pending: false', 'A1', 'Suspend! [B1]']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );
    await act(() => resolveText('B1'));
    assertLog(['Pending: false', 'A1', 'B1', 'Suspend! [C1]']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // Finally, all the data has loaded and the transition is complete.
    await act(() => resolveText('C1'));
    assertLog(['Pending: false', 'A1', 'B1', 'C1']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A1, B1, C1</span>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('urgent updates are not blocked during an async action', async () => {
    let setStepA;
    function A() {
      const [step, setStep] = useState(0);
      setStepA = setStep;
      return <Text text={'A' + step} />;
    }

    let setStepB;
    function B() {
      const [step, setStep] = useState(0);
      setStepB = setStep;
      return <Text text={'B' + step} />;
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return (
        <>
          <span>
            <Text text={'Pending: ' + isPending} />
          </span>
          <span>
            <A />, <B />
          </span>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App text="A" />);
    });
    assertLog(['Pending: false', 'A0', 'B0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A0, B0</span>
      </>,
    );

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        startTransition(() => setStepA(1));
        await getText('Wait');
        Scheduler.log('Async action ended');
      });
    });
    assertLog(['Async action started', 'Pending: true', 'A0', 'B0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0</span>
      </>,
    );

    // Update B at urgent priority. This should be allowed to finish.
    await act(() => setStepB(1));
    assertLog(['B1']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B1</span>
      </>,
    );

    // Finish the async action.
    await act(() => resolveText('Wait'));
    assertLog(['Async action ended', 'Pending: false', 'A1', 'B1']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A1, B1</span>
      </>,
    );
  });

  // @gate enableAsyncActions
  test("if a sync action throws, it's rethrown from the `useTransition`", async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      );
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    await act(() => {
      startTransition(() => {
        throw new Error('Oops!');
      });
    });
    assertLog(['Pending: true', 'Oops!', 'Oops!']);
    expect(root).toMatchRenderedOutput('Oops!');
  });

  // @gate enableAsyncActions
  test("if an async action throws, it's rethrown from the `useTransition`", async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      );
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        await getText('Wait');
        throw new Error('Oops!');
      });
    });
    assertLog(['Async action started', 'Pending: true']);
    expect(root).toMatchRenderedOutput('Pending: true');

    await act(() => resolveText('Wait'));
    assertLog(['Oops!', 'Oops!']);
    expect(root).toMatchRenderedOutput('Oops!');
  });

  // @gate !enableAsyncActions
  test('when enableAsyncActions is disabled, and a sync action throws, `isPending` is turned off', async () => {
    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    await act(() => {
      expect(() => {
        startTransition(() => {
          throw new Error('Oops!');
        });
      }).toThrow('Oops!');
    });
    assertLog(['Pending: true', 'Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');
  });

  // @gate enableAsyncActions
  test('if there are multiple entangled actions, and one of them errors, it only affects that action', async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let startTransitionA;
    function ActionA() {
      const [isPendingA, start] = useTransition();
      startTransitionA = start;
      return <Text text={'Pending A: ' + isPendingA} />;
    }

    let startTransitionB;
    function ActionB() {
      const [isPending, start] = useTransition();
      startTransitionB = start;
      return <Text text={'Pending B: ' + isPending} />;
    }

    let startTransitionC;
    function ActionC() {
      const [isPending, start] = useTransition();
      startTransitionC = start;
      return <Text text={'Pending C: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <>
          <div>
            <ErrorBoundary>
              <ActionA />
            </ErrorBoundary>
          </div>
          <div>
            <ErrorBoundary>
              <ActionB />
            </ErrorBoundary>
          </div>
          <div>
            <ErrorBoundary>
              <ActionC />
            </ErrorBoundary>
          </div>
        </>,
      );
    });
    assertLog(['Pending A: false', 'Pending B: false', 'Pending C: false']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending A: false</div>
        <div>Pending B: false</div>
        <div>Pending C: false</div>
      </>,
    );

    // Start a bunch of entangled transitions. A and C throw errors, but B
    // doesn't. A and should surface their respective errors, but B should
    // finish successfully.
    await act(() => {
      startTransitionC(async () => {
        startTransitionB(async () => {
          startTransitionA(async () => {
            await getText('Wait for A');
            throw new Error('Oops A!');
          });
          await getText('Wait for B');
        });
        await getText('Wait for C');
        throw new Error('Oops C!');
      });
    });
    assertLog(['Pending A: true', 'Pending B: true', 'Pending C: true']);

    // Finish action A. We can't commit the result yet because it's entangled
    // with B and C.
    await act(() => resolveText('Wait for A'));
    assertLog([]);

    // Finish action B. Same as above.
    await act(() => resolveText('Wait for B'));
    assertLog([]);

    // Now finish action C. This is the last action in the entangled set, so
    // rendering can proceed.
    await act(() => resolveText('Wait for C'));
    assertLog([
      // A and C result in (separate) errors, but B does not.
      'Oops A!',
      'Pending B: false',
      'Oops C!',

      // Because there was an error, React will try rendering one more time.
      'Oops A!',
      'Pending B: false',
      'Oops C!',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Oops A!</div>
        <div>Pending B: false</div>
        <div>Oops C!</div>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('useOptimistic can be used to implement a pending state', async () => {
    const startTransition = React.startTransition;

    let setIsPending;
    function App({text}) {
      const [isPending, _setIsPending] = useOptimistic(false);
      setIsPending = _setIsPending;
      return (
        <>
          <Text text={'Pending: ' + isPending} />
          <AsyncText text={text} />
        </>
      );
    }

    // Initial render
    const root = ReactNoop.createRoot();
    resolveText('A');
    await act(() => root.render(<App text="A" />));
    assertLog(['Pending: false', 'A']);
    expect(root).toMatchRenderedOutput('Pending: falseA');

    // Start a transition
    await act(() =>
      startTransition(() => {
        setIsPending(true);
        root.render(<App text="B" />);
      }),
    );
    assertLog([
      // Render the pending state immediately
      'Pending: true',
      'A',

      // Then attempt to render the transition. The pending state will be
      // automatically reverted.
      'Pending: false',
      'Suspend! [B]',
    ]);

    // Resolve the transition
    await act(() => resolveText('B'));
    assertLog([
      // Render the pending state immediately
      'Pending: false',
      'B',
    ]);
  });

  // @gate enableAsyncActions
  test('useOptimistic rebases pending updates on top of passthrough value', async () => {
    let serverCart = ['A'];

    async function submitNewItem(item) {
      await getText('Adding item ' + item);
      serverCart = [...serverCart, item];
      React.startTransition(() => {
        root.render(<App cart={serverCart} />);
      });
    }

    let addItemToCart;
    function App({cart}) {
      const [isPending, startTransition] = useTransition();

      const savedCartSize = cart.length;
      const [optimisticCartSize, setOptimisticCartSize] =
        useOptimistic(savedCartSize);

      addItemToCart = item => {
        startTransition(async () => {
          setOptimisticCartSize(n => n + 1);
          await submitNewItem(item);
        });
      };

      return (
        <>
          <div>
            <Text text={'Pending: ' + isPending} />
          </div>
          <div>
            <Text text={'Items in cart: ' + optimisticCartSize} />
          </div>
          <ul>
            {cart.map(item => (
              <li key={item}>
                <Text text={'Item ' + item} />
              </li>
            ))}
          </ul>
        </>
      );
    }

    // Initial render
    const root = ReactNoop.createRoot();
    await act(() => root.render(<App cart={serverCart} />));
    assertLog(['Pending: false', 'Items in cart: 1', 'Item A']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: false</div>
        <div>Items in cart: 1</div>
        <ul>
          <li>Item A</li>
        </ul>
      </>,
    );

    // The cart size is incremented even though B hasn't been added yet.
    await act(() => addItemToCart('B'));
    assertLog(['Pending: true', 'Items in cart: 2', 'Item A']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: true</div>
        <div>Items in cart: 2</div>
        <ul>
          <li>Item A</li>
        </ul>
      </>,
    );

    // While B is still pending, another item gets added to the cart
    // out-of-band.
    serverCart = [...serverCart, 'C'];
    // NOTE: This is a synchronous update only because we don't yet support
    // parallel transitions; all transitions are entangled together. Once we add
    // support for parallel transitions, we can update this test.
    ReactNoop.flushSync(() => root.render(<App cart={serverCart} />));
    assertLog([
      'Pending: true',
      // Note that the optimistic cart size is still correct, because the
      // pending update was rebased on top new value.
      'Items in cart: 3',
      'Item A',
      'Item C',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: true</div>
        <div>Items in cart: 3</div>
        <ul>
          <li>Item A</li>
          <li>Item C</li>
        </ul>
      </>,
    );

    // Finish loading B. The optimistic state is reverted.
    await act(() => resolveText('Adding item B'));
    assertLog([
      'Pending: false',
      'Items in cart: 3',
      'Item A',
      'Item C',
      'Item B',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: false</div>
        <div>Items in cart: 3</div>
        <ul>
          <li>Item A</li>
          <li>Item C</li>
          <li>Item B</li>
        </ul>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('useOptimistic accepts a custom reducer', async () => {
    let serverCart = ['A'];

    async function submitNewItem(item) {
      await getText('Adding item ' + item);
      serverCart = [...serverCart, item];
      React.startTransition(() => {
        root.render(<App cart={serverCart} />);
      });
    }

    let addItemToCart;
    function App({cart}) {
      const [isPending, startTransition] = useTransition();

      const savedCartSize = cart.length;
      const [optimisticCartSize, addToOptimisticCart] = useOptimistic(
        savedCartSize,
        (prevSize, newItem) => {
          Scheduler.log('Increment optimistic cart size for ' + newItem);
          return prevSize + 1;
        },
      );

      addItemToCart = item => {
        startTransition(async () => {
          addToOptimisticCart(item);
          await submitNewItem(item);
        });
      };

      return (
        <>
          <div>
            <Text text={'Pending: ' + isPending} />
          </div>
          <div>
            <Text text={'Items in cart: ' + optimisticCartSize} />
          </div>
          <ul>
            {cart.map(item => (
              <li key={item}>
                <Text text={'Item ' + item} />
              </li>
            ))}
          </ul>
        </>
      );
    }

    // Initial render
    const root = ReactNoop.createRoot();
    await act(() => root.render(<App cart={serverCart} />));
    assertLog(['Pending: false', 'Items in cart: 1', 'Item A']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: false</div>
        <div>Items in cart: 1</div>
        <ul>
          <li>Item A</li>
        </ul>
      </>,
    );

    // The cart size is incremented even though B hasn't been added yet.
    await act(() => addItemToCart('B'));
    assertLog([
      'Increment optimistic cart size for B',
      'Pending: true',
      'Items in cart: 2',
      'Item A',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: true</div>
        <div>Items in cart: 2</div>
        <ul>
          <li>Item A</li>
        </ul>
      </>,
    );

    // While B is still pending, another item gets added to the cart
    // out-of-band.
    serverCart = [...serverCart, 'C'];
    // NOTE: This is a synchronous update only because we don't yet support
    // parallel transitions; all transitions are entangled together. Once we add
    // support for parallel transitions, we can update this test.
    ReactNoop.flushSync(() => root.render(<App cart={serverCart} />));
    assertLog([
      'Increment optimistic cart size for B',
      'Pending: true',
      // Note that the optimistic cart size is still correct, because the
      // pending update was rebased on top new value.
      'Items in cart: 3',
      'Item A',
      'Item C',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: true</div>
        <div>Items in cart: 3</div>
        <ul>
          <li>Item A</li>
          <li>Item C</li>
        </ul>
      </>,
    );

    // Finish loading B. The optimistic state is reverted.
    await act(() => resolveText('Adding item B'));
    assertLog([
      'Pending: false',
      'Items in cart: 3',
      'Item A',
      'Item C',
      'Item B',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Pending: false</div>
        <div>Items in cart: 3</div>
        <ul>
          <li>Item A</li>
          <li>Item C</li>
          <li>Item B</li>
        </ul>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('useOptimistic rebases if the passthrough is updated during a render phase update', async () => {
    // This is kind of an esoteric case where it's hard to come up with a
    // realistic real-world scenario but it should still work.
    let increment;
    let setCount;
    function App() {
      const [isPending, startTransition] = useTransition(2);
      const [count, _setCount] = useState(0);
      setCount = _setCount;

      const [optimisticCount, setOptimisticCount] = useOptimistic(
        count,
        prev => {
          Scheduler.log('Increment optimistic count');
          return prev + 1;
        },
      );

      if (count === 1) {
        Scheduler.log('Render phase update count from 1 to 2');
        setCount(2);
      }

      increment = () =>
        startTransition(async () => {
          setOptimisticCount(n => n + 1);
          await getText('Wait to increment');
          React.startTransition(() => setCount(n => n + 1));
        });

      return (
        <>
          <div>
            <Text text={'Count: ' + count} />
          </div>
          {isPending ? (
            <div>
              <Text text={'Optimistic count: ' + optimisticCount} />
            </div>
          ) : null}
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => root.render(<App />));
    assertLog(['Count: 0']);
    expect(root).toMatchRenderedOutput(<div>Count: 0</div>);

    await act(() => increment());
    assertLog([
      'Increment optimistic count',
      'Count: 0',
      'Optimistic count: 1',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Count: 0</div>
        <div>Optimistic count: 1</div>
      </>,
    );

    await act(() => setCount(1));
    assertLog([
      'Increment optimistic count',
      'Render phase update count from 1 to 2',
      // The optimistic update is rebased on top of the new passthrough value.
      'Increment optimistic count',
      'Count: 2',
      'Optimistic count: 3',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Count: 2</div>
        <div>Optimistic count: 3</div>
      </>,
    );

    // Finish the action
    await act(() => resolveText('Wait to increment'));
    assertLog(['Count: 3']);
    expect(root).toMatchRenderedOutput(<div>Count: 3</div>);
  });

  // @gate enableAsyncActions
  test('useOptimistic rebases if the passthrough is updated during a render phase update (initial mount)', async () => {
    // This is kind of an esoteric case where it's hard to come up with a
    // realistic real-world scenario but it should still work.
    function App() {
      const [count, setCount] = useState(0);
      const [optimisticCount] = useOptimistic(count);

      if (count === 0) {
        Scheduler.log('Render phase update count from 1 to 2');
        setCount(1);
      }

      return (
        <>
          <div>
            <Text text={'Count: ' + count} />
          </div>
          <div>
            <Text text={'Optimistic count: ' + optimisticCount} />
          </div>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => root.render(<App />));
    assertLog([
      'Render phase update count from 1 to 2',
      'Count: 1',
      'Optimistic count: 1',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Count: 1</div>
        <div>Optimistic count: 1</div>
      </>,
    );
  });
});
