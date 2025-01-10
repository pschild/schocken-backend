const teardown = async () => {
  if (!!global.container) {
    await global.container.stop();
  }

  if (!!global.source) {
    await global.source.destroy();
  }
};

export default teardown;
