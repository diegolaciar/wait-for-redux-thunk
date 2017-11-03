export const ASYNC_START = "ASYNC_START";
export const ASYNC_END = "ASYNC_END";

export const waitMiddleware = (initFn, renderFn, finalFn) => {
  let asyncCount = 0;
  let sent = false;
  let renderString;

  return store => {
    process.nextTick(async function() {
      initFn(store);
      if (!asyncCount) {
        renderString = await renderFn(store);
      }

      process.nextTick(function() {
        if (asyncCount === 0 && !sent) {
          sent = true;
          finalFn(store, renderString);
        }
      });
    });

    return next => action => {
      if (action.meta === ASYNC_START) {
        asyncCount++;
      } else if (action.meta === ASYNC_END) {
        asyncCount--;

        process.nextTick(async function() {
          if (asyncCount === 0 && !sent) {
            renderString = await renderFn(store);

            process.nextTick(function() {
              if (asyncCount === 0 && !sent) {
                sent = true;
                finalFn(store, renderString);
              }
            });
          }
        });
      }

      return next(action);
    };
  };
};
