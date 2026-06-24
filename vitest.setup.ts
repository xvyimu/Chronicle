import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView — mock it for component tests
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
